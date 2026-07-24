import Input from '@/components/Input';
import MarkdownEditor from '@/components/Editor/MarkdownEditor';

interface LeftPanelProps {
    studyId: string;
    title: string;
    onTitleChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
}

export function LeftPanel({
    studyId,
    title,
    onTitleChange,
    onDescriptionChange,
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
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                />
            </div>
            <div className="flex flex-col flex-1 gap-2.5 min-h-0">
                <span className="text-base font-semibold text-gray-600">
                    딥스 설명 <span className="text-red-100">*</span>
                </span>
                <MarkdownEditor
                    studyId={studyId}
                    placeholder="딥스에 대해서 설명해 주세요"
                    className="flex-1 min-h-0"
                    onChange={onDescriptionChange}
                />
            </div>
        </div>
    );
}
