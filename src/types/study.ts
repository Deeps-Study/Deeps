interface Study {
    id: string;
    title: string;
    status: 'before' | 'ing' | 'end';
    currentParticipants: number;
    maxParticipants: number;
    period: string;
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
