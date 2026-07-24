'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import SquareButton from '@/components/SquareButton';
import { triggerAlertModal } from '@/utils/alertModalStore';

interface ExitStudyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
}

function ExitStudyModal({ isOpen, onClose, onConfirm }: ExitStudyModalProps) {
    const [isLeaving, setIsLeaving] = useState(false);

    const handleConfirm = async () => {
        try {
            setIsLeaving(true);
            await onConfirm();
        } catch (error) {
            console.error('스터디 나가기 중 오류가 발생했습니다:', error);
            triggerAlertModal({
                title: '처리 실패',
                message:
                    '스터디를 나가는 도중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
            });
        } finally {
            setIsLeaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-90 w-full">
            <Modal.Body>
                <div className="flex flex-col items-center text-center pt-4 pb-2 px-3">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        이 딥스터디를 나갈까요?
                    </h2>

                    <p className="text-sm font-medium text-gray-600 leading-relaxed">
                        딥스터디를 나가면
                        <br />
                        기록했던 잔디가 사라집니다.
                    </p>

                    <p className="text-sm font-medium text-gray-600 leading-relaxed mt-4">
                        다시 스터디에 돌아와도 잔디는 복구되지 않아요.
                    </p>
                </div>
            </Modal.Body>

            <Modal.Footer className="pt-0 mt-0">
                <SquareButton
                    variant="cancel"
                    onClick={onClose}
                    disabled={isLeaving}
                >
                    취소
                </SquareButton>
                <SquareButton onClick={handleConfirm} disabled={isLeaving}>
                    {isLeaving ? '처리 중...' : '확인'}
                </SquareButton>
            </Modal.Footer>
        </Modal>
    );
}

export default ExitStudyModal;
