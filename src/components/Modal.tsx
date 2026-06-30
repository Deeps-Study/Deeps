'use client';

import { createContext, type ReactNode } from 'react';
import cn from 'classnames';

interface ModalContextValue {
    onClose?: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

interface ModalProps {
    isOpen: boolean;
    onClose?: () => void;
    children: ReactNode;
    className?: string;
}

interface ModalHeaderProps {
    title?: string;
    children?: ReactNode;
}

interface ModalComponent extends React.FC<ModalProps> {
    Header: typeof ModalHeader;
    Body: typeof ModalBody;
    Footer: typeof ModalFooter;
}

function ModalHeader({ title, children }: ModalHeaderProps) {
    return (
        <div className="mb-4 flex items-center">
            <div className="flex-1">
                {title ? (
                    <h2 className="text-xl text-center font-bold tracking-tight text-gray-600">
                        {title}
                    </h2>
                ) : null}
                {children}
            </div>
        </div>
    );
}

function ModalBody({ children }: { children: ReactNode }) {
    return <div className="flex flex-col gap-4 px-5 py-2.5">{children}</div>;
}

function ModalFooter({ children }: { children: ReactNode }) {
    return (
        <div className="mt-5 flex w-full gap-2.5 px-5 py-2.5">{children}</div>
    );
}

function ModalRoot({ isOpen, onClose, children, className }: ModalProps) {
    if (!isOpen) {
        return null;
    }

    return (
        <ModalContext.Provider value={{ onClose }}>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-300/70 px-4 py-6 backdrop-blur-[3px]">
                <button
                    type="button"
                    aria-label="모달 배경"
                    className="absolute inset-0 hover:cursor-default"
                    onClick={onClose}
                />

                <div
                    className={cn(
                        'relative w-full max-w-100 rounded-[20px] border border-main-20 bg-white p-5 shadow-mint ',
                        className,
                    )}
                >
                    {children}
                </div>
            </div>
        </ModalContext.Provider>
    );
}

const Modal = ModalRoot as ModalComponent;
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export default Modal;
