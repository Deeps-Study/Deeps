interface AlertModalPayload {
    title: string;
    message: string;
    onConfirm?: () => void;
}

let notify: ((payload: AlertModalPayload) => void) | null = null;

export function registerAlertModal(fn: (payload: AlertModalPayload) => void) {
    notify = fn;
}

export function triggerAlertModal(payload: AlertModalPayload) {
    notify?.(payload);
}
