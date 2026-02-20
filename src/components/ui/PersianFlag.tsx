import persianFlagSrc from '@/assets/flag-persian.jpg';

interface PersianFlagProps {
  size?: number;
  className?: string;
}

/**
 * Lion & Sun Persian flag image used as a language badge/emoji replacement.
 */
export function PersianFlag({ size = 20, className }: PersianFlagProps) {
  return (
    <img
      src={persianFlagSrc}
      alt="Persian"
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline-block', borderRadius: 2, objectFit: 'cover', verticalAlign: 'middle' }}
    />
  );
}

/** Returns the flag src for use in non-JSX contexts */
export { persianFlagSrc };
