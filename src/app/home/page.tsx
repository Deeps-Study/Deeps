'use client';

import { useEffect, useState, useCallback } from 'react';
import StudyCard from './components/StudyCard';
import CreateCard from './components/CreateCard';
import StudyDetailModal from './components/StudyDetailModal';
import { useOpenCreateModal } from './CreateStudyModalContext';
import { StudyResponse } from '@/types/study';

function HomePage() {
    const openCreateModal = useOpenCreateModal();

    const [studies, setStudies] = useState<StudyResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStudyId, setSelectedStudyId] = useState<string | null>(null);

    const maxStudyCount = 3;

    const fetchMyStudies = useCallback(async (isStale = false) => {
        try {
            if (!isStale) setIsLoading(true);

            const res = await fetch('/api/studies/me');
            if (res.status === 401) {
                console.warn('인증 세션이 만료되었습니다.');
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
    }, []);

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

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <p className="text-gray-500 font-medium">
                    스터디 목록을 불러오는 중입니다...
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full px-8">
            <h1 className="my-6 text-center text-3xl font-bold text-gray-600">
                현재 진행중인 스터디를 확인하세요!
            </h1>
            <main className="flex h-full items-center justify-center gap-10 py-14">
                {studies.map((study) => (
                    <StudyCard
                        key={study.id}
                        study={study}
                        onCardClick={() => setSelectedStudyId(study.id)}
                        onEnterClick={() => console.log('딥스터디 입장')}
                    />
                ))}

                {studies.length < maxStudyCount && (
                    <CreateCard onCreateClick={openCreateModal} />
                )}
            </main>
            <StudyDetailModal
                isOpen={!!selectedStudyId}
                studyId={selectedStudyId}
                onClose={() => setSelectedStudyId(null)}
                onEnter={() => {
                    console.log('딥스터디 입장하기');
                    setSelectedStudyId(null);
                }}
            />
        </div>
    );
}

export default HomePage;
