'use client';

interface StudyLimitAlertProps {
    show: boolean;
}

export function StudyLimitAlert({ show }: StudyLimitAlertProps) {
    if (!show) return null;

    return (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-87.5 animate-toast">
            <div className="border border-red-50 bg-red-10 rounded-lg px-10 py-5 text-center flex flex-col gap-1 shadow-md">
                <p className="text-sm font-bold text-red-200">
                    스터디 참여 제한 안내
                </p>
                <p className="text-xs font-semibold text-red-200/90">
                    스터디는 최대 3개까지만 참여 및 생성할 수 있습니다.
                </p>
            </div>
        </div>
    );
}
