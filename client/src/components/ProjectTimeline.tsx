import { useState } from 'react';
import type { TimelineEvent } from '../lib/api';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface ProjectTimelineProps {
  timeline: TimelineEvent[];
  loading: boolean;
  deleteSession: (id: string) => void;
}

export function ProjectTimeline({ timeline, loading, deleteSession }: ProjectTimelineProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string; title: string } | null>(null);

  if (loading) {
    return (
      <div className="glass-card p-6 border border-glass-border/70 animate-fade-up">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded bg-accent-violet/20 animate-pulse" />
          <h2 className="text-lg font-bold text-text-primary">Project Timeline (V4)</h2>
        </div>
        <div className="py-8 flex items-center justify-center text-text-muted text-sm gap-2">
          <svg className="w-5 h-5 animate-spin text-accent-violet" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading visual project history...
        </div>
      </div>
    );
  }

  const activeSelectedEvent = timeline.find((e) => e.id === selectedEventId) || timeline[timeline.length - 1] || null;

  return (
    <div className="glass-card p-6 border border-glass-border/70 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-glass-border/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-accent-violet/10 text-accent-violet border border-accent-violet/20">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Project Timeline</h2>
            <p className="text-xs text-text-muted">Visual history of development events & milestones</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent-violet/10 text-accent-violet border border-accent-violet/20">
          {timeline.length} Milestones
        </span>
      </div>

      {/* Horizontal Stepper Timeline Visualizer */}
      {timeline.length === 0 ? (
        <div className="py-8 text-center text-text-muted text-sm">
          No project history recorded yet. Start working to generate timeline events!
        </div>
      ) : (
        <div>
          <div className="relative overflow-x-auto pb-4 pt-2 no-scrollbar">
            <div className="flex items-center gap-6 min-w-max px-2">
              {timeline.map((event, index) => {
                const isSelected = activeSelectedEvent?.id === event.id;
                return (
                  <div key={event.id} className="relative flex items-center">
                    {/* Horizontal Connector Line */}
                    {index < timeline.length - 1 && (
                      <div className="absolute top-5 left-10 w-full h-[2px] bg-glass-border/80 z-0" />
                    )}

                    {/* Node Button */}
                    <button
                      onClick={() => setSelectedEventId(event.id)}
                      className={`relative z-10 flex flex-col items-center group cursor-pointer transition-transform ${
                        isSelected ? 'scale-105' : 'hover:scale-102'
                      }`}
                    >
                      {/* Circle Dot */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all shadow-lg ${
                          isSelected
                            ? 'bg-gradient-to-br from-accent-blue to-accent-violet text-white border-white ring-4 ring-accent-blue/20'
                            : 'bg-navy-900 text-text-secondary border-glass-border group-hover:border-accent-violet'
                        }`}
                      >
                        {index + 1}
                      </div>

                      {/* Event Label */}
                      <div className="mt-2 text-center max-w-[130px]">
                        <p
                          className={`text-xs font-semibold truncate ${
                            isSelected ? 'text-accent-cyan font-bold' : 'text-text-secondary group-hover:text-text-primary'
                          }`}
                        >
                          {event.title}
                        </p>
                        <span className="text-[10px] text-text-muted block">
                          {new Date(event.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Event Expanded Details Card */}
          {activeSelectedEvent && (
            <div className="mt-6 p-5 rounded-xl bg-navy-950/70 border border-glass-border/60 animate-fade-up">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4 pb-3 border-b border-glass-border/40">
                <div className="flex-1 min-w-0">
                  {/* Type badge + session notes badge */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className={`text-xs font-semibold uppercase px-2.5 py-0.5 rounded border ${
                        activeSelectedEvent.type === 'session'
                          ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/20'
                          : activeSelectedEvent.type === 'commit_cluster'
                          ? 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20'
                          : 'bg-accent-violet/10 text-accent-violet border-accent-violet/20'
                      }`}
                    >
                      {activeSelectedEvent.type === 'commit_cluster'
                        ? 'Commit'
                        : activeSelectedEvent.type.replace(/_/g, ' ')}
                    </span>
                    {activeSelectedEvent.notes &&
                      activeSelectedEvent.notes.split('\n')[0] !== activeSelectedEvent.title && (
                        <span
                          className="text-xs font-medium px-2.5 py-0.5 rounded bg-accent-violet/10 text-accent-violet border border-accent-violet/20 truncate max-w-[200px]"
                          title={activeSelectedEvent.notes}
                        >
                          📌 {activeSelectedEvent.notes.split('\n')[0]}
                        </span>
                      )}
                  </div>
                  <h3 className="text-base font-bold text-text-primary">{activeSelectedEvent.title}</h3>
                  <div className="flex items-center gap-3 text-xs mt-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-accent-violet/10 text-accent-violet border border-accent-violet/20 font-mono">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                      </svg>
                      {activeSelectedEvent.branch}
                    </span>
                    <span className="text-text-muted">
                      {new Date(activeSelectedEvent.startTime).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Delete button — only for session type */}
                {activeSelectedEvent.type === 'session' && (
                  <button
                    onClick={() => {
                      setSessionToDelete({
                        id: activeSelectedEvent.id,
                        title: activeSelectedEvent.title,
                      });
                    }}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 text-xs font-medium transition-all cursor-pointer"
                    title="Delete this session"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                    Delete
                  </button>
                )}
              </div>

              {/* Session notes (name) shown only if it exists and is more than one line / has extra content */}
              {activeSelectedEvent.notes && activeSelectedEvent.notes.includes('\n') && (
                <div className="mb-4 text-xs text-text-secondary bg-navy-900/60 p-3 rounded-lg border border-glass-border/40">
                  <span className="font-semibold text-text-primary block mb-1">Session Notes:</span>
                  <p className="whitespace-pre-line">{activeSelectedEvent.notes}</p>
                </div>
              )}

              {/* Grid of Commits & Files */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Commits */}
                <div className="bg-navy-900/40 p-3 rounded-lg border border-glass-border/40">
                  <div className="font-semibold text-accent-cyan uppercase tracking-wide mb-2 flex items-center justify-between">
                    <span>Commits ({activeSelectedEvent.commits?.length || 0})</span>
                  </div>
                  {activeSelectedEvent.commits && activeSelectedEvent.commits.length > 0 ? (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {activeSelectedEvent.commits.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 border-b border-glass-border/20 pb-1.5 last:border-0">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 shrink-0">
                            {c.hash}
                          </span>
                          <div className="min-w-0">
                            <p className="text-text-primary font-medium truncate">{c.message}</p>
                            <span className="text-[10px] text-text-muted">by {c.author}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-text-muted italic">No commits recorded in this window</p>
                  )}
                </div>

                {/* Files */}
                <div className="bg-navy-900/40 p-3 rounded-lg border border-glass-border/40">
                  <div className="font-semibold text-accent-emerald uppercase tracking-wide mb-2 flex items-center justify-between">
                    <span>Files ({activeSelectedEvent.files?.length || 0})</span>
                  </div>
                  {activeSelectedEvent.files && activeSelectedEvent.files.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {activeSelectedEvent.files.map((f, i) => (
                        <span key={i} className="font-mono text-[10px] px-2 py-0.5 rounded bg-navy-950 border border-glass-border/50 text-text-secondary flex items-center gap-1">
                          <span>{f.path}</span>
                          {f.status && <span className="text-accent-emerald font-bold uppercase">{f.status}</span>}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-text-muted italic">No files modified in this window</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* In-app Custom Delete Confirmation Dialog */}
      <DeleteConfirmModal
        isOpen={!!sessionToDelete}
        title={sessionToDelete?.title || 'this session'}
        onClose={() => setSessionToDelete(null)}
        onConfirm={() => {
          if (sessionToDelete) {
            deleteSession(sessionToDelete.id);
            setSessionToDelete(null);
          }
        }}
      />
    </div>
  );
}
