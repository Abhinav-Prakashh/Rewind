import { useState, useEffect, useRef } from 'react';
import { aiApi, type MemorySource } from '../lib/api';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  sources?: MemorySource[];
  timestamp: Date;
}

interface AIMemoryChatProps {
  repoId: string;
  repoName: string;
}

export function AIMemoryChat({ repoId, repoName }: AIMemoryChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    'What was I working on recently?',
    'What changed while I was away?',
    'Which files are related to timeline or sessions?',
    'Why was the latest feature added?',
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    aiApi.getSuggestions(repoId).then((res) => {
      if (res?.suggestions && res.suggestions.length > 0) {
        setSuggestions(res.suggestions);
      }
    }).catch(() => {});
  }, [repoId]);

  // Scroll chat container (not window) when messages arrive
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (queryText: string) => {
    const query = queryText.trim();
    if (!query || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      const response = await aiApi.query(repoId, query);
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.answer,
        sources: response.sources,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'Sorry, I encountered an error while searching project memory. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recall-card flex-1 flex flex-col min-h-0 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-surface flex items-center justify-center text-ink border border-border shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-ink">AI Memory Assistant</h2>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-surface text-ink-soft border border-border">
                Semantic Recall
              </span>
            </div>
            <p className="text-[11px] text-muted">Ask anything about past decisions, sessions, modified files, and code intent</p>
          </div>
        </div>
      </div>

      {/* Suggested Quick Question Chips */}
      {messages.length === 0 && (
        <div className="mb-4 shrink-0">
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wider font-mono mb-2 flex items-center gap-1.5">
            <span>✨</span>
            <span>Suggested Inquiries</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(suggestion)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface border border-border text-xs text-ink-soft hover:text-ink hover:bg-surface-raised hover:border-ink/20 hover:shadow-xs transition-all cursor-pointer group"
              >
                <span>{suggestion}</span>
                <span className="text-[10px] text-muted group-hover:text-ink transition-colors font-mono">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Scroll Area - Dynamically fills remaining space */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1.5 mb-3">
        {messages.length === 0 && (
          <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-6 text-muted select-none">
            <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-ink mb-2.5 shadow-xs">
              <svg className="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-ink mb-1">Search memory index for {repoName}</p>
            <p className="text-[11px] text-muted max-w-sm">Query indexed commit histories, developer scratchpads, and architectural records.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            } animate-fade-up`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-[18px] p-3 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-ink text-white rounded-br-[4px] shadow-xs'
                  : 'bg-surface border border-border text-ink rounded-bl-[4px]'
              }`}
            >
              <div className="whitespace-pre-line text-xs leading-relaxed">{msg.text}</div>

              {/* Source Citations */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-border">
                  <span className="text-[10px] font-mono uppercase font-semibold text-muted block mb-1">
                    Referenced Context ({msg.sources.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((src, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-raised text-ink border border-border flex items-center gap-1"
                      >
                        <span className="font-semibold uppercase">{src.type}</span>
                        <span>· {src.label}</span>
                        {src.detail && <span className="text-muted truncate max-w-[140px]">({src.detail})</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span className="text-[10px] font-mono text-muted-light mt-0.5 px-1">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted bg-surface p-3 rounded-[14px] w-fit border border-border animate-pulse">
            <svg className="w-4 h-4 animate-spin text-ink" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Searching memory index for {repoName}...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputQuery);
        }}
        className="flex items-center gap-2 pt-2.5 border-t border-border shrink-0"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask anything about this repo's context, architecture, or recent changes..."
          disabled={loading}
          className="flex-1 bg-surface border border-border rounded-[14px] px-3.5 py-2.5 text-xs text-ink placeholder:text-muted-light focus:outline-none focus:border-ink/40 focus:ring-3 focus:ring-accent/40 transition-all disabled:opacity-50 font-mono"
        />
        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="px-4 py-2.5 rounded-[14px] bg-ink text-white text-xs font-medium hover:bg-ink-soft transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <span>Ask</span>
          <span className="text-accent">→</span>
        </button>
      </form>
    </div>
  );
}
