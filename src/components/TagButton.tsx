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
            'hover:bg-main-10 hover:border-main-30 disabled:bg-main-20 disabled:text-white',
        ].join(' '),
        selected: 'border border-main-60 bg-main-50 text-white',
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
                'py-1.5 px-5 text-base font-medium  transition-colors rounded-[20px] cursor-pointer',
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
