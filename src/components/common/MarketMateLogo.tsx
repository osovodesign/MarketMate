import React from 'react';

interface MarketMateLogoProps {
  mode?: 'full' | 'icon';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  className?: string;
  imageClassName?: string;
  showSubtitle?: boolean;
  onClick?: () => void;
}

/**
 * Official MarketMate SVG Vector Emblem (Retail Bag + Growth Trendline Arrow + Financial Bar Chart)
 */
export const MarketMateEmblem: React.FC<{ className?: string; roundedClass?: string }> = ({
  className = 'w-full h-full',
  roundedClass = 'rounded-2xl',
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center bg-white dark:bg-slate-900 shadow-2xs border border-slate-100 dark:border-slate-800 overflow-hidden ${roundedClass} ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Vibrant Lime-to-Emerald gradient matching official brand asset */}
          <linearGradient id="mmOfficialBagGrad" x1="15%" y1="10%" x2="85%" y2="90%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="45%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>

          {/* Deep Teal / Forest Green gradient for financial bar columns */}
          <linearGradient id="mmOfficialBarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="100%" stopColor="#042f2e" />
          </linearGradient>
        </defs>

        {/* Shopping Bag Handle Arch */}
        <path
          d="M42 41 C42 27.5 58 27.5 58 41"
          fill="none"
          stroke="url(#mmOfficialBagGrad)"
          strokeWidth="4.8"
          strokeLinecap="round"
        />

        {/* Shopping Bag Left Shoulder & Edge */}
        <path
          d="M42 42.5 L34 42.5 C32 42.5 31 44 30.5 46 L27.5 72 C27 75 29 76.5 32 76.5"
          fill="none"
          stroke="url(#mmOfficialBagGrad)"
          strokeWidth="4.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Shopping Bag Right Shoulder (open on bottom right for emerging growth arrow) */}
        <path
          d="M58 42.5 L65.5 42.5 C67.5 42.5 68.5 43.8 68.8 45.5"
          fill="none"
          stroke="url(#mmOfficialBagGrad)"
          strokeWidth="4.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 4 Financial Analytics Bar Columns */}
        <rect x="36" y="70" width="5.5" height="7" rx="1.8" fill="url(#mmOfficialBarGrad)" />
        <rect x="44" y="65.5" width="5.5" height="11.5" rx="1.8" fill="url(#mmOfficialBarGrad)" />
        <rect x="52" y="65.5" width="5.5" height="11.5" rx="1.8" fill="url(#mmOfficialBarGrad)" />
        <rect x="60" y="56" width="5.5" height="21" rx="1.8" fill="url(#mmOfficialBarGrad)" />

        {/* Dynamic Upward Growth Trendline & Arrow */}
        <path
          d="M28.5 74.5 L47 57 L53.5 64.5 L67.5 49"
          fill="none"
          stroke="url(#mmOfficialBagGrad)"
          strokeWidth="5.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Growth Arrowhead */}
        <path
          d="M62 48 L71.5 46.5 L69 56.5 Z"
          fill="url(#mmOfficialBagGrad)"
          stroke="url(#mmOfficialBagGrad)"
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
        />
      </div>
    );
  }

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
        />
        <div>
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight leading-none text-[#001A35] dark:text-[#FEFEFE] ${
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
          className={`font-medium tracking-tight mt-1 text-[#64748B] dark:text-[#94A3B8] ${
            selectedSize.subtitleClass || 'text-xs'
          }`}
        >
          Know Your Numbers
        </span>
      )}
    </div>
  );
};
