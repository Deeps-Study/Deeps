'use client';

import MainHeader from '@/components/MainHeader';
import {
    CreateStudyModalProvider,
    useOpenCreateModal,
} from './CreateStudyModalContext';
import { useAuth } from '@/components/AuthProvider';
import { useCurrentUser } from '@/hooks/useCurrentUser';

function LayoutContent({ children }: { children: React.ReactNode }) {
    const openModal = useOpenCreateModal();

    const { accessToken } = useAuth();
    const { currentUser } = useCurrentUser(accessToken);

    const userProfileData = currentUser
        ? {
              id: currentUser.id,
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
    return (
        <CreateStudyModalProvider>
            <LayoutContent>{children}</LayoutContent>
        </CreateStudyModalProvider>
    );
}
