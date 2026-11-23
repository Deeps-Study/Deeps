import { fileURLToPath } from 'node:url';
import { checkAcceptance } from './lib/acceptance-guard.mjs';

const { ok, message } = checkAcceptance(fileURLToPath(new URL('..', import.meta.url)));
console[ok ? 'log' : 'error'](message);
process.exitCode = ok ? 0 : 1;
