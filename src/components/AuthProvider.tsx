'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { API_URL } from '@/constants/api';

interface AuthContextValue {
    accessToken: string | null;
    isLoading: boolean;
    clearAccessToken: () => void;
}

const AuthContext = createContext<AuthContextValue>({
    accessToken: null,
    isLoading: true,
    clearAccessToken: () => {},
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

    const clearAccessToken = useCallback(() => setAccessToken(null), []);

    return (
        <AuthContext.Provider
            value={{ accessToken, isLoading, clearAccessToken }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
