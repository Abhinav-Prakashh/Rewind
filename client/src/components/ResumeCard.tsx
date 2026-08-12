import type { Session } from '../lib/api';

interface ResumeCardProps {
  repoName: string;
  branch: string;
  lastSession: Session | null;
  activeSession: Session | null;
  onResume: () => void;
  onEndSession: () => void;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

function formatDuration(start: string, end: string | null): string {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const diff = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);

  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export function ResumeCard({
  repoName,
  branch,
  lastSession,
  activeSession,
  onResume,
  onEndSession,
}: ResumeCardProps) {
  const isActive = !!activeSession;

  return (
    <div className="glass-card p-6 relative overflow-hidden animate-fade-up">
      {/* Gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-blue via-accent-violet to-accent-cyan" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Greeting */}
          <p className="text-sm text-text-muted mb-1">
            {isActive ? 'Currently working on' : 'Welcome back to'}
          </p>
          <h2 className="text-2xl font-bold text-text-primary truncate mb-3">
            {repoName}
          </h2>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {/* Branch badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent-violet/10 text-accent-violet border border-accent-violet/20">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
              {branch}
            </span>

            {/* Last session */}
            {lastSession && !isActive && (
              <span className="inline-flex items-center gap-1.5 text-text-muted">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Last session: {timeAgo(lastSession.end_time || lastSession.start_time)}
              </span>
            )}

            {/* Active session indicator */}
            {isActive && activeSession && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20">
                <span className="status-dot status-dot--active pulse-active" />
                Active · {formatDuration(activeSession.start_time, null)}
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0">
          {isActive ? (
            <button
              onClick={onEndSession}
              className="px-5 py-2.5 rounded-xl bg-accent-rose/10 text-accent-rose border border-accent-rose/20 font-medium text-sm hover:bg-accent-rose/20 transition-all cursor-pointer"
            >
              End Session
            </button>
          ) : (
            <button
              onClick={onResume}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-blue to-accent-violet text-white font-semibold text-sm hover:shadow-lg hover:shadow-accent-blue/25 transition-all cursor-pointer"
            >
              Resume Work
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
