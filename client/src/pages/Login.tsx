import { OAuthButton } from '../components/auth/OAuthButton';
import { supabase } from '../lib/supabase';

export function Login() {
  const handleGitHubLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("GitHub login error:", error.message);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Google login error:", error.message);
    }
  };

  return (
    <div className="min-h-screen w-full bg-app-bg p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-md animate-fade-up">
        {/* Centered Authentication Card */}
        <div className="bg-surface-raised rounded-[28px] p-7 sm:p-9 border border-border shadow-xs text-center">

          {/* Logo Badge & Branding */}
          <div className="flex justify-center mb-5">
            <div className="w-12 h-12 rounded-[16px] bg-ink text-white flex items-center justify-center shadow-xs">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink mb-1.5">
            Rewind
          </h1>
          <p className="text-sm text-muted mb-8">
            Pick up where you left off.
          </p>

          {/* Large OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <OAuthButton
              provider="github"
              variant="primary"
              onClick={handleGitHubLogin}
            >
              Continue with GitHub
            </OAuthButton>

            <OAuthButton
              provider="google"
              variant="secondary"
              onClick={handleGoogleLogin}
            >
              Continue with Google
            </OAuthButton>
          </div>

          {/* Terms and Privacy Footnote */}
          <p className="text-xs text-muted leading-relaxed max-w-xs mx-auto">
            By continuing, you agree to Rewind's{' '}
            <a
              href="#terms"
              onClick={(e) => e.preventDefault()}
              className="text-ink font-medium hover:underline"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="#privacy"
              onClick={(e) => e.preventDefault()}
              className="text-ink font-medium hover:underline"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
