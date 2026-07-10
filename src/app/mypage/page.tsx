import { AccountInfo } from './components/AccountInfo';
import { AccountManagement } from './components/AccountManagement';
import { MyPageHeader } from './components/MyPageHeader';
import { ProfileCard } from './components/ProfileCard';
import { WeeklyAttendance } from './components/WeeklyAttendance';

const MOCK_USER = {
    nickname: '내 이름은 고난 역경이죠',
    fallbackEmoji: '👻',
    attendedDays: [false, true, true, false, true, false, true],
    linkedAccount: { provider: '카카오', email: 'kakao@kakao.com' },
};

export default function MyPage() {
    return (
        <div className="flex flex-col bg-white min-h-screen">
            <MyPageHeader />
            <main className="flex gap-12 px-19.5 py-10 items-start">
                <div className="flex flex-col gap-9 w-[420px] shrink-0">
                    <ProfileCard
                        nickname={MOCK_USER.nickname}
                        fallbackEmoji={MOCK_USER.fallbackEmoji}
                    />
                    <WeeklyAttendance attendedDays={MOCK_USER.attendedDays} />
                    <AccountManagement />
                </div>
                <div className="flex-1 shrink-0">
                    <AccountInfo
                        nickname={MOCK_USER.nickname}
                        linkedAccount={MOCK_USER.linkedAccount}
                    />
                </div>
            </main>
        </div>
    );
}
