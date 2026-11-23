// 앱 프로세스(빌드·시작)에 미리 로드해 127.0.0.1 밖으로 나가는 연결을 막는다.
import net from 'node:net';

const LOCAL_HOSTS = new Set(['127.0.0.1', '::1', 'localhost']);
const originalConnect = net.Socket.prototype.connect;

net.Socket.prototype.connect = function connect(...args) {
    const first = Array.isArray(args[0]) ? args[0][0] : args[0];
    const options =
        typeof first === 'object' && first !== null
            ? first
            : { port: first, host: typeof args[1] === 'string' ? args[1] : undefined };
    const isPipe = options.path !== undefined || typeof first === 'string';
    const host = options.host ?? 'localhost';
    if (!isPipe && !LOCAL_HOSTS.has(host)) {
        const error = new Error('외부 연결이 차단되었습니다.');
        error.code = 'EXTERNAL_BLOCKED';
        process.nextTick(() => this.destroy(error));
        return this;
    }
    return originalConnect.apply(this, args);
};
