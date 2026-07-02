'use client';

import MainHeader from '@/components/MainHeader';
import { useState } from 'react';
import ExitStudyModal from './components/ExitStudyModal';
import { useRouter } from 'next/navigation';

export default function DeepStudyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isExitModalOpen, setIsExitModalOpen] = useState(false);

    const currentStudyTitle = '이거슨 스터디';
    const handleExitConfirm = () => {
        console.log('스터디 나가기가 실행되었습니다.');
        setIsExitModalOpen(false);
        router.push('/home');
    };

    return (
        <div className="flex flex-col min-h-screen">
            <MainHeader
                type="detail"
                onActionClick={() => setIsExitModalOpen(true)}
            />
            <div className="flex flex-1 justify-center  bg-white">
                {children}
            </div>

            <ExitStudyModal
                isOpen={isExitModalOpen}
                onClose={() => setIsExitModalOpen(false)}
                onConfirm={handleExitConfirm}
                studyTitle={currentStudyTitle}
            />
        </div>
    );
}
