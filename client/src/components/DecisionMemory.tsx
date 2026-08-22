import { useState } from 'react';
import type { Decision, CreateDecisionInput } from '../lib/api';

interface DecisionMemoryProps {
  decisions: Decision[];
  loading: boolean;
  onCreateDecision: (input: CreateDecisionInput) => Promise<unknown>;
  onDeleteDecision: (id: string) => Promise<unknown>;
}

export function DecisionMemory({
  decisions,
  loading,
  onCreateDecision,
  onDeleteDecision,
}: DecisionMemoryProps) {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form State
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [decisionText, setDecisionText] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<CreateDecisionInput['status']>('accepted');
  const [tags, setTags] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !decisionText.trim() || !reason.trim()) return;

    try {
      setSubmitting(true);
      await onCreateDecision({
        title: title.trim(),
        context: context.trim() || undefined,
        decision: decisionText.trim(),
        reason: reason.trim(),
        status,
        tags: tags.trim() || undefined,
      });

      // Reset form
      setTitle('');
      setContext('');
      setDecisionText('');
      setReason('');
      setStatus('accepted');
      setTags('');
      setShowModal(false);
    } catch (err) {
      console.error('Failed to create decision:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDecisions = decisions.filter((d) => {
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.decision.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.tags && d.tags.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (st: Decision['status']) => {
    switch (st) {
      case 'accepted':
        return 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20';
      case 'proposed':
        return 'bg-accent-blue/10 text-accent-blue border-accent-blue/20';
      case 'superseded':
        return 'bg-accent-amber/10 text-accent-amber border-accent-amber/20';
      case 'deprecated':
        return 'bg-accent-rose/10 text-accent-rose border-accent-rose/20';
      default:
        return 'bg-navy-800 text-text-secondary border-glass-border/40';
    }
  };

  return (
    <div className="glass-card p-6 border border-glass-border/70 animate-fade-up relative overflow-hidden">
      {/* Top Gradient Accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-amber via-accent-violet to-accent-cyan" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-glass-border/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-amber to-accent-violet flex items-center justify-center text-white shadow-md shadow-accent-amber/20">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.516 0c.85.493 1.508 1.333 1.508 2.316V18" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-text-primary">Decision Memory</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent-amber/10 text-accent-amber border border-accent-amber/20">
                V8 Decisions
              </span>
            </div>
            <p className="text-xs text-text-muted">Architecture & engineering decision records (ADRs)</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-amber to-accent-violet text-white text-xs font-bold hover:shadow-lg hover:shadow-accent-amber/20 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Record Decision</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="w-3.5 h-3.5 absolute left-3.5 top-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decisions by title, reason, or tags..."
            className="w-full bg-navy-950/70 border border-glass-border/60 rounded-xl pl-9 pr-4 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-amber/50"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'accepted', 'proposed', 'superseded', 'deprecated'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-accent-amber/15 text-accent-amber border-accent-amber/40 font-semibold'
                  : 'bg-navy-950/50 text-text-secondary border-glass-border/40 hover:text-text-primary'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Decisions List */}
      {loading ? (
        <div className="py-8 flex items-center justify-center text-text-muted text-sm gap-2">
          <svg className="w-5 h-5 animate-spin text-accent-amber" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading architecture decisions...
        </div>
      ) : filteredDecisions.length === 0 ? (
        <div className="py-8 text-center text-text-muted text-xs bg-navy-950/40 rounded-xl border border-glass-border/30">
          {decisions.length === 0
            ? 'No architecture decisions recorded yet. Click "Record Decision" to document key project decisions!'
            : 'No decisions match your search/filter criteria.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDecisions.map((d) => (
            <div
              key={d.id}
              className="p-4 rounded-xl bg-navy-950/70 border border-glass-border/60 hover:border-accent-amber/40 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Top Row: Title & Status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-text-primary leading-snug">
                    {d.title}
                  </h3>
                  <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border shrink-0 ${getStatusBadge(d.status)}`}>
                    {d.status}
                  </span>
                </div>

                {/* Context if available */}
                {d.context && (
                  <p className="text-xs text-text-muted mb-2 line-clamp-2">
                    {d.context}
                  </p>
                )}

                {/* Decision Block */}
                <div className="mb-2 text-xs text-text-secondary bg-navy-900/60 p-2.5 rounded-lg border border-glass-border/40">
                  <span className="font-semibold text-accent-cyan block mb-0.5">Decision:</span>
                  <p>{d.decision}</p>
                </div>

                {/* Reason Callout */}
                <div className="mb-3 text-xs text-text-secondary bg-accent-amber/5 p-2.5 rounded-lg border border-accent-amber/20">
                  <span className="font-semibold text-accent-amber block mb-0.5">Reason / Rationale:</span>
                  <p>{d.reason}</p>
                </div>
              </div>

              {/* Bottom Row: Tags, Date, & Delete */}
              <div className="flex items-center justify-between pt-2 border-t border-glass-border/40 text-[10px] text-text-muted">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  {d.tags &&
                    d.tags.split(',').map((tag, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-navy-900 text-text-secondary border border-glass-border/50 truncate">
                        #{tag.trim()}
                      </span>
                    ))}
                  <span>{new Date(d.created_at).toLocaleDateString()}</span>
                </div>

                <button
                  onClick={() => onDeleteDecision(d.id)}
                  title="Delete decision"
                  className="text-text-muted hover:text-accent-rose transition-colors cursor-pointer p-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Decision Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 border border-glass-border shadow-2xl relative animate-fade-up">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-glass-border/40">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-amber" />
                Record Architecture Decision (ADR)
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-text-muted hover:text-text-primary text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-text-primary block mb-1">
                  Decision Title * (e.g. Why Redis? / Adopt TypeScript)
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Why Redis?"
                  className="w-full bg-navy-950/80 border border-glass-border/60 rounded-xl px-3.5 py-2 text-text-primary focus:outline-none focus:border-accent-amber/50"
                />
              </div>

              <div>
                <label className="font-semibold text-text-primary block mb-1">
                  Context & Problem (Optional)
                </label>
                <textarea
                  rows={2}
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="What problem were we trying to solve or what context led to this decision?"
                  className="w-full bg-navy-950/80 border border-glass-border/60 rounded-xl px-3.5 py-2 text-text-primary focus:outline-none focus:border-accent-amber/50 resize-none"
                />
              </div>

              <div>
                <label className="font-semibold text-text-primary block mb-1">
                  Decision * (What did we choose to do?)
                </label>
                <input
                  type="text"
                  required
                  value={decisionText}
                  onChange={(e) => setDecisionText(e.target.value)}
                  placeholder="e.g. Use Redis for in-memory caching and session store."
                  className="w-full bg-navy-950/80 border border-glass-border/60 rounded-xl px-3.5 py-2 text-text-primary focus:outline-none focus:border-accent-amber/50"
                />
              </div>

              <div>
                <label className="font-semibold text-text-primary block mb-1">
                  Reason / Rationale * (Why this choice?)
                </label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Reduce API response times from 350ms to under 20ms."
                  className="w-full bg-navy-950/80 border border-glass-border/60 rounded-xl px-3.5 py-2 text-text-primary focus:outline-none focus:border-accent-amber/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-text-primary block mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CreateDecisionInput['status'])}
                    className="w-full bg-navy-950/80 border border-glass-border/60 rounded-xl px-3.5 py-2 text-text-primary focus:outline-none focus:border-accent-amber/50"
                  >
                    <option value="accepted">Accepted</option>
                    <option value="proposed">Proposed</option>
                    <option value="superseded">Superseded</option>
                    <option value="deprecated">Deprecated</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-text-primary block mb-1">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="database, caching, architecture"
                    className="w-full bg-navy-950/80 border border-glass-border/60 rounded-xl px-3.5 py-2 text-text-primary focus:outline-none focus:border-accent-amber/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-glass-border/40">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-navy-900 border border-glass-border/60 text-text-secondary hover:text-text-primary font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim() || !decisionText.trim() || !reason.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-accent-amber to-accent-violet text-white font-bold text-xs hover:shadow-lg hover:shadow-accent-amber/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Recording...' : 'Save Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
