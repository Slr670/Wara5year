import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Button = React.forwardRef(({
  className,
  variant = 'default',
  size = 'default',
  disabled = false,
  children,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:pointer-events-none rounded-xl active:scale-[0.98] select-none';
  
  const variants = {
    default: 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20 border border-blue-500/30',
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/25 border border-blue-400/30',
    secondary: 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 backdrop-blur-sm',
    outline: 'border border-slate-700 hover:bg-slate-800/50 text-slate-300 hover:text-white',
    ghost: 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-100',
    danger: 'bg-red-600 hover:bg-red-500 text-white shadow-sm shadow-red-500/20 border border-red-500/30',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 border border-emerald-500/30'
  };

  const sizes = {
    sm: 'h-9 px-3 text-xs gap-1.5',
    default: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-5 text-base gap-2.5',
    icon: 'h-10 w-10 p-0 flex items-center justify-center'
  };

  return (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
