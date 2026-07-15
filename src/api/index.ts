import axios from 'axios';
import { API_URL } from '@/constants/api';

// 1. 기본 설정이 적용된 axios 싱글톤 인스턴스 생성
export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// 2. 요청 인터셉터 추가
export const setAccessTokenHeader = (token: string | null) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};
