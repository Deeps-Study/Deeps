import type { ButtonHTMLAttributes } from 'react';
import cn from 'classnames';

interface TagButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary';
    selected?: boolean;
}

const variantStyles = {
    primary: {
        base: [
            'border border-main-20 bg-white text-gray-600',
            'hover:border-main-30 disabled:bg-main-20 disabled:text-white',
        ].join(' '),
        selected: 'border border-main-30 bg-main-10 text-gray-600',
    },
};

const TagButton = ({
    variant = 'primary',
    selected = false,
    className,
    children,
    ...props
}: TagButtonProps) => {
    const variantStyle = variantStyles[variant];
    return (
        <button
            className={cn(
                'text-base font-medium  transition-colors rounded-[20px] cursor-pointer',
                selected ? variantStyle.selected : variantStyle.base,
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
};

export default TagButton;
