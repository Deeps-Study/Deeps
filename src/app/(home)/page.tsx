import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { api, backendErrorStatus } from '@/api';
import { requireAccessToken } from '@/api/authSession';
import { errorSummary } from '@/utils/errorSummary';
import type { StudyResponse } from '@/types/study';
import HomeClient from './components/HomeClient';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ joinStudy?: string }>;
}

/* 로그인 뒤 초대 창으로 돌아오도록 초대 경로를 로그인 주소에 담는다 */
function loginPathWithInvite(joinStudy: string | undefined): string {
    if (!joinStudy) return '/login';
    const returnPath = `/?${new URLSearchParams({ joinStudy })}`;
    return `/login?${new URLSearchParams({ redirect: returnPath })}`;
}

export default async function HomePage({ searchParams }: PageProps) {
    const { joinStudy } = await searchParams;
    const loginPath = loginPathWithInvite(joinStudy);

    let accessToken: string | null = null;
    try {
        accessToken = await requireAccessToken();
    } catch (err) {
        console.error('SSR requireAccessToken 에러:', errorSummary(err));
    }

    if (!accessToken) {
        redirect(loginPath);
    }

    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    const studiesPromise = api.get<StudyResponse[]>('/studies/me', {
        headers: authHeaders,
    });

    const previewPromise = joinStudy
        ? api.get<StudyResponse>(`/studies/${joinStudy}/preview`, {
              headers: authHeaders,
          })
        : Promise.resolve(null);

    const [studiesResult, previewResult] = await Promise.allSettled([
        studiesPromise,
        previewPromise,
    ]);

    // 2. 내 스터디 목록 결과 파싱
    let studies: StudyResponse[] = [];
    let studiesStatus = 200;
    if (studiesResult.status === 'fulfilled') {
        studies = studiesResult.value.data;
    } else {
        studiesStatus = backendErrorStatus(studiesResult.reason);
        console.error('SSR GET /studies/me 실패 status:', studiesStatus);
        if (studiesStatus === 401) {
            redirect(loginPath);
        }
    }

    // 3. 초대 스터디 미리보기 결과 파싱
    let previewStudy: StudyResponse | null = null;
    let previewStatus = 200;
    if (joinStudy) {
        if (previewResult.status === 'fulfilled' && previewResult.value) {
            previewStudy = previewResult.value.data;
        } else if (previewResult.status === 'rejected') {
            previewStatus = backendErrorStatus(previewResult.reason);
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
