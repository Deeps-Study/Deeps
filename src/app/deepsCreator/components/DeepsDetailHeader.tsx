import Link from 'next/link';
import Icon from '@/ui/Icon/Icon';

export function DeepsDetailHeader() {
    return (
        <header className="bg-white border-b border-gray-100 flex items-center h-16.5 px-8 shrink-0">
            <Link href="/home" className="flex items-center gap-2">
                <Icon name="leftArrow" className="w-6 h-6 text-main-100" />
                <span className="text-2xl font-bold text-main-100">
                    딥스 생성하기
                </span>
            </Link>
        </header>
    );
}
