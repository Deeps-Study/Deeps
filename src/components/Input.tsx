import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import cn from 'classnames';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    isFull?: boolean;
}

const Input = ({
    value: controlledValue,
    onChange,
    onKeyDown,
    isFull = false,
    className,
    ...props
}: InputProps) => {
    const isControlled = controlledValue !== undefined;
    const [inputValue, setInputValue] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isControlled) {
            setInputValue(e.target.value);
        }
        onChange?.(e);
    };

    return (
        <input
            className={cn(
                'py-2 px-3 text-sm font-medium transition-colors rounded-lg bg-white border border-main-20 focus:outline-none',
                isFull && 'w-full',
                className,
            )}
            value={isControlled ? controlledValue : inputValue}
            onChange={handleChange}
            onKeyDown={onKeyDown}
            {...props}
        />
    );
};

export default Input;
