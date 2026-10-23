'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MainHeader from '@/components/MainHeader';
import ExitStudyModal from './components/ExitStudyModal';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { StudyResponse, StudyMemberResponse } from '@/types/study';

export default function DeepStudyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const params = useParams();
    const studyId = params?.studyId as string;

    const [isExitModalOpen, setIsExitModalOpen] = useState(false);
    const { currentUser } = useCurrentUser();

    const [studyDetail, setStudyDetail] = useState<StudyResponse | null>(null);
    const [members, setMembers] = useState<StudyMemberResponse[]>([]);

    useEffect(() => {
        if (!studyId) return;

        // 방장 여부 확인용 상세 정보 조회
        fetch(`/api/studies/${studyId}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => setStudyDetail(data))
            .catch(() => {});

        // 위임 대상 목록용 멤버 조회
        fetch(`/api/studies/${studyId}/members`)
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => setMembers(data))
            .catch(() => {});
    }, [studyId]);

    const handleExitConfirm = async (nextHostId?: string) => {
        if (!studyId) return;

        try {
            const res = await fetch(`/api/studies/${studyId}/members/me`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: nextHostId ? JSON.stringify({ nextHostId }) : undefined,
            });

            if (res.status === 204 || res.ok) {
                setIsExitModalOpen(false);
                router.push('/home');
            } else {
                const errorData = await res.json().catch(() => null);
                alert(errorData?.message || '스터디 나가기에 실패했습니다.');
            }
        } catch (error) {
            console.error('스터디 나가기 요청 처리 중 오류 발생:', error);
            alert('스터디 나가기 처리 중 오류가 발생했습니다.');
        }
    };

    const userProfileData = currentUser
        ? {
              nickname: currentUser.nickname ?? '닉네임 없음',
              profileImageUrl: currentUser.image ?? undefined,
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
                isHost={studyDetail?.isHost}
                members={members}
                currentUserId={currentUser?.id}
                onClose={() => setIsExitModalOpen(false)}
                onConfirm={handleExitConfirm}
            />
        </div>
    );
}
