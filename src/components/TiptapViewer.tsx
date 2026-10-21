'use client';

import { useEffect, useState } from 'react';
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

interface TiptapViewerProps {
    html: string;
    className?: string;
}

export function TiptapViewer({ html, className }: TiptapViewerProps) {
    const [processedHtml, setProcessedHtml] = useState(sanitizeHtml(html));

    useEffect(() => {
        const div = document.createElement('div');
        div.innerHTML = sanitizeHtml(html);
        div.querySelectorAll<HTMLElement>('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
        setProcessedHtml(div.innerHTML);
    }, [html]);

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
