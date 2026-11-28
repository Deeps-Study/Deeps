'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UserProfileModel } from '@/types/user';
import Icon from '@/ui/Icon/Icon';
import {
    readSidebarCollapsedCookie,
    writeSidebarCollapsedCookie,
} from './sidebarState';

/*
 * 홈·스터디·마이페이지 공통 레이아웃(이슈 #152 3단계).
 * - 넓은 폭(lg, 1024px 이상): 헤더 72px + 사이드바(접힘 76px / 펼침 240px)
 * - 좁은 폭(1023px 이하): 헤더 56px + 메뉴 버튼으로 여는 서랍
 * 접기 버튼과 메뉴는 44px 칸·아이콘 20px·왼쪽 여백 16px이라 아이콘 가로 중심이 38px로 같다.
 * 접힘 상태는 쿠키에 기억한다(sidebarState.ts). 서버 레이아웃이 읽은 값을 initialCollapsed로 받는다.
 * 서랍은 dialog로 포커스를 가두고(안에 닫기 버튼), 넓은 폭이 되면 닫히며, 열린 동안 뒤 본문 스크롤을 막는다.
 */

interface AppShellProps {
    userProfile?: UserProfileModel;
    /** 서버에서 읽은 sidebar_collapsed 쿠키 값. 첫 HTML 폭을 정한다. */
    initialCollapsed?: boolean;
    children: React.ReactNode;
}

const WIDE_QUERY = '(min-width: 1024px)';

// 접힘 상태의 원본은 쿠키다. 같은 화면의 구독자에게 바뀐 것을 알린다.
// 쿠키 쓰기가 막힌 브라우저에서는 메모리 값으로 화면 안 접기·펼치기만 동작한다(저장은 안 됨).
const collapsedListeners = new Set<() => void>();
let memoryCollapsed: boolean | null = null;

function subscribeCollapsed(listener: () => void) {
    collapsedListeners.add(listener);
    return () => {
        collapsedListeners.delete(listener);
    };
}

function getCollapsedSnapshot() {
    return memoryCollapsed ?? readSidebarCollapsedCookie() ?? false;
}

function setCollapsed(collapsed: boolean) {
    writeSidebarCollapsedCookie(collapsed);
    // 쿠키에 반영됐으면 쿠키를 따르고(다른 탭 변경도 반영), 막혔으면 메모리에 둔다.
    memoryCollapsed =
        readSidebarCollapsedCookie() === collapsed ? null : collapsed;
    collapsedListeners.forEach((listener) => listener());
}

/** 스크롤을 막을 때 사라지는 스크롤바 폭. 스크롤바가 자리를 차지하지 않으면 0. */
function scrollbarGutter() {
    return Math.max(
        0,
        window.innerWidth - document.documentElement.clientWidth,
    );
}

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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

function CloseIcon() {
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
            <path d="M6 6l12 12M18 6 6 18" />
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

export default function AppShell({
    userProfile,
    initialCollapsed = false,
    children,
}: AppShellProps) {
    const pathname = usePathname();
    // 하이드레이션은 서버 값으로 맞추고, 그 뒤(화면 안 이동 포함)에는 쿠키를 따른다.
    const collapsed = useSyncExternalStore(
        subscribeCollapsed,
        getCollapsedSnapshot,
        () => initialCollapsed,
    );
    // 서랍을 연 주소. 다른 주소로 이동하면 저절로 닫힌다.
    const [drawerOpenedAt, setDrawerOpenedAt] = useState<string | null>(null);
    const drawerOpen = drawerOpenedAt !== null && drawerOpenedAt === pathname;

    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const drawerHomeLinkRef = useRef<HTMLAnchorElement>(null);
    const drawerRef = useRef<HTMLDivElement>(null);
    const sidebarToggleRef = useRef<HTMLButtonElement>(null);

    const closeDrawer = (returnFocus: boolean) => {
        setDrawerOpenedAt(null);
        if (returnFocus) menuButtonRef.current?.focus();
    };

    useEffect(() => {
        if (!drawerOpen) return;
        drawerHomeLinkRef.current?.focus();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setDrawerOpenedAt(null);
                menuButtonRef.current?.focus();
                return;
            }
            if (e.key !== 'Tab') return;
            // 포커스를 서랍 안에 가둔다: 끝에서 처음으로, 처음에서 끝으로 돈다.
            const drawer = drawerRef.current;
            if (!drawer) return;
            const items = Array.from(
                drawer.querySelectorAll<HTMLElement>(FOCUSABLE),
            );
            if (items.length === 0) {
                e.preventDefault();
                return;
            }
            const first = items[0];
            const last = items[items.length - 1];
            const active = document.activeElement;
            const inside = active instanceof Node && drawer.contains(active);
            if (e.shiftKey && (!inside || active === first)) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && (!inside || active === last)) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown);

        // 넓은 폭(사이드바)이 되면 서랍을 닫고 포커스를 사이드바 접기 버튼으로 옮긴다.
        // 다시 좁혀도 닫힌 채로 둔다.
        const wide = window.matchMedia(WIDE_QUERY);
        const onWide = () => {
            if (!wide.matches) return;
            setDrawerOpenedAt(null);
            sidebarToggleRef.current?.focus();
        };
        wide.addEventListener('change', onWide);

        // 열린 동안 뒤 본문이 스크롤되지 않게 한다(휠·키 모두). 닫히면 원래 값으로 돌린다.
        // 사라지는 스크롤바 폭만큼 오른쪽 여백을 채워 본문 위치·폭이 흔들리지 않게 한다.
        const root = document.documentElement;
        const previousOverflow = root.style.overflow;
        const previousPaddingRight = root.style.paddingRight;
        const gutter = scrollbarGutter();
        root.style.overflow = 'hidden';
        if (gutter > 0) {
            const base =
                parseFloat(getComputedStyle(root).paddingRight) || 0;
            root.style.paddingRight = `${base + gutter}px`;
        }

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            wide.removeEventListener('change', onWide);
            root.style.overflow = previousOverflow;
            root.style.paddingRight = previousPaddingRight;
        };
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
                        ref={sidebarToggleRef}
                        type="button"
                        aria-expanded={!collapsed}
                        aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
                        onClick={() => setCollapsed(!collapsed)}
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
                        ref={drawerRef}
                        id="app-drawer"
                        role="dialog"
                        aria-modal="true"
                        aria-label="메뉴"
                        className="relative flex h-full w-60 max-w-[calc(100vw-3rem)] flex-col gap-2 bg-surface p-4"
                    >
                        <button
                            type="button"
                            aria-label="메뉴 닫기"
                            onClick={() => closeDrawer(true)}
                            className="flex size-11 shrink-0 items-center justify-center self-end rounded-lg text-foreground-muted hover:bg-canvas hover:text-foreground"
                        >
                            <CloseIcon />
                        </button>
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
