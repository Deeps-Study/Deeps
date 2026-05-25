import icons from '@/ui/Icon/icons';

type IconName = keyof typeof icons;

type IconProps = {
  name: IconName;
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
};

const Icon = ({
  name,
  width = 16,
  height = 16,
  stroke = 'currentColor',
  strokeWidth = 2,
}: IconProps) => {
  const IconComponent = icons[name];
  return (
    <IconComponent
      width={width}
      height={height}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
};

export default Icon;
