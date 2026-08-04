import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { REFRESH_COOKIE } from '@/api/authSession';
import { NicknameForm } from './NicknameForm';

export default async function NicknamePage() {
    const cookieStore = await cookies();
    if (!cookieStore.get(REFRESH_COOKIE)?.value) redirect('/login');

    return (
        <div className="w-125 min-h-78.5 pt-11 pb-14 px-12 border border-main-10 shadow-mint rounded-[40px] bg-white flex flex-col gap-6">
            <span className="text-main-100 text-xl font-bold text-center">
                안녕하세요! 닉네임을 알려주세요
            </span>
            <NicknameForm />
        </div>
    );
}
