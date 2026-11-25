import { execFileSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import {
    acceptancePorts, BLOCK_COUNT, candidateBlocks, defaultPorts, isLinkedWorktree, reservePorts,
} from './acceptance-ports.mjs';

const names = ['ACCEPTANCE_BACKEND_PORT', 'ACCEPTANCE_REDIS_PORT', 'ACCEPTANCE_APP_PORT'];
const [BACKEND, REDIS, APP] = names;
const values = (ports) => names.map((name) => Number(ports[name]));
const cleanups = [];

async function cleanUp() {
    while (cleanups.length) await cleanups.pop()();
}
afterEach(cleanUp);

async function reserve(...args) {
    const { ports, release } = await reservePorts(...args);
    cleanups.push(release);
    return values(ports);
}
async function occupy(port, host = '127.0.0.1') {
    const server = createServer();
    await new Promise((done, fail) => server.once('error', fail).listen(port, host, done));
    cleanups.push(() => new Promise((done) => server.close(done)));
}
/** 다른 실행이 쓰지 않는 후보 두 묶음을 찾는다. */
async function freeBlocks() {
    const found = [];
    for (const block of candidateBlocks(`test-${process.pid}-${Math.random()}`)) {
        const result = await reservePorts({}, [block]).catch(() => undefined);
        if (!result) continue;
        await result.release();
        found.push(block);
        if (found.length === 2) return found;
    }
    throw new Error('빈 묶음이 없습니다.');
}

describe('기본 작업 폴더의 포트', () => {
    test.each([
        ['지정 없음', {}, [4310, 4311, 4312]],
        ['하나 지정', { [BACKEND]: '9000' }, [9000, 4311, 4312]],
        ['다른 기본값과 겹침', { [APP]: '4310' }, [4312, 4311, 4310]],
        ['둘이 다른 기본값과 겹침', { [BACKEND]: '4311', [REDIS]: '4312' }, [4311, 4312, 4310]],
        ['모두 지정', { [BACKEND]: '1', [REDIS]: '2', [APP]: '3' }, [1, 2, 3]],
    ])('%s', (_, env, expected) => expect(values(defaultPorts(env))).toEqual(expected));
});

describe('후보', () => {
    test('모든 묶음이 한 번씩 나오고 허용 범위 안에 있다', () => {
        const blocks = candidateBlocks('/a');
        expect(new Set(blocks).size).toBe(BLOCK_COUNT);
        expect(blocks.every((block) => block % 4 === 0)).toBe(true);
        expect(Math.min(...blocks)).toBe(20_000);
        expect(Math.max(...blocks) + 3).toBe(31_999);
    });

    test('같은 경로는 같고 다른 경로는 다른 곳에서 시작한다', () => {
        expect(candidateBlocks('/a')).toEqual(candidateBlocks('/a'));
        expect(candidateBlocks('/a')[0]).not.toBe(candidateBlocks('/b')[0]);
    });
});

describe('예약', () => {
    test('시작 위치가 같아도 동시에 예약하면 겹치지 않고, 풀면 다시 쓴다', async () => {
        const blocks = await freeBlocks();
        const got = await Promise.all([reserve({}, blocks), reserve({}, blocks)]);
        expect(new Set(got.flat()).size).toBe(6);
        await cleanUp();
        expect(await reserve({}, blocks)).toEqual([1, 2, 3].map((i) => blocks[0] + i));
    });

    test.each([
        [0, '127.0.0.1'],
        [1, '127.0.0.1'],
        [3, '127.0.0.1'],
        [2, '0.0.0.0'],
    ])('묶음의 %i번 포트가 %s에서 쓰이면 다음 후보로 간다', async (offset, host) => {
        const blocks = await freeBlocks();
        await occupy(blocks[0] + offset, host);
        expect(await reserve({}, blocks)).toEqual([1, 2, 3].map((i) => blocks[1] + i));
    });

    test('지정한 포트를 우선하고 그 포트가 든 묶음은 건너뛴다', async () => {
        const blocks = await freeBlocks();
        const pinned = blocks[0] + 1;
        expect(await reserve({ [APP]: String(pinned) }, blocks)).toEqual([blocks[1] + 1, blocks[1] + 2, pinned]);
    });

    test('모두 지정하면 후보를 보지 않는다', async () => {
        expect(await reserve({ [BACKEND]: '1', [REDIS]: '2', [APP]: '3' }, [])).toEqual([1, 2, 3]);
    });

    test('후보가 모두 쓰이면 알려 준다', async () => {
        const blocks = await freeBlocks();
        for (const block of blocks) await occupy(block + 1);
        await expect(reservePorts({}, blocks)).rejects.toThrow('비어 있는 인수 테스트 포트가 없습니다');
    });
});

describe('worktree', () => {
    let temp;
    let main;

    function git(cwd, ...args) {
        const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
        const identity = ['-c', 'user.name=t', '-c', 'user.email=t@example.com'];
        execFileSync('git', [...identity, ...args], {
            cwd,
            stdio: 'pipe',
            env: { ...env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' },
        });
    }

    beforeEach(() => {
        temp = realpathSync(mkdtempSync(join(tmpdir(), 'ports-')));
        cleanups.push(() => rmSync(temp, { recursive: true, force: true }));
        main = join(temp, 'main folder');
        git(temp, 'init', '-q', main);
        git(main, 'commit', '-q', '--allow-empty', '-m', 'x');
    });

    test('기본 폴더는 detached HEAD여도 기본 포트를 쓴다', async () => {
        git(main, 'checkout', '-q', '--detach');
        expect(isLinkedWorktree(main)).toBe(false);
        const { ports } = await acceptancePorts(main, {});
        expect(values(ports)).toEqual([4310, 4311, 4312]);
    });

    test('연결된 worktree 둘은 서로 다른 포트를 쓴다', async () => {
        const got = [];
        for (const name of ['one', 'two']) {
            const path = join(temp, name);
            git(main, 'worktree', 'add', '-q', '--detach', path);
            expect(isLinkedWorktree(path)).toBe(true);
            const { ports, release } = await acceptancePorts(path, {});
            cleanups.push(release);
            got.push(...values(ports));
        }
        expect(new Set([...got, 4310, 4311, 4312]).size).toBe(9);
    });
});
