import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export function AuthCallback() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isHandled = useRef(false);

  useEffect(() => {
    // 1. Immediately subscribe to onAuthStateChange in case background detection resolves session first
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !isHandled.current) {
        isHandled.current = true;
        window.location.replace('/dashboard');
      }
    });

    async function processAuth() {
      if (isHandled.current) return;

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        if (error) {
          throw new Error(errorDescription || error);
        }

        // Check if session is already established
        const { data: initialSessionData } = await supabase.auth.getSession();
        if (initialSessionData?.session && !isHandled.current) {
          isHandled.current = true;
          window.location.replace('/dashboard');
          return;
        }

        if (code) {
          // Exchange code for session using Supabase PKCE
          const { data: exchangeData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            // If code was already exchanged by background auto-detection, check session again
            const { data: retrySession } = await supabase.auth.getSession();
            if (retrySession?.session && !isHandled.current) {
              isHandled.current = true;
              window.location.replace('/dashboard');
              return;
            }
            throw exchangeError;
          }

          if (exchangeData?.session && !isHandled.current) {
            isHandled.current = true;
            window.location.replace('/dashboard');
            return;
          }
        }

        // Final check for session
        const { data: finalSessionData } = await supabase.auth.getSession();
        if (finalSessionData?.session && !isHandled.current) {
          isHandled.current = true;
          window.location.replace('/dashboard');
          return;
        }

        throw new Error('No authorization code or active session found.');
      } catch (err: unknown) {
        // Before displaying error, do one last check in case auth state listener is processing
        const { data: fallbackCheck } = await supabase.auth.getSession();
        if (fallbackCheck?.session && !isHandled.current) {
          isHandled.current = true;
          window.location.replace('/dashboard');
          return;
        }

        const message = err instanceof Error ? err.message : 'Authentication failed';
        console.error('PKCE Auth callback error:', message);
        setErrorMessage(message);

        // Redirect back to login on failure
        setTimeout(() => {
          window.location.replace('/login');
        }, 2500);
      }
    }

    processAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-app-bg p-4 flex items-center justify-center">
      <div className="text-center animate-fade-up max-w-sm">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-ink text-white mb-4 shadow-xs">
          <svg className="w-7 h-7 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>

        <h2 className="text-lg font-medium text-ink mb-1">
          {errorMessage ? 'Authentication Failed' : 'Completing sign-in...'}
        </h2>
        <p className="text-xs text-muted leading-relaxed">
          {errorMessage ? errorMessage : 'Redirecting to your Rewind workspace'}
        </p>
      </div>
    </div>
  );
}

export default AuthCallback;
