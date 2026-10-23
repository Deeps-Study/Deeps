'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { StudyResponse, StudyMemberResponse } from '@/types/study';
import type { DeepsItemResponse } from '@/types/deeps';

import StudyInfo from '../components/StudyInfo';
import ActivityGrass from '../components/ActivityGrass';
import DeepsContainer from '../components/DeepsContainer';
import DeepsRanking from '../components/DeepsRanking';
import StudyFormModal from '@/components/StudyFormModal';
import Modal from '@/components/Modal';
import SquareButton from '@/components/SquareButton';
import { triggerAlertModal } from '@/utils/alertModalStore';

interface StudyClientProps {
    studyId: string;
    initialStudyDetail: StudyResponse | null;
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

    const [studyDetail, setStudyDetail] = useState<StudyResponse | null>(
        initialStudyDetail,
    );
    const [members] = useState<StudyMemberResponse[]>(initialMembers);
    const [deepsList] = useState<DeepsItemResponse[]>(initialDeepsList);

    // 모달 상태 관리
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const handleConfirmDelete = async () => {
        try {
            setIsDeleting(true);
            const res = await fetch(`/api/studies/${studyId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(
                    errorData?.message || '스터디 삭제에 실패했습니다.',
                );
            }

            setIsDeleteModalOpen(false);
            router.replace('/home');
        } catch (err: unknown) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : '스터디 삭제 중 오류가 발생했습니다.';

            triggerAlertModal({
                title: '오류 발생',
                message: errorMessage,
            });
        } finally {
            setIsDeleting(false);
        }
    };

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
                    <StudyInfo
                        study={studyDetail}
                        onEditClick={() => setIsEditModalOpen(true)}
                        onDeleteClick={() => setIsDeleteModalOpen(true)}
                    />
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
                        studyStatus={studyDetail.status}
                    />
                </div>
                <div className="col-span-5 pl-10">
                    <DeepsRanking members={members} />
                </div>
            </div>

            {/* 스터디 정보 수정 모달 */}
            <StudyFormModal
                isOpen={isEditModalOpen}
                mode="edit"
                initialData={studyDetail}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={(updatedFields) => {
                    if (updatedFields) {
                        setStudyDetail((prev) =>
                            prev ? { ...prev, ...updatedFields } : null,
                        );
                    }
                    router.refresh();
                }}
            />

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
                className="max-w-100 w-full"
            >
                <Modal.Body>
                    <div className="flex flex-col items-center text-center pt-4 pb-2 px-3">
                        <h2 className="text-xl font-bold text-gray-800 mb-3">
                            스터디를 삭제할까요?
                        </h2>
                        <p className="text-sm font-medium text-gray-600 leading-relaxed">
                            스터디를 삭제하면 모든 활동 내역과 잔디 기록이
                            <br />
                            영구적으로 삭제 되며 복구할 수 없습니다.
                        </p>
                    </div>
                </Modal.Body>
                <Modal.Footer className="pt-2 mt-0">
                    <SquareButton
                        variant="cancel"
                        onClick={() => setIsDeleteModalOpen(false)}
                        disabled={isDeleting}
                    >
                        취소
                    </SquareButton>
                    <SquareButton
                        onClick={handleConfirmDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? '삭제 중...' : '삭제'}
                    </SquareButton>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
