import { UserProfileModel } from './user';

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

export interface StudyViewModel {
    title: string;
    status: 'before' | 'ing' | 'end';
    currentParticipants: number;
    tags: string[];
    onCardClick: () => void;
    onEnterClick: () => void;
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
