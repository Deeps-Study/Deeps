import { DeepsDetailHeader } from './components/DeepsDetailHeader';
import { DeepsDescription } from './components/DeepsDescription';
import { HintSection } from './components/HintSection';
import { MySolution } from './components/MySolution';

const MOCK_DEEP = {
    title: '피그마로 로티는 어떻게 구현할까요?',
    timeLimitLabel: '12시간',
    remainSeconds: 21049,
    author: '강딥스',
    description: `피그마로 로티를 구현하는 방법에 대해서 설명해주세요

예시 :
  1. AI를 사용한다.
  2. 플러그인을 사용한다

구현 방법에 대한 설명과 해당 구현물을 JSON 파일 형식으로 제출하세요`,

    hint: `힌트는 여기에 표시됩니다. 보기 버튼을 클릭하면 내용을 확인할 수 있습니다. 이 텍스트는 블러 처리되어 초기에는 보이지 않습니다.`,
};

export default function DeepsDetailPage() {
    return (
        <div className="flex flex-col bg-white">
            <DeepsDetailHeader
                title={MOCK_DEEP.title}
                timeLimitLabel={MOCK_DEEP.timeLimitLabel}
                remainSeconds={MOCK_DEEP.remainSeconds}
            />
            <main className="flex gap-12 px-16 py-8 items-start">
                <div className="flex flex-col gap-12 flex-1 min-w-0">
                    <DeepsDescription
                        author={MOCK_DEEP.author}
                        description={MOCK_DEEP.description}
                    />
                    <HintSection hint={MOCK_DEEP.hint} />
                </div>
                <MySolution />
            </main>
        </div>
    );
}
