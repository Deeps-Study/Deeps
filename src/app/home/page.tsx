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

    // 초대 스터디 정보 불러오기
    useEffect(() => {
        if (!joinStudyId) {
            return;
        }

        let isMounted = true;

        fetch(`/api/studies/${joinStudyId}/preview`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (isMounted && data) {
                    setPreviewStudy(data);
                }
            })
            .catch((err) => {
                console.error('초대 스터디 정보를 불러오는 중 오류:', err);
            });

        return () => {
            isMounted = false;
        };
    }, [joinStudyId]);

    const handleCloseModal = () => {
        setPreviewStudy(null);
        router.replace(pathname, { scroll: false });
    };

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

                if (!res.ok) return;

                const data: StudyResponse[] = await res.json();
                if (!isStale) {
                    setStudies(data);
                }
            } catch (error) {
                console.error(
                    '스터디 목록을 불러오는 중 오류가 발생했습니다:',
                    error,
                );
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
                    // 로딩 중 : 200ms 지나면 스켈레톤 노출 (그 전엔 빈 공간)
                    isSkeletonVisible && (
                        <>
                            <StudyCardSkeleton />
                            <StudyCardSkeleton />
                            <StudyCardSkeleton />
                        </>
                    )
                ) : (
                    // 로딩 후: 실제 데이터 및 스터디 만들기 카드 노출
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
