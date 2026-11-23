/** 127.0.0.1의 http 주소가 아니면 예외를 던진다. */
export function assertLoopback(name) {
    let url;
    try {
        url = new URL(process.env[name] ?? '');
    } catch {
        throw new Error(`${name}: 주소가 없거나 잘못되어 시작을 거부합니다.`);
    }
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port) {
        throw new Error(`${name}: 127.0.0.1이 아니어서 시작을 거부합니다.`);
    }
    return url;
}
