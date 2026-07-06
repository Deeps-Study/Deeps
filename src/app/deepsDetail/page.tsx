import { DeepsDetailClient } from './components/DeepsDetailClient';
import { DeepsDescription } from './components/DeepsDescription';
import { HintSection } from './components/HintSection';
import { OtherAnswerCard } from './components/OtherAnswerCard';
import { UserProfileModel } from '@/types/user';
import { DeepsAnswerModel } from '@/types/deepsAnswerModel';

const MOCK_DEEP = {
    title: '피그마로 로티는 어떻게 구현할까요?',
    timeLimitLabel: '12시간',
    remainSeconds: 10,
    description: `피그마로 로티를 구현하는 방법에 대해서 설명해주세요

예시 :
  1. AI를 사용한다.
  2. 플러그인을 사용한다

구현 방법에 대한 설명과 해당 구현물을 JSON 파일 형식으로 제출하세요`,
    hint: `힌트는 여기에 표시됩니다. 보기 버튼을 클릭하면 내용을 확인할 수 있습니다. 이 텍스트는 블러 처리되어 초기에는 보이지 않습니다.`,
};

const MOCK_DEEP_AUTHOR: UserProfileModel = {
    nickname: '강딥스',
    image: '🐱',
};

const MOCK_OTHER_ANSWERS: DeepsAnswerModel[] = [
    {
        author: { nickname: '김딥스', image: '🦊' },
        deepsId: 'deep-1',
        deepStudyId: 'study-1',
        content:
            '<p>피그마에서 로티를 구현하는 방법은 LottieFiles 플러그인을 사용하는 것입니다. After Effects로 제작한 애니메이션을 JSON으로 내보낸 뒤, 피그마 플러그인으로 직접 삽입할 수 있습니다.</p>',
        recommendCount: 4,
    },
    {
        author: { nickname: '이딥스', image: '🐶' },
        deepsId: 'deep-1',
        deepStudyId: 'study-1',
        content:
            '<p>AI를 활용하면 텍스트 프롬프트만으로 로티 애니메이션 JSON을 생성할 수 있습니다. LottieFiles의 AI 기능이나 별도 생성 도구를 사용하면 복잡한 애니메이션도 빠르게 만들 수 있습니다.</p>',
        recommendCount: 2,
    },
    {
        author: { nickname: '박딥스', image: '🐸' },
        deepsId: 'deep-1',
        deepStudyId: 'study-1',
        content:
            '<p>피그마 자체적으로는 로티를 지원하지 않지만, dotLottie 플러그인을 설치하면 JSON 파일을 업로드해 미리보기가 가능합니다. 실제 구현 시에는 lottie-web 라이브러리를 사용합니다.</p>',
        recommendCount: 7,
    },
];

export default function DeepsDetailPage() {
    return (
        <DeepsDetailClient
            title={MOCK_DEEP.title}
            timeLimitLabel={MOCK_DEEP.timeLimitLabel}
            remainSeconds={MOCK_DEEP.remainSeconds}
            otherAnswerCards={
                <>
                    {MOCK_OTHER_ANSWERS.map((answer) => (
                        <OtherAnswerCard
                            key={answer.author.nickname}
                            author={answer.author.nickname}
                            image={answer.author.image ?? ''}
                            content={answer.content}
                            recommendCount={answer.recommendCount}
                        />
                    ))}
                </>
            }
            leftContent={
                <>
                    <DeepsDescription
                        author={MOCK_DEEP_AUTHOR.nickname}
                        image={MOCK_DEEP_AUTHOR.image}
                        description={MOCK_DEEP.description}
                    />
                    <HintSection hint={MOCK_DEEP.hint} />
                </>
            }
        />
    );
}
