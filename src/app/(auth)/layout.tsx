/*
 * 로그인·온보딩 공통 화면: 모든 폭에서 흰 배경 한 단, 내용 묶음은 가로·세로 가운데(PM 결정 2026-11-28).
 * 세로 가운데는 my-auto로 맞춘다. 내용이 화면보다 길면 여백이 0이 되어 위가 잘리지 않고 스크롤된다.
 */
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="flex min-h-dvh flex-col bg-surface px-5 py-12 sm:px-8">
            <div className="mx-auto my-auto w-full max-w-90">
                <p className="text-[28px] leading-9 font-bold text-foreground">
                    Deeps
                </p>
                {children}
            </div>
        </main>
    );
}
