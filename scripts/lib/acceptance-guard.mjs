import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync, readlinkSync, realpathSync } from 'node:fs';
import { join } from 'node:path';

const ACCEPTANCE_DIR = 'tests/acceptance';
// 같은 이름의 로컬 브랜치나 태그가 먼저 잡히지 않도록 전체 이름을 쓴다.
const BASE_REF = 'refs/remotes/origin/develop';
const ASK_QA = '할 일: 인수 테스트는 QA만 바꿀 수 있습니다. 직접 고치지 말고 QA에게 질문하세요.';

function gitEnv() {
    // GIT_DIR, GIT_INDEX_FILE 등으로 검사 대상이 바뀌지 않게 한다.
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
    return { ...env, LC_ALL: 'C', GIT_NO_REPLACE_OBJECTS: '1', GIT_GRAFT_FILE: '/dev/null' };
}

function git(root, args) {
    return execFileSync('git', ['--literal-pathspecs', '-c', 'trailer.separators=:', ...args], {
        cwd: root,
        env: gitEnv(),
        encoding: 'utf8',
        maxBuffer: 256 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
    });
}

const splitNul = (text) => text.split('\0').filter(Boolean);
const splitLines = (text) => text.split('\n').filter(Boolean);

function isQaCommit(root, commit) {
    const values = splitLines(
        git(root, ['log', '-1', '--no-show-signature', '--format=%(trailers:key=Acceptance,valueonly)', commit]),
    );
    return values.length === 1 && values[0].trim() === 'qa';
}

function findBaseline(root, baseRef) {
    const bases = splitLines(git(root, ['merge-base', '--all', baseRef, 'HEAD']));
    if (bases.length !== 1) throw new Error(`merge-base가 ${bases.length}개라 기준을 정할 수 없습니다.`);
    const [mergeBase] = bases;
    const qaCommits = splitLines(git(root, ['rev-list', `${mergeBase}..HEAD`])).filter((c) => isQaCommit(root, c));
    if (qaCommits.length === 0) return { mergeBase, baseline: mergeBase, label: 'merge-base' };
    // 커밋 날짜가 아니라 조상 관계로 마지막 커밋을 정한다.
    const last = splitLines(git(root, ['merge-base', '--independent', ...qaCommits]));
    if (last.length !== 1) {
        throw new Error('서로 갈라진 QA 커밋이 여러 개라 마지막을 정할 수 없습니다. QA의 새 커밋이 필요합니다.');
    }
    return { mergeBase, baseline: last[0], label: '마지막 QA 커밋' };
}

function readTree(root, commit) {
    const entries = new Map();
    for (const line of splitNul(git(root, ['ls-tree', '-r', '-z', '--full-tree', commit, '--', ACCEPTANCE_DIR]))) {
        const tab = line.indexOf('\t');
        const [mode, , hash] = line.slice(0, tab).split(' ');
        entries.set(line.slice(tab + 1), `${mode} ${hash}`);
    }
    return entries;
}

function readIndex(root) {
    const entries = new Map();
    for (const line of splitNul(git(root, ['ls-files', '-s', '-z', '--', ACCEPTANCE_DIR]))) {
        const tab = line.indexOf('\t');
        const [mode, hash, stage] = line.slice(0, tab).split(' ');
        const path = line.slice(tab + 1);
        entries.set(path, stage === '0' ? `${mode} ${hash}` : '충돌');
    }
    return entries;
}

// git status는 assume-unchanged, skip-worktree, ignore에 가려지므로 디스크를 직접 읽는다.
function readDisk(root, algorithm) {
    const entries = new Map();
    const hash = (content) =>
        createHash(algorithm).update(`blob ${content.length}\0`).update(content).digest('hex');

    const visit = (path) => {
        const full = join(root, path);
        const stat = lstatSync(full, { throwIfNoEntry: false });
        if (!stat) return;
        if (stat.isDirectory()) {
            for (const name of readdirSync(full)) visit(`${path}/${name}`);
        } else if (stat.isSymbolicLink()) {
            entries.set(path, `120000 ${hash(readlinkSync(full, { encoding: 'buffer' }))}`);
        } else if (stat.isFile()) {
            entries.set(path, `${stat.mode & 0o100 ? '100755' : '100644'} ${hash(readFileSync(full))}`);
        } else {
            entries.set(path, '특수 파일');
        }
    };

    const parent = lstatSync(join(root, 'tests'), { throwIfNoEntry: false });
    if (parent?.isSymbolicLink()) entries.set('tests', '심볼릭 링크');
    else if (parent?.isDirectory()) visit(ACCEPTANCE_DIR);
    return entries;
}

// macOS는 git에 NFC로 기록한 이름을 디스크에 NFD로 둘 수 있다.
function matchUnicodeForm(disk, baseline) {
    if (process.platform !== 'darwin') return disk;
    return new Map(
        [...disk].map(([path, value]) => {
            const nfc = path.normalize('NFC');
            return [!baseline.has(path) && baseline.has(nfc) && !disk.has(nfc) ? nfc : path, value];
        }),
    );
}

function describe(expected, actual) {
    if (actual === undefined) return '삭제됨';
    if (expected === undefined) return '추가됨';
    const [mode, hash] = actual.split(' ');
    const [baseMode, baseHash] = expected.split(' ');
    return hash === baseHash && mode !== baseMode ? `파일 모드 변경(${baseMode} → ${mode})` : '내용 또는 종류 변경';
}

function inspect(root, baseRef) {
    if (realpathSync(git(root, ['rev-parse', '--show-toplevel']).replace(/\n$/, '')) !== realpathSync(root)) {
        throw new Error('검사 위치가 저장소 루트가 아닙니다.');
    }
    if (git(root, ['rev-parse', '--is-shallow-repository']).trim() !== 'false') {
        throw new Error('shallow clone이라 전체 기록을 볼 수 없습니다. 전체 기록을 받으세요(git fetch --unshallow).');
    }
    try {
        git(root, ['rev-parse', '--verify', '--quiet', '--end-of-options', `${baseRef}^{commit}`]);
    } catch {
        throw new Error(`기준 ref(${baseRef})가 없습니다. git fetch origin을 먼저 실행하세요.`);
    }

    const { mergeBase, baseline, label } = findBaseline(root, baseRef);
    const touched = splitNul(
        git(root, [
            'log', '-m', '--full-history', '--no-renames', '--no-show-signature', '-z', '--name-only', '--format=',
            `${mergeBase}..HEAD`, '--', ACCEPTANCE_DIR,
        ]),
    );
    const expected = readTree(root, baseline);
    const index = readIndex(root);
    const head = readTree(root, 'HEAD');
    const algorithm = git(root, ['rev-parse', '--show-object-format']).trim();
    const disk = matchUnicodeForm(readDisk(root, algorithm), expected);
    // macOS Finder가 만드는 미추적 일반 파일만 무시한다.
    for (const [path, value] of disk) {
        const known = [expected, head, index].some((entries) => entries.has(path));
        if (path.endsWith('/.DS_Store') && value.startsWith('100') && !known) disk.delete(path);
    }
    const states = [
        ['HEAD', head],
        ['인덱스', index],
        ['디스크', disk],
    ];

    const paths = new Set([...touched, ...expected.keys(), ...states.flatMap(([, entries]) => [...entries.keys()])]);
    const problems = [];
    for (const path of [...paths].sort()) {
        // 깨진 이름끼리 겹치면 변경을 놓칠 수 있다.
        if (path.includes('�')) throw new Error(`UTF-8이 아닌 파일 이름이 있습니다: ${JSON.stringify(path)}`);
        const reasons = states
            .filter(([, entries]) => entries.get(path) !== expected.get(path))
            .map(([name, entries]) => {
                const untracked = name === '디스크' && entries.has(path) && !index.has(path);
                return `${name}: ${untracked ? '미추적 파일' : describe(expected.get(path), entries.get(path))}`;
            });
        if (reasons.length > 0) problems.push({ path, reasons });
    }
    return { baseline, label, problems };
}

/** 기준 ref 인자는 테스트 전용이다. CLI는 항상 기본값을 쓴다. */
export function checkAcceptance(root, baseRef = BASE_REF) {
    try {
        const { baseline, label, problems } = inspect(root, baseRef);
        const base = `${label} ${baseline.slice(0, 10)}`;
        if (problems.length === 0) return { ok: true, message: `인수 테스트 보호: 통과 (기준: ${base})` };
        return {
            ok: false,
            message: [
                `인수 테스트 보호: 실패. ${ACCEPTANCE_DIR} 내용이 기준(${base})과 다릅니다.`,
                ...problems.map(({ path, reasons }) => `  - ${JSON.stringify(path)} (${reasons.join(', ')})`),
                ASK_QA,
            ].join('\n'),
        };
    } catch (error) {
        const reason = String(error?.stderr || '').trim() || error?.message || String(error);
        return { ok: false, message: `인수 테스트 보호: 실패. 검사를 끝내지 못했습니다.\n  - ${reason}\n${ASK_QA}` };
    }
}
