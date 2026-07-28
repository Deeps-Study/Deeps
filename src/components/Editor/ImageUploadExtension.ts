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

interface ImageUploadOptions {
    studyId: string;
}

export const ImageUploadExtension = Node.create<ImageUploadOptions>({
    name: 'imageUpload',
    group: 'block',
    atom: true,

    addOptions() {
        return { studyId: '' };
    },

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
