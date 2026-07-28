import DOMPurify from 'isomorphic-dompurify';

export function isHtmlEmpty(html: string) {
    return (
        html
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, '')
            .trim().length === 0
    );
}

export function sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html);
}
