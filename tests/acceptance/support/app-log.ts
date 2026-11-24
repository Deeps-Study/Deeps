import fs from 'node:fs';
import path from 'node:path';
import { expect } from '@playwright/test';

const logFile = path.resolve(__dirname, '../../../test-results/app.log');

/** 지금부터 앱이 남기는 로그를 읽는다. */
export function watchAppLog() {
    const start = fs.statSync(logFile).size;
    const read = () => fs.readFileSync(logFile).subarray(start).toString('utf8');
    return {
        /** 문구가 모두 기록될 때까지 기다린 뒤 로그를 돌려준다. */
        async waitFor(phrases: string[]): Promise<string> {
            for (const phrase of phrases) {
                await expect.poll(read, { message: phrase }).toContain(phrase);
            }
            return read();
        },
    };
}

/** 문구 바로 뒤에 식별용 코드가 남았는지 확인한다. */
export function expectCodeAfter(log: string, phrase: string, code: RegExp) {
    const rest = log.slice(log.indexOf(phrase) + phrase.length);
    expect(rest.slice(0, 3000), `${phrase} 뒤의 코드`).toMatch(code);
}
