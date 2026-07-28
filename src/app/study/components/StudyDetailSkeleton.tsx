export default function StudyDetailSkeleton() {
    return (
        <div className="flex w-full max-w-350 flex-col gap-14 px-10 py-12 animate-pulse">
            {/* 상단 섹션: StudyInfo & ActivityGrass */}
            <div className="grid grid-cols-12 gap-16 items-start">
                {/* 왼쪽: StudyInfo 스켈레톤 */}
                <div className="col-span-7 flex flex-col gap-5">
                    {/* 제목 */}
                    <div className="w-2/3 h-9 bg-gray-200 rounded-lg" />

                    {/* 설명 (2줄) */}
                    <div className="flex flex-col gap-2 max-w-xl">
                        <div className="w-full h-4 bg-gray-200 rounded-md" />
                        <div className="w-4/5 h-4 bg-gray-200 rounded-md" />
                    </div>

                    {/* 기간 */}
                    <div className="w-36 h-3 bg-gray-200 rounded-md" />

                    {/* 태그 목록 */}
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-16 h-7 bg-gray-200 rounded-full" />
                        <div className="w-20 h-7 bg-gray-200 rounded-full" />
                        <div className="w-14 h-7 bg-gray-200 rounded-full" />
                    </div>

                    {/* 링크 복사 버튼 */}
                    <div className="w-32 h-5 bg-gray-200 rounded-md mt-2" />
                </div>

                {/* 오른쪽: ActivityGrass 스켈레톤 */}
                <div className="col-span-5 pl-10 flex flex-col gap-4">
                    <div className="w-28 h-6 bg-gray-200 rounded-md" />
                    {/* 잔디 그래프 박스 */}
                    <div className="w-full h-44 bg-gray-100 rounded-2xl border border-gray-100 p-4" />
                </div>
            </div>

            {/* 하단 섹션: DeepsContainer & DeepsRanking */}
            <div className="grid grid-cols-12 gap-16 items-start">
                {/* 왼쪽: DeepsContainer 스켈레톤 */}
                <div className="col-span-7 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="w-24 h-6 bg-gray-200 rounded-md" />
                        <div className="w-20 h-8 bg-gray-200 rounded-lg" />
                    </div>
                    {/* 딥스 아이템 리스트 스켈레톤 (2개 정도) */}
                    <div className="w-full h-28 bg-gray-100 rounded-2xl border border-gray-100" />
                    <div className="w-full h-28 bg-gray-100 rounded-2xl border border-gray-100" />
                </div>

                {/* 오른쪽: DeepsRanking 스켈레톤 */}
                <div className="col-span-5 pl-10 flex flex-col gap-4">
                    <div className="w-24 h-6 bg-gray-200 rounded-md" />
                    <div className="w-full h-52 bg-gray-100 rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
                        <div className="w-full h-8 bg-gray-200 rounded-lg" />
                        <div className="w-full h-8 bg-gray-200 rounded-lg" />
                        <div className="w-full h-8 bg-gray-200 rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
}
