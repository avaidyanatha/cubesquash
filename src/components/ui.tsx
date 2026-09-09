import classNames from 'classnames';
import type { ReactNode } from 'react';

export type ButtonColor = 'primary' | 'danger' | 'accent' | 'secondary';

const SOLID: Record<ButtonColor, string> = {
  primary: 'bg-button-primary border-button-primary hover:bg-button-primary-active hover:border-button-primary-active',
  danger: 'bg-button-danger border-button-danger hover:bg-button-danger-active hover:border-button-danger-active',
  accent: 'bg-button-accent border-button-accent hover:bg-button-accent-active hover:border-button-accent-active',
  secondary: 'bg-button-secondary border-button-secondary hover:bg-button-secondary-active',
};

const OUTLINE: Record<ButtonColor, string> = {
  primary: 'text-button-primary bg-transparent border-button-primary hover:bg-button-primary hover:text-button-text',
  danger: 'text-button-danger bg-transparent border-button-danger hover:bg-button-danger hover:text-button-text',
  accent: 'text-button-accent bg-transparent border-button-accent hover:bg-button-accent hover:text-button-text',
  secondary:
    'text-button-secondary bg-transparent border-button-secondary hover:bg-button-secondary hover:text-button-text',
};

export const buttonClasses = (color: ButtonColor, outline: boolean, disabled: boolean, extra?: string) =>
  classNames(
    'inline-flex items-center justify-center gap-1 px-2 py-1 rounded font-semibold text-sm border transition-colors duration-300 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-focus-ring/50 focus:border-focus-ring',
    outline ? OUTLINE[color] : `${SOLID[color]} text-button-text`,
    { 'opacity-50 cursor-not-allowed pointer-events-none': disabled },
    extra,
  );

interface ButtonProps {
  children: ReactNode;
  color?: ButtonColor;
  outline?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
  title?: string;
  className?: string;
  type?: 'button' | 'submit';
}

export function Button({
  children,
  color = 'accent',
  outline = false,
  disabled = false,
  onClick,
  href,
  title,
  className,
  type = 'button',
}: ButtonProps) {
  const classes = buttonClasses(color, outline, disabled, className);
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} title={title}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  );
}

export const Card = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={classNames('bg-bg-accent/80 shadow rounded-md border border-border', className)}>{children}</div>
);

export const CardHeader = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={classNames('py-2 px-4 border-b border-border', className)}>{children}</div>
);

export const CardBody = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={classNames('p-4', className)}>{children}</div>
);

export const CardFooter = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={classNames('py-2 px-4 border-t border-border', className)}>{children}</div>
);

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none" title={hint}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={classNames(
          'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-focus-ring/50',
          checked ? 'bg-button-primary' : 'bg-button-secondary/50',
        )}
      >
        <span
          className={classNames(
            'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-4' : 'translate-x-0',
          )}
        />
      </button>
      <span className="text-sm font-medium text-text">{label}</span>
    </label>
  );
}

export const Spinner = ({ className }: { className?: string }) => (
  <span
    className={classNames(
      'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent align-[-2px]',
      className,
    )}
    aria-label="Loading"
  />
);

export const Badge = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span
    className={classNames(
      'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
      className,
    )}
  >
    {children}
  </span>
);
