let notify: (() => void) | null = null;

export function registerSessionExpired(fn: () => void) {
    notify = fn;
}

export function triggerSessionExpired() {
    notify?.();
}
