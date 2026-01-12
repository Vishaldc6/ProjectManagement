import { LucideProps } from 'lucide-react-native';
import * as icons from 'lucide-react-native/icons';
import { memo } from 'react';

interface IconProps {
  name: keyof typeof icons;
}

const BaseIcon = ({ name, ...props }: IconProps & LucideProps) => {
  const LucideIcon = icons[name];

  return <LucideIcon {...props} />;
};

export default memo(BaseIcon);
