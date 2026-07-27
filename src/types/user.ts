export interface UserProfileModel {
    nickname: string;
    profileImageUrl?: string;
}

export interface LinkedAccount {
    provider: string;
    email: string;
}

export interface AttendanceDay {
    date: string;
    attended: boolean;
}

export interface CurrentUserModel {
    id: string;
    nickname: string | null;
    image: string | null;
    accounts: LinkedAccount[];
    attendance: AttendanceDay[];
}
