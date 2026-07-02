import cn from 'classnames';

interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'primary' | 'outline' | 'red';
}

const variantStyles = {
    primary: 'border border-main-20 bg-main-10 text-main-200',
    outline: 'border border-main-50 bg-white text-gray-600',
    red: 'border border-red-20 bg-red-10 text-red-200',
};

const Tag = ({
    variant = 'primary',
    className,
    children,
    ...props
}: TagProps) => {
    return (
        <span
            className={cn(
                'py-1 px-2.5 text-xs font-medium rounded-[20px] tabular-nums',
                variantStyles[variant],
                className,
            )}
            {...props}
        >
            {children}
        </span>
    );
};

export default Tag;
