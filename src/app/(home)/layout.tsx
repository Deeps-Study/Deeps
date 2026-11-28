import { cookies } from 'next/headers';
import {
    SIDEBAR_COOKIE,
    parseSidebarCollapsed,
} from '@/components/sidebarState';
import HomeLayoutClient from './HomeLayoutClient';

/* 사이드바 접힘 쿠키를 서버에서 읽어 첫 HTML부터 맞는 폭으로 그린다. */
export default async function HomeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    return (
        <HomeLayoutClient
            sidebarCollapsed={parseSidebarCollapsed(
                cookieStore.get(SIDEBAR_COOKIE)?.value,
            )}
        >
            {children}
        </HomeLayoutClient>
    );
}
