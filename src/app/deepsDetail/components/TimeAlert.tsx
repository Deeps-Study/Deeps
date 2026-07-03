interface TimeAlertProps {
    show: boolean;
}

export function TimeAlert({ show }: TimeAlertProps) {
    if (!show) return null;

    return (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[575px] animate-toast">
            <div className="border border-red-50 bg-red-10 rounded-lg px-10 py-5 text-center flex flex-col gap-1">
                <p className="text-sm font-bold text-red-200">
                    제한 시간이 종료되었습니다
                </p>
                <p className="text-sm font-bold text-red-200">
                    다른 멤버들의 답변을 확인해보세요!
                </p>
            </div>
        </div>
    );
}
