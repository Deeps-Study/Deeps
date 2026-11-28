'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UserProfileModel } from '@/types/user';
import Icon from '@/ui/Icon/Icon';

/*
 * 홈·스터디·마이페이지 공통 레이아웃(이슈 #152 3단계).
 * - 넓은 폭(lg, 1024px 이상): 헤더 72px + 사이드바(접힘 76px / 펼침 240px)
 * - 좁은 폭(1023px 이하): 헤더 56px + 메뉴 버튼으로 여는 서랍
 * 접기 버튼과 메뉴는 44px 칸·아이콘 20px·왼쪽 여백 16px이라 아이콘 가로 중심이 38px로 같다.
 */

interface AppShellProps {
    userProfile?: UserProfileModel;
    children: React.ReactNode;
}

function HomeIcon() {
    return (
        <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5 shrink-0"
        >
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9v11a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9" />
        </svg>
    );
}

function MenuIcon() {
    return (
        <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="size-5 shrink-0"
        >
            <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    );
}

function SidebarIcon() {
    return (
        <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5 shrink-0"
        >
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M9 4v16" />
        </svg>
    );
}

interface NavMenuProps {
    collapsed: boolean;
    onNavigate?: () => void;
    homeLinkRef?: React.Ref<HTMLAnchorElement>;
}

function NavMenu({ collapsed, onNavigate, homeLinkRef }: NavMenuProps) {
    const pathname = usePathname();
    const isHome = pathname === '/';

    return (
        <nav aria-label="주 메뉴">
            <Link
                ref={homeLinkRef}
                href="/"
                onClick={onNavigate}
                aria-current={isHome ? 'page' : undefined}
                className={`group relative flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold ${
                    collapsed ? 'w-11' : 'w-full'
                } ${
                    isHome
                        ? 'bg-primary-subtle text-primary-strong'
                        : 'text-foreground-muted hover:bg-canvas hover:text-foreground'
                }`}
            >
                <HomeIcon />
                {/* 접힘: 이름은 숨기고 호버·키보드 포커스에서 옆에 보인다(접근 가능한 이름은 유지) */}
                <span
                    className={
                        collapsed
                            ? 'pointer-events-none absolute left-full top-1/2 z-40 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-inverse px-2.5 py-1.5 text-xs font-medium text-surface opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                            : 'whitespace-nowrap'
                    }
                >
                    홈
                </span>
            </Link>
        </nav>
    );
}

function ProfileLink({ profileImageUrl, nickname }: UserProfileModel) {
    return (
        <Link
            href="/mypage"
            className="flex h-10 min-w-0 items-center gap-2 rounded-xl border border-border bg-surface px-2 hover:bg-canvas"
        >
            <span className="relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-canvas">
                {profileImageUrl ? (
                    <Image
                        src={profileImageUrl}
                        alt="프로필"
                        fill
                        sizes="24px"
                        priority
                        className="rounded-full object-cover"
                    />
                ) : (
                    <Icon
                        name="user"
                        className="h-4 w-4 fill-current stroke-2 text-primary-strong"
                    />
                )}
            </span>
            <span className="max-w-24 truncate text-sm font-semibold text-foreground sm:max-w-40">
                {nickname}
            </span>
        </Link>
    );
}

export default function AppShell({ userProfile, children }: AppShellProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    // 서랍을 연 주소. 다른 주소로 이동하면 저절로 닫힌다.
    const [drawerOpenedAt, setDrawerOpenedAt] = useState<string | null>(null);
    const drawerOpen = drawerOpenedAt !== null && drawerOpenedAt === pathname;

    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const drawerHomeLinkRef = useRef<HTMLAnchorElement>(null);

    const closeDrawer = (returnFocus: boolean) => {
        setDrawerOpenedAt(null);
        if (returnFocus) menuButtonRef.current?.focus();
    };

    useEffect(() => {
        if (!drawerOpen) return;
        drawerHomeLinkRef.current?.focus();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            setDrawerOpenedAt(null);
            menuButtonRef.current?.focus();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [drawerOpen]);

    return (
        <div className="flex min-h-screen flex-col bg-surface">
            <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface px-4 lg:h-18 lg:px-6">
                <button
                    ref={menuButtonRef}
                    type="button"
                    aria-expanded={drawerOpen}
                    aria-controls={drawerOpen ? 'app-drawer' : undefined}
                    aria-label={drawerOpen ? '메뉴 닫기' : '메뉴 열기'}
                    onClick={() =>
                        drawerOpen
                            ? closeDrawer(false)
                            : setDrawerOpenedAt(pathname)
                    }
                    className="flex size-11 shrink-0 items-center justify-center rounded-lg text-foreground-muted hover:bg-canvas hover:text-foreground lg:hidden"
                >
                    <MenuIcon />
                </button>
                <Link
                    href="/"
                    className="text-2xl font-bold text-primary-strong"
                >
                    Deeps
                </Link>
                <div className="ml-auto flex min-w-0 items-center">
                    {userProfile && (
                        <ProfileLink
                            profileImageUrl={userProfile.profileImageUrl}
                            nickname={userProfile.nickname}
                        />
                    )}
                </div>
            </header>

            <div className="flex flex-1">
                <aside
                    className={`sticky top-18 hidden h-[calc(100dvh-4.5rem)] shrink-0 flex-col gap-2 self-start bg-surface p-4 shadow-[inset_-1px_0_0_var(--color-border)] transition-[width] duration-200 motion-reduce:transition-none lg:flex ${
                        collapsed ? 'w-19' : 'w-60'
                    }`}
                >
                    <button
                        type="button"
                        aria-expanded={!collapsed}
                        aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
                        onClick={() => setCollapsed((v) => !v)}
                        className="flex size-11 shrink-0 items-center justify-center rounded-lg text-foreground-muted hover:bg-canvas hover:text-foreground"
                    >
                        <SidebarIcon />
                    </button>
                    <NavMenu collapsed={collapsed} />
                </aside>

                <div className="flex min-w-0 flex-1 flex-col">{children}</div>
            </div>

            {drawerOpen && (
                <div className="fixed inset-x-0 bottom-0 top-14 z-40 lg:hidden">
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-inverse/40"
                        onClick={() => closeDrawer(true)}
                    />
                    <div
                        id="app-drawer"
                        className="relative flex h-full w-60 max-w-[calc(100vw-3rem)] flex-col bg-surface p-4"
                    >
                        <NavMenu
                            collapsed={false}
                            homeLinkRef={drawerHomeLinkRef}
                            onNavigate={() => closeDrawer(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
