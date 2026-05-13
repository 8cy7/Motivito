import React from 'react';
import { Image } from 'react-native';

interface MotivitoLogoProps {
  size?: number;
}

export const MotivitoLogo: React.FC<MotivitoLogoProps> = ({ size = 80 }) => {
  return (
    <Image
      source={require('../assets/motivito-logo.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
};
