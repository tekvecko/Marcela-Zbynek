
import React from 'react';
import { motion } from 'framer-motion';

interface UserAvatarProps {
  user: {
    profileImageUrl?: string;
    firstName?: string;
    email?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  showOnlineStatus?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8', 
  lg: 'w-12 h-12'
};

const textSizeConfig = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base'
};

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md', 
  showOnlineStatus = false,
  className = '' 
}) => {
  const sizeClass = sizeConfig[size];
  const textSizeClass = textSizeConfig[size];
  
  const getInitials = () => {
    return user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';
  };

  if (user?.profileImageUrl) {
    return (
      <div className={`relative ${className}`}>
        <img 
          src={user.profileImageUrl} 
          alt={user.firstName || 'User'} 
          className={`${sizeClass} rounded-full border-2 border-white/50 shadow-sm object-cover`}
        />
        {showOnlineStatus && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm" />
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className={`${sizeClass} rounded-full bg-gradient-to-br from-romantic to-romantic/80 flex items-center justify-center border-2 border-white/50 shadow-sm`}>
        <span className={`text-white ${textSizeClass} font-bold`}>
          {getInitials()}
        </span>
      </div>
      {showOnlineStatus && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm" />
      )}
    </div>
  );
};
