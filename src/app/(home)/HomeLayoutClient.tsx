'use client';

import { useCallback, useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import Icon from '@/ui/Icon/Icon';
import {
    CreateStudyModalProvider,
    useCreateStudyModal,
} from './CreateStudyModalContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { StudyRefreshProvider } from './StudyRefreshContext';
import { StudyLimitAlert } from './components/StudyLimitAlert';
import { useRouter } from 'next/navigation';

function LayoutContent({
    sidebarCollapsed,
    children,
}: {
    sidebarCollapsed: boolean;
    children: React.ReactNode;
}) {
    const { openModal, studyCount } = useCreateStudyModal();
    const { currentUser } = useCurrentUser();
    const [showAlert, setShowAlert] = useState<boolean>(false);

    const handleCreateStudyClick = () => {
        if (studyCount >= 3) {
            setShowAlert(true); // 3개 이상이면 차단 알림 바 노출
            return;
        }
        openModal();
    };

    useEffect(() => {
        if (!showAlert) return;

        const timer = setTimeout(() => {
            setShowAlert(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, [showAlert]);

    const userProfileData = currentUser
        ? {
              nickname: currentUser.nickname ?? '닉네임 없음',
              profileImageUrl: currentUser.image ?? undefined,
          }
        : undefined;

    return (
        <AppShell
            userProfile={userProfileData}
            initialCollapsed={sidebarCollapsed}
        >
            <div className="flex w-full justify-end px-4 pt-6 sm:px-8">
                <button
                    type="button"
                    onClick={handleCreateStudyClick}
                    className="flex h-10 items-center gap-2 whitespace-nowrap rounded-xl bg-primary-strong px-4 text-sm font-bold text-surface hover:cursor-pointer hover:bg-primary-hover"
                >
                    <Icon name="plus" className="stroke-3" />
                    딥스터디 만들기
                </button>
            </div>

            <div className="flex flex-1 justify-center">{children}</div>

            <StudyLimitAlert show={showAlert} />
        </AppShell>
    );
}

export default function HomeLayoutClient({
    sidebarCollapsed,
    children,
}: {
    sidebarCollapsed: boolean;
    children: React.ReactNode;
}) {
    const router = useRouter();
    const fetchMyStudies = useCallback(async () => {
        router.refresh();
    }, [router]);

    return (
        <StudyRefreshProvider value={fetchMyStudies}>
            <CreateStudyModalProvider>
                <LayoutContent sidebarCollapsed={sidebarCollapsed}>
                    {children}
                </LayoutContent>
            </CreateStudyModalProvider>
        </StudyRefreshProvider>
    );
}
