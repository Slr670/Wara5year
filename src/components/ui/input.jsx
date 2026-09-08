import React from 'react';
import { cn } from './button.jsx';

export const Input = React.forwardRef(({
  className,
  type = 'text',
  disabled = false,
  ...props
}, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      disabled={disabled}
      className={cn(
        'flex h-10 w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/80',
        'disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
        className
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';
