import classNames from 'classnames';

const GREEN = '#498007';

export function SquashMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 110"
      width={size}
      height={size * 1.1}
      className={className}
      role="img"
      aria-label="Cube Squash"
    >
      <polygon
        points="50,6 92,30 92,80 50,104 8,80 8,30"
        fill={GREEN}
        stroke={GREEN}
        strokeWidth="9"
        strokeLinejoin="round"
      />
      <g transform="translate(50 68) scale(1.12) translate(-50 -68)">
      <path d="M50 48 C44 41 30 42 21 54 C11 67 18 91 50 92 C82 91 89 67 79 54 C70 42 56 41 50 48 Z" fill="#fff" />
      <path d="M46 49 C45 40 49 32 58 26 L64 31 C56 35 53 41 55 49 Z" fill="#fff" />
      <path d="M60 27 C69 22 73 29 66 33" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <path d="M37 47 C29 60 29 80 37 91" fill="none" stroke={GREEN} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M63 47 C71 60 71 80 63 91" fill="none" stroke={GREEN} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M50 49 C49 62 49 80 50 92" fill="none" stroke={GREEN} strokeWidth="3.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={classNames('font-display uppercase leading-none whitespace-nowrap select-none', className)}>
      <span className="font-extrabold tracking-wide">Cube</span>
      <span className="font-medium tracking-[0.18em] ml-[0.12em]">Squash</span>
    </span>
  );
}

export default function Logo({ className, markSize = 40 }: { className?: string; markSize?: number }) {
  return (
    <span className={classNames('inline-flex items-center gap-2.5', className)}>
      <SquashMark size={markSize} />
      <Wordmark className="text-white text-[1.45rem]" />
    </span>
  );
}
