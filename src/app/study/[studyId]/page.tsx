'use client';

import { useEffect, useState, use } from 'react';
import type {
    StudyDetailResponse,
    StudyMemberResponse,
    DeepsItemResponse,
} from '@/types/study';

import StudyInfo from '../components/StudyInfo';
import ActivityGrass from '../components/ActivityGrass';
import DeepsContainer from '../components/DeepsContainer';
import DeepsRanking from '../components/DeepsRanking';
import StudyDetailSkeleton from '../components/StudyDetailSkeleton';
import { useRouter } from 'next/navigation';
import { triggerSessionExpired } from '@/utils/sessionExpiredStore';

interface DeepStudyPageProps {
    params: Promise<{ studyId: string }>;
}

export default function DeepStudyPage({ params }: DeepStudyPageProps) {
    const { studyId } = use(params);

    const [studyDetail, setStudyDetail] = useState<StudyDetailResponse | null>(
        null,
    );
    const [members, setMembers] = useState<StudyMemberResponse[]>([]);
    const [deepsList, setDeepsList] = useState<DeepsItemResponse[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [showSkeleton, setShowSkeleton] = useState<boolean>(false);

    const router = useRouter();

    useEffect(() => {
        const fetchStudyData = async () => {
            try {
                setIsLoading(true);

                const [detailRes, membersRes, deepsRes] = await Promise.all([
                    fetch(`/api/studies/${studyId}`),
                    fetch(`/api/studies/${studyId}/members`),
                    fetch(`/api/studies/${studyId}/deeps`),
                ]);

                if (
                    detailRes.status === 401 ||
                    membersRes.status === 401 ||
                    deepsRes.status === 401
                ) {
                    triggerSessionExpired();
                    return;
                }

                if (detailRes.ok) {
                    const detailData: StudyDetailResponse =
                        await detailRes.json();
                    setStudyDetail(detailData);
                }

                if (membersRes.ok) {
                    const membersData: StudyMemberResponse[] =
                        await membersRes.json();
                    setMembers(membersData);
                }

                if (deepsRes.ok) {
                    const deepsData: DeepsItemResponse[] =
                        await deepsRes.json();
                    setDeepsList(deepsData);
                }

                if (!detailRes.ok) {
                    if (detailRes.status === 403) {
                        alert('해당 스터디의 멤버만 접근할 수 있습니다.');
                        router.replace('/home');
                        return;
                    }
                }
            } catch (error) {
                console.error('스터디 데이터를 불러오는 중 오류 발생:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (studyId) {
            fetchStudyData();
        }
    }, [studyId, router]);

    useEffect(() => {
        if (!isLoading) return;

        const timer = setTimeout(() => {
            setShowSkeleton(true);
        }, 200);

        return () => clearTimeout(timer);
    }, [isLoading]);

    const isSkeletonVisible = isLoading && showSkeleton;

    if (isLoading) {
        return isSkeletonVisible ? <StudyDetailSkeleton /> : null;
    }

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
