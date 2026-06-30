'use client';

import { useState } from 'react';

interface CalendarProps {
    startDate: string;
    endDate: string;
    onDateSelect: (startDate: string, endDate: string) => void;
}

export default function Calendar({
    startDate,
    endDate,
    onDateSelect,
}: CalendarProps) {
    const today = new Date();
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    // 오늘 날짜 구하기 (과거 날짜 차단용)
    const getTodayStr = () => {
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    };

    const todayStr = getTodayStr();

    const isPrevMonthDisabled =
        calendarMonth.getFullYear() < today.getFullYear() ||
        (calendarMonth.getFullYear() === today.getFullYear() &&
            calendarMonth.getMonth() <= today.getMonth());

    const formatDateValue = (year: number, month: number, day: number) => {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    // 일수 계산 (달력 격자에 숫자 넣기 용)
    const getCalendarDays = (baseDate: Date) => {
        // 이번 달의 1일 정보
        const firstDay = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth(),
            1,
        );
        // 이번 달의 말일 정보
        const lastDay = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth() + 1,
            0,
        );
        const startOffset = firstDay.getDay(); // 월요일 시작이면 => 앞에 빈 곳(일요일) 1칸 필요
        const totalDays = lastDay.getDate(); // 해당 달의 총 일수
        const days: Array<{ date: number; monthOffset: number }> = [];

        // 이전 달의 총 일수 구하기
        const prevMonthLast = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth(),
            0,
        ).getDate();

        // 이전 달 끄트머리 채우기
        for (let index = startOffset - 1; index >= 0; index -= 1) {
            days.push({ date: prevMonthLast - index, monthOffset: -1 });
        }
        // 이번 달 일수 채우기
        for (let index = 1; index <= totalDays; index += 1) {
            days.push({ date: index, monthOffset: 0 });
        }
        // 다음 달 시작 부분으로 남은 빈칸 채우기
        while (days.length % 7 !== 0) {
            const nextDay = days.length - startOffset - totalDays + 1;
            days.push({ date: nextDay, monthOffset: 1 });
        }
        return days;
    };

    const handleDayClick = (dayObj: { date: number; monthOffset: number }) => {
        const targetMonth = calendarMonth.getMonth() + 1 + dayObj.monthOffset;
        const clickedDateStr = formatDateValue(
            calendarMonth.getFullYear(),
            targetMonth,
            dayObj.date,
        );

        if (clickedDateStr < todayStr) return;

        // 이전 달 미리보기 날짜 누르면 달력 화면을 이전 달로 넘겨줌
        if (dayObj.monthOffset === -1) {
            setCalendarMonth(
                new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth() - 1,
                    1,
                ),
            );
        }
        // 다음 달 미리보기 날짜를 누르면 달력 화면을 다음 달로 넘겨줌
        if (dayObj.monthOffset === 1) {
            setCalendarMonth(
                new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth() + 1,
                    1,
                ),
            );
        }

        if (!startDate || (startDate && endDate)) {
            // 시작 날짜, 종료 날짜를 모두 선택하지 않은 경우 => 시작 날짜를 선택 날짜로
            onDateSelect(clickedDateStr, '');
        } else if (startDate && !endDate) {
            if (clickedDateStr < startDate) {
                // 시작 날짜를 선택했지만, 그 전 날짜를 다시 선택한 경우 => 시작 날짜를 선택 날짜로
                onDateSelect(clickedDateStr, '');
            } else {
                // 선택한 시작 날짜보다 그 이후 날짜를 선택한 경우 => 종료 날짜를 선택 날짜로
                onDateSelect(startDate, clickedDateStr);
            }
        }
    };

    const calendarDays = getCalendarDays(calendarMonth);

    return (
        <div className="w-full mt-1 rounded-2xl border border-main-20 bg-white p-3.5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
            {/* 헤더 제어 영역 */}
            <div className="flex items-center justify-between pb-2.5 px-1">
                <button
                    type="button"
                    disabled={isPrevMonthDisabled}
                    onClick={() =>
                        setCalendarMonth(
                            new Date(
                                calendarMonth.getFullYear(),
                                calendarMonth.getMonth() - 1,
                                1,
                            ),
                        )
                    }
                    className="text-xl font-bold text-main-30 hover:opacity-70 transition-opacity cursor-pointer px-2 disabled:text-gray-200 disabled:pointer-events-none"
                >
                    ‹
                </button>
                <span className="text-sm font-bold text-gray-700">
                    {calendarMonth.getFullYear()}년{' '}
                    {calendarMonth.getMonth() + 1}월
                </span>
                <button
                    type="button"
                    onClick={() =>
                        setCalendarMonth(
                            new Date(
                                calendarMonth.getFullYear(),
                                calendarMonth.getMonth() + 1,
                                1,
                            ),
                        )
                    }
                    className="text-xl font-bold text-main-30 hover:opacity-70 transition-opacity cursor-pointer px-2"
                >
                    ›
                </button>
            </div>

            {/* 요일 열 */}
            <div className="grid grid-cols-7 gap-y-1.5 pb-1.5 text-center text-xs font-semibold text-gray-400">
                {weekDays.map((day) => (
                    <span
                        key={day}
                        className={
                            day === '일'
                                ? 'text-red-100'
                                : day === '토'
                                  ? 'text-main-100'
                                  : ''
                        }
                    >
                        {day}
                    </span>
                ))}
            </div>

            {/* 날짜 그리드 및 피그마 하이라이트 */}
            <div className="grid grid-cols-7 gap-y-1.5 justify-items-center relative">
                {calendarDays.map((dayObj, index) => {
                    const targetMonth =
                        calendarMonth.getMonth() + 1 + dayObj.monthOffset;
                    const currentStr = formatDateValue(
                        calendarMonth.getFullYear(),
                        targetMonth,
                        dayObj.date,
                    );

                    const isStartDate = currentStr === startDate;
                    const isEndDate = currentStr === endDate;
                    const isInRange =
                        startDate &&
                        endDate &&
                        currentStr > startDate &&
                        currentStr < endDate;
                    const isPast = currentStr < todayStr;
                    const isCurrentMonth = dayObj.monthOffset === 0;

                    // 달력 한 줄(Row)에서 현재 칸이 가장 왼쪽(일요일)인지 오른쪽(토요일)인지 판별
                    const isRowLeftEnd = index % 7 === 0;
                    const isRowRightEnd = index % 7 === 6;

                    return (
                        <div
                            key={`day-${index}`}
                            className={`relative flex items-center justify-center w-full h-8 ${
                                // 기본적으로 선택 범위 안이면 배경색을 채웁니다.
                                isInRange ? 'bg-main-10' : ''
                            } ${
                                // 시작일이거나, 범위 내에 있으면서 일요일(줄의 시작)이면 왼쪽을 둥글게 깎습니다.
                                isStartDate || (isInRange && isRowLeftEnd)
                                    ? 'bg-main-10 rounded-l-full'
                                    : ''
                            } ${
                                // 종료일이거나, 범위 내에 있으면서 토요일(줄의 끝)이면 오른쪽을 둥글게 깎습니다.
                                isEndDate || (isInRange && isRowRightEnd)
                                    ? 'bg-main-10 rounded-r-full'
                                    : ''
                            }`}
                        >
                            <button
                                type="button"
                                disabled={isPast}
                                onClick={() => handleDayClick(dayObj)}
                                className={`h-8 w-8 rounded-full text-xs font-medium transition-all ${
                                    isStartDate || isEndDate
                                        ? 'bg-main-30 text-white font-bold z-10 shadow-sm'
                                        : isPast
                                          ? 'text-gray-200 cursor-not-allowed'
                                          : isCurrentMonth
                                            ? 'text-gray-600 hover:bg-main-10 cursor-pointer'
                                            : 'text-gray-300 hover:bg-main-10 cursor-pointer'
                                }`}
                            >
                                {dayObj.date}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
