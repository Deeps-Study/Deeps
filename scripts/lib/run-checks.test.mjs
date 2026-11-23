import { expect, test } from 'vitest';
import { runChecks } from './run-checks.mjs';

const step = (name, code) => [name, process.execPath, ['-e', code]];

test('앞이 실패해도 끝까지 돌고 요약한다', () => {
    const lines = [];
    const steps = [
        step('가', 'process.exit(2)'),
        ['나', 'no-such-command-for-test', []],
        step('다', "process.kill(process.pid, 'SIGKILL')"),
        step('라', ''),
    ];
    expect(runChecks(steps, { log: (line) => lines.push(line) })).toBe(false);
    expect(lines.slice(-4)).toEqual(['실패  가', '실패  나', '실패  다', '통과  라']);
});

test('모두 통과하면 true', () => {
    expect(runChecks([step('가', '')], { log: () => {} })).toBe(true);
});
