import axios, { isAxiosError } from 'axios';
import { BACKEND_URL } from '@/constants/api';

export const api = axios.create({
    baseURL: BACKEND_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export function backendErrorStatus(error: unknown): number {
    return isAxiosError(error) ? (error.response?.status ?? 502) : 502;
}

export function backendErrorMessage(error: unknown, fallback: string): string {
    const data = isAxiosError(error) ? error.response?.data : undefined;
    const message = (data as { message?: string | string[] })?.message;
    if (Array.isArray(message)) return message.join(', ');
    return message ?? fallback;
}
