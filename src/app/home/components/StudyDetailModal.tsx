'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import SquareButton from '@/components/SquareButton';
import Icon from '@/ui/Icon/Icon';
import { StudyDetailResponse } from '@/types/study';
import { triggerSessionExpired } from '@/utils/sessionExpiredStore';

interface StudyDetailModalProps {
    studyId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onEnter?: () => void;
}

function StudyDetailModal({
    studyId,
    isOpen,
    onClose,
    onEnter,
}: StudyDetailModalProps) {
    const [detail, setDetail] = useState<StudyDetailResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !studyId) return;

        let isStale = false;
        async function fetchStudyDetail() {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/studies/${studyId}`);

                if (res.status === 401) {
                    triggerSessionExpired();
                    return;
                }

                if (!res.ok) return;

                const data: StudyDetailResponse = await res.json();
                if (!isStale) {
                    setDetail(data);
                }
            } catch (error) {
                console.error(
                    '스터디 상세 데이터를 가져오는 데 실패했습니다:',
                    error,
                );
            } finally {
                if (!isStale) {
                    setIsLoading(false);
                }
            }
        }

        fetchStudyDetail();

        return () => {
            isStale = true;
            setDetail(null);
        };
    }, [isOpen, studyId]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-100 w-full">
            <Modal.Header title={detail?.title ?? '스터디 정보'} />

            <Modal.Body>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-14">
                        <p className="text-sm font-semibold text-gray-400 animate-pulse">
                            상세 정보를 불러오는 중입니다...
                        </p>
                    </div>
                ) : detail ? (
                    <div className="flex flex-col gap-5">
                        <p className="px-1 text-sm font-medium leading-6 text-gray-400">
                            {detail.description}
                        </p>

                        <div className="flex flex-col gap-2.5">
                            <div className="flex flex-col gap-4.5 rounded-[10px] border border-main-20 bg-white px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                    <Icon
                                        name="users"
                                        className="stroke-3 stroke-main-30"
                                    />
                                    <span className="text-sm text-gray-400">
                                        참여인원
                                    </span>
                                </div>
                                <div className="text-sm font-semibold">
                                    {detail.currentMemberCount} /{' '}
                                    {detail.maxMemberCount}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4.5 rounded-[10px] border border-main-20 bg-white px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                    <Icon
                                        name="calendar"
                                        className="stroke-2 stroke-main-30"
                                    />
                                    <span className="text-sm text-gray-400">
                                        기간
                                    </span>
                                </div>
                                <div className="text-sm font-semibold">
                                    {detail.startDate} ~ {detail.endDate}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4.5 rounded-[10px] border border-main-20 bg-white px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                    <Icon
                                        name="tag"
                                        className="stroke-2 stroke-main-30"
                                    />
                                    <span className="text-sm text-gray-400">
                                        태그
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {detail.tags.map((tag, index) => (
                                        <span
                                            key={`${tag}-${index}`}
                                            className="text-sm font-semibold"
                                        >
                                            # {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-14 text-gray-400 text-sm">
                        스터디 데이터를 불러올 수 없습니다. 다시 시도해 주세요.
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer>
                <SquareButton variant="cancel" onClick={onClose}>
                    취소
                </SquareButton>
                <SquareButton onClick={onEnter} disabled={isLoading || !detail}>
                    입장
                </SquareButton>
            </Modal.Footer>
        </Modal>
    );
}

export default StudyDetailModal;
