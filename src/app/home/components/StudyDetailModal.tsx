import SquareButton from '@/common/SquareButton';
import Icon from '@/ui/Icon/Icon';

interface StudyDetailModalProps {
    study: Study;
    onClose?: () => void;
    onEnter?: () => void;
    onExit?: () => void;
}

function StudyDetailModal({
    study,
    onClose,
    onEnter,
    onExit,
}: StudyDetailModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-300/70 backdrop-blur-[3px]">
            <div
                className="absolute inset-0 hover:cursor-default"
                onClick={onClose}
            />

            <div className="relative w-100 h-fit bg-white px-2.5 py-5 border border-main-20 shadow-mint rounded-2xl text-gray-600 ">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 px-1 py-1 rounded-full text-main-30 hover:text-white hover:bg-main-30 cursor-pointer transition-colors"
                >
                    <Icon name="close" />
                </button>
                <div className="flex flex-col gap-2.5 ">
                    <h1 className="mx-5 my-4.5 text-center text-2xl font-bold tracking-tight">
                        {study.title}
                    </h1>
                    <p className="text-start text-sm font-medium px-9">
                        {study.description}
                    </p>
                    <main className="flex flex-col gap-2.5 px-5 py-2.5 w-full h-full">
                        <div className="flex flex-col gap-4.5 px-4 py-3 w-full h-fit bg-white border border-main-20 rounded-[10px]">
                            <div className="flex gap-2.5 items-center">
                                <Icon
                                    name="users"
                                    className="stroke-3 stroke-main-30"
                                />
                                <span className="text-gray-400 text-sm">
                                    참여인원
                                </span>
                            </div>
                            <div className="text-sm font-semibold">
                                {study.currentParticipants} /{' '}
                                {study.maxParticipants}
                            </div>
                        </div>
                        <div className="flex flex-col gap-4.5 px-4 py-3 w-full h-fit bg-white border border-main-20 rounded-[10px]">
                            <div className="flex gap-2.5 items-center">
                                <Icon
                                    name="calendar"
                                    className="stroke-2 stroke-main-30"
                                />
                                <span className="text-gray-400 text-sm">
                                    기간
                                </span>
                            </div>
                            <div className="text-sm font-semibold">
                                {study.startDate} ~ {study.endDate}
                            </div>
                        </div>
                        <div className="flex flex-col gap-4.5 px-4 py-3 w-full h-fit bg-white border border-main-20 rounded-[10px]">
                            <div className="flex gap-2.5 items-center">
                                <Icon
                                    name="tag"
                                    className="stroke-2 stroke-main-30"
                                />
                                <span className="text-gray-400 text-sm">
                                    태그
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {study.tags.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="text-sm font-semibold"
                                    >
                                        # {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </main>
                    <div className="flex w-full gap-2.5 items-center px-5 py-2">
                        <SquareButton variant="cancel" onClick={onExit}>
                            나가기
                        </SquareButton>
                        <SquareButton onClick={onEnter}>입장</SquareButton>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudyDetailModal;
