export default function StudyCardSkeleton() {
    return (
        <div className="w-60 h-96 flex flex-col justify-between rounded-[30px] border border-gray-100 bg-white p-0 shadow-mint animate-pulse">
            {/* Header 영역 (태그 & 인원수) */}
            <header className="w-full h-11 flex justify-between items-center px-6 pt-3 shrink-0">
                <div className="w-14 h-6 bg-gray-200 rounded-full" />
                <div className="w-16 h-4 bg-gray-200 rounded-md" />
            </header>

            {/* Main 영역 */}
            <main className="w-full flex-1 flex flex-col items-center justify-center px-6 pb-6 pt-2 overflow-hidden">
                {/* 아이콘 (🌱, 🍀, 🥀 위치) */}
                <div className="w-12 h-12 my-2 bg-gray-200 rounded-full shrink-0" />

                <div className="w-full flex flex-col gap-3 items-center justify-center flex-1 min-h-0">
                    {/* 제목 영역 (2줄 가량의 두께) */}
                    <div className="w-3/4 h-6 bg-gray-200 rounded-md" />

                    {/* 태그 영역 (회색 박스 내부 태그) */}
                    <div className="w-full h-12 bg-gray-100 rounded-[10px] p-2 flex items-center justify-center gap-1.5">
                        <div className="w-10 h-3 bg-gray-200 rounded" />
                        <div className="w-12 h-3 bg-gray-200 rounded" />
                        <div className="w-8 h-3 bg-gray-200 rounded" />
                    </div>
                </div>

                {/* 입장하기 버튼 영역 */}
                <div className="w-full mt-4 shrink-0">
                    <div className="w-full h-10 bg-gray-200 rounded-full" />
                </div>
            </main>
        </div>
    );
}
