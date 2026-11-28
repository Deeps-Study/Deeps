import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { REFRESH_COOKIE } from '@/api/authSession';
import {
    SIDEBAR_COOKIE,
    parseSidebarCollapsed,
} from '@/components/sidebarState';
import { MyPageClient } from './MyPageClient';

export default async function MyPage() {
    const cookieStore = await cookies();
    if (!cookieStore.get(REFRESH_COOKIE)?.value) redirect('/login');

    return (
        <MyPageClient
            sidebarCollapsed={parseSidebarCollapsed(
                cookieStore.get(SIDEBAR_COOKIE)?.value,
            )}
        />
    );
}
