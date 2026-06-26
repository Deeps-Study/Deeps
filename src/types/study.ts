interface Study {
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

interface StudyViewModel {
    title: string;
    status: 'before' | 'ing' | 'end';
    currentParticipants: number;
    tags: string[];
    onCardClick: () => void;
    onEnterClick: () => void;
}
