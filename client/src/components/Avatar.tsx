import React from 'react';
import { Avatar as AntAvatar } from 'antd';
import type { AvatarProps } from 'antd';

interface CustomAvatarProps extends AvatarProps {
  children?: React.ReactNode;
}

const Avatar: React.FC<CustomAvatarProps> = ({ children, ...props }) => {
  return (
    <AntAvatar {...props}>
      {children}
    </AntAvatar>
  );
};

export default Avatar;