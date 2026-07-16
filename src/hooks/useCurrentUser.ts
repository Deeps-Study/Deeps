import { useCallback, useEffect, useState } from 'react';
import type { CurrentUserModel } from '@/types/user';

interface UseCurrentUserResult {
    currentUser: CurrentUserModel | null;
    isLoading: boolean;
    isUnauthorized: boolean;
    refetch: () => void;
}

export function useCurrentUser(): UseCurrentUserResult {
    const [currentUser, setCurrentUser] = useState<CurrentUserModel | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(true);
    const [isUnauthorized, setIsUnauthorized] = useState(false);
    const [refetchKey, setRefetchKey] = useState(0);

    useEffect(() => {
        let isStale = false;
        async function fetchCurrentUser() {
            setIsLoading(true);
            try {
                const res = await fetch('/api/users/me');
                if (res.status === 401) {
                    if (!isStale) setIsUnauthorized(true);
                    return;
                }
                if (!res.ok) return;
                const data: CurrentUserModel = await res.json();
                if (!isStale) setCurrentUser(data);
            } finally {
                if (!isStale) setIsLoading(false);
            }
        }

        fetchCurrentUser();

        return () => {
            isStale = true;
        };
    }, [refetchKey]);

    const refetch = useCallback(() => setRefetchKey((key) => key + 1), []);

    return { currentUser, isLoading, isUnauthorized, refetch };
}
