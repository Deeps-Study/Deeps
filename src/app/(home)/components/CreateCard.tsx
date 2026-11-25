import Icon from '@/ui/Icon/Icon';

function CreateCard({ onCreateClick }: { onCreateClick: () => void }) {
    return (
        <button
            onClick={onCreateClick}
            className="w-60 h-96 flex items-center justify-center rounded-[30px] shadow-mint bg-white border border-main-20 hover:cursor-pointer hover:shadow-green"
        >
            <div className="px-6 pt-3 flex flex-col items-center gap-12">
                <Icon
                    name="plus"
                    className="w-16 h-16 stroke-main-30 stroke-2"
                />
                <span className="text-xl font-bold text-main-200">
                    <span className="text-main-30">딥스</span>터디 만들기
                </span>
            </div>
        </button>
    );
}

export default CreateCard;
