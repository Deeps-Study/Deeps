'use client';

import { useCallback } from 'react';
import MainHeader from '@/components/MainHeader';
import {
    CreateStudyModalProvider,
    useOpenCreateModal,
} from './CreateStudyModalContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { StudyRefreshProvider } from './StudyRefreshContext';

function LayoutContent({ children }: { children: React.ReactNode }) {
    const openModal = useOpenCreateModal();
    const { currentUser } = useCurrentUser();

    const userProfileData = currentUser
        ? {
              nickname: currentUser.nickname ?? '닉네임 없음',
              image: currentUser.image ?? undefined,
          }
        : undefined;

    return (
        <div className="flex flex-col min-h-screen">
            <MainHeader
                type="home"
                onActionClick={openModal}
                userProfile={userProfileData}
            />

            <div className="flex flex-1 justify-center bg-white">
                {children}
            </div>
        </div>
    );
}

export default function HomeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const fetchMyStudies = useCallback(async () => {
        try {
            window.location.reload();
        } catch (error) {
            console.error(error);
        }
    }, []);

    return (
        <StudyRefreshProvider value={fetchMyStudies}>
            <CreateStudyModalProvider>
                <LayoutContent>{children}</LayoutContent>
            </CreateStudyModalProvider>
        </StudyRefreshProvider>
    );
}
