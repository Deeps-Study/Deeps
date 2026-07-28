import { UserProfileModel } from './user';

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
    hasAnswers: boolean;
    creator: UserProfileModel | null;
    explanation: string | null;
}

export interface DeepsItemResponse {
    id: string;
    title: string;
    creator: UserProfileModel;
    createdAt: string;
    expiredAt: string;
    isSubmitted: boolean;
    isCreator: boolean;
    submittedCount: number;
}
