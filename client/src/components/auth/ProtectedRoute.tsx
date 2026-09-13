import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const resolved = useRef(false);

  useEffect(() => {
    function handleSession(session: Session | null) {
      if (resolved.current) return;
      resolved.current = true;
      if (session) {
        setStatus('authenticated');
      } else {
        setStatus('unauthenticated');
        window.location.replace('/login');
      }
    }

    // 1. Check initial session immediately
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (!resolved.current) {
        handleSession(data.session);
      }
    });

    // 2. Subscribe to auth changes for immediate reaction (token refresh, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (session) {
          resolved.current = true;
          setStatus('authenticated');
        } else if (resolved.current) {
          // Session was lost after initial auth check (e.g. logout from another tab)
          window.location.replace('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen w-full bg-app-bg flex items-center justify-center">
        <div className="text-center animate-fade-up">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-ink mb-4 shadow-xs">
            <svg className="w-6 h-6 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-xs text-muted">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
}
