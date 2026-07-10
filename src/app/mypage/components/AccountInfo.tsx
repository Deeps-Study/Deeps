interface LinkedAccount {
    provider: string;
    email: string;
}

interface AccountInfoProps {
    nickname: string;
    linkedAccount: LinkedAccount;
}

export function AccountInfo({ nickname, linkedAccount }: AccountInfoProps) {
    return (
        <div className="border border-main-20 rounded-xl flex flex-col gap-4 px-5.5 py-3">
            <p className="text-base font-bold text-gray-600">계정 정보</p>
            <div className="flex flex-col gap-2.5">
                <p className="text-sm font-semibold text-gray-600">닉네임</p>
                <div className="border border-main-20 rounded-lg flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm font-medium text-gray-600">
                        {nickname}
                    </span>
                    <button
                        type="button"
                        className="text-sm font-medium text-main-30 px-2 cursor-pointer"
                    >
                        변경
                    </button>
                </div>
            </div>
            <div className="flex flex-col gap-2.5">
                <p className="text-sm font-semibold text-gray-600">
                    연동된 계정
                </p>
                <div className="border border-main-20 rounded-lg flex gap-1 items-center px-4 py-2.5">
                    <span className="text-2xl">💬</span>
                    <div className="flex flex-col px-4">
                        <span className="text-sm font-medium text-gray-600">
                            {linkedAccount.provider}
                        </span>
                        <span className="text-sm font-medium text-gray-400">
                            {linkedAccount.email}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
