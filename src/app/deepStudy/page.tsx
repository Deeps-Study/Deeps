import { StudyDetailModel } from '@/types/study';
import StudyInfo from './components/StudyInfo';
import DeepsContainer from './components/DeepsContainer';
import ActivityGrass from './components/ActivityGrass';
import DeepsRanking from './components/DeepsRanking';

const MOCK_STUDY_DATA: StudyDetailModel = {
    id: 'detail-1',
    title: '이것은 스터디',
    startDate: '2026.05.05',
    endDate: '2026.06.04',
    maxParticipants: 6,
    tags: ['React', 'Frontend', 'Test Study'],
    description:
        '안녕하세요 반갑습니다 스터디 설명은 50자 내외만 가능합니다. 잘 부탁드립니다. 50자 넘기',
    members: [
        { nickname: '강딥스', fallbackEmoji: '👻', count: 12 },
        { nickname: '김딥스', fallbackEmoji: '✈️', count: 8 },
        { nickname: '박딥스', fallbackEmoji: '🦀', count: 5 },
        { nickname: '최딥스', fallbackEmoji: '🐱', count: 3 },
        { nickname: '이딥스', fallbackEmoji: '🥷', count: 0 },
        { nickname: '정딥스', fallbackEmoji: '🦖', count: 0 },
    ],
};

function DeepStudyPage() {
    return (
        <div className="w-full max-w-350 px-10 py-12 flex flex-col gap-14">
            <div className="grid grid-cols-12 gap-16 items-start">
                <div className="col-span-7">
                    <StudyInfo study={MOCK_STUDY_DATA} />
                </div>
                <div className="col-span-5 pl-10">
                    <ActivityGrass members={MOCK_STUDY_DATA.members} />
                </div>
            </div>

            <div className="grid grid-cols-12 gap-16 items-start">
                <div className="col-span-7">
                    <DeepsContainer />
                </div>
                <div className="col-span-5 pl-10">
                    <DeepsRanking members={MOCK_STUDY_DATA.members} />
                </div>
            </div>
        </div>
    );
}

export default DeepStudyPage;
