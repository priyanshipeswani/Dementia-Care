import React, { HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'bordered';
  interactive?: boolean;
}

export function Card({ 
  children, 
  className = '', 
  variant = 'default',
  interactive = false,
  ...props 
}: CardProps) {
  const { settings } = useAccessibility();

  const baseClasses = `
    rounded-2xl transition-all duration-300
    ${settings.theme === 'high-contrast' ? 'border-4 border-black' : ''}
  `;

  const variantClasses = {
    default: 'bg-white shadow-md',
    elevated: 'bg-white shadow-lg hover:shadow-xl',
    bordered: 'bg-white border-2 border-gray-200 shadow-sm'
  };

  const interactiveClasses = interactive ? 
    'cursor-pointer hover:shadow-lg transform hover:-translate-y-1' : '';

  const CardComponent = interactive ? motion.div : 'div';

  const motionProps = interactive && !settings.reducedMotion ? {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 }
  } : {};

  return (
    <CardComponent
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${interactiveClasses}
        ${className}
      `}
      {...(interactive ? motionProps : {})}
      {...props}
    >
      {children}
    </CardComponent>
  );
}