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
  modified: { color: 'text-warning bg-warning/10 border-warning/30', icon: 'M' },
  added: { color: 'text-success bg-success/10 border-success/30', icon: 'A' },
  deleted: { color: 'text-danger bg-danger/10 border-danger/30', icon: 'D' },
  untracked: { color: 'text-info bg-info/10 border-info/30', icon: '?' },
  renamed: { color: 'text-ink bg-surface border-border', icon: 'R' },
};

export function GitInfo({ status, commits, loading }: GitInfoProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="recall-card animate-pulse">
          <div className="h-4 w-32 bg-surface rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-surface rounded-[14px]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Changed Files */}
      <div className="recall-card animate-fade-up">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          Modified Working Tree
          {status && status.changedFiles.length > 0 && (
            <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface text-ink border border-border">
              {status.changedFiles.length} files
            </span>
          )}
        </h3>

        {status && status.changedFiles.length > 0 ? (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {status.changedFiles.map((file, i) => {
              const config = statusConfig[file.status] || { color: 'text-muted bg-surface border-border', icon: '?' };
              return (
                <div
                  key={i}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-[14px] bg-surface border border-border hover:bg-surface-raised transition-colors"
                >
                  <span className={`text-[10px] font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center border ${config.color}`}>
                    {config.icon}
                  </span>
                  <span className="text-xs text-ink-soft truncate font-mono">
                    {file.path}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted font-mono">Working tree clean ✨</p>
        )}
      </div>

      {/* Recent Commits */}
      <div className="recall-card animate-fade-up flex-1 flex flex-col">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
          </svg>
          Recent Commits
        </h3>

        {commits.length > 0 ? (
          <div className="space-y-0 max-h-96 overflow-y-auto pr-1">
            {commits.map((commit, i) => {
              const isLast = i === commits.length - 1;
              return (
                <div key={i} className="flex gap-3.5 group">
                  {/* Perfectly aligned Node & Connecting Line */}
                  <div className="flex flex-col items-center w-5 shrink-0">
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 z-10 transition-transform group-hover:scale-110 ${
                        i === 0
                          ? 'bg-ink ring-4 ring-ink/10'
                          : 'bg-muted-light group-hover:bg-ink'
                      }`}
                    />
                    {!isLast && (
                      <div className="w-[1.5px] flex-1 bg-border my-1" />
                    )}
                  </div>

                  {/* Commit Information */}
                  <div className="flex-1 pb-4 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-ink leading-snug">
                        {commit.message}
                      </p>
                      <span className="text-[10px] font-mono text-muted shrink-0 mt-0.5">
                        {timeAgo(commit.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px]">
                      <span className="bg-surface px-2 py-0.5 rounded-md border border-border text-ink-soft font-semibold">
                        {commit.hash}
                      </span>
                      <span className="text-muted truncate">
                        {commit.author}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted font-mono">No commits yet</p>
        )}
      </div>
    </div>
  );
}
