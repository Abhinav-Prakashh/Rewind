import type { Activity } from '../lib/api';

interface ActivityTimelineProps {
  activities: Activity[];
  loading: boolean;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function getActivityConfig(type: Activity['type']) {
  switch (type) {
    case 'file_modified':
      return {
        label: 'Modified',
        badgeColor: 'bg-warning/15 text-ink border-warning/30',
        icon: (
          <svg className="w-3.5 h-3.5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
        ),
      };
    case 'file_created':
      return {
        label: 'Created',
        badgeColor: 'bg-success/15 text-ink border-success/30',
        icon: (
          <svg className="w-3.5 h-3.5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        ),
      };
    case 'file_deleted':
      return {
        label: 'Deleted',
        badgeColor: 'bg-danger/15 text-ink border-danger/30',
        icon: (
          <svg className="w-3.5 h-3.5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        ),
      };
    case 'branch_changed':
      return {
        label: 'Branch Switch',
        badgeColor: 'bg-accent/30 text-accent-ink border-accent/40',
        icon: (
          <svg className="w-3.5 h-3.5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
          </svg>
        ),
      };
    case 'commit_created':
      return {
        label: 'Commit',
        badgeColor: 'bg-info/15 text-ink border-info/30',
        icon: (
          <svg className="w-3.5 h-3.5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
          </svg>
        ),
      };
    default:
      return {
        label: 'Event',
        badgeColor: 'bg-surface text-muted border-border',
        icon: (
          <svg className="w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        ),
      };
  }
}

export function ActivityTimeline({ activities, loading }: ActivityTimelineProps) {
  return (
    <div className="recall-card animate-fade-up h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wider font-mono flex items-center gap-2">
          <svg className="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          Live Activity Stream
        </h3>
        <span className="flex items-center gap-1.5 text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-surface text-ink-soft border border-border">
          <span className="status-dot status-dot--active pulse-active" />
          Realtime Index
        </span>
      </div>

      {loading ? (
        <div className="space-y-3 py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-surface rounded-[14px] animate-pulse" />
          ))}
        </div>
      ) : activities.length > 0 ? (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {activities.map((item) => {
            const config = getActivityConfig(item.type);
            return (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 p-3 rounded-[16px] bg-surface border border-border hover:bg-surface-raised transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-1.5 rounded-[10px] bg-surface-raised border border-border shrink-0 mt-0.5">
                    {config.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${config.badgeColor}`}>
                        {config.label}
                      </span>
                      {item.file_path && (
                        <span className="text-xs font-mono font-medium text-ink truncate">
                          {item.file_path}
                        </span>
                      )}
                    </div>
                    {item.details && (
                      <p className="text-xs text-muted mt-1 line-clamp-2">
                        {item.details}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-muted-light shrink-0 mt-0.5">
                  {formatTime(item.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-muted text-xs font-mono">
          No automatic events captured yet. Edit a file or commit to stream live context!
        </div>
      )}
    </div>
  );
}
