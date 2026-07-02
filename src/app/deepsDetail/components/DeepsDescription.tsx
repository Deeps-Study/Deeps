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
                    <span className="w-6 h-6 rounded-full border border-main-100 flex items-center justify-center text-base leading-none shrink-0">
                        {image}
                    </span>
                    {author}님이 출제했습니다.
                </p>
            </div>
            <div className="min-h-40 max-h-70 overflow-y-auto bg-gray-50 border border-gray-200 rounded-lg px-6 py-5 text-sm font-medium text-gray-500 leading-relaxed whitespace-pre-line">
                {description}
            </div>
        </section>
    );
}
