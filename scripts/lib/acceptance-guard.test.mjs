import { execFileSync } from 'node:child_process';
import {
    chmodSync, cpSync, mkdirSync, mkdtempSync, realpathSync, renameSync, rmSync, symlinkSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { checkAcceptance } from './acceptance-guard.mjs';

const DIR = 'tests/acceptance';
const A = `${DIR}/a.txt`;
const QA = 'test: 인수 테스트\n\nAcceptance: qa';
let temp;
let root;
let committerDate;

function git(...args) {
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
    return execFileSync('git', args, {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
            ...env,
            GIT_CONFIG_GLOBAL: '/dev/null',
            GIT_CONFIG_NOSYSTEM: '1',
            GIT_AUTHOR_NAME: 't',
            GIT_AUTHOR_EMAIL: 't@example.com',
            GIT_COMMITTER_NAME: 't',
            GIT_COMMITTER_EMAIL: 't@example.com',
            ...(committerDate && { GIT_COMMITTER_DATE: committerDate }),
        },
    }).trim();
}
function write(path, content = 'x\n') {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
}
function commit(message) {
    git('add', '-A');
    git('commit', '-q', '--allow-empty', '-m', message);
}
function change(path, content, message) {
    write(path, content);
    commit(message);
}
const check = () => checkAcceptance(root);
const expectPass = () => expect(check()).toMatchObject({ ok: true });
function expectFail(text = A) {
    const result = check();
    expect(result.ok).toBe(false);
    expect(result.message).toContain(text);
    expect(result.message).toContain('QA에게 질문');
}

beforeEach(() => {
    committerDate = undefined;
    temp = realpathSync(mkdtempSync(join(tmpdir(), 'guard-')));
    root = join(temp, 'repo');
    mkdirSync(root);
    git('init', '-q', '-b', 'develop');
    git('config', 'core.hooksPath', '/dev/null');
    write(A, 'base\n');
    write('src/app.txt');
    commit('base');
    git('update-ref', 'refs/remotes/origin/develop', 'HEAD');
    git('checkout', '-q', '-b', 'work');
});
afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(temp, { recursive: true, force: true });
});

describe('통과', () => {
    test('변경 없음', expectPass);
    test('다른 디렉터리 변경', () => {
        change('src/app.txt', 'y', 'feat');
        change(`${DIR}-other/a.txt`, 'y', 'feat');
        expectPass();
    });
    test('QA 커밋의 수정, 추가, 삭제', () => {
        write(`${DIR}/new.txt`);
        unlinkSync(join(root, A));
        commit(QA);
        change('src/app.txt', 'y', 'feat');
        expectPass();
    });
    test('QA 커밋에 다른 트레일러가 함께 있음', () => {
        change(A, 'qa', `${QA}\nCo-Authored-By: t <t@example.com>`);
        expectPass();
    });
    test('추가 후 삭제, 이름 변경 후 복구', () => {
        change(`${DIR}/b.txt`, 'x', 'add');
        unlinkSync(join(root, `${DIR}/b.txt`));
        renameSync(join(root, A), join(root, `${DIR}/c.txt`));
        commit('rename');
        renameSync(join(root, `${DIR}/c.txt`), join(root, A));
        commit('restore');
        expectPass();
    });
    test('QA가 커밋한 특수 이름, 한글, 실행 비트, 링크', () => {
        write(`${DIR}/한글 파일.txt`);
        write(`${DIR}/tab\t"quote"\nline.txt`);
        write(`${DIR}/run.sh`);
        chmodSync(join(root, `${DIR}/run.sh`), 0o755);
        symlinkSync('a.txt', join(root, `${DIR}/link`));
        commit(QA);
        expectPass();
    });
    test('인수 테스트와 무관한 merge', () => {
        git('checkout', '-q', '-b', 'side');
        change('src/side.txt', 's', 'side');
        git('checkout', '-q', 'work');
        change('src/work.txt', 'w', 'work');
        git('merge', '-q', '--no-ff', '-m', 'merge', 'side');
        expectPass();
    });
    test('나중 QA 커밋이 개발 수정을 되돌림', () => {
        change(A, 'qa', QA);
        change(A, 'dev', 'feat');
        change(A, 'qa', QA);
        expectPass();
    });
});

describe('커밋된 변경', () => {
    test('수정', () => {
        change(A, 'dev', 'feat');
        expectFail();
    });
    test('삭제', () => {
        unlinkSync(join(root, A));
        commit('feat');
        expectFail();
    });
    test('추가', () => {
        change(`${DIR}/b.txt`, 'b', 'feat');
        expectFail(`${DIR}/b.txt`);
    });
    test('이름 변경은 양쪽 경로를 알린다', () => {
        renameSync(join(root, A), join(root, `${DIR}/b.txt`));
        commit('rename');
        expectFail();
        expectFail(`${DIR}/b.txt`);
    });
    test('밖으로 이름 변경', () => {
        renameSync(join(root, A), join(root, 'src/a.txt'));
        commit('rename');
        expectFail();
    });
    test('QA 커밋 뒤 수정', () => {
        change(A, 'qa', QA);
        change(A, 'dev', 'feat');
        expectFail();
    });
    test('QA 커밋을 merge-base 내용으로 되돌림', () => {
        change(A, 'qa', QA);
        change(A, 'base\n', 'revert');
        expectFail();
    });
    test('QA가 추가한 파일을 삭제', () => {
        change(`${DIR}/new.txt`, 'n', QA);
        unlinkSync(join(root, `${DIR}/new.txt`));
        commit('feat');
        expectFail(`${DIR}/new.txt`);
    });
    test('커밋 날짜가 뒤바뀌어도 마지막 조상을 쓴다', () => {
        committerDate = '2030-01-01T00:00:00Z';
        change(A, 'one', QA);
        committerDate = '2020-01-01T00:00:00Z';
        change(A, 'two', QA);
        expectPass();
        change(A, 'one', 'feat');
        expectFail();
    });
    test.each([
        ['본문 중간', 'feat\n\nAcceptance: qa\n\n마지막 문단은 설명이다.'],
        ['제목', 'Acceptance: qa'],
        ['문장 속', 'feat\n\n이 커밋은 Acceptance: qa 가 아니다'],
        ['다른 값', 'feat\n\nAcceptance: qa-dev'],
        ['대문자 값', 'feat\n\nAcceptance: QA'],
        ['값 두 개', 'feat\n\nAcceptance: qa\nAcceptance: dev'],
        ['다른 키', 'feat\n\nX-Acceptance: qa'],
    ])('가짜 트레일러: %s', (_, message) => {
        change(A, 'dev', message);
        expectFail();
    });
    test('범위 밖(기준 이전) QA 커밋은 허용 근거가 아니다', () => {
        change(A, 'qa', QA);
        git('update-ref', 'refs/remotes/origin/develop', 'HEAD');
        change(A, 'dev', 'feat');
        expectFail();
    });
    test('한글과 특수 문자 파일명', () => {
        change(`${DIR}/한글 [a]*.txt`, 'x', 'feat');
        expectFail('한글 [a]*.txt');
    });
    test('실행 비트', () => {
        chmodSync(join(root, A), 0o755);
        commit('feat');
        expectFail('파일 모드 변경');
    });
    test('merge로 들어온 변경', () => {
        git('checkout', '-q', '-b', 'side');
        change(A, 'side', 'side');
        git('checkout', '-q', 'work');
        change('src/work.txt', 'w', 'work');
        git('merge', '-q', '--no-ff', '-m', 'merge', 'side');
        expectFail();
    });
    test('merge 커밋 자체에서 넣은 변경', () => {
        git('checkout', '-q', '-b', 'side');
        change('src/side.txt', 's', 'side');
        git('checkout', '-q', 'work');
        change('src/work.txt', 'w', 'work');
        git('merge', '-q', '--no-ff', '--no-commit', 'side');
        change(A, 'merge', 'merge');
        expectFail();
    });
    test('ours merge로 QA 변경을 버림', () => {
        git('checkout', '-q', '-b', 'side');
        change(A, 'qa', QA);
        git('checkout', '-q', 'work');
        change('src/work.txt', 'w', 'work');
        git('merge', '-q', '-s', 'ours', '-m', 'merge', 'side');
        expectFail();
    });
    test('갈라진 QA 커밋', () => {
        git('checkout', '-q', '-b', 'side');
        change(`${DIR}/side.txt`, 's', QA);
        git('checkout', '-q', 'work');
        change(`${DIR}/work.txt`, 'w', QA);
        git('merge', '-q', '--no-ff', '-m', 'merge', 'side');
        expectFail('갈라진 QA 커밋');
    });
});

describe('작업 트리', () => {
    test('수정', () => {
        write(A, 'dirty');
        expectFail('디스크');
    });
    test('삭제', () => {
        unlinkSync(join(root, A));
        expectFail('디스크: 삭제됨');
    });
    test('staged', () => {
        write(A, 'staged');
        git('add', A);
        expectFail('인덱스');
    });
    test('인덱스만 변경', () => {
        write(A, 'staged');
        git('add', A);
        write(A, 'base\n');
        expectFail('(인덱스: 내용');
    });
    test('인덱스에서만 제거', () => {
        git('rm', '-q', '--cached', A);
        expectFail('인덱스: 삭제됨');
    });
    test.each(['--skip-worktree', '--assume-unchanged'])('%s로 숨긴 수정', (flag) => {
        git('update-index', flag, A);
        write(A, 'hidden');
        expect(git('status', '--porcelain')).toBe('');
        expectFail('디스크');
    });
    test('미추적', () => {
        write(`${DIR}/new.txt`);
        expectFail('미추적 파일');
    });
    test('ignore로 숨긴 미추적', () => {
        change('.gitignore', '*.log\n', 'chore');
        write(`${DIR}/sub/x.log`);
        expect(git('status', '--porcelain')).toBe('');
        expectFail(`${DIR}/sub/x.log`);
    });
    test('미추적 일반 파일 .DS_Store는 무시하고 비슷한 이름은 잡는다', () => {
        write(`${DIR}/.DS_Store`);
        write(`${DIR}/sub/.DS_Store`);
        expectPass();
        write(`${DIR}/x.DS_Store`);
        expectFail('x.DS_Store');
    });
    test('추적되거나 심볼릭 링크인 .DS_Store는 잡는다', () => {
        const path = `${DIR}/.DS_Store`;
        symlinkSync('a.txt', join(root, path));
        expectFail(path);
        unlinkSync(join(root, path));
        write(path);
        git('add', '-f', path);
        expectFail('인덱스: 추가됨');
        git('commit', '-q', '-m', 'feat');
        expectFail('HEAD: 추가됨');
    });
    test('core.fileMode=false로 숨긴 실행 비트', () => {
        git('config', 'core.fileMode', 'false');
        chmodSync(join(root, A), 0o755);
        expect(git('status', '--porcelain')).toBe('');
        expectFail('파일 모드 변경');
    });
    test('같은 내용을 가리키는 심볼릭 링크', () => {
        write('src/copy.txt', 'base\n');
        unlinkSync(join(root, A));
        symlinkSync('../../src/copy.txt', join(root, A));
        expectFail('디스크');
    });
    test.each([DIR, 'tests'])('%s 디렉터리를 심볼릭 링크로 바꿈', (path) => {
        renameSync(join(root, path), join(root, 'moved'));
        symlinkSync(join(root, 'moved'), join(root, path));
        expectFail();
    });
    test('QA 커밋 뒤에도 잡는다', () => {
        change(A, 'qa', QA);
        write(A, 'dirty');
        expectFail('마지막 QA 커밋');
    });
    test('merge 충돌 중', () => {
        git('checkout', '-q', '-b', 'side');
        change(A, 'side', QA);
        git('checkout', '-q', 'work');
        change(A, 'work', QA);
        expect(() => git('merge', 'side')).toThrow();
        expectFail();
    });
});

describe('검사 불가와 우회', () => {
    test('기준 ref 없음', () => {
        git('update-ref', '-d', 'refs/remotes/origin/develop');
        expectFail('기준 ref');
        // 로컬의 같은 이름으로 대신하지 않는다.
        git('branch', 'origin/develop');
        expectFail('기준 ref');
    });
    test('함수 인자의 기준 ref', () => {
        change(A, 'x', 'feat');
        expect(checkAcceptance(root, 'HEAD').ok).toBe(true);
    });
    test('공통 조상 없음', () => {
        git('checkout', '-q', '--orphan', 'orphan');
        commit('orphan');
        expectFail('검사를 끝내지 못했습니다');
    });
    test('git 저장소가 아님', () => {
        rmSync(join(root, '.git'), { recursive: true });
        expectFail('검사를 끝내지 못했습니다');
    });
    test('git 실행 불가', () => {
        vi.stubEnv('PATH', '');
        expectFail('검사를 끝내지 못했습니다');
    });
    test('저장소 하위 디렉터리', () => {
        const result = checkAcceptance(join(root, 'src'));
        expect(result.ok).toBe(false);
        expect(result.message).toContain('저장소 루트');
    });
    test('shallow clone', () => {
        change('src/app.txt', 'y', 'feat');
        const source = root;
        root = join(temp, 'clone');
        mkdirSync(root);
        git('clone', '-q', '--depth=1', pathToFileURL(source).href, '.');
        git('update-ref', 'refs/remotes/origin/develop', 'HEAD');
        expectFail('shallow clone');
    });
    test('GIT_INDEX_FILE, GIT_DIR로 바꿔치기', () => {
        cpSync(join(root, '.git'), join(temp, 'clean.git'), { recursive: true });
        change(A, 'dev', 'feat');
        vi.stubEnv('GIT_DIR', join(temp, 'clean.git'));
        vi.stubEnv('GIT_WORK_TREE', root);
        vi.stubEnv('GIT_INDEX_FILE', join(temp, 'clean.git/index'));
        expectFail('HEAD');
    });
    test('git replace로 바꿔치기', () => {
        change(A, 'dev', 'feat');
        const replacement = git('commit-tree', 'HEAD^{tree}', '-p', 'HEAD^', '-m', QA);
        git('replace', 'HEAD', replacement);
        expectFail();
    });
    test('CLI는 종료 코드로 알리고 인자·환경 변수로 기준을 바꿀 수 없다', () => {
        cpSync(import.meta.dirname, join(root, 'scripts/lib'), { recursive: true });
        cpSync(join(import.meta.dirname, '../check-acceptance.mjs'), join(root, 'scripts/check-acceptance.mjs'));
        commit('chore');
        const run = () =>
            execFileSync(process.execPath, [join(root, 'scripts/check-acceptance.mjs'), 'HEAD'], {
                cwd: temp,
                encoding: 'utf8',
                stdio: 'pipe',
                env: { ...process.env, BASE_REF: 'HEAD' },
            });
        expect(run()).toContain('통과');
        change(A, 'dev', 'feat');
        expect(run).toThrow(/QA에게 질문/);
    });
});
