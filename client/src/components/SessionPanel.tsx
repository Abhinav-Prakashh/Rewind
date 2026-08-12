import { useState, useEffect, useRef } from 'react';
import type { Session } from '../lib/api';

interface SessionPanelProps {
  activeSession: Session | null;
  sessions: Session[];
  onUpdateNotes: (notes: string) => void;
}

function formatDuration(start: string, end: string | null): string {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
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
  const [elapsed, setElapsed] = useState('0s');
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  // Live timer for active session
  useEffect(() => {
    if (!activeSession) return;
    const tick = () => {
      setElapsed(formatDuration(activeSession.start_time, null));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

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
    <div className="glass-card p-5 animate-fade-up animate-delay-2">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        Sessions
      </h3>

      {/* Active Session */}
      {activeSession && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="status-dot status-dot--active pulse-active" />
            <span className="text-sm font-medium text-accent-emerald">Active Session</span>
            <span className="ml-auto text-lg font-mono font-bold text-text-primary">{elapsed}</span>
          </div>

          <div className="text-xs text-text-muted mb-3">
            Branch: <span className="text-text-secondary">{activeSession.branch}</span>
          </div>

          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="What are you working on? Add notes here..."
            className="w-full h-24 px-3 py-2 rounded-xl bg-navy-900/80 border border-glass-border text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent-cyan/30 focus:border-accent-cyan/30 transition-all"
          />
          <p className="text-[10px] text-text-muted mt-1">Auto-saves as you type</p>
        </div>
      )}

      {/* Session History */}
      <div>
        <h4 className="text-xs font-medium text-text-muted mb-3">
          {completedSessions.length > 0 ? 'Recent Sessions' : 'No sessions yet'}
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {completedSessions.slice(0, 8).map((session) => (
            <div
              key={session.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-navy-900/40 border border-glass-border/50 hover:bg-navy-900/60 transition-colors"
            >
              <div className="mt-0.5">
                <span className="status-dot status-dot--inactive" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-xs font-medium text-text-secondary truncate">
                    {session.branch}
                  </span>
                  <span className="text-xs text-text-muted shrink-0">
                    {formatDuration(session.start_time, session.end_time)}
                  </span>
                </div>
                <p className="text-xs text-text-muted">
                  {formatDate(session.start_time)}
                </p>
                {session.notes && (
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">
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
