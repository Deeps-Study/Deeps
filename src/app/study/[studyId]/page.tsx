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
import { triggerAlertModal } from '@/utils/alertModalStore';

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
                } else {
                    const errorData = await detailRes.json().catch(() => null);
                    const backendMessage = errorData?.message;
                    console.error(
                        '스터디 상세 정보 로딩 에러:',
                        backendMessage,
                    );

                    if (detailRes.status === 403) {
                        triggerAlertModal({
                            title: '접근 제한',
                            message: '해당 스터디의 멤버만 접근할 수 있습니다.',
                            onConfirm: () => {
                                router.replace('/home');
                            },
                        });
                        return;
                    }

                    if (detailRes.status === 404) {
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
                        message:
                            '스터디 정보를 불러오는 중 문제가 발생했습니다.',
                        onConfirm: () => {
                            router.replace('/home');
                        },
                    });
                    return;
                }

                if (membersRes.ok) {
                    const membersData: StudyMemberResponse[] =
                        await membersRes.json();
                    setMembers(membersData);
                } else {
                    const errorData = await membersRes.json().catch(() => null);
                    console.error(
                        '스터디 멤버 목록 로딩 에러:',
                        errorData?.message,
                    );
                }

                // 4. 딥스 목록 데이터 처리
                if (deepsRes.ok) {
                    const deepsData: DeepsItemResponse[] =
                        await deepsRes.json();
                    setDeepsList(deepsData);
                } else {
                    const errorData = await deepsRes.json().catch(() => null);
                    console.error('딥스 목록 로딩 에러:', errorData?.message);
                }
            } catch (error) {
                console.error(
                    '스터디 데이터를 불러오는 중 네트워크 오류 발생:',
                    error,
                );
                triggerAlertModal({
                    title: '네트워크 연결 오류',
                    message:
                        '서버와 통신할 수 없습니다. 인터넷 연결 상태를 확인 후 다시 시도해 주세요.',
                });
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
