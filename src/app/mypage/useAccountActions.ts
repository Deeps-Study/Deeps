import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UseAccountActionsResult {
    isProcessing: boolean;
    logout: () => Promise<void>;
    deleteAccount: () => Promise<void>;
}

export function useAccountActions(): UseAccountActionsResult {
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();

    async function runAndRedirect(request: () => Promise<Response>) {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            await request();
        } finally {
            router.replace('/login');
        }
    }

    const logout = () =>
        runAndRedirect(() => fetch('/api/auth/logout', { method: 'POST' }));

    const deleteAccount = () =>
        runAndRedirect(() => fetch('/api/users/me', { method: 'DELETE' }));

    return { isProcessing, logout, deleteAccount };
}
