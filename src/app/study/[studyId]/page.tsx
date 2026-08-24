import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { api, backendErrorStatus } from '@/api';
import { requireAccessToken } from '@/api/authSession';
import type { StudyDetailResponse, StudyMemberResponse } from '@/types/study';
import type { DeepsItemResponse } from '@/types/deeps';
import StudyClient from '../components/StudyClient';
import StudyDetailSkeleton from '../components/StudyDetailSkeleton';

export const dynamic = 'force-dynamic';

interface DeepStudyPageProps {
    params: Promise<{ studyId: string }>;
}

export default async function DeepStudyPage({ params }: DeepStudyPageProps) {
    const { studyId } = await params;

    // 1. 서버 토큰 검증
    let accessToken: string | null = null;
    try {
        accessToken = await requireAccessToken();
    } catch (err) {
        console.error('SSR requireAccessToken 에러:', err);
    }

    if (!accessToken) {
        redirect('/login');
    }

    const authHeader = {
        headers: { Authorization: `Bearer ${accessToken}` },
    };

    let studyDetail: StudyDetailResponse | null = null;
    let detailStatus = 200;
    let members: StudyMemberResponse[] = [];
    let deepsList: DeepsItemResponse[] = [];

    // 2. 백엔드 데이터 병렬 패칭 (Promise.all)
    try {
        const [detailRes, membersRes, deepsRes] = await Promise.all([
            api.get<StudyDetailResponse>(`/studies/${studyId}`, authHeader),
            api
                .get<
                    StudyMemberResponse[]
                >(`/studies/${studyId}/members`, authHeader)
                .catch((err) => {
                    console.error('SSR members 패칭 에러:', err);
                    return { data: [] as StudyMemberResponse[] };
                }),
            api
                .get<
                    DeepsItemResponse[]
                >(`/studies/${studyId}/deeps`, authHeader)
                .catch((err) => {
                    console.error('SSR deeps 패칭 에러:', err);
                    return { data: [] as DeepsItemResponse[] };
                }),
        ]);

        studyDetail = detailRes.data;
        members = membersRes.data;
        deepsList = deepsRes.data;
    } catch (error) {
        detailStatus = backendErrorStatus(error);
        console.error('SSR /studies/[studyId] 조회 실패 status:', detailStatus);

        if (detailStatus === 401) {
            redirect('/login');
        }
    }

    return (
        <Suspense fallback={<StudyDetailSkeleton />}>
            <StudyClient
                studyId={studyId}
                initialStudyDetail={studyDetail}
                detailStatus={detailStatus}
                initialMembers={members}
                initialDeepsList={deepsList}
            />
        </Suspense>
    );
}
