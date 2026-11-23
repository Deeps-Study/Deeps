import { spawnSync } from 'node:child_process';

/** 앞 검사가 실패해도 모두 실행하고, 하나라도 실패하면 false를 돌려준다. */
export function runChecks(steps, { cwd, log = console.log } = {}) {
    const results = steps.map(([name, command, args]) => {
        log(`\n=== ${name} ===`);
        const { status, error } = spawnSync(command, args, { cwd, stdio: 'inherit' });
        if (error) log(`실행하지 못했습니다: ${error.message}`);
        return [name, status === 0];
    });
    log('\n=== 요약 ===');
    for (const [name, ok] of results) log(`${ok ? '통과' : '실패'}  ${name}`);
    return results.every(([, ok]) => ok);
}
