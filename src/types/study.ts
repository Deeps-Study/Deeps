import { UserProfileModel } from './user';

export interface StudyResponse {
    id: string;
    title: string;
    status: 'BEFORE_START' | 'IN_PROGRESS' | 'ENDED';
    currentMemberCount: number;
    tags: string[];
}

export function mapServerStatusToUI(
    status: StudyResponse['status'],
): 'before' | 'ing' | 'end' {
    const statusMap: Record<StudyResponse['status'], 'before' | 'ing' | 'end'> =
        {
            BEFORE_START: 'before',
            IN_PROGRESS: 'ing',
            ENDED: 'end',
        };
    return statusMap[status] ?? 'before';
}

export interface StudyDetailResponse {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    currentMemberCount: number;
    maxMemberCount: number;
    tags: string[];
}

export interface ActivityLog {
    date: string;
    deepsCreatedCount: number;
    answersSolvedCount: number;
}

export interface StudyMemberResponse {
    id: string;
    nickname: string;
    profileImageUrl: string;
    totalLikesReceived: number;
    activityLogs: ActivityLog[];
}

export interface DeepsItemResponse {
    id: string;
    title: string;
    creator: UserProfileModel;
    createdAt: string;
    expiredAt: string;
    isSubmitted: boolean;
    submittedCount: number;
}
