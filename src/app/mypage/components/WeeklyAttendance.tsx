import Icon from '@/ui/Icon/Icon';
import type { AttendanceDay } from '@/types/user';

interface WeeklyAttendanceProps {
    attendance: AttendanceDay[];
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function getDayLabel(date: string): string {
    return DAY_LABELS[new Date(date).getUTCDay()];
}

export function WeeklyAttendance({ attendance }: WeeklyAttendanceProps) {
    return (
        <div className="border border-main-20 rounded-xl flex flex-col gap-2.5 py-5">
            <p className="text-base font-bold text-gray-600 px-4">
                이번주 출석
            </p>
            <div className="flex items-center justify-between px-4">
                {attendance.map(({ date, attended }) => (
                    <div
                        key={date}
                        className="flex flex-col gap-1 items-center"
                    >
                        <span className="text-sm font-bold text-gray-600 text-center">
                            {getDayLabel(date)}
                        </span>
                        <div
                            className={`size-7.5 rounded-full border flex items-center justify-center ${
                                attended
                                    ? 'bg-main-30 border-main-30'
                                    : 'border-main-20'
                            }`}
                        >
                            {attended && (
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
