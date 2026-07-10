import Icon from '@/ui/Icon/Icon';

interface WeeklyAttendanceProps {
    attendedDays: boolean[];
}

const DAYS = ['월', '화', '수', '목', '금', '토', '일'] as const;

export function WeeklyAttendance({ attendedDays }: WeeklyAttendanceProps) {
    return (
        <div className="border border-main-20 rounded-xl flex flex-col gap-2.5 py-5">
            <p className="text-base font-bold text-gray-600 px-4">
                이번주 출석
            </p>
            <div className="flex gap-4.5 items-center justify-center px-3.5">
                {DAYS.map((day, i) => (
                    <div key={day} className="flex flex-col gap-1 items-center">
                        <span className="text-sm font-bold text-gray-600 text-center">
                            {day}
                        </span>
                        <div
                            className={`size-7.5 rounded-full border flex items-center justify-center ${
                                attendedDays[i]
                                    ? 'bg-main-30 border-main-30'
                                    : 'border-main-20'
                            }`}
                        >
                            {attendedDays[i] && (
                                <Icon
                                    name="check"
                                    className="w-5 h-5 text-white"
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
