'use client';

import { useRef, useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewRendererProps } from '@tiptap/core';
import Icon from '@/ui/Icon/Icon';
import {
    uploadDeepsImage,
    DEEPS_IMAGE_UPLOAD_GUIDE,
} from '@/utils/uploadDeepsImage';
import { triggerAlertModal } from '@/utils/alertModalStore';

const MAX_SIZE = 5 * 1024 * 1024;

export function ImageUploadView({
    editor,
    getPos,
    extension,
}: NodeViewRendererProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    async function insertImage(file: File) {
        if (!file.type.startsWith('image/') || file.size > MAX_SIZE) {
            triggerAlertModal({
                title: '이미지 업로드에 실패했어요',
                message: DEEPS_IMAGE_UPLOAD_GUIDE,
            });
            return;
        }

        setIsUploading(true);
        try {
            const studyId = extension.options.studyId as string;
            const url = await uploadDeepsImage(studyId, file);
            const pos = getPos();
            if (typeof pos !== 'number') return;
            editor
                .chain()
                .focus()
                .deleteRange({ from: pos, to: pos + 1 })
                .insertContentAt(pos, { type: 'image', attrs: { src: url } })
                .run();
        } catch {
            triggerAlertModal({
                title: '이미지 업로드에 실패했어요',
                message: DEEPS_IMAGE_UPLOAD_GUIDE,
            });
        } finally {
            setIsUploading(false);
        }
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
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                    if (!isUploading && (e.key === 'Enter' || e.key === ' '))
                        fileInputRef.current?.click();
                }}
                className="flex flex-col items-center justify-center gap-4 border-2 border-dashed border-gray-200 rounded-xl py-10 my-3 cursor-pointer hover:border-main-100 transition-colors select-none"
            >
                <Icon name="imageFile" className="w-16 h-16 text-gray-300" />
                <div className="flex flex-col items-center gap-1 text-center">
                    <p className="text-sm font-semibold text-gray-600">
                        {isUploading
                            ? '이미지를 업로드하고 있어요...'
                            : '이미지를 드래그하거나 클릭해 업로드할 수 있어요.'}
                    </p>
                    <p className="text-xs font-medium text-gray-400">
                        최대 크기: 5MB
                    </p>
                    <p className="text-xs font-medium text-gray-400">
                        지원되는 파일 형식: JPEG, PNG, WEBP
                    </p>
                </div>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={isUploading}
                onChange={handleChange}
            />
        </NodeViewWrapper>
    );
}
