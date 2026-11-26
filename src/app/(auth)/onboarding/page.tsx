import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { REFRESH_COOKIE } from '@/api/authSession';
import { NicknameForm } from './NicknameForm';

export default async function OnboardingPage() {
    const cookieStore = await cookies();
    if (!cookieStore.get(REFRESH_COOKIE)?.value) redirect('/login');

    return (
        <>
            <p className="mt-8 inline-flex rounded-full bg-primary-subtle px-2.5 py-1 text-xs leading-4.5 font-semibold text-primary-strong">
                2 / 2 단계
            </p>
            <h1 className="mt-3 text-2xl leading-8.5 font-bold text-foreground lg:text-[28px] lg:leading-9.5">
                반가워요!
                <br />
                어떻게 불러드릴까요?
            </h1>
            <p className="mt-3 text-sm leading-5.5 text-foreground-muted">
                Deeps에서 사용할 나만의 닉네임을 설정해주세요.
            </p>
            <NicknameForm />
        </>
    );
}
