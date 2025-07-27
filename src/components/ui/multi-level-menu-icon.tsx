import React from 'react';
import { cn } from '@/lib/utils';

interface MultiLevelMenuIconProps {
  className?: string;
  size?: number;
}

export const MultiLevelMenuIcon: React.FC<MultiLevelMenuIconProps> = ({ 
  className, 
  size = 16 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("", className)}
    >
      {/* Top line - longer */}
      <line x1="3" y1="7" x2="21" y2="7" />
      
      {/* Middle line - shorter, indented */}
      <line x1="6" y1="12" x2="18" y2="12" />
      
      {/* Bottom line - medium length */}
      <line x1="3" y1="17" x2="19" y2="17" />
    </svg>
  );
};
