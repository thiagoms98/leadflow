'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { TeamMember } from '@/lib/leadflow-data';
import { cn } from '@/lib/utils';

interface TeamAvatarProps {
  member: TeamMember;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-7 h-7 text-[11px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-11 h-11 text-sm',
};

export function TeamAvatar({ member, size = 'sm', className }: TeamAvatarProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full border border-[#7dd3fc]/25 bg-[#0f1524] flex items-center justify-center font-display font-semibold text-[#7dd3fc]',
        SIZE_CLASSES[size],
        className
      )}
      title={`${member.name} — ${member.role}`}
    >
      {!hasError ? (
        <Image
          src={member.avatar}
          alt={member.name}
          fill
          sizes="48px"
          referrerPolicy="no-referrer"
          className="object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span>{member.initials}</span>
      )}
    </div>
  );
}
