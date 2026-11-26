/* 로그인·온보딩 공통 화면: 넓은 화면(lg)은 좌측 내용 + 우측 남색 장식 영역, 좁은 화면은 흰 배경 한 단 */
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-dvh bg-surface">
            <main className="flex w-full justify-center px-5 pt-12 pb-12 sm:px-8 sm:pt-16 lg:w-120 lg:shrink-0 lg:items-center lg:px-20 lg:py-12">
                <div className="w-full max-w-90 lg:max-w-80">
                    <p className="text-[28px] leading-9 font-bold text-foreground">
                        Deeps
                    </p>
                    {children}
                </div>
            </main>
            <AuthVisual />
        </div>
    );
}

function AuthVisual() {
    return (
        <div
            aria-hidden="true"
            className="hidden min-h-dvh flex-1 flex-col bg-inverse p-12 lg:flex"
        >
            <div className="flex justify-end">
                <span className="rounded-full border border-primary-strong px-3 py-1 text-xs leading-4.5 font-semibold tracking-wider text-primary">
                    DEEP LEARNING, TOGETHER
                </span>
            </div>
            <div className="flex flex-1 items-center justify-center gap-4 py-12">
                <div className="flex h-40 w-44 items-end rounded-2xl bg-[#1e293b] p-6">
                    <p className="text-lg leading-7 font-semibold break-keep text-surface">
                        좋은 질문을 직접 만들어보고
                    </p>
                </div>
                <div className="flex h-40 w-44 translate-y-10 items-end rounded-2xl bg-primary-strong p-6">
                    <p className="text-lg leading-7 font-semibold break-keep text-surface">
                        동료와 생각을 나누며 성장해요
                    </p>
                </div>
            </div>
            <p className="text-sm leading-5 text-[#cbd5e1]">
                Deeps · Study platform for developers
            </p>
        </div>
    );
}
