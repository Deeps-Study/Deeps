'use client';

import { useState } from 'react';
import SquareButton from '@/components/SquareButton';
import Icon from '@/ui/Icon/Icon';
import { DeleteAccountModal } from './DeleteAccountModal';

interface AccountManagementProps {
    isProcessing: boolean;
    onLogout: () => void;
    onDeleteAccount: () => void;
}

export function AccountManagement({
    isProcessing,
    onLogout,
    onDeleteAccount,
}: AccountManagementProps) {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    return (
        <div className="border border-main-20 rounded-xl flex flex-col gap-5 py-5">
            <p className="text-base font-bold text-gray-600 px-4">계정 관리</p>
            <div className="flex flex-col gap-2.5 px-4">
                <SquareButton
                    variant="cancel"
                    onClick={onLogout}
                    disabled={isProcessing}
                >
                    <Icon name="out" className="w-4 h-4" />
                    로그아웃
                </SquareButton>
                <SquareButton
                    variant="leave"
                    onClick={() => setIsDeleteModalOpen(true)}
                    disabled={isProcessing}
                >
                    <Icon name="trash" className="w-4 h-4 stroke-2" />
                    회원탈퇴
                </SquareButton>
            </div>

            <DeleteAccountModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={onDeleteAccount}
            />
        </div>
    );
}
