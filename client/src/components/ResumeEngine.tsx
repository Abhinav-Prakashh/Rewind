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
    <div className="recall-card p-4 sm:p-5 rounded-[24px] animate-fade-up h-full">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-ink bg-surface px-2 py-0.5 rounded-full border border-border font-mono">
              {repoName}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted bg-surface px-2 py-0.5 rounded-full border border-border font-mono">
              Mental Model Reconstructor
            </span>
            {resumeContext?.lastWorked?.relativeText && (
              <span className="text-[11px] text-muted flex items-center gap-1 font-mono">
                Last active: {resumeContext.lastWorked.relativeText}
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-medium text-ink tracking-tight">
            Active Context & Workspace State
          </h2>
        </div>

        {/* Action Button & Active Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface text-ink-soft border border-border text-[11px] font-mono">
            <svg className="w-3 h-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
            {branch}
          </span>

          {isActive ? (
            <button
              onClick={onEndSession}
              className="px-3.5 py-1.5 rounded-[14px] bg-danger/15 text-ink hover:bg-danger/25 border border-danger/30 font-medium text-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-danger animate-ping" />
              End Session
            </button>
          ) : (
            <button
              onClick={onResume}
              className="px-4 py-1.5 rounded-[14px] bg-ink text-white font-medium text-xs hover:bg-ink-soft transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <span className="text-accent">▶</span>
              <span>Resume Session</span>
            </button>
          )}
        </div>
      </div>

      {loadingContext ? (
        <div className="py-6 flex items-center justify-center text-muted text-xs gap-2">
          <svg className="w-3.5 h-3.5 animate-spin text-ink" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Reconstructing development memory...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Working On Card */}
          <div className="bg-surface p-3 rounded-[16px] border border-border">
            <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-semibold text-muted uppercase tracking-wider font-mono">
              <svg className="w-3 h-3 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              Focus & Objective
            </div>
            <p className="text-xs font-medium text-ink line-clamp-2">
              {resumeContext?.workingOn || 'General Development Work'}
            </p>
          </div>

          {/* Last Commit Card */}
          <div className="bg-surface p-3 rounded-[16px] border border-border">
            <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-semibold text-muted uppercase tracking-wider font-mono">
              <svg className="w-3 h-3 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6-6m-6 6l-6-6" />
              </svg>
              Latest Commit
            </div>
            {resumeContext?.lastCommit ? (
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-raised text-ink border border-border">
                    {resumeContext.lastCommit.hash}
                  </span>
                  <span className="text-[11px] text-muted truncate">
                    {resumeContext.lastCommit.author}
                  </span>
                </div>
                <p className="text-xs font-medium text-ink-soft truncate">
                  {resumeContext.lastCommit.message}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted">No recent commit found</p>
            )}
          </div>

          {/* Changes Since Last Session */}
          <div className="bg-surface p-3 rounded-[16px] border border-border md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-semibold text-muted uppercase tracking-wider font-mono">
              <svg className="w-3 h-3 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25T5.106 5.25m0 0L7.5 7.5m-2.394-2.25L3 7.5m16.5 4.5v6a2.25 2.25 0 0 1-2.25 2.25H4.5" />
              </svg>
              Diff Delta
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-surface-raised border border-border text-ink font-medium text-[11px]">
                {resumeContext?.changesSinceLastSession?.commitsCount || 0} commits
              </span>
              <span className="px-2 py-0.5 rounded-full bg-surface-raised border border-border text-ink font-medium text-[11px]">
                {resumeContext?.changesSinceLastSession?.modifiedFilesCount || 0} files
              </span>
              {resumeContext?.changesSinceLastSession?.branchChanged && (
                <span className="px-2 py-0.5 rounded-full bg-accent text-accent-ink font-medium text-[11px]">
                  Branch switched
                </span>
              )}
            </div>
          </div>

          {/* Files Section */}
          <div className="bg-surface p-3 rounded-[16px] border border-border md:col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted uppercase tracking-wider font-mono">
                <svg className="w-3 h-3 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                Contextual Files
              </div>
              <span className="text-[10px] text-muted font-mono">
                {resumeContext?.files?.length || 0} active
              </span>
            </div>

            {resumeContext?.files && resumeContext.files.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
                {resumeContext.files.map((file, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-raised border border-border text-ink-soft hover:text-ink transition-colors"
                  >
                    <span>{file.path}</span>
                    {file.status && (
                      <span className="text-[8px] uppercase font-bold text-muted bg-surface px-1 rounded">
                        {file.status}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted italic">No recent modified files recorded</p>
            )}
          </div>

          {/* Pending Tasks Section */}
          <div className="bg-surface p-3 rounded-[16px] border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted uppercase tracking-wider font-mono">
                <svg className="w-3 h-3 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Action Items
              </div>
              <span className="text-[10px] text-muted font-mono">
                {resumeContext?.pending?.length || 0} items
              </span>
            </div>

            {resumeContext?.pending && resumeContext.pending.length > 0 ? (
              <div className="space-y-1 max-h-20 overflow-y-auto pr-1">
                {resumeContext.pending.map((item, idx) => {
                  const isDone = !!completedPending[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => togglePending(idx)}
                      className="flex items-start gap-1.5 text-xs cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => {}}
                        className="mt-0.5 accent-ink rounded cursor-pointer"
                      />
                      <span
                        className={`transition-colors text-[11px] ${
                          isDone
                            ? 'line-through text-muted'
                            : 'text-ink-soft group-hover:text-ink'
                        }`}
                      >
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted italic">No pending tasks found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
