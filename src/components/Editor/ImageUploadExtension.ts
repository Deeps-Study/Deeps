import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageUploadView } from './ImageUploadView';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        imageUpload: {
            insertImageUpload: () => ReturnType;
        };
    }
}

export const ImageUploadExtension = Node.create({
    name: 'imageUpload',
    group: 'block',
    atom: true,

    parseHTML() {
        return [{ tag: 'div[data-type="image-upload"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(HTMLAttributes, { 'data-type': 'image-upload' }),
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ImageUploadView);
    },

    addCommands() {
        return {
            insertImageUpload:
                () =>
                ({ commands }) => {
                    return commands.insertContent({ type: this.name });
                },
        };
    },
});
