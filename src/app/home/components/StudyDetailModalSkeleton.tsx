'use client';

import Modal from '@/components/Modal';
import SquareButton from '@/components/SquareButton';

interface StudyDetailModalSkeletonProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function StudyDetailModalSkeleton({
    isOpen,
    onClose,
}: StudyDetailModalSkeletonProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-100 w-full">
            <Modal.Header>
                <div className="mx-auto my-1 h-6 w-48 animate-pulse rounded-md bg-gray-200" />
            </Modal.Header>

            <Modal.Body>
                <div className="flex animate-pulse flex-col gap-5">
                    {/* 설명 영역 (2줄) */}
                    <div className="flex flex-col gap-2 px-1">
                        <div className="h-4 w-full rounded-md bg-gray-200" />
                        <div className="h-4 w-3/4 rounded-md bg-gray-200" />
                    </div>

                    {/* 카드 박스 3개 스켈레톤 */}
                    <div className="flex flex-col gap-2.5">
                        {/* 참여인원 박스 */}
                        <div className="flex flex-col gap-3 rounded-[10px] border border-gray-100 bg-gray-50/60 px-4 py-3">
                            <div className="flex items-center gap-2.5">
                                <div className="h-4 w-4 rounded bg-gray-200" />
                                <div className="h-4 w-16 rounded bg-gray-200" />
                            </div>
                            <div className="h-5 w-12 rounded bg-gray-200" />
                        </div>

                        {/* 기간 박스 */}
                        <div className="flex flex-col gap-3 rounded-[10px] border border-gray-100 bg-gray-50/60 px-4 py-3">
                            <div className="flex items-center gap-2.5">
                                <div className="h-4 w-4 rounded bg-gray-200" />
                                <div className="h-4 w-12 rounded bg-gray-200" />
                            </div>
                            <div className="h-5 w-36 rounded bg-gray-200" />
                        </div>

                        {/* 태그 박스 */}
                        <div className="flex flex-col gap-3 rounded-[10px] border border-gray-100 bg-gray-50/60 px-4 py-3">
                            <div className="flex items-center gap-2.5">
                                <div className="h-4 w-4 rounded bg-gray-200" />
                                <div className="h-4 w-12 rounded bg-gray-200" />
                            </div>
                            <div className="flex gap-2">
                                <div className="h-5 w-12 rounded bg-gray-200" />
                                <div className="h-5 w-16 rounded bg-gray-200" />
                                <div className="h-5 w-10 rounded bg-gray-200" />
                            </div>
                        </div>
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <SquareButton variant="cancel" onClick={onClose}>
                    취소
                </SquareButton>
                <SquareButton disabled>입장</SquareButton>
            </Modal.Footer>
        </Modal>
    );
}
