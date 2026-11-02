import { Link, type LinkProps } from 'react-router-dom';
import type { ReactNode } from 'react';
import { buttonStyles } from '../ui/button';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

export function LinkButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: LinkProps & {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link className={cn(buttonStyles({ variant, size }), className)} {...props}>
      {children}
    </Link>
  );
}
