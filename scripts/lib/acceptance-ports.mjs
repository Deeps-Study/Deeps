import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { connect, createServer } from 'node:net';
import { resolve } from 'node:path';

const HOST = '127.0.0.1';
const DEFAULTS = {
    ACCEPTANCE_BACKEND_PORT: 4310,
    ACCEPTANCE_REDIS_PORT: 4311,
    ACCEPTANCE_APP_PORT: 4312,
};
const NAMES = Object.keys(DEFAULTS);

// 개발 서버, 기본 포트, 운영체제가 임의로 나눠 주는 포트(Linux 32768+, macOS 49152+)를
// 피한 범위를 4개씩 나눈다. 첫 포트는 실행이 끝날 때까지 잡아 두는 예약용이다.
const FIRST_PORT = 20_000;
const BLOCK_SIZE = 4;
export const BLOCK_COUNT = 3000;

/** 연결된 git worktree이면 true, 기본 작업 폴더이면 false. */
export function isLinkedWorktree(root) {
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
    const [gitDir, commonDir] = ['--git-dir', '--git-common-dir'].map((flag) => {
        const output = execFileSync('git', ['rev-parse', flag], { cwd: root, env, encoding: 'utf8' });
        return realpathSync(resolve(root, output.replace(/\r?\n$/, '')));
    });
    return gitDir !== commonDir;
}

/** 폴더 경로로 시작 위치를 정해 모든 후보의 첫 포트를 한 번씩 돌려준다. */
export function candidateBlocks(root) {
    const start = createHash('sha256').update(root).digest().readUInt32BE() % BLOCK_COUNT;
    return Array.from({ length: BLOCK_COUNT }, (_, i) => FIRST_PORT + ((start + i) % BLOCK_COUNT) * BLOCK_SIZE);
}

/** 환경변수로 정한 포트. 올바른 값인지는 인수 테스트가 확인한다. */
function pinnedPorts(env) {
    return Object.fromEntries(NAMES.filter((name) => env[name] !== undefined).map((name) => [name, env[name]]));
}

const isPinned = (pinned, port) => Object.values(pinned).some((value) => Number(value) === port);

/** 정하지 않은 포트는 기본값을 쓰고, 정한 포트와 겹치면 남은 기본값을 쓴다. */
export function defaultPorts(env) {
    const ports = pinnedPorts(env);
    const open = NAMES.filter((name) => !(name in ports));
    const free = Object.values(DEFAULTS).filter((port) => !isPinned(ports, port));
    const kept = open.filter((name) => free.includes(DEFAULTS[name]));
    const moved = open.filter((name) => !kept.includes(name));
    const spare = free.filter((port) => !kept.some((name) => DEFAULTS[name] === port));
    for (const name of kept) ports[name] = String(DEFAULTS[name]);
    for (const name of moved) ports[name] = String(spare.shift());
    return ports;
}

function listen(port) {
    return new Promise((done, fail) => {
        const server = createServer((socket) => socket.destroy());
        server.once('error', (error) => {
            if (['EADDRINUSE', 'EACCES'].includes(error.code)) done(undefined);
            else fail(error);
        });
        server.listen({ port, host: HOST, exclusive: true }, () => done(server));
    });
}

const close = (server) => new Promise((done) => server.close(done));

async function isFree(port) {
    // 0.0.0.0에 열린 서버가 있어도 127.0.0.1 listen은 성공할 수 있어 연결도 확인한다.
    const answered = await new Promise((done) => {
        const socket = connect({ port, host: HOST });
        const finish = (value) => {
            socket.destroy();
            done(value);
        };
        socket.once('connect', () => finish(true));
        socket.once('error', (error) => finish(error.code !== 'ECONNREFUSED'));
        socket.setTimeout(1000, () => finish(true));
    });
    if (answered) return false;
    const server = await listen(port);
    if (server) await close(server);
    return Boolean(server);
}

/** 후보 중 비어 있는 묶음을 예약한다. release를 부르거나 프로세스가 끝나면 풀린다. */
export async function reservePorts(env, blocks) {
    const pinned = pinnedPorts(env);
    const open = NAMES.filter((name) => !(name in pinned));
    if (open.length === 0) return { ports: pinned, release: async () => {} };
    for (const block of blocks) {
        const group = NAMES.map((_, i) => block + 1 + i);
        if ([block, ...group].some((port) => isPinned(pinned, port))) continue;
        const lock = await listen(block);
        if (!lock) continue;
        const free = await Promise.all(group.map(isFree));
        if (free.every(Boolean)) {
            const ports = { ...pinned };
            for (const name of open) ports[name] = String(group[NAMES.indexOf(name)]);
            return { ports, release: () => close(lock) };
        }
        await close(lock);
    }
    throw new Error(
        `비어 있는 인수 테스트 포트가 없습니다(후보 ${blocks.length}개 확인). ${NAMES.join(', ')} 환경변수로 직접 지정하세요.`,
    );
}

/** 기본 작업 폴더는 고정 포트를, 연결된 worktree는 폴더마다 다른 빈 포트를 쓴다. */
export async function acceptancePorts(root, env = process.env) {
    if (!isLinkedWorktree(root)) return { ports: defaultPorts(env), release: async () => {} };
    return reservePorts(env, candidateBlocks(realpathSync(root)));
}
