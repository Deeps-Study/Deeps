'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import StudyCard from './StudyCard';
import CreateCard from './CreateCard';
import StudyDetailModal from './StudyDetailModal';
import StudyJoinModal from '@/components/StudyJoinModal';
import {
    useOpenCreateModal,
    useCreateStudyModal,
} from '../CreateStudyModalContext';
import { StudyResponse, StudyDetailResponse } from '@/types/study';
import { triggerAlertModal } from '@/utils/alertModalStore';

interface HomeClientProps {
    initialStudies: StudyResponse[];
    studiesStatus: number;
    initialPreviewStudy: StudyDetailResponse | null;
    previewStatus?: number;
    joinStudyId?: string;
}

export default function HomeClient({
    initialStudies,
    studiesStatus,
    initialPreviewStudy,
    previewStatus,
    joinStudyId,
}: HomeClientProps) {
    const openCreateModal = useOpenCreateModal();
    const { setStudyCount } = useCreateStudyModal();
    const router = useRouter();
    const pathname = usePathname();

    const [studies] = useState<StudyResponse[]>(initialStudies);
    const [selectedStudyId, setSelectedStudyId] = useState<string | null>(null);
    const [previewStudy, setPreviewStudy] =
        useState<StudyDetailResponse | null>(initialPreviewStudy);

    const maxStudyCount = 3;

    // 1. 내 스터디 조회 에러 모달 핸들링
    useEffect(() => {
        if (studiesStatus === 200) return;

        switch (studiesStatus) {
            case 403:
                triggerAlertModal({
                    title: '접근 권한 없음',
                    message: '스터디 목록을 조회할 권한이 없습니다.',
                });
                break;
            case 404:
                triggerAlertModal({
                    title: '조회 실패',
                    message: '요청하신 스터디 정보를 찾을 수 없습니다.',
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
                    message: '스터디 목록을 불러오는 중 문제가 발생했습니다.',
                });
                break;
        }
    }, [studiesStatus]);

    // 2. 초대 스터디 미리보기 에러 모달 핸들링
    useEffect(() => {
        if (!joinStudyId || !previewStatus || previewStatus === 200) return;

        if (previewStatus === 404) {
            triggerAlertModal({
                title: '초대 링크 오류',
                message: '존재하지 않거나 삭제된 스터디의 초대 링크입니다.',
            });
        } else {
            triggerAlertModal({
                title: '초대 정보 오류',
                message: '초대 스터디 정보를 불러올 수 없습니다.',
            });
        }
    }, [joinStudyId, previewStatus]);

    // 3. 모달용 스터디 개수 동기화
    useEffect(() => {
        setStudyCount(initialStudies.length);
    }, [initialStudies.length, setStudyCount]);

    const handleCloseModal = () => {
        setPreviewStudy(null);
        router.replace(pathname, { scroll: false });
    };

    const handleEnterStudy = (studyId: string) => {
        router.push(`/study/${studyId}`);
    };

    return (
        <div className="flex flex-col w-full px-8">
            <h1 className="mt-20 text-center text-3xl font-bold text-gray-600">
                현재 진행중인 스터디를 확인하세요!
            </h1>
            <main className="flex h-full items-center justify-center gap-10 py-14">
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
