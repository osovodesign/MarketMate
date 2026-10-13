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
 * Official MarketMate Emblem (Retail Bag + Growth Trendline Arrow + 4 Financial Analytics Bars)
 * Exact vector replica of the registered brand mark
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
  const gradId = `mmLogoGrad_${rawId}`;
  const darkBgGradId = `mmDarkBgGrad_${rawId}`;

  // Container styling matching brand squircle
  const containerClasses =
    variant === 'dark'
      ? 'shadow-xs border border-[#0d2a4a]'
      : variant === 'light'
      ? 'shadow-2xs border border-slate-100'
      : 'shadow-2xs border border-slate-100 dark:border-[#0d2a4a]';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${containerClasses} ${roundedClass} ${className}`}
    >
      <svg
        viewBox="0 0 512 512"
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Official Lime to Emerald Brand Gradient */}
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2ecc71" />
            <stop offset="100%" stopColor="#1db954" />
          </linearGradient>

          {/* Official Dark Mode Deep Navy Gradient */}
          <linearGradient id={darkBgGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#07203B" />
            <stop offset="100%" stopColor="#05172C" />
          </linearGradient>
        </defs>

        {/* Squircle Background Base */}
        {variant === 'dark' ? (
          <rect width="512" height="512" rx="105" fill={`url(#${darkBgGradId})`} />
        ) : variant === 'light' ? (
          <rect width="512" height="512" rx="105" fill="#FFFFFF" />
        ) : (
          <rect
            width="512"
            height="512"
            rx="105"
            className="fill-white dark:fill-[#07203B]"
          />
        )}

        {/* Shopping Bag Handle Arch */}
        <path
          d="M 205 195 C 205 110, 307 110, 307 195"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="26"
          strokeLinecap="round"
        />

        {/* Shopping Bag Left Shoulder & Body Frame */}
        <path
          d="M 205 185 L 160 185 C 140 185, 126 198, 122 218 L 100 375 C 96 398, 112 412, 130 405 L 140 398"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="26"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Shopping Bag Right Shoulder (open on lower right for soaring arrow) */}
        <path
          d="M 307 185 L 345 185 C 368 185, 382 198, 385 215"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="26"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 4 Financial Bar Chart Columns */}
        {variant === 'dark' ? (
          <g fill="#FFFFFF">
            <rect x="162" y="388" width="42" height="48" rx="12" />
            <rect x="222" y="350" width="42" height="86" rx="12" />
            <rect x="282" y="350" width="42" height="86" rx="12" />
            <rect x="343" y="280" width="42" height="156" rx="12" />
          </g>
        ) : variant === 'light' ? (
          <g fill="#07203B">
            <rect x="162" y="388" width="42" height="48" rx="12" />
            <rect x="222" y="350" width="42" height="86" rx="12" />
            <rect x="282" y="350" width="42" height="86" rx="12" />
            <rect x="343" y="280" width="42" height="156" rx="12" />
          </g>
        ) : (
          <g className="fill-[#07203B] dark:fill-white">
            <rect x="162" y="388" width="42" height="48" rx="12" />
            <rect x="222" y="350" width="42" height="86" rx="12" />
            <rect x="282" y="350" width="42" height="86" rx="12" />
            <rect x="343" y="280" width="42" height="156" rx="12" />
          </g>
        )}

        {/* Dynamic Upward Growth Trendline */}
        <path
          d="M 115 390 L 246 276 L 290 326 L 388 238"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="28"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Growth Arrowhead */}
        <path
          d="M 358 228 L 408 214 L 396 264 Z"
          fill={`url(#${gradId})`}
          stroke={`url(#${gradId})`}
          strokeWidth="8"
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
  const sizeClasses: Record<
    string,
    { height: string; textClass: string; iconSize: string; subtitleClass: string; roundedClass: string }
  > = {
    xs: { height: 'h-6', textClass: 'text-xs', iconSize: 'w-6 h-6', subtitleClass: 'text-[8px]', roundedClass: 'rounded-md' },
    sm: { height: 'h-8', textClass: 'text-sm', iconSize: 'w-7 h-7', subtitleClass: 'text-[9px]', roundedClass: 'rounded-lg' },
    md: { height: 'h-10', textClass: 'text-base', iconSize: 'w-9 h-9', subtitleClass: 'text-[10px]', roundedClass: 'rounded-xl' },
    lg: { height: 'h-12', textClass: 'text-lg', iconSize: 'w-11 h-11', subtitleClass: 'text-xs', roundedClass: 'rounded-xl' },
    xl: { height: 'h-16', textClass: 'text-2xl', iconSize: 'w-14 h-14', subtitleClass: 'text-xs', roundedClass: 'rounded-2xl' },
    '2xl': { height: 'h-20', textClass: 'text-3xl', iconSize: 'w-20 h-20', subtitleClass: 'text-sm', roundedClass: 'rounded-3xl' },
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
      ? 'text-white'
      : variant === 'light'
      ? 'text-[#07203B]'
      : 'text-[#07203B] dark:text-white';

  const subtitleColorClass =
    variant === 'dark'
      ? 'text-slate-300'
      : variant === 'light'
      ? 'text-slate-500'
      : 'text-slate-500 dark:text-slate-400';

  return (
    <div
      className={`inline-flex items-center ${
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
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center">
            <span
              className={`font-black tracking-tight leading-none ${textColorClass} ${
                selectedSize.textClass || 'text-lg'
              }`}
            >
              Market<span className={variant === 'dark' ? 'text-[#34D399]' : 'text-[#059669] dark:text-[#10B981]'}>Mate</span>
              <sup className={`text-[9px] font-bold ${variant === 'dark' ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'} ml-0.5 select-none`}>™</sup>
            </span>
          </div>
          {showSubtitle && (
            <span
              className={`font-medium tracking-tight mt-1 ${subtitleColorClass} ${
                selectedSize.subtitleClass || 'text-xs'
              } whitespace-nowrap leading-tight`}
            >
              Know Your Numbers, Grow Your Business
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
