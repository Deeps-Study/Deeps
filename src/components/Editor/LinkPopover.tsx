'use client';

import { useState } from 'react';
import Icon from '@/ui/Icon/Icon';

interface LinkPopoverProps {
    initialUrl: string;
    onApply: (url: string) => void;
    onClose: () => void;
}

export function LinkPopover({ initialUrl, onApply, onClose }: LinkPopoverProps) {
    const [url, setUrl] = useState(initialUrl);

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') {
            e.preventDefault();
            onApply(url);
        }
        if (e.key === 'Escape') onClose();
    }

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div className="absolute top-full right-0 mt-1 z-50 flex items-center gap-2 bg-white border border-main-20 rounded-lg px-3 py-2 shadow-sm min-w-[260px]">
                <Icon name="link" className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="링크를 입력하세요"
                    className="flex-1 text-sm font-medium text-gray-600 placeholder:text-gray-300 outline-none"
                    autoFocus
                />
                <button
                    type="button"
                    onClick={() => onApply(url)}
                    className="text-xs font-medium text-main-100 whitespace-nowrap shrink-0 transition-colors hover:text-main-200"
                >
                    확인
                </button>
            </div>
        </>
    );
}
