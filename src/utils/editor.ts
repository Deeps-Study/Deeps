export function isHtmlEmpty(html: string) {
    return (
        html
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, '')
            .trim().length === 0
    );
}
