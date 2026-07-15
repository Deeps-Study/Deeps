import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { API_URL } from '@/constants/api';

interface UseAccountActionsResult {
    isProcessing: boolean;
    logout: () => Promise<void>;
    deleteAccount: () => Promise<void>;
}

export function useAccountActions(
    accessToken: string | null,
): UseAccountActionsResult {
    const [isProcessing, setIsProcessing] = useState(false);
    const { clearAccessToken } = useAuth();
    const router = useRouter();

    async function runAndRedirect(request: () => Promise<Response>) {
        if (!accessToken || isProcessing) return;
        setIsProcessing(true);
        try {
            await request();
        } finally {
            clearAccessToken();
            router.replace('/login');
        }
    }

    const logout = () =>
        runAndRedirect(() =>
            fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` },
            }),
        );

    const deleteAccount = () =>
        runAndRedirect(() =>
            fetch(`${API_URL}/users/me`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${accessToken}` },
            }),
        );

    return { isProcessing, logout, deleteAccount };
}
