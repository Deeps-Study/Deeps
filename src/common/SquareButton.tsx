import type { ButtonHTMLAttributes } from 'react';
import cn from 'classnames';

interface SquareButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'cancel' | 'leave';
    isFull?: boolean;
    className?: string;
}

const variantStyles = {
    primary: [
        'bg-main-30 text-white',
        'hover:bg-main-50 disabled:bg-main-20 disabled:text-white disabled:cursor-default',
    ].join(' '),
    cancel: [
        'bg-white text-main-30 border border-main-20',
        'hover:border-main-50 hover:text-main-50',
    ].join(' '),
    leave: ['bg-gray-200 text-gray-200', 'hover:text-gray-400'].join(' '),
};

const SquareButton = ({
    variant = 'primary',
    isFull = false,
    className,
    ...props
}: SquareButtonProps) => {
    return (
        <button
            className={cn(
                'flex items-center justify-center gap-2.5 px-6 py-2.5 text-base font-medium transition-colors rounded-lg cursor-pointer',
                variantStyles[variant],
                isFull && 'w-full',
                className,
            )}
            {...props}
        ></button>
    );
};

export default SquareButton;
