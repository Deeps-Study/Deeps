import SquareButton from '@/components/SquareButton';
import { TimeSelector } from './TimeSelector';
import dynamic from 'next/dynamic';

interface RightPanelProps {
    studyId: string;
    onTimeChange: (seconds: number | null) => void;
    initialSeconds?: number;
    hint: string;
    onHintChange: (value: string) => void;
    onSolutionChange: (value: string) => void;
    initialSolution?: string;
    isFormValid: boolean;
    isSubmitting: boolean;
    submitError: string;
    onCancel: () => void;
    onSubmit: () => void;
}

const MarkdownEditor = dynamic(
    () => import('@/components/Editor/MarkdownEditor'),
    { ssr: false },
);

export function RightPanel({
    studyId,
    onTimeChange,
    initialSeconds,
    hint,
    onHintChange,
    onSolutionChange,
    initialSolution,
    isFormValid,
    isSubmitting,
    submitError,
    onCancel,
    onSubmit,
}: RightPanelProps) {
    return (
        <div className="flex flex-col gap-9 w-143.75 pb-3 shrink-0 min-h-0">
            <div className="flex flex-col flex-1 gap-9 min-h-0">
                <TimeSelector
                    onChange={onTimeChange}
                    initialSeconds={initialSeconds}
                />
                <div className="flex flex-col gap-2.5 shrink-0">
                    <span className="text-base font-medium text-gray-600">
                        힌트
                    </span>
                    <textarea
                        className="py-2 px-3 text-sm font-medium rounded-lg bg-white border border-main-20 focus:outline-none resize-none h-18 placeholder:text-gray-300 text-gray-600"
                        name="hint"
                        placeholder="힌트를 입력해 주세요"
                        value={hint}
                        onChange={(e) => onHintChange(e.target.value)}
                    />
                </div>
                <div className="flex flex-col flex-1 gap-2.5 min-h-0">
                    <span className="text-base font-semibold text-gray-600">
                        딥스 해설 <span className="text-red-100">*</span>
                    </span>
                    <MarkdownEditor
                        studyId={studyId}
                        placeholder="딥스 해설을 작성해 주세요"
                        className="flex-1 min-h-0"
                        initialContent={initialSolution}
                        onChange={onSolutionChange}
                    />
                </div>
            </div>
            {submitError && (
                <p className="text-sm font-medium text-red-100">
                    {submitError}
                </p>
            )}
            <div className="flex gap-2.5 shrink-0">
                <SquareButton variant="cancel" onClick={onCancel}>
                    취소
                </SquareButton>
                <SquareButton
                    variant="primary"
                    disabled={!isFormValid || isSubmitting}
                    onClick={onSubmit}
                >
                    확인
                </SquareButton>
            </div>
        </div>
    );
}
