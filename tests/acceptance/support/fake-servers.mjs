// 가짜 백엔드와 가짜 Upstash REST 서버. 상태는 /__control로만 바꾼다.
import http from 'node:http';
import { assertLoopback } from './loopback.mjs';

const backendUrl = assertLoopback('BACKEND_URL');
const redisUrl = assertLoopback('UPSTASH_REDIS_REST_URL');
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const initialState = () => ({
    // 백엔드가 받은 요청 기록
    calls: [],
    // Upstash가 받은 명령 기록
    redisCommands: [],
    redis: {},
    // refresh token -> 회전 결과 { accessToken, refreshToken }
    refreshTokens: {},
    // 등록되지 않은 refresh token을 거부할 때의 상태 코드
    rejectStatus: 401,
    // OAuth code -> { accessToken, refreshToken, nickname, isNewUser }
    codes: {},
    accessTokens: [],
    studies: [],
    user: null,
    // 업무 API가 강제로 돌려줄 상태 코드
    forcedStatus: null,
    // GET 업무 경로 -> 응답 본문
    responses: {},
    // 백엔드 경로 -> 상태 코드 또는 'drop'(연결 끊기). 오류 본문에 요청을 되풀이한다.
    failures: {},
    // Upstash 실패: { commands: ['get'], mode: 'http' | 'command' | 'invalid' | 'drop' }
    redisFailure: null,
});
let state = initialState();

async function readBody(req) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const text = Buffer.concat(chunks).toString('utf8');
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function send(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
}

function control(url, body, res) {
    if (url.pathname === '/__control/reset') {
        state = { ...initialState(), ...body };
        return send(res, 200, {});
    }
    if (url.pathname === '/__control/state') return send(res, 200, state);
    return send(res, 200, { ok: true });
}

function business(call, res) {
    if (!state.accessTokens.some((t) => call.authorization === `Bearer ${t}`)) {
        return send(res, 401, { message: 'fake unauthorized' });
    }
    if (state.forcedStatus) {
        return send(res, state.forcedStatus, { message: 'fake error' });
    }
    if (call.method === 'GET' && call.path in state.responses) {
        return send(res, 200, state.responses[call.path]);
    }
    if (call.method === 'GET' && call.path === '/users/me') {
        return send(res, 200, state.user ?? {});
    }
    if (call.method === 'GET' && call.path === '/users/me/nickname/check') {
        return send(res, 200, { available: true });
    }
    if (call.method === 'GET' && call.path === '/studies/me') {
        return send(res, 200, state.studies);
    }
    if (call.method === 'POST' && call.path === '/studies') {
        const study = {
            ...call.body,
            id: `created-${state.studies.length + 1}`,
            status: 'BEFORE_START',
            currentMemberCount: 1,
            hasPassword: Boolean(call.body.password),
        };
        state.studies.push(study);
        return send(res, 201, study);
    }
    return send(res, 200, { ok: true });
}

const backend = http.createServer(async (req, res) => {
    const url = new URL(req.url, backendUrl);
    const body = await readBody(req);
    if (url.pathname.startsWith('/__control/')) return control(url, body, res);

    const call = {
        method: req.method,
        path: url.pathname,
        search: url.search,
        authorization: req.headers.authorization ?? null,
        body,
    };
    state.calls.push(call);

    const failure = state.failures[call.path];
    if (failure === 'drop') return req.socket.destroy();
    if (failure) {
        const echo = JSON.stringify([call.authorization, call.body]);
        return send(res, failure, { message: `fake error: ${echo}` });
    }

    if (call.method === 'GET' && call.path === '/auth/google') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end('<h1>fake oauth start</h1>');
    }
    if (call.method === 'POST' && call.path === '/auth/token') {
        const pair = state.refreshTokens[body?.refreshToken];
        return pair
            ? send(res, 200, pair)
            : send(res, state.rejectStatus, { message: 'fake rejected' });
    }
    if (call.method === 'POST' && call.path === '/auth/exchange') {
        const result = state.codes[body?.code];
        return result
            ? send(res, 200, result)
            : send(res, 401, { message: 'fake rejected' });
    }
    return business(call, res);
});

function execute([name, key, value]) {
    const command = String(name).toLowerCase();
    if (command === 'get') return state.redis[key] ?? null;
    if (command === 'set') {
        state.redis[key] = value;
        return 'OK';
    }
    if (command === 'del') {
        const existed = key in state.redis;
        delete state.redis[key];
        return existed ? 1 : 0;
    }
    throw new Error(`지원하지 않는 명령: ${command}`);
}

const redis = http.createServer(async (req, res) => {
    const body = await readBody(req);
    if (req.headers.authorization !== `Bearer ${redisToken}`) {
        return send(res, 401, { error: 'WRONGPASS' });
    }
    const isBase64 = req.headers['upstash-encoding'] === 'base64';
    const run = (command) => {
        state.redisCommands.push(command);
        try {
            const result = execute(command);
            const encoded =
                isBase64 && typeof result === 'string' && result !== 'OK'
                    ? Buffer.from(result).toString('base64')
                    : result;
            return { result: encoded };
        } catch (error) {
            return { error: String(error) };
        }
    };
    const isPipeline = req.url.startsWith('/pipeline');
    const commands = isPipeline ? body : [body];
    const { redisFailure } = state;
    const isFailing = commands.some(([name]) =>
        redisFailure?.commands.includes(String(name).toLowerCase()),
    );
    if (isFailing) {
        state.redisCommands.push(...commands);
        const error = `ERR fake, command was: ${JSON.stringify(body)}`;
        if (redisFailure.mode === 'drop') return req.socket.destroy();
        if (redisFailure.mode === 'http') return send(res, 400, { error });
        if (redisFailure.mode === 'command') {
            return send(
                res,
                200,
                isPipeline ? commands.map(() => ({ error })) : { error },
            );
        }
        res.writeHead(502, { 'Content-Type': 'text/html' });
        return res.end(`<p>${error}</p>`);
    }
    send(res, 200, isPipeline ? body.map(run) : run(body));
});

backend.listen(Number(backendUrl.port), '127.0.0.1');
redis.listen(Number(redisUrl.port), '127.0.0.1');
