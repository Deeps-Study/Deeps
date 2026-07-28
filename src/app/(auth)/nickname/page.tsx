import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { REFRESH_COOKIE } from '@/api/authSession';
import { NicknameForm } from './NicknameForm';

export default async function NicknamePage() {
    const cookieStore = await cookies();
    if (!cookieStore.get(REFRESH_COOKIE)?.value) redirect('/login');

    return <NicknameForm />;
}
