import type { ButtonHTMLAttributes } from 'react';
import cn from 'classnames';

interface SquareButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'cancel' | 'leave';
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
    leave: ['text-gray-200', 'hover:text-gray-400'].join(' '),
};

const SquareButton = ({
    variant = 'primary',
    className,
    children,
    ...props
}: SquareButtonProps) => {
    return (
        <button
            type={props.type ?? 'button'}
            className={cn(
                'flex items-center justify-center w-full gap-2.5 px-2 py-2.5 text-base font-bold transition-colors rounded-lg cursor-pointer',
                variantStyles[variant],
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
};

export default SquareButton;
