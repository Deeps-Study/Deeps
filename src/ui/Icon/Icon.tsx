import icons from '@/ui/Icon/icons';

type IconName = keyof typeof icons;

type IconProps = {
    name: IconName;
    className?: string;
};

const Icon = ({ name, className }: IconProps) => {
    const IconComponent = icons[name];

    return <IconComponent className={className} />;
};

export default Icon;
