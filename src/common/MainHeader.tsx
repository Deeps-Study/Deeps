import Icon from '@/ui/Icon/Icon';
import Link from 'next/link';

interface MainHeaderProps {
    type: 'login' | 'home' | 'detail';
    onActionClick?: () => void;
    userProfile?: {
        image?: string;
        nickname: string;
    };
}

interface UserProfileProps {
    image?: string;
    nickname: string;
}

function UserProfile({ image, nickname }: UserProfileProps) {
    return (
        <Link
            href="/myPage"
            className="flex flex-row whitespace-nowrap items-center px-2 py-2 h-10 rounded-xl gap-2.5 bg-white border border-main-20 hover:border-main-60"
        >
            <div>
                {image ? (
                    <img
                        src={image}
                        alt="프로필"
                        className="h-full w-full rounded-full object-cover"
                    />
                ) : (
                    <span className="rounded-full bg-gray-100 py-2 px-2 font-medium">
                        🐱
                    </span>
                )}
            </div>
            <span className="text-sm font-semibold text-gray-600">
                {nickname}
            </span>
        </Link>
    );
}

function MainHeader({ type, onActionClick, userProfile }: MainHeaderProps) {
    return (
        <header className="bg-white flex w-full px-8 py-3 items-center justify-between border-b border-gray-100">
            <div className="flex items-center w-full">
                <Link
                    href="/home"
                    className=" font-bold text-2xl text-main-100"
                >
                    DeepStudy
                </Link>
            </div>

            {/* 1. 홈 화면 */}
            {type === 'home' && (
                <div className="flex gap-4">
                    <button
                        onClick={onActionClick}
                        className="flex whitespace-nowrap items-center gap-2 px-3 py-2 rounded-xl bg-main-10 border border-main-20 text-sm font-bold text-main-100 hover:bg-main-50 hover:border-main-30 hover:text-white hover:cursor-pointer"
                    >
                        + 딥스터디 만들기
                    </button>

                    {userProfile && (
                        <UserProfile
                            image={userProfile.image}
                            nickname={userProfile.nickname}
                        />
                    )}
                </div>
            )}

            {/* 2. 딥스터디 상세 화면 */}
            {type === 'detail' && (
                <div className="flex gap-4">
                    <button
                        onClick={onActionClick}
                        className="flex whitespace-nowrap items-center gap-2 px-3 py-2 rounded-xl bg-white text-sm font-bold text-main-100 hover:text-main-60 hover:cursor-pointer"
                    >
                        {/* <Icon name="out" /> */}
                        스터디 나가기
                    </button>

                    {userProfile && (
                        <UserProfile
                            image={userProfile.image}
                            nickname={userProfile.nickname}
                        />
                    )}
                </div>
            )}
            {/* 3. 로그인 화면 */}
            {type === 'login' && null}
        </header>
    );
}

export default MainHeader;
