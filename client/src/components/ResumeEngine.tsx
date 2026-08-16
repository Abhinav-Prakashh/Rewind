import { useState, useEffect } from 'react';
import type { Session, ResumeContext } from '../lib/api';

interface ResumeEngineProps {
  repoName: string;
  branch: string;
  activeSession: Session | null;
  resumeContext: ResumeContext | null;
  loadingContext: boolean;
  onResume: () => void;
  onEndSession: () => void;
}

export function ResumeEngine({
  repoName,
  branch,
  activeSession,
  resumeContext,
  loadingContext,
  onResume,
  onEndSession,
}: ResumeEngineProps) {
  const isActive = !!activeSession;

  // Local state for interactive pending tasks
  const [completedPending, setCompletedPending] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setCompletedPending({});
  }, [resumeContext]);

  const togglePending = (idx: number) => {
    setCompletedPending((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <div className="glass-card p-6 md:p-8 relative overflow-hidden animate-fade-up border border-glass-border/70 shadow-2xl">
      {/* Top Gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-accent-blue via-accent-violet to-accent-cyan" />

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-glass-border/40">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs uppercase tracking-wider font-semibold text-accent-cyan bg-accent-cyan/10 px-2.5 py-0.5 rounded-full border border-accent-cyan/20">
              V3 Resume Work Engine
            </span>
            {resumeContext?.lastWorked?.relativeText && (
              <span className="text-xs text-text-muted flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Last Worked: {resumeContext.lastWorked.relativeText}
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
            {repoName}
          </h1>
        </div>

        {/* Action Button & Active Badge */}
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-violet/10 text-accent-violet border border-accent-violet/20 text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
            {branch}
          </span>

          {isActive ? (
            <button
              onClick={onEndSession}
              className="px-5 py-2.5 rounded-xl bg-accent-rose/10 text-accent-rose border border-accent-rose/20 font-semibold text-sm hover:bg-accent-rose/20 transition-all cursor-pointer shadow-lg shadow-accent-rose/10 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-accent-rose animate-ping" />
              End Session
            </button>
          ) : (
            <button
              onClick={onResume}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent-blue via-accent-violet to-accent-cyan text-white font-bold text-sm hover:shadow-xl hover:shadow-accent-blue/30 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
              Resume Work
            </button>
          )}
        </div>
      </div>

      {loadingContext ? (
        <div className="py-8 flex items-center justify-center text-text-muted text-sm gap-2">
          <svg className="w-5 h-5 animate-spin text-accent-blue" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Reconstructing development memory...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Working On Header & Goal */}
          <div className="bg-navy-950/60 p-4 rounded-xl border border-glass-border/50">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-accent-amber uppercase tracking-wide">
              <svg className="w-4 h-4 text-accent-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              Working On
            </div>
            <p className="text-base font-bold text-text-primary line-clamp-2">
              {resumeContext?.workingOn || 'General Development Work'}
            </p>
          </div>

          {/* Last Commit */}
          <div className="bg-navy-950/60 p-4 rounded-xl border border-glass-border/50">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-accent-cyan uppercase tracking-wide">
              <svg className="w-4 h-4 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6-6m-6 6l-6-6" />
              </svg>
              Last Commit
            </div>
            {resumeContext?.lastCommit ? (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                    {resumeContext.lastCommit.hash}
                  </span>
                  <span className="text-xs text-text-muted truncate">
                    by {resumeContext.lastCommit.author}
                  </span>
                </div>
                <p className="text-xs font-medium text-text-secondary truncate">
                  {resumeContext.lastCommit.message}
                </p>
              </div>
            ) : (
              <p className="text-xs text-text-muted">No recent commit found</p>
            )}
          </div>

          {/* Changes Since Last Session */}
          <div className="bg-navy-950/60 p-4 rounded-xl border border-glass-border/50 md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-accent-emerald uppercase tracking-wide">
              <svg className="w-4 h-4 text-accent-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25T5.106 5.25m0 0L7.5 7.5m-2.394-2.25L3 7.5m16.5 4.5v6a2.25 2.25 0 0 1-2.25 2.25H4.5" />
              </svg>
              Changes Since Last Session
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-navy-900 border border-glass-border/60 text-text-primary font-semibold">
                {resumeContext?.changesSinceLastSession?.commitsCount || 0} commits
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-navy-900 border border-glass-border/60 text-text-primary font-semibold">
                {resumeContext?.changesSinceLastSession?.modifiedFilesCount || 0} modified files
              </span>
              {resumeContext?.changesSinceLastSession?.branchChanged && (
                <span className="px-2.5 py-1 rounded-lg bg-accent-amber/10 text-accent-amber border border-accent-amber/20 font-semibold">
                  Branch changed
                </span>
              )}
            </div>
          </div>

          {/* Files Section */}
          <div className="bg-navy-950/60 p-4 rounded-xl border border-glass-border/50 md:col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-accent-violet uppercase tracking-wide">
                <svg className="w-4 h-4 text-accent-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                Relevant Files
              </div>
              <span className="text-xs text-text-muted">
                {resumeContext?.files?.length || 0} files
              </span>
            </div>

            {resumeContext?.files && resumeContext.files.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
                {resumeContext.files.map((file, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg bg-navy-900 border border-glass-border/60 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <span>{file.path}</span>
                    {file.status && (
                      <span className="text-[10px] uppercase font-bold text-accent-blue/80">
                        {file.status}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">No recent modified files recorded</p>
            )}
          </div>

          {/* Pending Tasks / Checklist Section */}
          <div className="bg-navy-950/60 p-4 rounded-xl border border-glass-border/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-accent-rose uppercase tracking-wide">
                <svg className="w-4 h-4 text-accent-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Pending Tasks
              </div>
              <span className="text-xs text-text-muted">
                {resumeContext?.pending?.length || 0} tasks
              </span>
            </div>

            {resumeContext?.pending && resumeContext.pending.length > 0 ? (
              <div className="space-y-2 max-h-28 overflow-y-auto pr-1">
                {resumeContext.pending.map((item, idx) => {
                  const isDone = !!completedPending[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => togglePending(idx)}
                      className="flex items-start gap-2 text-xs cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => {}}
                        className="mt-0.5 accent-accent-rose rounded cursor-pointer"
                      />
                      <span
                        className={`transition-colors ${
                          isDone
                            ? 'line-through text-text-muted'
                            : 'text-text-secondary group-hover:text-text-primary'
                        }`}
                      >
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic">No pending tasks found from session notes</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
