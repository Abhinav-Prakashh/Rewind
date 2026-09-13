import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch currently authenticated user
    supabase.auth
      .getUser()
      .then(({ data: { user }, error }) => {
        if (error) {
          console.warn('supabase.auth.getUser() notice:', error.message);
        }
        if (user) {
          // Temporarily log user_metadata for verification
          console.log('Supabase user.user_metadata:', user.user_metadata);
        }
        setUser(user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Could not fetch Supabase user:', err);
        setLoading(false);
      });

    // 2. Listen for authentication state changes (login, logout, token exchange)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('supabase.auth.onAuthStateChange event:', event);
      if (session?.user) {
        console.log('Supabase user.user_metadata (onAuthStateChange):', session.user.user_metadata);
      }
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
    window.history.pushState(null, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return { user, loading, signOut };
}
