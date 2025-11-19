'use client';

import Image from 'next/image';

interface BackgroundImageProps {
  variant?: 'hero' | 'overlay';
  className?: string;
}

export const BackgroundImage: React.FC<BackgroundImageProps> = ({
  variant = 'hero',
  className = ''
}) => {
  if (variant === 'hero') {
    return (
      <div className={`absolute inset-0 -z-10 overflow-hidden ${className}`}>
        <Image
          src="/figma-assets/background-image.png"
          alt="Background"
          fill
          className="object-cover object-center"
          priority
          quality={85}
        />
      </div>
    );
  }

  return null;
};
