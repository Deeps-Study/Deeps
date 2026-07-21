'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MainHeader from '@/components/MainHeader';
import ExitStudyModal from './components/ExitStudyModal';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function DeepStudyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const params = useParams();
    const studyId = params.studyId as string;

    const [isExitModalOpen, setIsExitModalOpen] = useState(false);
    const { currentUser } = useCurrentUser();

    const handleExitConfirm = async () => {
        if (!studyId) return;

        try {
            const res = await fetch(`/api/studies/${studyId}/members/me`, {
                method: 'DELETE',
            });

            if (res.status === 204) {
                setIsExitModalOpen(false);
                router.push('/home'); // 성공 시 메인 화면으로 이동
            } else {
                const errorData = await res.json();
                alert(errorData.message || '스터디 나가기에 실패했습니다.');
            }
        } catch (error) {
            console.error('스터디 나가기 요청 처리 중 오류 발생:', error);
            alert('스터디 나가기 처리 중 오류가 발생했습니다.');
        }
    };

    const userProfileData = currentUser
        ? {
              nickname: currentUser.nickname ?? '닉네임 없음',
              image: currentUser.image ?? undefined,
          }
        : undefined;

    return (
        <div className="flex flex-col min-h-screen">
            <MainHeader
                type="detail"
                onLeaveStudyClick={() => setIsExitModalOpen(true)}
                userProfile={userProfileData}
            />
            <div className="flex flex-1 justify-center bg-white">
                {children}
            </div>

            <ExitStudyModal
                isOpen={isExitModalOpen}
                onClose={() => setIsExitModalOpen(false)}
                onConfirm={handleExitConfirm}
            />
        </div>
    );
}
