'use client';

import Modal from '@/components/Modal';
import SquareButton from '@/components/SquareButton';
import { Study } from '@/types/study';
import Icon from '@/ui/Icon/Icon';

interface StudyDetailModalProps {
    study: Study;
    isOpen: boolean;
    onClose?: () => void;
    onEnter?: () => void;
}

function StudyDetailModal({
    study,
    isOpen,
    onClose,
    onEnter,
}: StudyDetailModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-100 w-full">
            <Modal.Header title={study.title} />
            <Modal.Body>
                <p className="px-1 text-sm font-medium leading-6 text-gray-400">
                    {study.description}
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
                            {study.currentParticipants} /{' '}
                            {study.maxParticipants}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4.5 rounded-[10px] border border-main-20 bg-white px-4 py-3">
                        <div className="flex items-center gap-2.5">
                            <Icon
                                name="calendar"
                                className="stroke-2 stroke-main-30"
                            />
                            <span className="text-sm text-gray-400">기간</span>
                        </div>
                        <div className="text-sm font-semibold">
                            {study.startDate} ~ {study.endDate}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4.5 rounded-[10px] border border-main-20 bg-white px-4 py-3">
                        <div className="flex items-center gap-2.5">
                            <Icon
                                name="tag"
                                className="stroke-2 stroke-main-30"
                            />
                            <span className="text-sm text-gray-400">태그</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {study.tags.map((tag, index) => (
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
