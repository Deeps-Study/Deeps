'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { StudyDetailResponse, StudyMemberResponse } from '@/types/study';
import type { DeepsItemResponse } from '@/types/deeps';

import StudyInfo from '../components/StudyInfo';
import ActivityGrass from '../components/ActivityGrass';
import DeepsContainer from '../components/DeepsContainer';
import DeepsRanking from '../components/DeepsRanking';
import { triggerAlertModal } from '@/utils/alertModalStore';

interface StudyClientProps {
    studyId: string;
    initialStudyDetail: StudyDetailResponse | null;
    detailStatus: number;
    initialMembers: StudyMemberResponse[];
    initialDeepsList: DeepsItemResponse[];
}

export default function StudyClient({
    studyId,
    initialStudyDetail,
    detailStatus,
    initialMembers,
    initialDeepsList,
}: StudyClientProps) {
    const router = useRouter();

    const [studyDetail] = useState<StudyDetailResponse | null>(
        initialStudyDetail,
    );
    const [members] = useState<StudyMemberResponse[]>(initialMembers);
    const [deepsList] = useState<DeepsItemResponse[]>(initialDeepsList);

    // 에러 상태 코드에 따른 모달 핸들링
    useEffect(() => {
        if (detailStatus === 200) return;

        if (detailStatus === 403) {
            triggerAlertModal({
                title: '접근 제한',
                message: '해당 스터디의 멤버만 접근할 수 있습니다.',
                onConfirm: () => {
                    router.replace('/home');
                },
            });
            return;
        }

        if (detailStatus === 404) {
            triggerAlertModal({
                title: '조회 실패',
                message: '존재하지 않거나 삭제된 스터디입니다.',
                onConfirm: () => {
                    router.replace('/home');
                },
            });
            return;
        }

        triggerAlertModal({
            title: '오류 발생',
            message: '스터디 정보를 불러오는 중 문제가 발생했습니다.',
        });
    }, [detailStatus, router]);

    if (!studyDetail) {
        return (
            <div className="flex h-96 w-full items-center justify-center text-gray-400">
                스터디 정보를 찾을 수 없습니다.
            </div>
        );
    }

    return (
        <div className="flex w-full max-w-350 flex-col gap-14 px-10 py-12">
            <div className="grid grid-cols-12 gap-16 items-start">
                <div className="col-span-7">
                    <StudyInfo study={studyDetail} />
                </div>
                <div className="col-span-5 pl-10">
                    <ActivityGrass
                        members={members}
                        startDate={studyDetail.startDate}
                        endDate={studyDetail.endDate}
                    />
                </div>
            </div>

            <div className="grid grid-cols-12 gap-16 items-start">
                <div className="col-span-7">
                    <DeepsContainer
                        deepsList={deepsList}
                        studyId={studyId}
                        totalMemberCount={studyDetail.currentMemberCount}
                    />
                </div>
                <div className="col-span-5 pl-10">
                    <DeepsRanking members={members} />
                </div>
            </div>
        </div>
    );
}
