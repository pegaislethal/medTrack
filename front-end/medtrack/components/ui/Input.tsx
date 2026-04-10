import React, { forwardRef } from "react";
import { Search } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
  isSearch?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", icon, error, isSearch, type, ...props }, ref) => {
    return (
      <div className="w-full relative">
        {isSearch && !icon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-600" />
          </div>
        )}
        {!isSearch && icon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-600">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={`flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm
            ${(isSearch || icon) ? 'pl-9' : ''}
            ${error ? 'border-red-500 focus-visible:ring-red-500' : ''}
            ${className}`}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
