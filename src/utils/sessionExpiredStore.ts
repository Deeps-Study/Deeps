import { triggerAlertModal } from './alertModalStore';

export function triggerSessionExpired() {
    triggerAlertModal({
        title: '로그인 세션이 만료되었어요',
        message: '다시 로그인해 주세요.',
        onConfirm: () => {
            window.location.href = '/login';
        },
    });
}
