import icons from '@/ui/Icon/icons';

type IconName = keyof typeof icons;

type IconProps = {
    name: IconName;
    width?: number;
    height?: number;
    className?: string;
};

const Icon = ({ name, width = 16, height = 16, className }: IconProps) => {
    const IconComponent = icons[name];

    return (
        <IconComponent width={width} height={height} className={className} />
    );
};

export default Icon;
