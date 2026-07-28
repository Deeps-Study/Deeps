import Tag from '@/components/Tag';
import BackButton from './BackButton';
import { CountdownTimer } from './CountdownTimer';

interface DeepsDetailHeaderProps {
    studyId: string;
    title: string;
    timeLimitLabel: string;
    expiredAtMs: number;
    onExpire?: () => void;
    action?: React.ReactNode;
}

export function DeepsDetailHeader({
    studyId,
    title,
    timeLimitLabel,
    expiredAtMs,
    onExpire,
    action,
}: DeepsDetailHeaderProps) {
    return (
        <header className="bg-white border-b border-gray-100 flex items-center justify-between gap-8 h-16.5 px-8 shrink-0">
            <div className="flex items-center gap-8 shrink-0 min-w-0">
                <div className="flex items-center gap-4 shrink-0">
                    <BackButton studyId={studyId} />
                    <h1 className="text-2xl font-bold text-main-100">
                        {title}
                    </h1>
                </div>
                <div className="flex items-center gap-8 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <span className="text-sm font-medium text-gray-500">
                            제한 시간
                        </span>
                        <Tag>{timeLimitLabel}</Tag>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <span className="text-sm font-medium text-gray-500">
                            남은 시간
                        </span>
                        <CountdownTimer
                            expiredAtMs={expiredAtMs}
                            onExpire={onExpire}
                        />
                    </div>
                </div>
            </div>
            {action}
        </header>
    );
}
