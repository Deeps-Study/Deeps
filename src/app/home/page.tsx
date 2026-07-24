'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import StudyCard from './components/StudyCard';
import CreateCard from './components/CreateCard';
import StudyDetailModal from './components/StudyDetailModal';
import StudyCardSkeleton from './components/StudyCardSkeleton';
import StudyJoinModal from '@/components/StudyJoinModal';
import { useOpenCreateModal } from './CreateStudyModalContext';
import { StudyResponse, StudyDetailResponse } from '@/types/study';
import { triggerSessionExpired } from '@/utils/sessionExpiredStore';
import { triggerAlertModal } from '@/utils/alertModalStore';

function HomePageContent() {
    const openCreateModal = useOpenCreateModal();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [studies, setStudies] = useState<StudyResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showSkeleton, setShowSkeleton] = useState(false);

    const [selectedStudyId, setSelectedStudyId] = useState<string | null>(null);

    const joinStudyId = searchParams.get('joinStudy');
    const [previewStudy, setPreviewStudy] =
        useState<StudyDetailResponse | null>(null);

    const maxStudyCount = 3;

    // 1. 초대 스터디 정보 불러오기 (상태 코드 및 백엔드 메시지 분기)
    useEffect(() => {
        if (!joinStudyId) {
            return;
        }

        let isMounted = true;

        fetch(`/api/studies/${joinStudyId}/preview`)
            .then(async (res) => {
                if (!res.ok) {
                    const errorData = await res.json().catch(() => null);
                    const backendMessage = errorData?.message;
                    console.error(backendMessage);
                    if (res.status === 404) {
                        triggerAlertModal({
                            title: '초대 링크 오류',
                            message:
                                '존재하지 않거나 삭제된 스터디의 초대 링크입니다.',
                        });
                    } else {
                        triggerAlertModal({
                            title: '초대 정보 오류',
                            message: '초대 스터디 정보를 불러올 수 없습니다.',
                        });
                    }
                    return null;
                }
                return res.json();
            })
            .then((data) => {
                if (isMounted && data) {
                    setPreviewStudy(data);
                }
            })
            .catch((err) => {
                console.error(
                    '초대 스터디 정보를 불러오는 중 네트워크 오류:',
                    err,
                );
                triggerAlertModal({
                    title: '네트워크 오류',
                    message:
                        '초대 스터디 정보를 가져오는 중 네트워크 연결 오류가 발생했습니다.',
                });
            });

        return () => {
            isMounted = false;
        };
    }, [joinStudyId]);

    const handleCloseModal = () => {
        setPreviewStudy(null);
        router.replace(pathname, { scroll: false });
    };

    // 2. 내 스터디 목록 불러오기 (상태 코드 및 백엔드 메시지 분기)
    const fetchMyStudies = useCallback(
        async (isStale = false) => {
            try {
                if (!isStale) setIsLoading(true);

                const res = await fetch('/api/studies/me');

                if (res.status === 401) {
                    if (!joinStudyId) {
                        triggerSessionExpired();
                    }
                    return;
                }

                if (!res.ok) {
                    const errorData = await res.json().catch(() => null);
                    const backendMessage = errorData?.message;
                    console.error(backendMessage);

                    switch (res.status) {
                        case 403:
                            triggerAlertModal({
                                title: '접근 권한 없음',
                                message:
                                    '스터디 목록을 조회할 권한이 없습니다.',
                            });
                            break;
                        case 404:
                            triggerAlertModal({
                                title: '조회 실패',
                                message:
                                    '요청하신 스터디 정보를 찾을 수 없습니다.',
                            });
                            break;
                        case 500:
                            triggerAlertModal({
                                title: '서버 오류',
                                message:
                                    '서버 내부 문제로 스터디 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
                            });
                            break;
                        default:
                            triggerAlertModal({
                                title: '오류 발생',
                                message:
                                    '스터디 목록을 불러오는 중 문제가 발생했습니다.',
                            });
                            break;
                    }
                    return;
                }

                const data: StudyResponse[] = await res.json();
                if (!isStale) {
                    setStudies(data);
                }
            } catch (error) {
                console.error(
                    '스터디 목록을 불러오는 중 네트워크 오류가 발생했습니다:',
                    error,
                );
                triggerAlertModal({
                    title: '네트워크 연결 오류',
                    message:
                        '서버와 통신할 수 없습니다. 인터넷 연결을 확인해 주세요.',
                });
            } finally {
                if (!isStale) {
                    setIsLoading(false);
                }
            }
        },
        [joinStudyId],
    );

    useEffect(() => {
        let isStale = false;

        const loadInitialData = async () => {
            await fetchMyStudies(isStale);
        };

        loadInitialData();

        return () => {
            isStale = true;
        };
    }, [fetchMyStudies]);

    const handleEnterStudy = (studyId: string) => {
        router.push(`/study/${studyId}`);
    };

    useEffect(() => {
        if (!isLoading) return;

        const timer = setTimeout(() => {
            setShowSkeleton(true);
        }, 200);

        return () => clearTimeout(timer);
    }, [isLoading]);

    const isSkeletonVisible = isLoading && showSkeleton;

    return (
        <div className="flex flex-col w-full px-8">
            <h1 className="mt-20 text-center text-3xl font-bold text-gray-600">
                현재 진행중인 스터디를 확인하세요!
            </h1>
            <main className="flex h-full items-center justify-center gap-10 py-14">
                {isLoading ? (
                    isSkeletonVisible && (
                        <>
                            <StudyCardSkeleton />
                            <StudyCardSkeleton />
                            <StudyCardSkeleton />
                        </>
                    )
                ) : (
                    <>
                        {studies.map((study) => (
                            <StudyCard
                                key={study.id}
                                study={study}
                                onCardClick={() => setSelectedStudyId(study.id)}
                                onEnterClick={() => handleEnterStudy(study.id)}
                            />
                        ))}

                        {studies.length < maxStudyCount && (
                            <CreateCard onCreateClick={openCreateModal} />
                        )}
                    </>
                )}
            </main>
            <StudyDetailModal
                isOpen={!!selectedStudyId}
                studyId={selectedStudyId}
                onClose={() => setSelectedStudyId(null)}
                onEnter={() => {
                    if (selectedStudyId) {
                        handleEnterStudy(selectedStudyId);
                        setSelectedStudyId(null);
                    }
                }}
            />

            {previewStudy && (
                <StudyJoinModal
                    study={previewStudy}
                    isOpen={!!joinStudyId}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
}

export default function HomePage() {
    return (
        <Suspense
            fallback={
                <div className="flex flex-1 items-center justify-center">
                    <p className="text-gray-500 font-medium">로딩 중...</p>
                </div>
            }
        >
            <HomePageContent />
        </Suspense>
    );
}
