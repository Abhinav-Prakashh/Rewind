import { useState, useEffect, useRef } from 'react';
import type { Session } from '../lib/api';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name?: string) => void;
  lastSession?: Session | null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDuration(start: string, end: string | null): string {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  const diff = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
}

export function SessionModal({ isOpen, onClose, onConfirm, lastSession }: SessionModalProps) {
  const [sessionName, setSessionName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSessionName('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm(sessionName.trim() || undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-ink/40 backdrop-blur-xs"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-app-bg border border-border rounded-[28px] shadow-2xl p-6 sm:p-7 animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[12px] bg-ink text-white flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-medium text-ink">Start Development Session</h2>
              <p className="text-xs text-muted">Index real-time edits & mental state</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface text-muted hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Last Session Recap */}
        {lastSession && (
          <div className="mt-4 p-4 rounded-[20px] bg-surface border border-border">
            <p className="text-[10px] font-mono font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Prior Session Recap
            </p>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-medium text-ink truncate">
                {lastSession.notes ? lastSession.notes.split('\n')[0] : 'Session on ' + lastSession.branch}
              </span>
              <span className="text-xs text-muted font-mono shrink-0">
                {formatDuration(lastSession.start_time, lastSession.end_time)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted font-mono">
              <span>{formatDate(lastSession.start_time)}</span>
              <span>·</span>
              <span>{lastSession.branch}</span>
            </div>
          </div>
        )}

        {/* Name Input */}
        <div className="pt-4 pb-2">
          <label className="block text-[11px] font-mono font-medium text-muted uppercase tracking-wider mb-2">
            Session Label <span className="text-muted-light font-normal lowercase">(optional)</span>
          </label>
          <input
            ref={inputRef}
            type="text"
            placeholder='e.g. "Auth middleware refactor", "Bug fix #142"'
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={80}
            className="w-full px-4 py-2.5 rounded-[16px] bg-surface border border-border text-xs text-ink placeholder:text-muted-light focus:outline-none focus:border-ink/40 focus:ring-3 focus:ring-accent/40 transition-all font-mono"
          />
          <p className="mt-1.5 text-[11px] text-muted-light font-mono">Enter to begin · Esc to cancel</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[14px] bg-surface text-xs font-medium text-muted hover:text-ink transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-2 rounded-[14px] text-xs font-medium text-white bg-ink hover:bg-ink-soft transition-all shadow-xs cursor-pointer active:scale-98"
          >
            <span className="text-accent">▶</span>
            <span>Start Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}
