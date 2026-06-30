'use client';

import { useState } from 'react';
import { type Editor, useEditorState } from '@tiptap/react';
import cn from 'classnames';
import Icon from '@/ui/Icon/Icon';
import { LinkPopover } from './LinkPopover';

interface EditorToolbarProps {
    editor: Editor;
}

function Group({ children }: { children: React.ReactNode }) {
    return <div className="flex items-center gap-1">{children}</div>;
}

function Sep() {
    return <div className="w-px h-5 bg-gray-200 mx-2" />;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
    const [showLink, setShowLink] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    const activeMap = useEditorState({
        editor,
        selector: ({ editor: e }) => ({
            heading: e.isActive('heading', { level: 2 }),
            bold: e.isActive('bold'),
            italic: e.isActive('italic'),
            codeBlock: e.isActive('codeBlock'),
            link: e.isActive('link'),
            blockquote: e.isActive('blockquote'),
            orderedList: e.isActive('orderedList'),
            bulletList: e.isActive('bulletList'),
            taskList: e.isActive('taskList'),
        }),
    });

    function active(key: keyof typeof activeMap) {
        return activeMap[key] ? 'bg-main-10 text-main-100' : 'text-gray-400';
    }

    function openLink() {
        if (showLink) {
            setShowLink(false);
            return;
        }
        setLinkUrl(editor.getAttributes('link').href ?? '');
        setShowLink(true);
    }

    function findImageUploadPos(): number {
        let pos = -1;
        editor.state.doc.descendants((node, nodePos) => {
            if (node.type.name === 'imageUpload' && pos === -1) pos = nodePos;
        });
        return pos;
    }

    function handleAttach() {
        const pos = findImageUploadPos();
        if (pos !== -1) {
            editor
                .chain()
                .focus()
                .deleteRange({ from: pos, to: pos + 1 })
                .run();
        } else {
            editor.chain().focus().insertImageUpload().run();
        }
    }

    function applyLink(url: string) {
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor
                .chain()
                .focus()
                .extendMarkRange('link')
                .setLink({ href: url })
                .run();
        }
        setShowLink(false);
        setLinkUrl('');
    }

    const attachActive = findImageUploadPos() !== -1;

    return (
        <div className="relative flex items-center px-2 h-full">
            <Group>
                <button
                    type="button"
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                    className={cn(
                        'px-1.5 py-1 rounded-md text-[17px] font-medium transition-colors',
                        active('heading'),
                    )}
                >
                    H
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={cn(
                        'px-1.5 py-1 rounded-md text-[17px] font-medium transition-colors',
                        active('bold'),
                    )}
                >
                    B
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={cn(
                        'px-1.5 py-1 rounded-md text-[17px] font-medium italic transition-colors',
                        active('italic'),
                    )}
                >
                    I
                </button>
                <button
                    type="button"
                    onClick={() =>
                        editor.chain().focus().toggleCodeBlock().run()
                    }
                    className={cn(
                        'p-1.5 rounded-md flex items-center transition-colors',
                        active('codeBlock'),
                    )}
                >
                    <Icon
                        name="code"
                        className="w-4.5 h-4.5 stroke-1 stroke-gray-400"
                    />
                </button>
                <button
                    type="button"
                    onClick={openLink}
                    className={cn(
                        'p-1.5 rounded-md flex items-center transition-colors',
                        active('link'),
                    )}
                >
                    <Icon
                        name="link"
                        className="w-4.5 h-4.5 stroke-1 stroke-gray-400"
                    />
                </button>
                <button
                    type="button"
                    onClick={() =>
                        editor.chain().focus().toggleBlockquote().run()
                    }
                    className={cn(
                        'p-1.5 rounded-md flex items-center transition-colors',
                        active('blockquote'),
                    )}
                >
                    <Icon
                        name="quote"
                        className="w-4.5 h-4.5 stroke-1 stroke-gray-400"
                    />
                </button>
            </Group>
            <Sep />
            <Group>
                <button
                    type="button"
                    onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                    }
                    className={cn(
                        'p-1.5 rounded-md flex items-center transition-colors',
                        active('orderedList'),
                    )}
                >
                    <Icon
                        name="listOrdered"
                        className="w-4.5 h-4.5 stroke-1 stroke-gray-400"
                    />
                </button>
                <button
                    type="button"
                    onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                    }
                    className={cn(
                        'p-1.5 rounded-md flex items-center transition-colors',
                        active('bulletList'),
                    )}
                >
                    <Icon
                        name="list"
                        className="w-4.5 h-4.5 stroke-1 stroke-gray-400"
                    />
                </button>
                <button
                    type="button"
                    onClick={() =>
                        editor.chain().focus().toggleTaskList().run()
                    }
                    className={cn(
                        'p-1.5 rounded-md flex items-center transition-colors',
                        active('taskList'),
                    )}
                >
                    <Icon
                        name="listTodo"
                        className="w-4.5 h-4.5 stroke-1 stroke-gray-400"
                    />
                </button>
            </Group>
            <Sep />
            <Group>
                <button
                    type="button"
                    onClick={handleAttach}
                    className={cn(
                        'p-1.5 rounded-md flex items-center transition-colors',
                        attachActive
                            ? 'bg-main-10 text-main-100'
                            : 'text-gray-400',
                    )}
                >
                    <Icon
                        name="attach"
                        className="w-4.5 h-4.5 stroke-1 stroke-gray-400"
                    />
                </button>
            </Group>
            {showLink && (
                <LinkPopover
                    initialUrl={linkUrl}
                    onApply={applyLink}
                    onClose={() => setShowLink(false)}
                />
            )}
        </div>
    );
}
