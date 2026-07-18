import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/constants/api';

export function GET() {
    return NextResponse.redirect(`${BACKEND_URL}/auth/google`);
}
