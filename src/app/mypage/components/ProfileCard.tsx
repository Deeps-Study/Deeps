import Image from 'next/image';
import { UserProfileModel } from '@/types/user';

export function ProfileCard({
    nickname,
    image,
    fallbackEmoji,
}: UserProfileModel) {
    return (
        <div className="border border-main-20 rounded-2xl h-53 flex flex-col items-center justify-center gap-4 py-5">
            <div className="flex items-center justify-center size-25 rounded-full border border-main-30 overflow-hidden text-3xl">
                {image ? (
                    <Image
                        src={image}
                        alt={nickname}
                        width={100}
                        height={100}
                        className="size-full object-cover"
                    />
                ) : (
                    <span>{fallbackEmoji ?? '👤'}</span>
                )}
            </div>
            <p className="text-base font-semibold text-gray-600">{nickname}</p>
        </div>
    );
}
