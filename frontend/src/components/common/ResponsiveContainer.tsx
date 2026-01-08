/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Last updated: 2026-01-07
 */

/**
 * @file ResponsiveContainer.tsx
 * @description Responsive container component with breakpoint-based layouts. */

import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  isFullWidth?: boolean;
  maxContentWidth?: string;
  contentPadding?: string;
}

/**
 * Responsive container that adapts layout based on screen size
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  isFullWidth = false,
  className,
  ...rest
}) => {
  return (
    <div
      className={cn(
        "w-full px-4 md:px-6 lg:px-8",
        !isFullWidth && "max-w-full md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto",
        className
      )}
      data-testid="responsive-container"
      {...rest}
    >
      {children}
    </div>
  );
};

export default ResponsiveContainer;
