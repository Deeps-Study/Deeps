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
