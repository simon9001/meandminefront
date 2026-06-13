import { cn } from '@/lib/utils';

interface Props {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  children: React.ReactNode;
}

const variantStyles = {
  default:  'bg-gray-100 text-gray-700',
  success:  'bg-emerald-100 text-emerald-700',
  warning:  'bg-amber-100 text-amber-700',
  error:    'bg-red-100 text-red-700',
  info:     'bg-blue-100 text-blue-700',
  outline:  'border border-gray-300 text-gray-600 bg-transparent',
};

const sizeStyles = { sm: 'text-xs px-2 py-0.5', md: 'text-xs px-2.5 py-1' };

export function Badge({ variant = 'default', size = 'md', className, children }: Props) {
  return (
    <span className={cn('inline-flex items-center gap-1 font-medium rounded-full', variantStyles[variant], sizeStyles[size], className)}>
      {children}
    </span>
  );
}
