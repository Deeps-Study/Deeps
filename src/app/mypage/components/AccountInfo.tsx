import Icon from '@/ui/Icon/Icon';
import type { LinkedAccount } from '@/types/user';
import { NicknameEditor } from './NicknameEditor';

interface AccountInfoProps {
    nickname: string;
    linkedAccount: LinkedAccount;
    onNicknameChanged: () => void;
}

const PROVIDER_LABEL: Record<string, string> = {
    google: 'Google',
};

export function AccountInfo({
    nickname,
    linkedAccount,
    onNicknameChanged,
}: AccountInfoProps) {
    return (
        <div className="border border-main-20 rounded-xl flex flex-col gap-4 px-5.5 py-3">
            <p className="text-base font-bold text-gray-600">계정 정보</p>
            <div className="flex flex-col gap-2.5">
                <p className="text-sm font-semibold text-gray-600">닉네임</p>
                <NicknameEditor
                    nickname={nickname}
                    onNicknameChanged={onNicknameChanged}
                />
            </div>
            <div className="flex flex-col gap-2.5">
                <p className="text-sm font-semibold text-gray-600">
                    연동된 계정
                </p>
                <div className="border border-main-20 rounded-lg flex gap-1 items-center px-4 py-2.5">
                    <Icon name="googleLogo" className="w-6 h-6" />
                    <div className="flex flex-col px-4">
                        <span className="text-sm font-medium text-gray-600">
                            {PROVIDER_LABEL[linkedAccount.provider] ??
                                linkedAccount.provider}
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
