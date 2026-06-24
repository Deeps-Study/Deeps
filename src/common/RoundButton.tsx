import cn from 'classnames';
import type { ButtonHTMLAttributes } from 'react';

interface RoundButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'join' | 'complete';
    isFull?: boolean;
}

const variantStyles = {
    join: ['bg-main-30 text-white', 'hover:bg-main-50'].join(' '),
    complete: [
        'bg-main-30 text-white',
        'disabled:bg-main-20 disabled:cursor-default',
    ].join(' '),
};

const RoundButton = ({
    variant = 'join',
    isFull = false,
    className,
    children,
    ...props
}: RoundButtonProps) => {
    return (
        <button
            type={props.type ?? 'button'}
            className={cn(
                'py-1.5 px-16 text-sm font-semibold transition-colors rounded-full cursor-pointer',
                variantStyles[variant],
                isFull && 'w-full',
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
};

export default RoundButton;
