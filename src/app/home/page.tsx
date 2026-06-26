'use client';
import { useState } from 'react';
import StudyCard from './components/StudyCard';
import CreateCard from './components/CreateCard';
import { getStudyStatus } from '@/utils/date';
import StudyDetailModal from './components/StudyDetailModal';

function HomePage() {
    const [studies, setStudies] = useState<Study[]>([
        {
            id: '1',
            title: '이것도 배우고 저것도 배우는 스터디',
            currentParticipants: 3,
            maxParticipants: 6,
            startDate: '2026.05.05',
            endDate: '2026.06.04',
            tags: ['React', 'TailwindCSS', 'Frontend'],
            description:
                '안녕하세요 반갑습니다 스터디 설명은 여기에 이렇게 적힙니다. 잘 부탁드려요 호호호',
        },
        {
            id: '2',
            title: '야 너두 백엔드 ㄱ?',
            currentParticipants: 2,
            maxParticipants: 5,
            startDate: '2026.06.01',
            endDate: '2026.07.01',
            tags: ['Backend', 'SpringBoot'],
            description: '백엔드 정복 스터디입니다.',
        },
    ]);

    const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
    const [isExitPopupOpen, setIsExitPopupOpen] = useState<boolean>(false);
    const [studyToExit, setStudyToExit] = useState<string | null>(null);

    const maxStudyCount = 3;

    return (
        <div className="flex flex-col w-screen px-8">
            <h1 className="my-6 text-gray-600 text-center text-3xl font-bold">
                현재 진행중인 스터디를 확인하세요!
            </h1>
            <main className="h-full flex items-center justify-center gap-10 py-14">
                {studies.map((study) => (
                    <StudyCard
                        key={study.id}
                        title={study.title}
                        status={getStudyStatus(study.startDate, study.endDate)}
                        currentParticipants={study.currentParticipants}
                        tags={study.tags}
                        onCardClick={() => setSelectedStudy(study)}
                        onEnterClick={() => console.log('딥스터디 입장')}
                    />
                ))}

                {studies.length < maxStudyCount && (
                    <CreateCard
                        onCreateClick={() =>
                            console.log('딥스터디 만들기 팝업 오픈')
                        }
                    />
                )}
            </main>
            {selectedStudy && (
                <StudyDetailModal
                    study={selectedStudy}
                    onClose={() => setSelectedStudy(null)}
                    onExit={() => {
                        console.log('딥스터디 나가기');
                        setSelectedStudy(null);
                    }}
                    onEnter={() => {
                        console.log('딥스터디 입장하기');
                        setSelectedStudy(null);
                    }}
                />
            )}
        </div>
    );
}

export default HomePage;
