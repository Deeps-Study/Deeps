export function DeepsDetailSkeleton() {
    return (
        <div className="flex flex-col bg-white min-h-screen animate-pulse">
            {/* Header 스켈레톤 */}
            <header className="flex items-center justify-between px-16 py-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="h-6 w-24 rounded-md bg-gray-200" />
                    <div className="h-8 w-64 rounded-md bg-gray-200" />
                </div>
                <div className="h-8 w-32 rounded-full bg-gray-200" />
            </header>

            {/* Main Content 스켈레톤 */}
            <main className="flex gap-12 px-16 py-8 items-start">
                {/* 왼쪽 영역 (설명 & 힌트 섹션) */}
                <div className="flex flex-col gap-12 flex-1 min-w-0">
                    {/* DeepsDescription 영역 */}
                    <div className="flex flex-col gap-6 rounded-2xl border border-gray-100 p-6 bg-white">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200" />
                            <div className="h-5 w-28 rounded bg-gray-200" />
                        </div>
                        <div className="space-y-3 pt-2">
                            <div className="h-4 w-full rounded bg-gray-200" />
                            <div className="h-4 w-5/6 rounded bg-gray-200" />
                            <div className="h-4 w-4/6 rounded bg-gray-200" />
                        </div>
                    </div>

                    {/* HintSection 영역 */}
                    <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 p-6 bg-white">
                        <div className="h-6 w-32 rounded bg-gray-200" />
                        <div className="h-16 w-full rounded-xl bg-gray-100" />
                    </div>
                </div>

                {/* 오른쪽 영역 (MySolution 풀이 작성 폼 sticky) */}
                <div className="sticky top-8 flex-1 min-w-0">
                    <div className="flex flex-col gap-6 rounded-2xl border border-gray-100 p-6 bg-white">
                        <div className="flex items-center justify-between">
                            <div className="h-6 w-28 rounded bg-gray-200" />
                            <div className="h-5 w-20 rounded bg-gray-200" />
                        </div>
                        <div className="h-64 w-full rounded-xl bg-gray-100" />
                        <div className="h-12 w-full rounded-xl bg-gray-200" />
                    </div>
                </div>
            </main>
        </div>
    );
}
