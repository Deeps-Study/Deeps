'use client';

interface CopyToastProps {
    show: boolean;
}

export function CopyToast({ show }: CopyToastProps) {
    if (!show) return null;

    return (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-87.5 animate-toast">
            <div className="border border-main-20 bg-main-10 rounded-lg px-10 py-5 text-center flex flex-col gap-1 shadow-md">
                <p className="text-sm font-bold text-main-100">
                    초대 링크가 클립보드에 복사되었습니다!
                </p>
            </div>
        </div>
    );
}
