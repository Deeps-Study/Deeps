'use client';

import { memo } from 'react';
import MarkdownEditor from '@/components/Editor/MarkdownEditor';
import SquareButton from '@/components/SquareButton';
import Icon from '@/ui/Icon/Icon';

export const MySolution = memo(function MySolution() {
    return (
        <section className="flex flex-col gap-3 flex-1 min-w-0">
            <h2 className="text-base font-semibold text-gray-600">나의 풀이</h2>
            <div className="flex flex-col gap-3">
                <MarkdownEditor
                    placeholder="딥스 풀이를 작성해 주세요"
                    className="h-[430px]"
                />
                <SquareButton>
                    <Icon
                        name="send"
                        className="w-4 h-4 stroke-2 stroke-white shrink-0"
                    />
                    답변 제출하기
                </SquareButton>
            </div>
        </section>
    );
});
