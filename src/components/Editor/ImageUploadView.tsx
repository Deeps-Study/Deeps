'use client';

import { useRef } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewRendererProps } from '@tiptap/core';
import Icon from '@/ui/Icon/Icon';

const MAX_SIZE = 5 * 1024 * 1024;

export function ImageUploadView({ editor, getPos }: NodeViewRendererProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    function insertImage(file: File) {
        if (!file.type.startsWith('image/') || file.size > MAX_SIZE) return;
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            const pos = getPos();
            if (typeof pos !== 'number') return;
            editor
                .chain()
                .focus()
                .deleteRange({ from: pos, to: pos + 1 })
                .insertContentAt(pos, {
                    type: 'image',
                    attrs: { src: reader.result as string },
                })
                .run();
        });
        reader.readAsDataURL(file);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) insertImage(file);
        e.target.value = '';
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) insertImage(file);
    }

    return (
        <NodeViewWrapper>
            <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                }}
                className="flex flex-col items-center justify-center gap-4 border-2 border-dashed border-gray-200 rounded-xl py-10 my-3 cursor-pointer hover:border-main-100 transition-colors select-none"
            >
                <Icon name="imageFile" className="w-16 h-16 text-gray-300" />
                <div className="flex flex-col items-center gap-1 text-center">
                    <p className="text-sm font-semibold text-gray-600">
                        이미지를 드래그하거나 클릭해 업로드할 수 있어요.
                    </p>
                    <p className="text-xs font-medium text-gray-400">최대 크기: 5MB</p>
                    <p className="text-xs font-medium text-gray-400">
                        지원되는 파일 형식: JPEG, PNG, GIF, WEBP
                    </p>
                </div>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleChange}
            />
        </NodeViewWrapper>
    );
}
