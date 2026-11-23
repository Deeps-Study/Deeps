import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const METHODS = new Set([
    'GET',
    'HEAD',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
]);

function exportedNames(file: string): string[] {
    const source = ts.createSourceFile(
        file,
        fs.readFileSync(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
    );
    const names: string[] = [];
    for (const node of source.statements) {
        if (ts.isExportDeclaration(node)) {
            if (!node.exportClause || !ts.isNamedExports(node.exportClause)) {
                throw new Error(`export *는 메서드를 알 수 없습니다: ${file}`);
            }
            names.push(...node.exportClause.elements.map((e) => e.name.text));
        } else if (
            ts.canHaveModifiers(node) &&
            ts
                .getModifiers(node)
                ?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
        ) {
            if (ts.isFunctionDeclaration(node) && node.name) {
                names.push(node.name.text);
            } else if (ts.isVariableStatement(node)) {
                for (const declaration of node.declarationList.declarations) {
                    if (ts.isIdentifier(declaration.name)) {
                        names.push(declaration.name.text);
                    } else {
                        names.push(
                            ...declaration.name.elements.flatMap((e) =>
                                ts.isBindingElement(e) ? [e.name.getText()] : [],
                            ),
                        );
                    }
                }
            }
        }
    }
    return names;
}

/** app 폴더의 모든 route 파일에서 'METHOD /경로' 목록을 만든다. */
export function discoverRoutes(appDir: string): string[] {
    const found: string[] = [];
    const files = fs.readdirSync(appDir, { recursive: true, encoding: 'utf8' });
    for (const file of files) {
        if (!/^route\.(ts|tsx|js|jsx)$/.test(path.basename(file))) continue;
        const segments = path
            .dirname(file)
            .split(path.sep)
            .filter((s) => s !== '.' && !/^\(.*\)$/.test(s));
        const names = exportedNames(path.join(appDir, file));
        const methods = names.filter((name) => METHODS.has(name));
        if (methods.length === 0) {
            throw new Error(`메서드를 찾지 못했습니다: ${file}`);
        }
        found.push(...methods.map((m) => `${m} /${segments.join('/')}`));
    }
    return found.sort();
}
