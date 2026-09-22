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
    <main className="h-full w-full overflow-y-auto bg-app-bg">
      <div className="grid min-h-full lg:grid-cols-2">
        <section aria-labelledby="intro-title" className="bg-ink text-white flex flex-col px-7 py-9 sm:px-12 sm:py-12 lg:min-h-[100dvh] xl:px-16">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[14px] border border-white/15 flex items-center justify-center text-accent">
              <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </div>
            <span className="text-2xl font-medium tracking-tight">Rewind</span>
          </div>

          <div className="flex-1 flex flex-col justify-center py-12 lg:py-16 max-w-lg">
            <p className="font-mono text-[10px] sm:text-xs uppercase tracking-wider text-white/50 mb-5">
              Your development memory
            </p>
            <h2 id="intro-title" className="text-4xl sm:text-5xl xl:text-6xl font-medium tracking-tight leading-[1.08] mb-6">
              Less catching up.<br />
              <span className="text-accent">More building.</span>
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-white/65 max-w-md">
              Rewind brings your code, session notes, and decisions together.
              See what changed, remember why, and ask AI about your project so
              you can pick up where you left off.
            </p>

            <div className="hidden lg:grid gap-5 mt-10 pt-8 border-t border-white/10">
              {[
                ['01', 'Reconnect with your code', 'Bring in a repository snapshot to explore your project.'],
                ['02', 'Keep the thinking behind it', 'Save session notes and the decisions that shaped your work.'],
                ['03', 'Get your context back', 'Ask AI questions grounded in your recorded project memory.'],
              ].map(([number, title, description]) => (
                <div key={number} className="flex gap-4">
                  <span className="text-[11px] font-mono text-accent pt-0.5">{number}</span>
                  <div>
                    <h3 className="text-sm font-medium mb-1">{title}</h3>
                    <p className="text-xs leading-relaxed text-white/50">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="hidden lg:block text-[10px] font-mono text-white/35 uppercase tracking-wider">
            Git remembers code. Rewind remembers context.
          </p>
        </section>

        <section aria-label="Sign in to Rewind" className="flex items-center justify-center p-6 py-12 sm:p-10 lg:p-12">
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
        </section>
      </div>
    </main>
  );
}

export default Login;
