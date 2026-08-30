import React from 'react';

interface MarketMateLogoProps {
  mode?: 'full' | 'icon';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  className?: string;
  imageClassName?: string;
  showSubtitle?: boolean;
  onClick?: () => void;
}

export const MarketMateLogo: React.FC<MarketMateLogoProps> = ({
  mode = 'full',
  size = 'md',
  className = '',
  showSubtitle = false,
  onClick,
}) => {
  // Size mapping for the original vector logo
  const sizeClasses: Record<string, { height: string; textClass: string; iconSize: string; subtitleClass: string }> = {
    xs: { height: 'h-6', textClass: 'text-xs', iconSize: 'w-6 h-6', subtitleClass: 'text-[9px]' },
    sm: { height: 'h-8', textClass: 'text-sm', iconSize: 'w-7 h-7', subtitleClass: 'text-[10px]' },
    md: { height: 'h-10', textClass: 'text-base', iconSize: 'w-9 h-9', subtitleClass: 'text-xs' },
    lg: { height: 'h-12', textClass: 'text-lg', iconSize: 'w-11 h-11', subtitleClass: 'text-xs' },
    xl: { height: 'h-16', textClass: 'text-2xl', iconSize: 'w-14 h-14', subtitleClass: 'text-sm' },
    '2xl': { height: 'h-20', textClass: 'text-3xl', iconSize: 'w-18 h-18', subtitleClass: 'text-base' },
    custom: { height: '', textClass: '', iconSize: '', subtitleClass: '' },
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
        <div
          className={`rounded-xl flex items-center justify-center p-1.5 shadow-2xs bg-emerald-700 text-white ${selectedSize.iconSize}`}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
            {/* Bag Handle */}
            <path
              d="M14 15V11C14 7.686 16.686 5 20 5C23.314 5 26 7.686 26 11V15"
              stroke="white"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            {/* Bag Body */}
            <path
              d="M8 15H32L30 33C30 34.1 29.1 35 28 35H12C10.9 35 10 34.1 10 33L8 15Z"
              stroke="white"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
            {/* Ascending Growth Arrow */}
            <path
              d="M12 28L20 20L28 12M28 12H21M28 12V19"
              stroke="#86EFAC"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
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
        <div
          className={`rounded-xl flex items-center justify-center p-1.5 shadow-2xs bg-emerald-700 text-white shrink-0 ${
            selectedSize.iconSize || 'w-9 h-9'
          }`}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
            {/* Bag Handle */}
            <path
              d="M14 15V11C14 7.686 16.686 5 20 5C23.314 5 26 7.686 26 11V15"
              stroke="white"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            {/* Bag Body */}
            <path
              d="M8 15H32L30 33C30 34.1 29.1 35 28 35H12C10.9 35 10 34.1 10 33L8 15Z"
              stroke="white"
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
            {/* Ascending Growth Arrow */}
            <path
              d="M12 28L20 20L28 12M28 12H21M28 12V19"
              stroke="#86EFAC"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight leading-none text-slate-900 ${
                selectedSize.textClass || 'text-lg'
              }`}
            >
              Market<span className="text-emerald-600">Mate</span>
            </span>
            <span className="text-[10px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded leading-none bg-emerald-100 text-emerald-800">
              PRO
            </span>
          </div>
        </div>
      </div>

      {showSubtitle && (
        <span
          className={`font-medium tracking-tight mt-1 text-slate-500 ${
            selectedSize.subtitleClass || 'text-xs'
          }`}
        >
          Know Your Numbers
        </span>
      )}
    </div>
  );
};

