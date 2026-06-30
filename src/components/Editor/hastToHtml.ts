type HastText = { type: 'text'; value: string };
type HastElement = {
    type: 'element';
    tagName: string;
    properties?: { className?: string[] };
    children?: HastNode[];
};
type HastRoot = { type: 'root'; children?: HastNode[] };
export type HastNode = HastText | HastElement | HastRoot;

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function hastToHtml(node: HastNode): string {
    if (node.type === 'text') return escapeHtml(node.value);
    const children = (node.children ?? []).map(hastToHtml).join('');
    if (node.type === 'root') return children;
    const classes = (node.properties?.className ?? []).join(' ');
    const classAttr = classes ? ` class="${classes}"` : '';
    return `<${node.tagName}${classAttr}>${children}</${node.tagName}>`;
}
