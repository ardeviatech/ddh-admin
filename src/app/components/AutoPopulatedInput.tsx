import { forwardRef } from 'react';
import { Wand2 } from 'lucide-react';

interface AutoPopulatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isAutoPopulated?: boolean;
  label: string;
  error?: string;
  required?: boolean;
}

export const AutoPopulatedInput = forwardRef<HTMLInputElement, AutoPopulatedInputProps>(
  ({ isAutoPopulated, label, error, required, className = '', ...props }, ref) => {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          <span>
            {label} {required && <span className="text-red-500">*</span>}
          </span>
          {isAutoPopulated && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600 font-normal">
              <Wand2 size={12} />
              Auto-filled
            </span>
          )}
        </label>
        <input
          ref={ref}
          {...props}
          className={`w-full px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            isAutoPopulated
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300'
          } ${className}`}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

AutoPopulatedInput.displayName = 'AutoPopulatedInput';

interface AutoPopulatedSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  isAutoPopulated?: boolean;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const AutoPopulatedSelect = forwardRef<HTMLSelectElement, AutoPopulatedSelectProps>(
  ({ isAutoPopulated, label, error, required, className = '', children, ...props }, ref) => {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          <span>
            {label} {required && <span className="text-red-500">*</span>}
          </span>
          {isAutoPopulated && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600 font-normal">
              <Wand2 size={12} />
              Auto-filled
            </span>
          )}
        </label>
        <select
          ref={ref}
          {...props}
          className={`w-full px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            isAutoPopulated
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300'
          } ${className}`}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

AutoPopulatedSelect.displayName = 'AutoPopulatedSelect';
