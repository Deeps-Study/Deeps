import { UserProfileModel } from './user';

export interface DeepsAnswerModel {
    author: UserProfileModel;
    deepsId: string;
    deepStudyId: string;
    content: string;
    recommendCount: number;
}
