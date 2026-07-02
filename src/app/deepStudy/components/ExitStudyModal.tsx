'use client';

import Modal from '@/components/Modal';
import SquareButton from '@/components/SquareButton';

interface ExitStudyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    studyTitle: string; // 시안의 "이거슨 스터디"처럼 동적으로 스터디 이름을 받기 위함
}

function ExitStudyModal({
    isOpen,
    onClose,
    onConfirm,
    studyTitle,
}: ExitStudyModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-90 w-full">
            <Modal.Body>
                <div className="flex flex-col items-center text-center pt-4 pb-2 px-3">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        이 딥스터디를 나갈까요?
                    </h2>

                    <p className="text-sm font-medium text-gray-600 leading-relaxed">
                        &ldquo;{studyTitle}&rdquo; 딥스터디를 나가면
                        <br />
                        기록했던 잔디가 사라집니다.
                    </p>

                    <p className="text-sm font-medium text-gray-600 leading-relaxed mt-4">
                        다시 스터디에 돌아와도 잔디는 복구되지 않아요.
                    </p>
                </div>
            </Modal.Body>

            <Modal.Footer className="pt-0 mt-0">
                <SquareButton variant="cancel" onClick={onClose}>
                    취소
                </SquareButton>
                <SquareButton onClick={onConfirm}>확인</SquareButton>
            </Modal.Footer>
        </Modal>
    );
}

export default ExitStudyModal;
