import type { CommitInfo, GitStatus } from '../lib/api';

interface GitInfoProps {
  status: GitStatus | null;
  commits: CommitInfo[];
  loading: boolean;
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

const statusConfig: Record<string, { color: string; icon: string }> = {
  modified: { color: 'text-accent-amber', icon: 'M' },
  added: { color: 'text-accent-emerald', icon: 'A' },
  deleted: { color: 'text-accent-rose', icon: 'D' },
  untracked: { color: 'text-accent-cyan', icon: '?' },
  renamed: { color: 'text-accent-violet', icon: 'R' },
};

export function GitInfo({ status, commits, loading }: GitInfoProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="glass-card p-5 animate-pulse">
          <div className="h-4 w-32 bg-navy-700/50 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-navy-700/30 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Changed Files */}
      <div className="glass-card p-5 animate-fade-up animate-delay-1">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          Changed Files
          {status && status.changedFiles.length > 0 && (
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-accent-amber/10 text-accent-amber border border-accent-amber/20">
              {status.changedFiles.length}
            </span>
          )}
        </h3>

        {status && status.changedFiles.length > 0 ? (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {status.changedFiles.map((file, i) => {
              const config = statusConfig[file.status] || { color: 'text-text-muted', icon: '?' };
              return (
                <div
                  key={i}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-navy-900/40 hover:bg-navy-900/60 transition-colors"
                >
                  <span className={`text-xs font-mono font-bold w-5 text-center ${config.color}`}>
                    {config.icon}
                  </span>
                  <span className="text-sm text-text-secondary truncate font-mono">
                    {file.path}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-text-muted">Working tree clean ✨</p>
        )}
      </div>

      {/* Recent Commits */}
      <div className="glass-card p-5 animate-fade-up animate-delay-3">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
          </svg>
          Recent Commits
        </h3>

        {commits.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-accent-blue/40 via-accent-violet/20 to-transparent" />

            <div className="space-y-3">
              {commits.map((commit, i) => (
                <div key={i} className="flex items-start gap-3 relative">
                  {/* Timeline dot */}
                  <div className={`w-[9px] h-[9px] rounded-full mt-1.5 shrink-0 z-10 ring-2 ring-navy-950 ${
                    i === 0 ? 'bg-accent-blue' : 'bg-navy-600'
                  }`} />

                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-text-primary leading-snug line-clamp-2">
                        {commit.message}
                      </p>
                      <span className="text-[10px] text-text-muted shrink-0 mt-0.5">
                        {timeAgo(commit.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono text-accent-blue/70 bg-accent-blue/10 px-1.5 py-0.5 rounded">
                        {commit.hash}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {commit.author}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-muted">No commits yet</p>
        )}
      </div>
    </div>
  );
}
