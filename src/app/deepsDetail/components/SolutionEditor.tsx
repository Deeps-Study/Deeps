'use client';

import { useState } from 'react';
import MarkdownEditor from '@/components/Editor/MarkdownEditor';
import SquareButton from '@/components/SquareButton';
import Icon from '@/ui/Icon/Icon';
import { isHtmlEmpty } from '@/utils/editor';

interface SolutionEditorProps {
    initialContent?: string;
    onSubmit: (content: string) => void;
    onContentChange?: (html: string) => void;
}

export function SolutionEditor({
    initialContent,
    onSubmit,
    onContentChange,
}: SolutionEditorProps) {
    const [content, setContent] = useState(initialContent ?? '');

    const isEmpty = isHtmlEmpty(content);

    function handleChange(html: string) {
        setContent(html);
        onContentChange?.(html);
    }

    return (
        <div className="flex flex-col gap-3">
            <MarkdownEditor
                placeholder="딥스 풀이를 작성해 주세요"
                className="h-[430px]"
                initialContent={initialContent}
                onChange={handleChange}
            />
            <SquareButton disabled={isEmpty} onClick={() => onSubmit(content)}>
                <Icon
                    name="send"
                    className="w-4 h-4 stroke-2 stroke-white shrink-0"
                />
                답변 제출하기
            </SquareButton>
        </div>
    );
}
