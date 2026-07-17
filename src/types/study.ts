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

export interface Study {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    currentParticipants: number;
    maxParticipants: number;
    tags: string[];
    description: string;
    password?: string;
}

export interface StudyDetailModel {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    maxParticipants: number;
    tags: string[];
    description: string;
    members: StudyMemberModel[];
}

export interface StudyMemberModel extends UserProfileModel {
    count: number;
}

export interface DeepsModel {
    id: string;
    studyId: string;
    title: string;
    content: string;
    creator: UserProfileModel;
    timeLimit: number;
    createdAt: string;
    solvedCount: number;
    totalCount: number;
    isMyAnswered: boolean;
    isTimeEnded: boolean;
}
