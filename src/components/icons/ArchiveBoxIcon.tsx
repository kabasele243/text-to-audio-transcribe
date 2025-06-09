
import React from 'react';

interface IconProps {
  className?: string;
}

export const ArchiveBoxIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10.5 11.25h3M12 15V7.5M3 7.5h18M3 7.5a2.25 2.25 0 00-2.25 2.25v1.5A2.25 2.25 0 003 13.5h18a2.25 2.25 0 002.25-2.25v-1.5A2.25 2.25 0 0021 7.5H3z" />
  </svg>
);
