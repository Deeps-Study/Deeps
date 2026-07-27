import Image from 'next/image';
import { UserProfileModel } from '@/types/user';
import Icon from '@/ui/Icon/Icon';

export function ProfileCard({ nickname, profileImageUrl }: UserProfileModel) {
    return (
        <div className="border border-main-20 rounded-2xl h-53 flex flex-col items-center justify-center gap-4 py-5">
            <div className="flex items-center justify-center size-25 rounded-full border border-main-30 overflow-hidden text-3xl">
                {profileImageUrl ? (
                    <Image
                        src={profileImageUrl}
                        alt={nickname}
                        width={100}
                        height={100}
                        priority
                        className="size-full object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full bg-gray-50 p-3">
                        <Icon
                            name="user"
                            className="w-12 h-12 text-main-100 stroke-2 fill-current"
                        />
                    </div>
                )}
            </div>
            <p className="text-base font-semibold text-gray-600">{nickname}</p>
        </div>
    );
}
