'use client';

import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { triggerSessionExpired } from '@/utils/sessionExpiredStore';
import { useAccountActions } from './useAccountActions';
import { AccountInfo } from './components/AccountInfo';
import { AccountManagement } from './components/AccountManagement';
import { MyPageHeader } from './components/MyPageHeader';
import { ProfileCard } from './components/ProfileCard';
import { WeeklyAttendance } from './components/WeeklyAttendance';

export function MyPageClient() {
    const { currentUser, isLoading, isUnauthorized, refetch } =
        useCurrentUser();
    const { isProcessing, logout, deleteAccount } = useAccountActions();

    useEffect(() => {
        if (isUnauthorized) triggerSessionExpired();
    }, [isUnauthorized]);

    if (isLoading || !currentUser) return null;

    return (
        <div className="flex flex-col bg-white min-h-screen">
            <MyPageHeader />
            <main className="flex gap-12 px-19.5 py-10 items-start">
                <div className="flex flex-col gap-9 w-105 shrink-0">
                    <ProfileCard
                        nickname={currentUser.nickname ?? ''}
                        image={currentUser.image ?? undefined}
                    />
                    <WeeklyAttendance attendance={currentUser.attendance} />
                    <AccountManagement
                        isProcessing={isProcessing}
                        onLogout={logout}
                        onDeleteAccount={deleteAccount}
                    />
                </div>
                <div className="flex-1 shrink-0">
                    <AccountInfo
                        nickname={currentUser.nickname ?? ''}
                        linkedAccount={currentUser.accounts[0]}
                        onNicknameChanged={refetch}
                    />
                </div>
            </main>
        </div>
    );
}
