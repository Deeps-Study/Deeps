'use client';

import { useEffect, useState } from 'react';
import Modal from './Modal';
import SquareButton from './SquareButton';
import { registerSessionExpired } from '@/utils/sessionExpiredStore';

export default function SessionExpiredModal() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        registerSessionExpired(() => setIsOpen(true));
    }, []);

    function handleConfirm() {
        window.location.href = '/login';
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleConfirm}
            className="max-w-90 w-full"
        >
            <Modal.Body>
                <div className="flex flex-col items-center text-center pt-4 pb-2 px-3">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        로그인 세션이 만료되었어요
                    </h2>

                    <p className="text-sm font-medium text-gray-600 leading-relaxed">
                        다시 로그인해 주세요.
                    </p>
                </div>
            </Modal.Body>

            <Modal.Footer className="pt-0 mt-0">
                <SquareButton onClick={handleConfirm}>확인</SquareButton>
            </Modal.Footer>
        </Modal>
    );
}
