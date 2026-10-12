import React, { useId } from 'react';

export interface MarketMateLogoProps {
  mode?: 'full' | 'icon';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  className?: string;
  imageClassName?: string;
  showSubtitle?: boolean;
  variant?: 'light' | 'dark' | 'auto';
  onClick?: () => void;
}

/**
 * Official MarketMate SVG Vector Emblem (Retail Bag + Growth Trendline Arrow + Financial Bar Chart)
 */
export const MarketMateEmblem: React.FC<{
  className?: string;
  roundedClass?: string;
  variant?: 'light' | 'dark' | 'auto';
}> = ({
  className = 'w-full h-full',
  roundedClass = 'rounded-2xl',
  variant = 'auto',
}) => {
  const rawId = useId().replace(/:/g, '');
  const bagGradId = `mmBagGrad_${rawId}`;
  const barGradId = `mmBarGrad_${rawId}`;

  const bgClasses =
    variant === 'dark'
      ? 'bg-slate-900 border-slate-800'
      : variant === 'light'
      ? 'bg-white border-slate-100 shadow-2xs'
      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-2xs';

  return (
    <div
      className={`relative inline-flex items-center justify-center border overflow-hidden shrink-0 ${bgClasses} ${roundedClass} ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Vibrant Lime-to-Emerald gradient matching official brand asset */}
          <linearGradient id={bagGradId} x1="15%" y1="10%" x2="85%" y2="90%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="45%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>

          {/* Deep Teal / Forest Green gradient for financial bar columns */}
          <linearGradient id={barGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="100%" stopColor="#042f2e" />
          </linearGradient>
        </defs>

        {/* Shopping Bag Handle Arch */}
        <path
          d="M42 41 C42 27.5 58 27.5 58 41"
          fill="none"
          stroke={`url(#${bagGradId})`}
          strokeWidth="4.8"
          strokeLinecap="round"
        />

        {/* Shopping Bag Left Shoulder & Edge */}
        <path
          d="M42 42.5 L34 42.5 C32 42.5 31 44 30.5 46 L27.5 72 C27 75 29 76.5 32 76.5"
          fill="none"
          stroke={`url(#${bagGradId})`}
          strokeWidth="4.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Shopping Bag Right Shoulder (open on bottom right for emerging growth arrow) */}
        <path
          d="M58 42.5 L65.5 42.5 C67.5 42.5 68.5 43.8 68.8 45.5"
          fill="none"
          stroke={`url(#${bagGradId})`}
          strokeWidth="4.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 4 Financial Analytics Bar Columns */}
        <rect x="36" y="70" width="5.5" height="7" rx="1.8" fill={`url(#${barGradId})`} />
        <rect x="44" y="65.5" width="5.5" height="11.5" rx="1.8" fill={`url(#${barGradId})`} />
        <rect x="52" y="65.5" width="5.5" height="11.5" rx="1.8" fill={`url(#${barGradId})`} />
        <rect x="60" y="56" width="5.5" height="21" rx="1.8" fill={`url(#${barGradId})`} />

        {/* Dynamic Upward Growth Trendline & Arrow */}
        <path
          d="M28.5 74.5 L47 57 L53.5 64.5 L67.5 49"
          fill="none"
          stroke={`url(#${bagGradId})`}
          strokeWidth="5.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Growth Arrowhead */}
        <path
          d="M62 48 L71.5 46.5 L69 56.5 Z"
          fill={`url(#${bagGradId})`}
          stroke={`url(#${bagGradId})`}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export const MarketMateLogo: React.FC<MarketMateLogoProps> = ({
  mode = 'full',
  size = 'md',
  className = '',
  showSubtitle = false,
  variant = 'auto',
  onClick,
}) => {
  // Size mapping for the official logo
  const sizeClasses: Record<
    string,
    { height: string; textClass: string; iconSize: string; subtitleClass: string; roundedClass: string }
  > = {
    xs: { height: 'h-6', textClass: 'text-xs', iconSize: 'w-6 h-6', subtitleClass: 'text-[9px]', roundedClass: 'rounded-md' },
    sm: { height: 'h-8', textClass: 'text-sm', iconSize: 'w-7 h-7', subtitleClass: 'text-[10px]', roundedClass: 'rounded-lg' },
    md: { height: 'h-10', textClass: 'text-base', iconSize: 'w-9 h-9', subtitleClass: 'text-xs', roundedClass: 'rounded-xl' },
    lg: { height: 'h-12', textClass: 'text-lg', iconSize: 'w-11 h-11', subtitleClass: 'text-xs', roundedClass: 'rounded-xl' },
    xl: { height: 'h-16', textClass: 'text-2xl', iconSize: 'w-14 h-14', subtitleClass: 'text-sm', roundedClass: 'rounded-2xl' },
    '2xl': { height: 'h-20', textClass: 'text-3xl', iconSize: 'w-20 h-20', subtitleClass: 'text-base', roundedClass: 'rounded-3xl' },
    custom: { height: '', textClass: '', iconSize: '', subtitleClass: '', roundedClass: 'rounded-xl' },
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  if (mode === 'icon') {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 ${
          onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
        } ${className}`}
        onClick={onClick}
      >
        <MarketMateEmblem
          className={selectedSize.iconSize}
          roundedClass={selectedSize.roundedClass}
          variant={variant}
        />
      </div>
    );
  }

  const textColorClass =
    variant === 'dark'
      ? 'text-[#FEFEFE]'
      : variant === 'light'
      ? 'text-[#001A35]'
      : 'text-[#001A35] dark:text-[#FEFEFE]';

  const subtitleColorClass =
    variant === 'dark'
      ? 'text-slate-400'
      : variant === 'light'
      ? 'text-slate-500'
      : 'text-[#64748B] dark:text-[#94A3B8]';

  return (
    <div
      className={`inline-flex flex-col items-start ${
        onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2.5">
        <MarketMateEmblem
          className={`${selectedSize.iconSize || 'w-9 h-9'} shrink-0`}
          roundedClass={selectedSize.roundedClass}
          variant={variant}
        />
        <div>
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight leading-none ${textColorClass} ${
                selectedSize.textClass || 'text-lg'
              }`}
            >
              Market<span className="text-[#059669] dark:text-[#10B981]">Mate</span>
              <sup className="text-[9px] font-bold text-[#64748B] dark:text-[#94A3B8] ml-0.5 select-none">™</sup>
            </span>
            <span className="text-[10px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded leading-none bg-[#ECFDF5] dark:bg-[#064E3B] text-[#059669] dark:text-[#34D399] border border-[#059669]/20">
              PRO
            </span>
          </div>
        </div>
      </div>

      {showSubtitle && (
        <span
          className={`font-medium tracking-tight mt-1 ${subtitleColorClass} ${
            selectedSize.subtitleClass || 'text-xs'
          }`}
        >
          Know Your Numbers
        </span>
      )}
    </div>
  );
};
