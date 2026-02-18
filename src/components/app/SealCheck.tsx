import { cn } from '@/lib/utils';

const SealCheck = ({ className = '', showParticles = false }: { className?: string; showParticles?: boolean }) => (
  <span className="relative inline-flex items-center justify-center">
    {/* Green particle burst rings */}
    {showParticles && (
      <>
        <span className="absolute inset-0 rounded-full border-2 border-teal-400/60 animate-particle-burst" />
        <span className="absolute inset-[-2px] rounded-full border border-teal-300/40 animate-particle-burst [animation-delay:100ms]" />
      </>
    )}
    <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 3c1.2 0 2.1.9 3 1.6.8.6 1.8 1.1 2.8 1 1-.1 1.9-.6 2.9-.9 1-.3 2.2-.3 3 .4.8.7 1 1.8 1.2 2.8.2 1 .2 2 .8 2.8.6.9 1.5 1.4 2.1 2.3.6.8.9 1.9.6 2.9-.3 1-.9 1.8-1 2.8-.1 1 .2 2 .1 3-.1 1-.7 1.9-1.4 2.7-.7.8-1.5 1.4-2 2.3-.4.9-.4 1.9-.8 2.8-.4.9-1.2 1.6-2.1 2-.9.4-1.9.4-2.9.5-1 .1-1.9.4-2.8.9-.9.5-1.6 1.3-2.5 1.6-.9.3-2 .3-2.9 0-.9-.3-1.6-1.1-2.5-1.6-.9-.5-1.8-.8-2.8-.9-1-.1-2-.1-2.9-.5-.9-.4-1.7-1.1-2.1-2-.4-.9-.4-1.9-.8-2.8-.5-.9-1.3-1.5-2-2.3-.7-.8-1.3-1.7-1.4-2.7-.1-1 .2-2 .1-3-.1-1-.7-1.8-1-2.8-.3-1 0-2.1.6-2.9.6-.9 1.5-1.4 2.1-2.3.6-.8.6-1.8.8-2.8.2-1 .4-2.1 1.2-2.8.8-.7 2-.7 3-.4 1 .3 1.9.8 2.9.9 1 .1 2-.4 2.8-1C17.9 3.9 18.8 3 20 3z"
        fill="currentColor"
      />
      <path
        d="M14 20.5l4 4 8.5-8.5"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

export default SealCheck;
