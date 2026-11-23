'use client';

import { useMemo, useSyncExternalStore } from 'react';
import 'highlight.js/styles/monokai-sublime.css';

import cn from 'classnames';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import swift from 'highlight.js/lib/languages/swift';
import kotlin from 'highlight.js/lib/languages/kotlin';
import { sanitizeHtml } from '@/utils/editor';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('java', java);
hljs.registerLanguage('c', c);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('swift', swift);
hljs.registerLanguage('kotlin', kotlin);

const subscribe = () => () => {};

interface TiptapViewerProps {
    html: string;
    className?: string;
}

export function TiptapViewer({ html, className }: TiptapViewerProps) {
    // 서버 렌더와 hydration 첫 렌더에서는 false다.
    const isHydrated = useSyncExternalStore(
        subscribe,
        () => true,
        () => false,
    );

    const processedHtml = useMemo(() => {
        const sanitizedHtml = sanitizeHtml(html);
        if (!isHydrated) return sanitizedHtml;

        const div = document.createElement('div');
        div.innerHTML = sanitizedHtml;
        div.querySelectorAll<HTMLElement>('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
        return div.innerHTML;
    }, [html, isHydrated]);

    return (
        <div
            className={cn(
                'prose prose-sm max-w-none',
                '[--tw-prose-body:var(--color-gray-600)]',
                '[&_.tiptap_p]:my-[0.2em]',
                '[&_.tiptap_h1]:my-[0.5em] [&_.tiptap_h2]:my-[0.5em] [&_.tiptap_h3]:my-[0.5em]',
                '[&_.tiptap_h4]:my-[0.5em] [&_.tiptap_h5]:my-[0.5em] [&_.tiptap_h6]:my-[0.5em]',
                '[&_.tiptap>:first-child]:mt-0 [&_.tiptap>:last-child]:mb-0',
                '[&_.tiptap_img]:rounded-lg [&_.tiptap_img]:my-3 [&_.tiptap_img]:max-w-full [&_.tiptap_img]:block',
                className,
            )}
        >
            <div
                className="tiptap"
                dangerouslySetInnerHTML={{ __html: processedHtml }}
            />
        </div>
    );
}
