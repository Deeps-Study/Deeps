'use client';

import Modal from '@/components/Modal';
import SquareButton from '@/components/SquareButton';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function DeleteAccountModal({
    isOpen,
    onClose,
    onConfirm,
}: DeleteAccountModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-90 w-full">
            <Modal.Body>
                <div className="flex flex-col items-center text-center pt-4 pb-2 px-3">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        정말 탈퇴하시겠어요?
                    </h2>
                    <p className="text-sm font-medium text-gray-600 leading-relaxed">
                        탈퇴하면 출석 기록과 계정 정보가
                        <br />
                        모두 삭제되고 복구할 수 없습니다.
                    </p>
                </div>
            </Modal.Body>

            <Modal.Footer className="pt-0 mt-0">
                <SquareButton variant="cancel" onClick={onClose}>
                    취소
                </SquareButton>
                <SquareButton variant="leave" onClick={onConfirm}>
                    탈퇴하기
                </SquareButton>
            </Modal.Footer>
        </Modal>
    );
}
