import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  required?: boolean;
  showPasswordToggle?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftAddon,
      rightAddon,
      required,
      showPasswordToggle,
      id,
      className = '',
      type = 'text',
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const isPasswordInput = type === 'password';
    const effectiveType = isPasswordInput && showPasswordToggle ? (isPasswordVisible ? 'text' : 'password') : type;
    const hasRightElement = rightAddon || (showPasswordToggle && isPasswordInput);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <span>{label}</span>
            {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 text-sm">
              {leftAddon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={effectiveType}
            className={`w-full rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm transition-colors min-h-[44px]
              ${leftAddon ? 'pl-9' : 'pl-3.5'}
              ${hasRightElement ? 'pr-10' : 'pr-3.5'}
              py-2.5 outline-none
              ${
                error
                  ? 'border-rose-400 dark:border-rose-600 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900/30'
                  : 'border-slate-300 dark:border-slate-700 focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-950'
              }
              disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />
          {showPasswordToggle && isPasswordInput ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setIsPasswordVisible((prev) => !prev);
              }}
              className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40 rounded-md cursor-pointer flex items-center justify-center"
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
              title={isPasswordVisible ? 'Hide password' : 'Show password'}
              tabIndex={0}
            >
              {isPasswordVisible ? (
                <EyeOff className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              ) : (
                <Eye className="w-4 h-4 text-slate-400 dark:text-slate-500 hover:text-slate-600" />
              )}
            </button>
          ) : rightAddon ? (
            <div className="absolute right-3 flex items-center text-slate-400 dark:text-slate-500 text-sm">
              {rightAddon}
            </div>
          ) : null}
        </div>
        {error ? (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
