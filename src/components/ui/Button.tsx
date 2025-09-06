import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'emergency' | 'ghost';
  size?: 'small' | 'medium' | 'large' | 'extra-large';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}, ref) => {
  const { settings } = useAccessibility();

  const baseClasses = `
    font-semibold rounded-xl transition-all duration-300 
    focus:outline-none focus:ring-4 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    touch-manipulation select-none
    flex items-center justify-center gap-3
  `;

  const variantClasses = {
    primary: `
      bg-blue-600 hover:bg-blue-700 text-white 
      focus:ring-blue-300 shadow-lg hover:shadow-xl
      border-2 border-blue-600
    `,
    secondary: `
      bg-gray-100 hover:bg-gray-200 text-gray-900 
      focus:ring-gray-300 shadow-md hover:shadow-lg
      border-2 border-gray-200
    `,
    emergency: `
      bg-red-600 hover:bg-red-700 text-white 
      focus:ring-red-300 shadow-lg hover:shadow-xl
      border-2 border-red-600 animate-pulse
    `,
    ghost: `
      bg-transparent hover:bg-gray-100 text-gray-700 
      focus:ring-gray-300 border-2 border-transparent
    `
  };

  const sizeClasses = {
    small: 'px-4 py-2 text-lg min-h-[48px]',
    medium: 'px-6 py-3 text-xl min-h-[56px]',
    large: 'px-8 py-4 text-2xl min-h-[64px]',
    'extra-large': 'px-12 py-6 text-3xl min-h-[80px]'
  };

  // Increase touch targets for accessibility
  const touchTargetSize = size === 'small' ? 'min-h-[60px]' : 
                         size === 'medium' ? 'min-h-[64px]' :
                         size === 'large' ? 'min-h-[72px]' : 'min-h-[88px]';

  return (
    <motion.button
      ref={ref}
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${sizeClasses[size]}
        ${touchTargetSize}
        ${className}
      `}
      whileHover={settings.reducedMotion ? {} : { scale: 1.02 }}
      whileTap={settings.reducedMotion ? {} : { scale: 0.98 }}
      disabled={disabled || isLoading}
      aria-label={typeof children === 'string' ? children : undefined}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      ) : children}
    </motion.button>
  );
});