import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/constants/api';

export function GET(request: NextRequest) {
    const origin = request.nextUrl.origin;
    return NextResponse.redirect(
        `${BACKEND_URL}/auth/google?origin=${encodeURIComponent(origin)}`,
    );
}
