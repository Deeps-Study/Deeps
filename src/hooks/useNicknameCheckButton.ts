import { useCallback, useRef, useState } from 'react';

export type NicknameCheckStatus =
    | 'idle'
    | 'checking'
    | 'available'
    | 'taken'
    | 'failed';

interface CheckState {
    nickname: string;
    status: Exclude<NicknameCheckStatus, 'idle'>;
}

/*
 * 버튼을 누를 때만 닉네임 중복을 확인한다(입력만으로는 요청하지 않음).
 * 결과는 확인한 값에만 붙으므로 값이 바뀌면 자동으로 확인 전(idle) 상태가 된다.
 * 값이 바뀌거나 새로 확인하면 이전 요청의 늦은 응답은 무시한다.
 */
export function useNicknameCheckButton(nickname: string) {
    const [state, setState] = useState<CheckState | null>(null);
    const requestIdRef = useRef(0);
    const checkingRef = useRef<string | null>(null);

    const status: NicknameCheckStatus =
        state && state.nickname === nickname ? state.status : 'idle';

    const check = useCallback(async () => {
        const target = nickname;
        if (checkingRef.current === target) return;
        const requestId = ++requestIdRef.current;
        checkingRef.current = target;
        setState({ nickname: target, status: 'checking' });

        let next: CheckState['status'] = 'failed';
        try {
            const res = await fetch(
                `/api/users/me/nickname/check?nickname=${encodeURIComponent(target)}`,
            );
            if (res.ok) {
                const data: unknown = await res.json();
                const available = (data as { available?: unknown } | null)
                    ?.available;
                if (typeof available === 'boolean') {
                    next = available ? 'available' : 'taken';
                }
            }
        } catch {
            next = 'failed';
        }

        if (requestId !== requestIdRef.current) return;
        checkingRef.current = null;
        setState({ nickname: target, status: next });
    }, [nickname]);

    /* 값이 바뀔 때 부른다. 진행 중인 확인의 응답을 버린다. */
    const reset = useCallback(() => {
        requestIdRef.current += 1;
        checkingRef.current = null;
        setState(null);
    }, []);

    return { status, check, reset };
}
