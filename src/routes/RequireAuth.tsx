import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

type RequireAuthProps = {
  children: ReactNode;
};

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('nexum.auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string | null };
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  useEffect(() => {
    setToken(getStoredToken());
  }, []);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

