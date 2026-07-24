'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import SquareButton from '@/components/SquareButton';
import Icon from '@/ui/Icon/Icon';
import { StudyDetailResponse } from '@/types/study';
import { triggerSessionExpired } from '@/utils/sessionExpiredStore';
import { triggerAlertModal } from '@/utils/alertModalStore';
import StudyDetailModalSkeleton from './StudyDetailModalSkeleton';

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
    const [showSkeleton, setShowSkeleton] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            return;
        }

        const timer = setTimeout(() => {
            setShowSkeleton(true);
        }, 200);

        return () => {
            clearTimeout(timer);
            setShowSkeleton(false);
        };
    }, [isLoading]);

    const isSkeletonVisible = isLoading && showSkeleton;

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

                if (!res.ok) {
                    const errorData = await res.json().catch(() => null);
                    const backendMessage = errorData?.message;
                    console.error(backendMessage);

                    switch (res.status) {
                        case 403:
                            triggerAlertModal({
                                title: '접근 권한 없음',
                                message:
                                    '스터디 상세 정보를 조회할 권한이 없습니다.',
                            });
                            break;
                        case 404:
                            triggerAlertModal({
                                title: '조회 실패',
                                message: '존재하지 않거나 삭제된 스터디입니다.',
                            });
                            break;
                        case 500:
                            triggerAlertModal({
                                title: '서버 오류',
                                message:
                                    '서버 내부 문제로 스터디 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
                            });
                            break;
                        default:
                            triggerAlertModal({
                                title: '오류 발생',
                                message:
                                    '스터디 정보를 불러오는 중 문제가 발생했습니다.',
                            });
                            break;
                    }
                    return;
                }

                const data: StudyDetailResponse = await res.json();
                if (!isStale) {
                    setDetail(data);
                }
            } catch (error) {
                console.error(
                    '스터디 상세 데이터를 가져오는 데 실패했습니다:',
                    error,
                );
                triggerAlertModal({
                    title: '네트워크 연결 오류',
                    message:
                        '서버와 통신할 수 없습니다. 인터넷 연결 상태를 확인 후 다시 시도해 주세요.',
                });
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

    if (isLoading) {
        if (isSkeletonVisible) {
            return (
                <StudyDetailModalSkeleton isOpen={isOpen} onClose={onClose} />
            );
        }
        return null;
    }

    if (!detail) {
        return null;
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-100 w-full">
            <Modal.Header title={detail.title} />

            <Modal.Body>
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
            </Modal.Body>

            <Modal.Footer>
                <SquareButton variant="cancel" onClick={onClose}>
                    취소
                </SquareButton>
                <SquareButton onClick={onEnter}>입장</SquareButton>
            </Modal.Footer>
        </Modal>
    );
}

export default StudyDetailModal;
