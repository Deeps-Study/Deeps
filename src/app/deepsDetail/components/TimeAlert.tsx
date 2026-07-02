export function TimeAlert() {
    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[575px]">
            <div className="border border-red-20 bg-red-10 rounded-xl px-10 py-5 text-center flex flex-col gap-1">
                <p className="text-sm font-bold text-red-100">
                    제한 시간 종료 전입니다
                </p>
                <p className="text-sm font-medium text-red-100">
                    제한 시간 종료 후에 다른 멤버들의 답변을 볼 수 있습니다!
                </p>
            </div>
        </div>
    );
}
