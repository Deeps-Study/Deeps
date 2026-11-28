'use client';

import { useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { triggerSessionExpired } from '@/utils/sessionExpiredStore';
import { useAccountActions } from './useAccountActions';
import { AccountInfo } from './components/AccountInfo';
import { AccountManagement } from './components/AccountManagement';
import { ProfileCard } from './components/ProfileCard';
import { WeeklyAttendance } from './components/WeeklyAttendance';

export function MyPageClient({
    sidebarCollapsed,
}: {
    sidebarCollapsed: boolean;
}) {
    const { currentUser, isLoading, isUnauthorized, refetch } =
        useCurrentUser();
    const { isProcessing, logout, deleteAccount } = useAccountActions();

    useEffect(() => {
        if (isUnauthorized) triggerSessionExpired();
    }, [isUnauthorized]);

    const userProfile = currentUser
        ? {
              nickname: currentUser.nickname ?? '닉네임 없음',
              profileImageUrl: currentUser.image ?? undefined,
          }
        : undefined;

    return (
        <AppShell
            userProfile={userProfile}
            initialCollapsed={sidebarCollapsed}
        >
            {!isLoading && currentUser && (
                <main className="flex flex-col gap-9 px-4 py-10 sm:px-8 xl:flex-row xl:items-start xl:gap-12 xl:px-19.5">
                    <div className="flex w-full flex-col gap-9 xl:w-105 xl:shrink-0">
                        <ProfileCard
                            nickname={currentUser.nickname ?? ''}
                            profileImageUrl={currentUser.image ?? undefined}
                        />
                        <WeeklyAttendance attendance={currentUser.attendance} />
                        <AccountManagement
                            isProcessing={isProcessing}
                            onLogout={logout}
                            onDeleteAccount={deleteAccount}
                        />
                    </div>
                    <div className="w-full min-w-0 xl:flex-1">
                        <AccountInfo
                            nickname={currentUser.nickname ?? ''}
                            linkedAccount={currentUser.accounts[0]}
                            onNicknameChanged={refetch}
                        />
                    </div>
                </main>
            )}
        </AppShell>
    );
}
