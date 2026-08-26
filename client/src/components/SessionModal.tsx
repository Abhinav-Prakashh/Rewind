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

  // Reset & focus when opened
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
      className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md animate-fade-up"
        style={{
          background: 'linear-gradient(135deg, rgba(15,20,40,0.98) 0%, rgba(10,14,30,0.98) 100%)',
          border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: '1rem',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-glass-border/30">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">Start New Session</h2>
              <p className="text-xs text-text-muted">Name it to stay organized</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Last Session Recap */}
        {lastSession && (
          <div
            className="mx-6 mt-5 p-4 rounded-xl"
            style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)' }}
          >
            <p className="text-xs font-semibold text-accent-violet uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Last Session Recap
            </p>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-sm font-medium text-text-primary truncate">
                {lastSession.notes ? lastSession.notes.split('\n')[0] : 'Session on ' + lastSession.branch}
              </span>
              <span className="text-xs text-text-muted shrink-0 font-mono">
                {formatDuration(lastSession.start_time, lastSession.end_time)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                {formatDate(lastSession.start_time)}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
                {lastSession.branch}
              </span>
            </div>
            {lastSession.notes && lastSession.notes.split('\n').length > 1 && (
              <p className="mt-2 text-xs text-text-secondary bg-navy-950/60 rounded-lg p-2 line-clamp-3">
                {lastSession.notes}
              </p>
            )}
          </div>
        )}

        {/* Name Input */}
        <div className="px-6 pt-5 pb-2">
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Session Name <span className="text-text-muted font-normal normal-case">(optional)</span>
          </label>
          <input
            ref={inputRef}
            type="text"
            placeholder='e.g. "Auth flow refactor", "Bug fix #142"'
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={80}
            className="w-full px-4 py-2.5 rounded-xl text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(139,92,246,0.25)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12), inset 0 1px 3px rgba(0,0,0,0.2)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)'; e.currentTarget.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.2)'; }}
          />
          <p className="mt-1.5 text-xs text-text-muted">Press Enter to start · Esc to cancel</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 pt-4 pb-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
            Start Session
          </button>
        </div>
      </div>
    </div>
  );
}
