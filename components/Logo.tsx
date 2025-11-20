'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  animated?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  animated = false,
  className = ''
}) => {
  const sizeMap = {
    sm: { width: 75, height: 31 },
    md: { width: 100, height: 41 },
    lg: { width: 150, height: 62 }
  };

  const textSizeMap = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const dims = sizeMap[size];
  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative" style={{ width: dims.width, height: dims.height }}>
        <Image
          src="/logo-login.png"
          alt="Budaya GO Logo"
          width={dims.width}
          height={dims.height}
          priority
          style={{ width: 'auto', height: '100%' }}
          className="object-contain"
        />
      </div>
      {showText && (
        <span className={`font-heading font-bold bg-gradient-to-b from-blue-600 to-blue-900 bg-clip-text text-transparent ${textSizeMap[size]}`}>
          PALAPA
        </span>
      )}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
};
