import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Safe go-back hook. If there's browser history, navigates back.
 * Otherwise navigates to the provided fallback route (default: /app/my-rilo).
 */
export function useGoBack(fallback = '/app/my-rilo') {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    // React Router sets location.key to "default" when there's no history entry
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  }, [navigate, location.key, fallback]);
}
