import { useState, useEffect, useRef } from 'react';
import type { Session } from '../lib/api';

interface SessionPanelProps {
  activeSession: Session | null;
  sessions: Session[];
  onUpdateNotes: (notes: string) => void;
}

function formatDuration(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);

  if (diff < 60) return `${diff}s`;
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m}m ${s}s`;
  }
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function SessionPanel({ activeSession, sessions, onUpdateNotes }: SessionPanelProps) {
  const [notes, setNotes] = useState(activeSession?.notes || '');
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  // Sync notes when active session changes
  useEffect(() => {
    setNotes(activeSession?.notes || '');
  }, [activeSession?.id]);

  // Auto-save notes with debounce
  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      onUpdateNotes(value);
    }, 800);
  };

  const completedSessions = sessions.filter((s) => s.status === 'completed');

  return (
    <div className="recall-card animate-fade-up h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wider font-mono flex items-center gap-2">
          <svg className="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          Session Logs
        </h3>
        {activeSession && (
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-accent/30 text-accent-ink">
            Active
          </span>
        )}
      </div>

      {/* Active Session */}
      {activeSession && (
        <div className="mb-5 p-4 rounded-[20px] bg-surface border border-border">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="status-dot status-dot--active pulse-active" />
            <span className="text-xs font-semibold text-ink">In Progress</span>
          </div>

          <div className="text-xs text-muted font-mono mb-3">
            Branch: <span className="text-ink font-semibold">{activeSession.branch}</span>
          </div>

          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Document mental scratchpad, task notes, or key findings..."
            className="w-full h-24 p-3 rounded-[14px] bg-surface-raised border border-border text-xs text-ink placeholder:text-muted-light resize-none focus:outline-none focus:border-ink/40 focus:ring-3 focus:ring-accent/40 transition-all font-mono"
          />
          <p className="text-[10px] text-muted font-mono mt-1">Auto-saves to memory stream</p>
        </div>
      )}

      {/* Session History */}
      <div>
        <h4 className="text-[11px] font-semibold font-mono text-muted uppercase tracking-wider mb-3">
          {completedSessions.length > 0 ? 'Recorded History' : 'No recorded sessions'}
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {completedSessions.slice(0, 8).map((session) => (
            <div
              key={session.id}
              className="flex items-start gap-3 p-3 rounded-[16px] bg-surface border border-border hover:bg-surface-raised transition-colors"
            >
              <div className="mt-1">
                <span className="status-dot status-dot--inactive" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-xs font-medium text-ink truncate font-mono">
                    {session.branch}
                  </span>
                  <span className="text-xs text-muted shrink-0 font-mono">
                    {session.end_time ? formatDuration(session.start_time, session.end_time) : '—'}
                  </span>
                </div>
                <p className="text-[11px] text-muted font-mono">
                  {formatDate(session.start_time)}
                </p>
                {session.notes && (
                  <p className="text-xs text-ink-soft mt-1 line-clamp-2 bg-surface-raised p-2 rounded-[10px] border border-border/60">
                    {session.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
