import { fileURLToPath } from 'node:url';
import { runChecks } from './lib/run-checks.mjs';

const steps = ['lint', 'typecheck', 'test', 'check:acceptance', 'test:acceptance'].map((name) => [
    name,
    'npm',
    ['run', '--silent', name],
]);
process.exitCode = runChecks(steps, { cwd: fileURLToPath(new URL('..', import.meta.url)) }) ? 0 : 1;
