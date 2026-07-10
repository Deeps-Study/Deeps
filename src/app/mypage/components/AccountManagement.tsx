import SquareButton from '@/components/SquareButton';
import Icon from '@/ui/Icon/Icon';

export function AccountManagement() {
    return (
        <div className="border border-main-20 rounded-xl flex flex-col gap-5 py-5">
            <p className="text-base font-bold text-gray-600 px-4">계정 관리</p>
            <div className="flex flex-col gap-2.5 px-4">
                <SquareButton variant="cancel">
                    <Icon name="out" className="w-4 h-4" />
                    로그아웃
                </SquareButton>
                <SquareButton variant="leave">
                    <Icon name="trash" className="w-4 h-4 stroke-2" />
                    회원탈퇴
                </SquareButton>
            </div>
        </div>
    );
}
