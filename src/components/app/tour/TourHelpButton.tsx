interface TourHelpButtonProps {
  onClick: () => void;
  className?: string;
}

// Tour help (?) buttons removed from headers per design decision.
// Tours can still be triggered programmatically via the onClick handler if needed elsewhere.
export function TourHelpButton(_props: TourHelpButtonProps) {
  return null;
}
