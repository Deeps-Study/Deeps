'use client';

import { useEffect, useState } from 'react';
import Modal from './Modal';
import SquareButton from './SquareButton';
import { registerAlertModal } from '@/utils/alertModalStore';

export default function AlertModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [onConfirm, setOnConfirm] = useState<() => void>(() => () => {});

    useEffect(() => {
        registerAlertModal((payload) => {
            setTitle(payload.title);
            setMessage(payload.message);
            setOnConfirm(() => payload.onConfirm ?? (() => {}));
            setIsOpen(true);
        });
    }, []);

    function handleConfirm() {
        setIsOpen(false);
        onConfirm();
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
                        {title}
                    </h2>

                    <p className="text-sm font-medium text-gray-600 leading-relaxed whitespace-pre-line">
                        {message}
                    </p>
                </div>
            </Modal.Body>

            <Modal.Footer className="pt-0 mt-0">
                <SquareButton onClick={handleConfirm}>확인</SquareButton>
            </Modal.Footer>
        </Modal>
    );
}
