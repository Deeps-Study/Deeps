'use client';
import { useEffect, useRef, useState } from 'react';
import Icon from '@/ui/Icon/Icon';

const REDIRECT_COOKIE = 'auth_redirect';

interface GoogleLoginButtonProps {
    /** 초대 등 로그인 뒤 돌아갈 경로. 검증은 콜백·온보딩의 resolveRedirectPath가 한다. */
    redirect: string | null;
    /** 로그인이 실패해 돌아온 화면(error=oauth_failed)인지 */
    isRetry: boolean;
}

/*
 * 복귀 경로 쿠키 처리
 * - redirect가 있으면 새로 저장한다.
 * - 로그인 실패 뒤 다시 시도하면 직전 시도의 쿠키를 그대로 둔다(초대 로그인 재시도).
 * - 그 밖에(redirect 없이 연 로그인 화면) 이전에 남은 쿠키를 지워 그만둔 초대가 열리지 않게 한다.
 */
function prepareRedirectCookie(redirect: string | null, isRetry: boolean) {
    if (redirect) {
        document.cookie = `${REDIRECT_COOKIE}=${encodeURIComponent(redirect)}; path=/; max-age=300; SameSite=Lax`;
        return;
    }
    if (!isRetry) {
        document.cookie = `${REDIRECT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    }
}

export function GoogleLoginButton({ redirect, isRetry }: GoogleLoginButtonProps) {
    const startedRef = useRef(false);
    const [isStarting, setIsStarting] = useState(false);

    // 뒤로 가기로 페이지가 캐시에서 돌아오면 다시 누를 수 있게 한다.
    useEffect(() => {
        const handlePageShow = (e: PageTransitionEvent) => {
            if (!e.persisted) return;
            startedRef.current = false;
            setIsStarting(false);
        };
        window.addEventListener('pageshow', handlePageShow);
        return () => window.removeEventListener('pageshow', handlePageShow);
    }, []);

    const handleClick = () => {
        if (startedRef.current) return;
        startedRef.current = true;
        setIsStarting(true);
        prepareRedirectCookie(redirect, isRetry);
        window.location.href = '/api/auth/google';
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={isStarting}
            className="mt-8 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border-input bg-surface px-4 text-[15px] leading-5.5 font-semibold text-foreground enabled:hover:bg-canvas disabled:cursor-default"
        >
            <span aria-hidden="true" className="flex size-5 shrink-0">
                <Icon name="googleLogo" className="size-5" />
            </span>
            Google로 계속하기
        </button>
    );
}
