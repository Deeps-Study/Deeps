'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useState, useRef, useEffect, memo } from 'react';
import cn from 'classnames';
import { EditorToolbar } from './EditorToolbar';
import { ImageUploadExtension } from './ImageUploadExtension';
import { hastToHtml, type HastNode } from './hastToHtml';
import {
    uploadDeepsImage,
    DEEPS_IMAGE_UPLOAD_GUIDE,
} from '@/utils/uploadDeepsImage';
import { triggerAlertModal } from '@/utils/alertModalStore';
import { sanitizeHtml } from '@/utils/editor';

interface MarkdownEditorProps {
    studyId: string;
    placeholder?: string;
    className?: string;
    initialContent?: string;
    onChange?: (html: string) => void;
}

const lowlight = createLowlight(common);

const WRITE_CLASSES = cn(
    'flex-1 pt-3.5 px-4.5 pb-3.5 overflow-auto prose prose-sm max-w-none',
    '[&_.tiptap]:outline-none [&_.tiptap]:min-h-[120px]',
    '[&_.tiptap_p]:my-[0.3em]',
    '[&_.tiptap_h1]:my-[0.4em] [&_.tiptap_h2]:my-[0.4em] [&_.tiptap_h3]:my-[0.4em]',
    '[&_.tiptap_h4]:my-[0.4em] [&_.tiptap_h5]:my-[0.4em] [&_.tiptap_h6]:my-[0.4em]',
    '[&_.tiptap>:first-child]:mt-0 [&_.tiptap>:last-child]:mb-0',
    '[&_.tiptap_img]:rounded-lg [&_.tiptap_img]:my-3 [&_.tiptap_img]:max-w-full [&_.tiptap_img]:block',
);

const PREVIEW_CLASSES = cn(
    'flex-1 pt-3.5 px-4.5 pb-3.5 overflow-auto prose prose-sm max-w-none',
    '[&_p]:my-[0.3em]',
    '[&_h1]:my-[0.4em] [&_h2]:my-[0.4em] [&_h3]:my-[0.4em]',
    '[&_h4]:my-[0.4em] [&_h5]:my-[0.4em] [&_h6]:my-[0.4em]',
    '[&>:first-child]:mt-0 [&>:last-child]:mb-0',
    '[&_img]:rounded-lg [&_img]:my-3 [&_img]:max-w-full [&_img]:block',
);

function MarkdownEditor({
    studyId,
    placeholder,
    className,
    initialContent,
    onChange,
}: MarkdownEditorProps) {
    const [tab, setTab] = useState<'write' | 'preview'>('write');
    const previewRef = useRef<HTMLDivElement>(null);

    const editor = useEditor({
        content: initialContent,
        editorProps: {
            attributes: { class: 'tiptap' },
            handleDOMEvents: {
                drop: (view, event) => {
                    const files = Array.from(event.dataTransfer?.files ?? []);
                    const imageFile = files.find((f) =>
                        f.type.startsWith('image/'),
                    );
                    if (!imageFile) return false;

                    event.preventDefault();

                    const target = event.target as Element;
                    if (target.closest('[data-node-view-wrapper]'))
                        return false;

                    const dropPos =
                        view.posAtCoords({
                            left: event.clientX,
                            top: event.clientY,
                        })?.pos ?? view.state.doc.content.size;

                    uploadDeepsImage(studyId, imageFile)
                        .then((url) => {
                            const node = view.state.schema.nodes.image.create({
                                src: url,
                            });
                            view.dispatch(view.state.tr.insert(dropPos, node));
                        })
                        .catch(() => {
                            triggerAlertModal({
                                title: '이미지 업로드에 실패했어요',
                                message: DEEPS_IMAGE_UPLOAD_GUIDE,
                            });
                        });
                    return true;
                },
            },
        },
        extensions: [
            StarterKit.configure({
                codeBlock: false,
                link: { openOnClick: false },
            }),
            CodeBlockLowlight.configure({ lowlight }),
            Placeholder.configure({ placeholder: placeholder ?? '' }),
            TaskList,
            TaskItem.configure({ nested: true }),
            Image,
            ImageUploadExtension.configure({ studyId }),
        ],
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML());
        },
        immediatelyRender: false,
        shouldRerenderOnTransaction: false,
    });

    useEffect(() => {
        if (tab !== 'preview' || !previewRef.current) return;
        previewRef.current
            .querySelectorAll<HTMLElement>('pre code')
            .forEach((block) => {
                const code = block.textContent ?? '';
                const lang = Array.from(block.classList)
                    .find((cls) => cls.startsWith('language-'))
                    ?.replace('language-', '');
                const result =
                    lang && lowlight.registered(lang)
                        ? lowlight.highlight(lang, code)
                        : lowlight.highlightAuto(code);
                block.innerHTML = hastToHtml(result as unknown as HastNode);
                block.classList.add('hljs');
            });
    }, [tab]);

    return (
        <div
            className={cn(
                'flex flex-col border border-main-20 rounded-lg overflow-hidden',
                className,
            )}
        >
            <div className="bg-gray-100 border-b border-main-20 flex items-center justify-between shrink-0 h-12.5">
                <div className="flex h-full">
                    <button
                        type="button"
                        onClick={() => setTab('write')}
                        className={cn(
                            'px-4 text-[17px] font-medium transition-colors',
                            tab === 'write'
                                ? 'bg-white text-gray-600 rounded-tr-lg'
                                : 'text-gray-400',
                        )}
                    >
                        Write
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('preview')}
                        className={cn(
                            'px-3 text-[17px] font-medium transition-colors',
                            tab === 'preview'
                                ? 'bg-white text-gray-600 rounded-tl-lg rounded-tr-lg'
                                : 'text-gray-400',
                        )}
                    >
                        Preview
                    </button>
                </div>
                {tab === 'write' && editor && <EditorToolbar editor={editor} />}
            </div>
            {tab === 'write' ? (
                <EditorContent editor={editor} className={WRITE_CLASSES} />
            ) : (
                <div
                    ref={previewRef}
                    className={PREVIEW_CLASSES}
                    dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(editor?.getHTML() ?? ''),
                    }}
                />
            )}
        </div>
    );
}

export default memo(MarkdownEditor);
