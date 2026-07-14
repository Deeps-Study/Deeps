'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { API_URL } from '@/constants/api';

interface AuthContextValue {
    accessToken: string | null;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
    accessToken: null,
    isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchAccessToken() {
            try {
                const res = await fetch(`${API_URL}/auth/token`, {
                    credentials: 'include',
                });
                if (res.ok) {
                    const data = await res.json();
                    setAccessToken(data.accessToken);
                }
            } catch {
                setAccessToken(null);
            } finally {
                setIsLoading(false);
            }
        }
        fetchAccessToken();
    }, []);

    return (
        <AuthContext.Provider value={{ accessToken, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
