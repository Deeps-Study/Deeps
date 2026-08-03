'use client';

import { useCallback, useState, useEffect } from 'react';
import MainHeader from '@/components/MainHeader';
import {
    CreateStudyModalProvider,
    useCreateStudyModal,
} from './CreateStudyModalContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { StudyRefreshProvider } from './StudyRefreshContext';
import { StudyLimitAlert } from './components/StudyLimitAlert';

function LayoutContent({ children }: { children: React.ReactNode }) {
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
        <div className="flex flex-col min-h-screen">
            <MainHeader
                type="home"
                onCreateStudyClick={handleCreateStudyClick}
                userProfile={userProfileData}
            />

            <div className="flex flex-1 justify-center bg-white">
                {children}
            </div>

            <StudyLimitAlert show={showAlert} />
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
