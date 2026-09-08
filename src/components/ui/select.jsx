import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from './button.jsx';

export const Select = React.forwardRef(({
  className,
  children,
  disabled = false,
  ...props
}, ref) => {
  return (
    <div className="relative w-full">
      <select
        ref={ref}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full appearance-none rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 pr-8 py-2 text-sm text-slate-100',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/80',
          'disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
    </div>
  );
});

Select.displayName = 'Select';
