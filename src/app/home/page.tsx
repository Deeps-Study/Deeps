import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { api, backendErrorStatus } from '@/api';
import { requireAccessToken } from '@/api/authSession';
import type { StudyResponse, StudyDetailResponse } from '@/types/study';
import HomeClient from './components/HomeClient';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ joinStudy?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
    const { joinStudy } = await searchParams;

    let accessToken: string | null = null;
    try {
        accessToken = await requireAccessToken();
    } catch (err) {
        console.error('SSR requireAccessToken 에러:', err);
    }

    if (!accessToken) {
        redirect('/login');
    }

    let studies: StudyResponse[] = [];
    let studiesStatus = 200;
    let previewStudy: StudyDetailResponse | null = null;
    let previewStatus = 200;

    // 1. 내 스터디 목록 조회
    try {
        const { data } = await api.get<StudyResponse[]>('/studies/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        studies = data;
    } catch (error) {
        studiesStatus = backendErrorStatus(error);
        console.error('SSR GET /studies/me 실패 status:', studiesStatus, error);
        if (studiesStatus === 401) {
            redirect('/login');
        }
    }

    // 2. 초대 스터디 조회
    if (joinStudy) {
        try {
            const { data } = await api.get<StudyDetailResponse>(
                `/studies/${joinStudy}/preview`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                },
            );
            previewStudy = data;
        } catch (error) {
            previewStatus = backendErrorStatus(error);
            console.error('SSR preview 조회 실패 status:', previewStatus);
        }
    }

    return (
        <Suspense
            fallback={
                <div className="flex flex-1 items-center justify-center">
                    <p className="text-gray-600 font-medium">로딩 중...</p>
                </div>
            }
        >
            <HomeClient
                initialStudies={studies}
                studiesStatus={studiesStatus}
                initialPreviewStudy={previewStudy}
                previewStatus={previewStatus}
                joinStudyId={joinStudy}
            />
        </Suspense>
    );
}
