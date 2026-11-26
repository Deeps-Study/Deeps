import { GoogleLoginButton } from './GoogleLoginButton';

interface LoginPageProps {
    searchParams: Promise<{ redirect?: string | string[]; error?: string | string[] }>;
}

const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const params = await searchParams;
    const isLoginFailed = first(params.error) === 'oauth_failed';

    return (
        <>
            <p className="mt-8 inline-flex rounded-full bg-primary-subtle px-2.5 py-1 text-xs leading-4.5 font-semibold text-primary-strong">
                함께 깊어지는 학습
            </p>
            <h1 className="mt-3 text-2xl leading-8.5 font-bold text-foreground lg:text-[28px] lg:leading-9.5">
                질문하고, 풀고,
                <br />
                <span className="text-primary-strong">더 깊이 이해하세요.</span>
            </h1>
            <p className="mt-3 text-sm leading-5.5 text-foreground-muted">
                혼자 넘겼던 개념을 문제로 만들고 동료의 풀이에서 새로운 관점을 발견하세요.
            </p>
            <GoogleLoginButton
                redirect={first(params.redirect) ?? null}
                isRetry={isLoginFailed}
            />
            {isLoginFailed && (
                <p
                    role="alert"
                    className="mt-3 text-[13px] leading-5 font-medium text-error"
                >
                    로그인에 실패했어요. 다시 시도해 주세요.
                </p>
            )}
        </>
    );
}
