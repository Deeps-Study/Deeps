import Image from 'next/image';
import Icon from '@/ui/Icon/Icon';
import { sanitizeHtml } from '@/utils/editor';
import { ExpandableBox } from './ExpandableBox';

interface DeepsDescriptionProps {
    author: string;
    description: string;
    image?: string;
}

export function DeepsDescription({
    author,
    description,
    image,
}: DeepsDescriptionProps) {
    return (
        <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-gray-600">
                    딥스 설명
                </h2>
                <p className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <span className="relative w-6 h-6 rounded-full border border-main-100 flex items-center justify-center overflow-hidden shrink-0">
                        {image ? (
                            <Image
                                src={image}
                                alt={author}
                                fill
                                sizes="24px"
                                className="object-cover"
                            />
                        ) : (
                            <Icon
                                name="user"
                                className="w-4 h-4 text-main-100"
                            />
                        )}
                    </span>
                    <span className="text-main-100">{author}</span>님이
                    출제했습니다.
                </p>
            </div>
            <ExpandableBox
                heightClassName="min-h-50 max-h-107.5"
                className="bg-gray-50 border border-gray-200 rounded-lg pt-3 px-4.5 pb-4.5 text-sm font-medium text-gray-500 leading-relaxed prose prose-sm max-w-none [&>div>:first-child]:mt-0 [&>div>:last-child]:mb-0"
            >
                <div
                    dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(description),
                    }}
                />
            </ExpandableBox>
        </section>
    );
}
