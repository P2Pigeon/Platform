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
 * @file Card.tsx
 * @description Reusable Card component with responsive design. */

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  isInteractive?: boolean;
  hasBorder?: boolean;
  isSelected?: boolean;
  hasShadow?: boolean;
  borderRadius?: string;
}

/**
 * Card component with responsive design and accessibility features
 */
export const Card: React.FC<CardProps> = ({
  children,
  isInteractive = false,
  hasBorder = true,
  isSelected = false,
  hasShadow = true,
  className,
  ...rest
}) => {
  return (
    <div
      className={cn(
        "bg-gray-800 transition-all duration-200",
        hasBorder && "border",
        isSelected ? "border-cyan-500 bg-cyan-900/20" : "border-gray-700",
        hasShadow && "shadow-md",
        "rounded-md",
        isInteractive && "cursor-pointer hover:bg-gray-700 hover:-translate-y-0.5 hover:shadow-lg",
        className
      )}
      aria-selected={isSelected}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      data-testid="card-component"
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card;
