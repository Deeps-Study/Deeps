import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { acceptancePorts } from './lib/acceptance-ports.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const { ports, release } = await acceptancePorts(root);
console.log(`인수 테스트 포트: ${Object.entries(ports).map(([name, port]) => `${name}=${port}`).join(' ')}`);

const cli = createRequire(import.meta.url).resolve('@playwright/test/cli');
const child = spawn(
    process.execPath,
    [cli, 'test', '-c', 'tests/acceptance/playwright.config.ts', ...process.argv.slice(2)],
    { cwd: root, env: { ...process.env, ...ports }, stdio: 'inherit' },
);

const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'];
const forward = (signal) => child.kill(signal);
for (const signal of signals) process.on(signal, forward);

async function finish(code, signal) {
    await release();
    for (const name of signals) process.off(name, forward);
    if (signal) process.kill(process.pid, signal);
    else process.exitCode = code ?? 1;
}
child.on('error', (error) => {
    console.error(`인수 테스트를 시작하지 못했습니다: ${error.message}`);
    finish(1);
});
child.on('exit', finish);
