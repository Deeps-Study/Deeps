'use client';

import React, { useState, createContext, useContext } from 'react';
import MainHeader from '@/components/MainHeader';
import CreateStudyModal from '@/app/home/components/CreateStudyModal';

const ModalContext = createContext<(() => void) | undefined>(undefined);

export const useOpenCreateModal = () => {
    const context = useContext(ModalContext);
    if (!context)
        throw new Error(
            'useOpenCreateModal은 반드시 HomeLayout 내부에서 사용되어야 합니다.',
        );
    return context;
};

export default function HomeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <ModalContext.Provider value={() => setIsCreateModalOpen(true)}>
            <div className="flex flex-col min-h-screen">
                <MainHeader
                    type="home"
                    onActionClick={() => setIsCreateModalOpen(true)}
                />

                <div className="flex flex-1 justify-center bg-white">
                    {children}
                </div>

                {isCreateModalOpen && (
                    <CreateStudyModal
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                    />
                )}
            </div>
        </ModalContext.Provider>
    );
}
