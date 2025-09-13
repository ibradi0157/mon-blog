import React from 'react';

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ');
}

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'secondary' | 'destructive';
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', className, ...props }) => {
  const variants: Record<string, string> = {
    default: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
    destructive: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', variants[variant], className)}
      {...props}
    />
  );
};
