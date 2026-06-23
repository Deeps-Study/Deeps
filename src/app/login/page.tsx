import Icon from '@/ui/Icon/Icon';

export default function LoginPage() {
    return (
        <>
            <div className="w-85 h-118 pt-14 pb-10 px-10 border border-main-10 shadow-mint rounded-[40px]">
                <div className="flex flex-col items-center">
                    <span className="text-xl font-bold text-gray-600">
                        소셜 로그인
                    </span>
                    <div className="mt-3.5">
                        <span className="text-[50px]">🐱</span>
                    </div>
                    <p className="mt-3.5 text-base text-center text-gray-600">
                        소셜 로그인으로
                        <br /> 빠르게 시작해 보세요!
                    </p>
                </div>

                <div className="flex flex-col items-center">
                    <button className="flex items-center gap-3 h-10 bg-white border border-[#747775] rounded-xl px-3 mt-14">
                        <Icon
                            name="googleLogo"
                            width={20}
                            height={20}
                            strokeWidth={0}
                        />
                        <span>Sign in with Google</span>
                    </button>
                </div>
            </div>
        </>
    );
}
