'use client';

import MainHeader from '@/components/MainHeader';
import {
    CreateStudyModalProvider,
    useOpenCreateModal,
} from './CreateStudyModalContext';

function LayoutContent({ children }: { children: React.ReactNode }) {
    const openModal = useOpenCreateModal();

    return (
        <div className="flex flex-col min-h-screen">
            <MainHeader
                type="home"
                onActionClick={openModal}
                userProfile={{ nickname: '박딥스', fallbackEmoji: '👻' }}
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
