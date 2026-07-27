'use client';
import { Suspense } from 'react';
import Icon from '@/ui/Icon/Icon';
import { useSearchParams } from 'next/navigation';

function LoginCard() {
    const searchParams = useSearchParams();
    const isLoginFailed = searchParams.get('error') === 'oauth_failed';

    const handleLoginButtonClick = () => {
        const redirectParam = searchParams.get('redirect');

        if (redirectParam) {
            document.cookie = `auth_redirect=${encodeURIComponent(redirectParam)}; path=/; max-age=300; SameSite=Lax`;
        }
        window.location.href = '/api/auth/google';
    };

    return (
        <div className="w-85 min-h-85 pt-14 pb-10 px-10 border border-main-10 shadow-mint rounded-[40px]">
            <div className="flex flex-col items-center">
                <span className="text-5xl font-bold text-main-100">Deeps</span>
                <p className="mt-3.5 text-base text-center text-gray-600">
                    소셜 로그인으로
                    <br /> 빠르게 시작해 보세요!
                </p>
            </div>

            <div className="flex flex-col items-center">
                <button
                    className="flex items-center gap-2.5 h-10 bg-[#FFFFFF] border border-[#747775] rounded-xl pl-3 pr-3 mt-16 cursor-pointer"
                    onClick={handleLoginButtonClick}
                >
                    <div className="flex items-center justify-center w-5 h-5">
                        <Icon name="googleLogo" className="w-5 h-5" />
                    </div>
                    <span className="text-[#1F1F1F] text-sm text-left leading-5 font-medium">
                        Google 계정으로 로그인
                    </span>
                </button>
                {isLoginFailed && (
                    <p className="mt-3 text-sm font-medium text-red-100">
                        로그인에 실패했어요. 다시 시도해 주세요.
                    </p>
                )}
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginCard />
        </Suspense>
    );
}
