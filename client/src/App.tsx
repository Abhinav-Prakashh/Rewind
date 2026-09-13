import { useEffect, useRef, useState } from 'react';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { useRepo } from './hooks/useApi';
import { ConnectRepo } from './components/ConnectRepo';
import { Dashboard } from './components/Dashboard';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  const [currentPath, setCurrentPath] = useState(() => {
    const p = window.location.pathname;
    if (p === '/' || p === '') {
      window.history.replaceState(null, '', '/login');
      return '/login';
    }
    return p;
  });

  // Track auth session for the /login redirect-if-authenticated behaviour
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const sessionResolved = useRef(false);

  useEffect(() => {
    // Fetch initial session
    supabase.auth.getSession().then(({ data }) => {
      if (!sessionResolved.current) {
        sessionResolved.current = true;
        setSession(data.session);
        setSessionLoading(false);
      }
    });

    // Keep session in sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      sessionResolved.current = true;
      setSession(s);
      setSessionLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Path sync
  useEffect(() => {
    const handleLocationChange = () => {
      const p = window.location.pathname;
      if (p === '/' || p === '') {
        window.history.replaceState(null, '', '/login');
        setCurrentPath('/login');
      } else {
        setCurrentPath(p);
      }
    };

    const handleSignOut = () => {
      setCurrentPath('/login');
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('rewind:signout', handleSignOut);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('rewind:signout', handleSignOut);
    };
  }, []);

  // Route: /auth/callback (Supabase PKCE OAuth callback — always accessible)
  if (currentPath === '/auth/callback' || currentPath.startsWith('/auth/callback')) {
    return <AuthCallback />;
  }

  // Route: /login — redirect to /dashboard if already authenticated
  if (currentPath === '/login' || currentPath === '/login/') {
    if (sessionLoading) {
      // Brief loading to avoid flash-of-login for already authenticated users
      return (
        <div className="min-h-screen w-full bg-app-bg flex items-center justify-center">
          <div className="text-center animate-fade-up">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-ink mb-4 shadow-xs">
              <svg className="w-6 h-6 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          </div>
        </div>
      );
    }
    if (session) {
      window.location.replace('/dashboard');
      return null;
    }
    return <Login />;
  }

  // Route: /dashboard and all other paths — protected
  return (
    <ProtectedRoute>
      <DashboardApp />
    </ProtectedRoute>
  );
}

// Inner component so useRepo only runs inside a ProtectedRoute (i.e. when auth is confirmed)
function DashboardApp() {
  const { repos, activeRepo, loading, error, connectRepo, deselectRepo, selectRepo } = useRepo();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="text-center animate-fade-up">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-ink mb-4">
            <svg className="w-7 h-7 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-sm text-muted">Loading your memory...</p>
        </div>
      </div>
    );
  }

  if (!activeRepo) {
    return (
      <ConnectRepo
        repos={repos}
        onConnect={async (path) => {
          await connectRepo(path);
        }}
        onSelect={selectRepo}
        error={error}
      />
    );
  }

  return (
    <Dashboard
      repo={activeRepo}
      onDisconnect={deselectRepo}
    />
  );
}

export default App;
