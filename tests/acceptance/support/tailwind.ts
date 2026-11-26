import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { compile } from '@tailwindcss/node';

const root = path.resolve(__dirname, '../../..');

/** 저장소의 Tailwind 진입 CSS(`@import 'tailwindcss'`가 있는 파일)를 찾는다. */
export function tailwindEntry(): string {
    const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', 'src'], {
        cwd: root,
        encoding: 'utf8',
    })
        .split('\0')
        .filter((file) => file.endsWith('.css'))
        .map((file) => path.join(root, file))
        .filter((file) => fs.existsSync(file))
        .filter((file) => /@import\s+['"]tailwindcss['"]/.test(fs.readFileSync(file, 'utf8')));
    if (files.length !== 1) {
        throw new Error(`Tailwind 진입 CSS가 ${files.length}개입니다(1개여야 함).`);
    }
    return files[0];
}

/**
 * 앱의 CSS 설정 그대로, 주어진 클래스만 쓰였을 때 Tailwind가 만드는 CSS를 돌려준다.
 * 화면에서 아직 쓰지 않은 유틸리티도 "쓰면 무엇이 되는지" 확인할 수 있다.
 */
export async function buildCss(candidates: string[]): Promise<string> {
    const entry = tailwindEntry();
    const compiler = await compile(fs.readFileSync(entry, 'utf8'), {
        base: path.dirname(entry),
        from: entry,
        onDependency: () => {},
    });
    return compiler.build(candidates);
}
