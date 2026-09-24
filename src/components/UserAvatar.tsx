import React, { useState, useEffect } from 'react';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  className?: string;
  showBadge?: boolean;
  badgeColor?: string;
  badgePulse?: boolean;
}

/**
 * Extracts a clean initial letter for profile fallback avatar:
 * e.g., "สมชาย ใจดี" -> "ส", "John Doe" -> "J", "test@gmail.com" -> "T"
 */
export function getAvatarInitial(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const trimmed = name.trim();
    // Thai or English first character
    const firstChar = Array.from(trimmed)[0];
    return firstChar ? firstChar.toUpperCase() : 'U';
  }
  if (email && email.trim()) {
    const first = email.trim()[0];
    return first ? first.toUpperCase() : 'U';
  }
  return 'U';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  email,
  className = 'w-8 h-8 rounded-full',
  showBadge = false,
  badgeColor = 'bg-emerald-500',
  badgePulse = false,
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state when src changes (e.g. switching accounts or updated photoURL)
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initial = getAvatarInitial(name, email);

  const renderContent = () => {
    if (!src || hasError) {
      return (
        <div
          className={`${className} bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center select-none shadow-2xs text-xs sm:text-sm shrink-0`}
          title={name || email || 'ผู้ใช้งาน'}
        >
          <span>{initial}</span>
        </div>
      );
    }

    return (
      <img
        src={src}
        alt={name || email || 'โปรไฟล์'}
        className={`${className} object-cover shrink-0`}
        onError={() => setHasError(true)}
        referrerPolicy="no-referrer"
      />
    );
  };

  if (!showBadge) {
    return renderContent();
  }

  return (
    <div className="relative inline-flex shrink-0">
      {renderContent()}
      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-2xs">
        <span className={`w-2 h-2 rounded-full ${badgeColor} ${badgePulse ? 'animate-pulse' : ''}`} />
      </span>
    </div>
  );
};
