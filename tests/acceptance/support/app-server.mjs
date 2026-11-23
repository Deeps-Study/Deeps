// .env 파일이 없는 임시 사본에서 앱을 빌드하고 시작한다.
// 저장소에서 직접 실행하면 Next가 .env.local을 읽고 .next를 덮어쓴다.
import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertLoopback } from './loopback.mjs';

assertLoopback('BACKEND_URL');
assertLoopback('UPSTASH_REDIS_REST_URL');
const appUrl = assertLoopback('APP_URL');
if (!process.env.UPSTASH_REDIS_REST_TOKEN?.startsWith('fake-')) {
    throw new Error('UPSTASH_REDIS_REST_TOKEN: 가짜 값이 아니어서 시작을 거부합니다.');
}

const root = path.resolve(import.meta.dirname, '../../..');
const id = createHash('sha256').update(`${root}:${appUrl.port}`).digest('hex');
const appDir = path.join(os.tmpdir(), `acceptance-app-${id.slice(0, 12)}`);

const isCopied = (file) =>
    !/(^|\/)\.env/.test(file) && !/^(tests|scripts|docs|\.[^/]+)\//.test(file);

fs.rmSync(appDir, { recursive: true, force: true });
const files = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    { cwd: root, encoding: 'utf8' },
)
    .split('\0')
    .filter((file) => file && isCopied(file));
for (const file of files) {
    const source = path.join(root, file);
    if (!fs.existsSync(source)) continue;
    const target = path.join(appDir, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
}
fs.cpSync(path.join(root, 'node_modules'), path.join(appDir, 'node_modules'), {
    recursive: true,
    verbatimSymlinks: true,
    mode: fs.constants.COPYFILE_FICLONE,
});

const blocker = new URL('./block-external.mjs', import.meta.url).href;
const env = {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    TMPDIR: process.env.TMPDIR,
    BACKEND_URL: process.env.BACKEND_URL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    NEXT_TELEMETRY_DISABLED: '1',
    NODE_OPTIONS: `--import=${blocker}`,
};
const nextBin = path.join(appDir, 'node_modules/next/dist/bin/next');

// 실행 중 로그는 길어서 파일로 남긴다.
const logFile = path.join(root, 'test-results/app.log');
fs.mkdirSync(path.dirname(logFile), { recursive: true });

let child;
function cleanUp(code) {
    child?.kill('SIGKILL');
    fs.rmSync(appDir, { recursive: true, force: true, maxRetries: 5 });
    process.exit(code);
}
process.on('SIGTERM', () => cleanUp(0));
process.on('SIGINT', () => cleanUp(0));

function run(args, output, onExit) {
    child = spawn(process.execPath, [nextBin, ...args], {
        cwd: appDir,
        env,
        stdio: ['ignore', output, output],
    });
    child.on('exit', onExit);
}

run(['build'], 'inherit', (code) => {
    if (code !== 0) return cleanUp(1);
    const args = ['start', '-H', '127.0.0.1', '-p', appUrl.port];
    run(args, fs.openSync(logFile, 'w'), (status) => cleanUp(status ?? 1));
});
