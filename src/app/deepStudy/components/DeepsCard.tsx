import Icon from '@/ui/Icon/Icon';

type DeepCardState = 'unanswered' | 'answered' | 'closed';

interface DeepCardProps {
    title: string;
    creator: string;
    emoji: string;
    timeLeft: string;
    solvedCount: number;
    totalCount: number;
    state: DeepCardState;
    isTimeEnded: boolean;
}

function DeepsCard({
    title,
    creator,
    emoji,
    timeLeft,
    solvedCount,
    totalCount,
    state,
    isTimeEnded,
}: DeepCardProps) {
    const renderAnswerStatus = () => {
        if (isTimeEnded) {
            return null;
        }

        if (state === 'answered') {
            return (
                <div className="flex items-center gap-1 px-1.5">
                    <Icon
                        name="doubleCheck"
                        className="h-4 w-4 text-main-100 stroke-2"
                    />
                    <span className="text-xs font-medium text-main-100">
                        답변 완료
                    </span>
                </div>
            );
        }

        if (state === 'unanswered') {
            return (
                <div className="flex items-center gap-1 px-1.5">
                    <Icon name="circleAlert" className="h-4 w-4 text-red-200" />
                    <span className="text-xs font-medium text-red-200">
                        답변 필요
                    </span>
                </div>
            );
        }
    };

    return (
        <div className="flex flex-col gap-2 rounded-lg border border-main-20 bg-white px-3 py-2">
            {/* NOTE: 딥스 제목 + 출제자 영역 */}
            <div className="border-b border-main-20 py-2">
                <div className="flex items-start gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-main-30 bg-white text-base font-bold">
                        {emoji}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 px-1.5">
                        <p className="text-base font-bold text-gray-600">
                            {title}
                        </p>
                        <div className="flex items-center gap-1">
                            <Icon
                                name="user"
                                className="h-3 w-3 text-main-200 stroke-2"
                            />
                            <span className="text-xs font-medium text-gray-600">
                                {creator}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between px-1.5 py-2">
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                        <Icon name="clock" className="h-4 w-4 text-main-200" />
                        <span className="text-xs font-medium text-gray-600">
                            {timeLeft}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Icon
                            name="users"
                            className="h-4 w-4 text-main-200 stroke-2"
                        />
                        <span className="text-xs font-medium text-gray-600">
                            {solvedCount} / {totalCount}
                        </span>
                    </div>
                </div>

                {renderAnswerStatus()}
            </div>
        </div>
    );
}

export default DeepsCard;
