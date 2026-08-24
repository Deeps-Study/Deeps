import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { api, backendErrorStatus, backendErrorMessage } from '@/api';
import { requireAccessToken } from '@/api/authSession';
import type { StudyResponse, StudyDetailResponse } from '@/types/study';
import HomeClient from './components/HomeClient';

interface PageProps {
    searchParams: Promise<{ joinStudy?: string }>;
}

interface FetchResult<T> {
    data: T | null;
    status: number;
    errorMessage?: string;
}

// 1. 내 스터디 목록 조회
async function fetchMyStudiesServer(
    accessToken: string,
): Promise<FetchResult<StudyResponse[]>> {
    try {
        const { data } = await api.get<StudyResponse[]>('/studies/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return { data, status: 200 };
    } catch (error) {
        return {
            data: null,
            status: backendErrorStatus(error),
            errorMessage: backendErrorMessage(
                error,
                '스터디 목록을 가져오는 데 실패했습니다.',
            ),
        };
    }
}

// 2. 초대 스터디 미리보기 조회
async function fetchPreviewStudyServer(
    studyId: string,
    accessToken: string,
): Promise<FetchResult<StudyDetailResponse>> {
    try {
        const { data } = await api.get<StudyDetailResponse>(
            `/studies/${studyId}/preview`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            },
        );
        return { data, status: 200 };
    } catch (error) {
        return {
            data: null,
            status: backendErrorStatus(error),
            errorMessage: backendErrorMessage(
                error,
                '스터디 미리보기 정보를 가져오는 데 실패했습니다.',
            ),
        };
    }
}

export default async function HomePage({ searchParams }: PageProps) {
    const { joinStudy } = await searchParams;
    const accessToken = await requireAccessToken();

    // 토큰이 없으면 로그인 페이지로 서버 즉시 리다이렉트
    if (!accessToken) {
        redirect('/login');
    }

    // 요청 병렬 처리
    const [myStudiesResult, previewStudyResult] = await Promise.all([
        fetchMyStudiesServer(accessToken),
        joinStudy
            ? fetchPreviewStudyServer(joinStudy, accessToken)
            : Promise.resolve(null),
    ]);

    // 내 스터디 목록 조회 중 401 발생 시 세션 만료로 처리
    if (myStudiesResult.status === 401) {
        redirect('/login');
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
                initialStudies={myStudiesResult.data || []}
                studiesStatus={myStudiesResult.status}
                initialPreviewStudy={previewStudyResult?.data || null}
                previewStatus={previewStudyResult?.status}
                joinStudyId={joinStudy}
            />
        </Suspense>
    );
}
