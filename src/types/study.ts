export interface StudyResponse {
    id: string;
    title: string;
    rule?: string;
    status: 'BEFORE_START' | 'IN_PROGRESS' | 'ENDED';
    startDate: string;
    endDate: string;
    currentMemberCount: number;
    maxMemberCount: number;
    tags: string[];
    hasPassword: boolean;
    hostId?: string;
    isHost?: boolean;
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

export interface ActivityLog {
    date: string;
    deepsCreatedCount: number;
    answersSolvedCount: number;
}

export interface StudyMemberResponse {
    id: string;
    nickname: string;
    profileImageUrl: string;
    isHost: boolean;
    totalLikesReceived: number;
    activityLogs: ActivityLog[];
}
