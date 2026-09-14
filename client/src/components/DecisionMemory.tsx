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
        return 'bg-success/20 text-ink border-success/30';
      case 'proposed':
        return 'bg-info/20 text-ink border-info/30';
      case 'superseded':
        return 'bg-warning/20 text-ink border-warning/30';
      case 'deprecated':
        return 'bg-danger/20 text-ink border-danger/30';
      default:
        return 'bg-surface text-muted border-border';
    }
  };

  return (
    <div className="recall-card animate-fade-up h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-surface flex items-center justify-center text-ink border border-border">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.516 0c.85.493 1.508 1.333 1.508 2.316V18" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium text-ink">Decision Memory</h2>
            </div>
            <p className="text-xs text-muted">Track key engineering decisions & rationale</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-[16px] bg-ink text-white text-xs font-medium hover:bg-ink-soft transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
        >
          <span className="text-accent">+</span>
          <span>Record Decision</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="w-3.5 h-3.5 absolute left-3.5 top-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decisions by title, reason, or tags..."
            className="w-full bg-surface border border-border rounded-[16px] pl-9 pr-4 py-2 text-xs text-ink placeholder:text-muted-light focus:outline-none focus:border-ink/40 focus:ring-3 focus:ring-accent/40"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {['all', 'accepted', 'proposed', 'superseded', 'deprecated'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-ink text-white border-ink font-medium shadow-xs'
                  : 'bg-surface text-muted border-border hover:text-ink hover:bg-surface-raised'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Decisions List */}
      {loading ? (
        <div className="py-8 flex items-center justify-center text-muted text-sm gap-2">
          <svg className="w-4 h-4 animate-spin text-ink" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading decisions...
        </div>
      ) : filteredDecisions.length === 0 ? (
        <div className="py-8 text-center text-muted text-xs bg-surface rounded-[20px] border border-border">
          {decisions.length === 0
            ? 'No decisions recorded yet. Click "Record Decision" to document key project decisions!'
            : 'No decisions match your search/filter criteria.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDecisions.map((d) => (
            <div
              key={d.id}
              className="p-5 rounded-[22px] bg-surface border border-border hover:border-ink/25 hover:-translate-y-0.5 transition-all flex flex-col justify-between shadow-xs"
            >
              <div>
                {/* Top Row: Title & Status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-medium text-ink leading-snug">
                    {d.title}
                  </h3>
                  <span className={`text-[10px] font-mono uppercase font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${getStatusBadge(d.status)}`}>
                    {d.status}
                  </span>
                </div>

                {/* Context if available */}
                {d.context && (
                  <p className="text-xs text-muted mb-2.5 line-clamp-2">
                    {d.context}
                  </p>
                )}

                {/* Decision Block */}
                <div className="mb-2 text-xs text-ink-soft bg-surface-raised p-3 rounded-[14px] border border-border">
                  <span className="font-semibold text-ink block mb-0.5 font-mono text-[11px]">Decision:</span>
                  <p>{d.decision}</p>
                </div>

                {/* Reason Callout */}
                <div className="mb-3 text-xs text-ink-soft bg-surface-raised p-3 rounded-[14px] border border-border">
                  <span className="font-semibold text-muted block mb-0.5 font-mono text-[11px]">Reason / Rationale:</span>
                  <p>{d.reason}</p>
                </div>
              </div>

              {/* Bottom Row: Tags, Date, & Delete */}
              <div className="flex items-center justify-between pt-3 border-t border-border text-[10px] text-muted font-mono">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  {d.tags &&
                    d.tags.split(',').map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-surface-raised text-ink-soft border border-border truncate">
                        #{tag.trim()}
                      </span>
                    ))}
                  <span>{new Date(d.created_at).toLocaleDateString()}</span>
                </div>

                <button
                  onClick={() => onDeleteDecision(d.id)}
                  title="Delete decision"
                  className="text-muted hover:text-danger transition-colors cursor-pointer p-1"
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
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-app-bg max-w-lg w-full p-6 sm:p-8 rounded-[28px] border border-border shadow-xl relative animate-fade-up">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <h3 className="text-base font-medium text-ink flex items-center gap-2">
                Record Decision
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-surface text-muted hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-ink block mb-1 font-mono text-[11px]">
                  Decision Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Use PostgreSQL + pgvector for vector search"
                  className="w-full bg-surface border border-border rounded-[14px] px-3.5 py-2.5 text-ink focus:outline-none focus:border-ink/40 focus:ring-3 focus:ring-accent/40"
                />
              </div>

              <div>
                <label className="font-medium text-ink block mb-1 font-mono text-[11px]">
                  Context & Problem (Optional)
                </label>
                <textarea
                  rows={2}
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="What problem or requirements led to this decision?"
                  className="w-full bg-surface border border-border rounded-[14px] px-3.5 py-2 text-ink focus:outline-none focus:border-ink/40 focus:ring-3 focus:ring-accent/40 resize-none"
                />
              </div>

              <div>
                <label className="font-medium text-ink block mb-1 font-mono text-[11px]">
                  Decision *
                </label>
                <input
                  type="text"
                  required
                  value={decisionText}
                  onChange={(e) => setDecisionText(e.target.value)}
                  placeholder="e.g. Maintain vector embeddings in Postgres alongside metadata"
                  className="w-full bg-surface border border-border rounded-[14px] px-3.5 py-2.5 text-ink focus:outline-none focus:border-ink/40 focus:ring-3 focus:ring-accent/40"
                />
              </div>

              <div>
                <label className="font-medium text-ink block mb-1 font-mono text-[11px]">
                  Reason / Rationale *
                </label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Avoid separate operational overhead of dedicated vector DB"
                  className="w-full bg-surface border border-border rounded-[14px] px-3.5 py-2 text-ink focus:outline-none focus:border-ink/40 focus:ring-3 focus:ring-accent/40 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-ink block mb-1 font-mono text-[11px]">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CreateDecisionInput['status'])}
                    className="w-full bg-surface border border-border rounded-[14px] px-3.5 py-2 text-ink focus:outline-none focus:border-ink/40 focus:ring-3 focus:ring-accent/40"
                  >
                    <option value="accepted">Accepted</option>
                    <option value="proposed">Proposed</option>
                    <option value="superseded">Superseded</option>
                    <option value="deprecated">Deprecated</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-ink block mb-1 font-mono text-[11px]">Tags</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="database, pgvector, schema"
                    className="w-full bg-surface border border-border rounded-[14px] px-3.5 py-2 text-ink focus:outline-none focus:border-ink/40 focus:ring-3 focus:ring-accent/40"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-[14px] bg-surface border border-border text-muted hover:text-ink font-medium text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim() || !decisionText.trim() || !reason.trim()}
                  className="px-5 py-2 rounded-[14px] bg-ink text-white font-medium text-xs hover:bg-ink-soft transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submitting ? 'Saving...' : 'Save Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
