'use client';

import { useState } from 'react';
import TagButton from '@/common/TagButton';
import Input from '@/common/Input';

const PRESET_TIMES = [
    '1 시간',
    '2 시간',
    '6 시간',
    '12 시간',
    '24 시간',
] as const;

interface CustomTime {
    hours: string;
    minutes: string;
    seconds: string;
}

interface TimeSelectorProps {
    onChange: (value: string | null) => void;
}

export function TimeSelector({ onChange }: TimeSelectorProps) {
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [custom, setCustom] = useState<CustomTime>({
        hours: '',
        minutes: '',
        seconds: '',
    });

    const isCustom = selectedTime === '직접 입력';

    function handleSelect(time: string) {
        const next = selectedTime === time ? null : time;
        setSelectedTime(next);
        if (next !== '직접 입력') {
            setCustom({ hours: '', minutes: '', seconds: '' });
        }
        onChange(next === '직접 입력' ? null : next);
    }

    function handleCustomChange(field: keyof CustomTime, value: string) {
        const next = { ...custom, [field]: value };
        setCustom(next);
        const isValid =
            next.hours !== '' || next.minutes !== '' || next.seconds !== '';
        onChange(isValid ? '직접 입력' : null);
    }

    return (
        <div className="flex flex-col gap-2.5 shrink-0">
            <span className="text-base font-semibold text-gray-600">
                제한 시간 <span className="text-red-100">*</span>
            </span>
            <div className="flex gap-2 overflow-hidden">
                {PRESET_TIMES.map((option) => (
                    <TagButton
                        key={option}
                        variant="primary"
                        selected={selectedTime === option}
                        onClick={() => handleSelect(option)}
                    >
                        {option}
                    </TagButton>
                ))}
                <TagButton
                    variant="primary"
                    selected={isCustom}
                    onClick={() => handleSelect('직접 입력')}
                >
                    직접 입력
                </TagButton>
            </div>
            {isCustom && (
                <div className="flex items-center justify-center gap-2.5 pt-2.5">
                    <Input
                        type="number"
                        value={custom.hours}
                        onChange={(e) =>
                            handleCustomChange('hours', e.target.value)
                        }
                        className="w-16 text-center"
                        min="0"
                        placeholder="0"
                    />
                    <span className="text-base font-medium text-gray-600">
                        시간
                    </span>
                    <Input
                        type="number"
                        value={custom.minutes}
                        onChange={(e) =>
                            handleCustomChange('minutes', e.target.value)
                        }
                        className="w-16 text-center"
                        min="0"
                        max="59"
                        placeholder="0"
                    />
                    <span className="text-base font-medium text-gray-600">
                        분
                    </span>
                    <Input
                        type="number"
                        value={custom.seconds}
                        onChange={(e) =>
                            handleCustomChange('seconds', e.target.value)
                        }
                        className="w-16 text-center"
                        min="0"
                        max="59"
                        placeholder="0"
                    />
                    <span className="text-base font-medium text-gray-600">
                        초
                    </span>
                </div>
            )}
        </div>
    );
}
