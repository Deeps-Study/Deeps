export interface DeepsDetailModel {
    id: string;
    title: string;
    description: string;
    durationSeconds: number;
    createdAt: string;
    expiredAt: string;
    hint: string | null;
    myAnswerStatus: 'SUBMITTED' | 'NOT_SUBMITTED';
    isCreatedByMe: boolean;
    creator: { nickname: string; profileImageUrl: string } | null;
    explanation: string | null;
}
