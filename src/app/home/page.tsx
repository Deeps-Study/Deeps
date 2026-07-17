'use client';

import { useEffect, useState } from 'react';
import StudyCard from './components/StudyCard';
import CreateCard from './components/CreateCard';
import StudyDetailModal from './components/StudyDetailModal';
import { useOpenCreateModal } from './CreateStudyModalContext';
import { api } from '@/api';
import { useAuth } from '@/components/AuthProvider';
import { StudyResponse } from '@/types/study';

function HomePage() {
    const openCreateModal = useOpenCreateModal();
    const { accessToken } = useAuth();

    const [studies, setStudies] = useState<StudyResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStudyId, setSelectedStudyId] = useState<string | null>(null);

    const maxStudyCount = 3;

    useEffect(() => {
        if (!accessToken) return;

        async function fetchMyStudies() {
            setIsLoading(true);
            try {
                const res = await api.get<StudyResponse[]>('/studies/me');
                setStudies(res.data);
            } catch (error) {
                console.error(
                    '스터디 목록을 불러오는 중 오류가 발생했습니다:',
                    error,
                );
            } finally {
                setIsLoading(false);
            }
        }

        fetchMyStudies();
    }, [accessToken]);

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
