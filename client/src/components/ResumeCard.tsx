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
    <div className="recall-card-dark animate-fade-up">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/60 font-mono mb-1">
            {isActive ? 'Active Workspace' : 'Workspace Ready'}
          </p>
          <h2 className="text-2xl font-medium text-white truncate mb-3">
            {repoName}
          </h2>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white border border-white/10">
              <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
              {branch}
            </span>

            {lastSession && !isActive && (
              <span className="inline-flex items-center gap-1 text-white/50">
                Last session: {timeAgo(lastSession.end_time || lastSession.start_time)}
              </span>
            )}

            {isActive && activeSession && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-ink font-medium">
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
              className="px-4 py-2 rounded-[16px] bg-danger text-white font-medium text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              End Session
            </button>
          ) : (
            <button
              onClick={onResume}
              className="px-5 py-2.5 rounded-[16px] bg-white text-ink font-medium text-xs hover:bg-accent transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <span>Resume Work</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
