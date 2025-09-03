import { useEffect } from 'react';

interface RedirectProps {
  to: string;
}

const Redirect = ({ to }: RedirectProps) => {
  useEffect(() => {
    window.location.href = to;
  }, [to]);

  return null;
};

export default Redirect;