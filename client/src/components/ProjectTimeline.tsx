import { useState } from 'react';
import type { TimelineEvent } from '../lib/api';

interface ProjectTimelineProps {
  timeline: TimelineEvent[];
  loading: boolean;
  deleteSession: (id: string) => void;
}

export function ProjectTimeline({ timeline, loading, deleteSession }: ProjectTimelineProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="recall-card animate-fade-up">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded bg-surface animate-pulse" />
          <h2 className="text-lg font-medium text-ink">Project Timeline</h2>
        </div>
        <div className="py-8 flex items-center justify-center text-muted text-sm gap-2">
          <svg className="w-4 h-4 animate-spin text-ink" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading visual project history...
        </div>
      </div>
    );
  }

  const activeSelectedEvent = timeline.find((e) => e.id === selectedEventId) || timeline[timeline.length - 1] || null;

  return (
    <div className="recall-card animate-fade-up h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-surface flex items-center justify-center text-ink border border-border">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-medium text-ink">Project Timeline</h2>
            <p className="text-xs text-muted">Chronological milestones & development windows</p>
          </div>
        </div>
        <span className="text-xs font-mono font-medium px-3 py-1 rounded-full bg-surface text-ink-soft border border-border">
          {timeline.length} Milestones
        </span>
      </div>

      {/* Horizontal Stepper Timeline Visualizer */}
      {timeline.length === 0 ? (
        <div className="py-8 text-center text-muted text-sm">
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
                      <div className="absolute top-5 left-10 w-full h-[2px] bg-border z-0" />
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
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-xs border transition-all ${
                          isSelected
                            ? 'bg-ink text-white border-ink ring-4 ring-accent/40 shadow-sm'
                            : 'bg-surface text-ink-soft border-border group-hover:border-ink/40'
                        }`}
                      >
                        {index + 1}
                      </div>

                      {/* Event Label */}
                      <div className="mt-2 text-center max-w-[130px]">
                        <p
                          className={`text-xs font-medium truncate ${
                            isSelected ? 'text-ink font-semibold' : 'text-muted group-hover:text-ink'
                          }`}
                        >
                          {event.title}
                        </p>
                        <span className="text-[10px] text-muted-light font-mono block">
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
            <div className="mt-6 p-5 rounded-[22px] bg-surface border border-border animate-fade-up">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4 pb-3 border-b border-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase font-semibold px-2.5 py-0.5 rounded-full bg-surface-raised text-ink border border-border">
                      {activeSelectedEvent.type === 'commit_cluster'
                        ? 'Commit Window'
                        : activeSelectedEvent.type.replace(/_/g, ' ')}
                    </span>
                    {activeSelectedEvent.notes &&
                      activeSelectedEvent.notes.split('\n')[0] !== activeSelectedEvent.title && (
                        <span
                          className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-surface-raised text-muted border border-border truncate max-w-[240px]"
                          title={activeSelectedEvent.notes}
                        >
                          📌 {activeSelectedEvent.notes.split('\n')[0]}
                        </span>
                      )}
                  </div>
                  <h3 className="text-base font-medium text-ink">{activeSelectedEvent.title}</h3>
                  <div className="flex items-center gap-3 text-xs mt-2 font-mono text-muted">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-raised text-ink-soft border border-border">
                      <svg className="w-3 h-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                      </svg>
                      {activeSelectedEvent.branch}
                    </span>
                    <span>
                      {new Date(activeSelectedEvent.startTime).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Delete button for session */}
                {activeSelectedEvent.type === 'session' && (
                  <button
                    onClick={() => setDeletingSessionId(activeSelectedEvent.id)}
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-[12px] bg-surface-raised hover:bg-danger/15 text-danger border border-border text-xs font-medium transition-all cursor-pointer"
                    title="Delete this session"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                    <span>Delete</span>
                  </button>
                )}
              </div>

              {/* Extra Session notes if present */}
              {activeSelectedEvent.notes && activeSelectedEvent.notes.includes('\n') && (
                <div className="mb-4 text-xs text-ink-soft bg-surface-raised p-3 rounded-[14px] border border-border">
                  <span className="font-semibold text-ink block mb-1">Session Notes:</span>
                  <p className="whitespace-pre-line">{activeSelectedEvent.notes}</p>
                </div>
              )}

              {/* Grid of Commits & Files */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Commits */}
                <div className="bg-surface-raised p-3.5 rounded-[16px] border border-border">
                  <div className="font-semibold text-ink uppercase tracking-wider text-[11px] font-mono mb-2 flex items-center justify-between">
                    <span>Commits ({activeSelectedEvent.commits?.length || 0})</span>
                  </div>
                  {activeSelectedEvent.commits && activeSelectedEvent.commits.length > 0 ? (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {activeSelectedEvent.commits.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 border-b border-border pb-1.5 last:border-0">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface text-ink border border-border shrink-0">
                            {c.hash}
                          </span>
                          <div className="min-w-0">
                            <p className="text-ink font-medium truncate">{c.message}</p>
                            <span className="text-[10px] text-muted">by {c.author}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted italic">No commits recorded in this window</p>
                  )}
                </div>

                {/* Files */}
                <div className="bg-surface-raised p-3.5 rounded-[16px] border border-border">
                  <div className="font-semibold text-ink uppercase tracking-wider text-[11px] font-mono mb-2 flex items-center justify-between">
                    <span>Files ({activeSelectedEvent.files?.length || 0})</span>
                  </div>
                  {activeSelectedEvent.files && activeSelectedEvent.files.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {activeSelectedEvent.files.map((f, i) => (
                        <span key={i} className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-surface border border-border text-ink-soft flex items-center gap-1">
                          <span>{f.path}</span>
                          {f.status && <span className="text-[9px] font-bold uppercase text-muted">{f.status}</span>}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted italic">No files modified in this window</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* In-app Delete Confirmation Modal */}
      {deletingSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-app-bg border border-border rounded-[24px] p-6 shadow-xl animate-fade-up">
            <h3 className="text-base font-medium text-ink mb-2">Delete Session</h3>
            <p className="text-xs text-muted mb-6">
              Are you sure you want to delete this session from the project timeline? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingSessionId(null)}
                className="px-4 py-2 rounded-[14px] bg-surface text-ink text-xs font-medium hover:bg-surface-raised border border-border transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteSession(deletingSessionId);
                  setDeletingSessionId(null);
                }}
                className="px-4 py-2 rounded-[14px] bg-danger text-white text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
