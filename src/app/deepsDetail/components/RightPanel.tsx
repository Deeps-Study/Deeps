import MarkdownEditor from '@/components/Editor/MarkdownEditor';
import SquareButton from '@/components/SquareButton';
import { TimeSelector } from './TimeSelector';

interface RightPanelProps {
    onTimeChange: (value: string | null) => void;
    hint: string;
    onHintChange: (value: string) => void;
    isFormValid: boolean;
    onCancel: () => void;
}

export function RightPanel({
    onTimeChange,
    hint,
    onHintChange,
    isFormValid,
    onCancel,
}: RightPanelProps) {
    return (
        <div className="flex flex-col gap-9 w-[575px] pb-3 shrink-0 min-h-0">
            <div className="flex flex-col flex-1 gap-9 min-h-0">
                <TimeSelector onChange={onTimeChange} />
                <div className="flex flex-col gap-2.5 shrink-0">
                    <span className="text-base font-medium text-gray-600">
                        힌트
                    </span>
                    <textarea
                        className="py-2 px-3 text-sm font-medium rounded-lg bg-white border border-main-20 focus:outline-none resize-none h-18 placeholder:text-gray-300"
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
                        placeholder="딥스 해설을 작성해 주세요"
                        className="flex-1 min-h-0"
                    />
                </div>
            </div>
            <div className="flex gap-2.5 shrink-0">
                <SquareButton variant="cancel" onClick={onCancel}>
                    취소
                </SquareButton>
                <SquareButton
                    variant="primary"
                    type="submit"
                    disabled={!isFormValid}
                >
                    확인
                </SquareButton>
            </div>
        </div>
    );
}
