'use client';

import { useCallback, useState, useEffect } from 'react';
import MainHeader from '@/components/MainHeader';
import {
    CreateStudyModalProvider,
    useOpenCreateModal,
} from './CreateStudyModalContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { triggerSessionExpired } from '@/utils/sessionExpiredStore';
import { StudyRefreshProvider } from './StudyRefreshContext';
import { StudyLimitAlert } from './components/StudyLimitAlert';

function LayoutContent({ children }: { children: React.ReactNode }) {
    const openModal = useOpenCreateModal();
    const { currentUser } = useCurrentUser();
    const [studyCount, setStudyCount] = useState<number>(0);
    const [showAlert, setShowAlert] = useState<boolean>(false);

    useEffect(() => {
        if (!currentUser) return;

        fetch('/api/studies/count')
            .then((res) => {
                if (res.status === 401) {
                    triggerSessionExpired();
                    return null;
                }
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then((data) => {
                if (data) setStudyCount(data.count);
            })
            .catch((error) => console.error('스터디 개수 조회 실패:', error));
    }, [currentUser]);

    const handleCreateStudyClick = () => {
        if (studyCount >= 3) {
            setShowAlert(true);
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
              image: currentUser.image ?? undefined,
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
