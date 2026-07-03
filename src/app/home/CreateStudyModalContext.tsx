'use client';

import React, { createContext, useContext, useState } from 'react';
import CreateStudyModal from '@/app/home/components/CreateStudyModal';

const ModalContext = createContext<(() => void) | undefined>(undefined);

export const useOpenCreateModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error(
            'useOpenCreateModal은 반드시 CreateStudyModalProvider 내부에서 사용되어야 합니다.',
        );
    }
    return context;
};

export function CreateStudyModalProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <ModalContext.Provider value={() => setIsCreateModalOpen(true)}>
            {children}
            {isCreateModalOpen && (
                <CreateStudyModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                />
            )}
        </ModalContext.Provider>
    );
}
