import Input from '@/components/Input';
import dynamic from 'next/dynamic';

interface LeftPanelProps {
    studyId: string;
    title: string;
    onTitleChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    initialDescription?: string;
}

const MarkdownEditor = dynamic(
    () => import('@/components/Editor/MarkdownEditor'),
    { ssr: false },
);

export function LeftPanel({
    studyId,
    title,
    onTitleChange,
    onDescriptionChange,
    initialDescription,
}: LeftPanelProps) {
    return (
        <div className="flex flex-col flex-1 gap-9 pb-3 min-h-0">
            <div className="flex flex-col gap-2.5 shrink-0">
                <span className="text-base font-semibold text-gray-600">
                    딥스 제목 <span className="text-red-100">*</span>
                </span>
                <Input
                    isFull
                    name="title"
                    placeholder="딥스 제목을 입력해주세요"
                    maxLength={40}
                    value={title}
                    onChange={(e) => {
                        const target = e.target.value.slice(0, 40);
                        onTitleChange(target);
                    }}
                />
                <div className="flex justify-end">
                    <span className="text-xs font-medium text-gray-400">
                        {title.length}/40
                    </span>
                </div>
            </div>
            <div className="flex flex-col flex-1 gap-2.5 min-h-0">
                <span className="text-base font-semibold text-gray-600">
                    딥스 설명 <span className="text-red-100">*</span>
                </span>
                <MarkdownEditor
                    studyId={studyId}
                    placeholder="딥스에 대해서 설명해 주세요"
                    className="flex-1 min-h-0"
                    initialContent={initialDescription}
                    onChange={onDescriptionChange}
                />
            </div>
        </div>
    );
}
