'use client';

import React, { createContext, useContext, useState } from 'react';
import CreateStudyModal from '@/app/home/components/CreateStudyModal';

interface CreateStudyModalContextType {
    openModal: () => void;
    studyCount: number;
    setStudyCount: (count: number) => void;
}
const ModalContext = createContext<CreateStudyModalContextType | undefined>(
    undefined,
);

export const useCreateStudyModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error(
            'useCreateStudyModal은 반드시 CreateStudyModalProvider 내부에서 사용되어야 합니다.',
        );
    }
    return context;
};

export const useOpenCreateModal = () => {
    return useCreateStudyModal().openModal;
};

export function CreateStudyModalProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [studyCount, setStudyCount] = useState(0);

    const openModal = () => setIsCreateModalOpen(true);

    return (
        <ModalContext.Provider value={{ openModal, studyCount, setStudyCount }}>
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
