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
    // Fetch suggestions from backend
    aiApi.getSuggestions(repoId).then((res) => {
      if (res?.suggestions && res.suggestions.length > 0) {
        setSuggestions(res.suggestions);
      }
    }).catch(() => {});
  }, [repoId]);

  // Scroll chat container (not the page) when messages change
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

  const getSourceBadgeStyle = (type: MemorySource['type']) => {
    switch (type) {
      case 'commit':
        return 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20';
      case 'session':
        return 'bg-accent-violet/10 text-accent-violet border-accent-violet/20';
      case 'file':
        return 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20';
      default:
        return 'bg-navy-800 text-text-secondary border-glass-border/40';
    }
  };

  return (
    <div className="glass-card p-6 border border-glass-border/70 animate-fade-up relative overflow-hidden flex flex-col">
      {/* Top Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-cyan via-accent-blue to-accent-violet" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-glass-border/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-blue flex items-center justify-center text-white shadow-md shadow-accent-cyan/20">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-text-primary">AI Memory Layer</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                V5 Memory
              </span>
            </div>
            <p className="text-xs text-text-muted">Ask questions about past work, decisions, commits, and files</p>
          </div>
        </div>
      </div>

      {/* Suggested Quick Questions */}
      {messages.length === 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
            Suggested Memory Queries
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(suggestion)}
                className="text-left text-xs p-2.5 rounded-xl bg-navy-950/70 border border-glass-border/60 text-text-secondary hover:text-text-primary hover:border-accent-cyan/40 hover:bg-navy-900 transition-all cursor-pointer flex items-center justify-between group"
              >
                <span>{suggestion}</span>
                <svg className="w-3.5 h-3.5 text-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div ref={scrollContainerRef} className="space-y-4 max-h-80 overflow-y-auto mb-4 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            } animate-fade-up`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-accent-blue to-accent-violet text-white rounded-br-none shadow-md shadow-accent-blue/15'
                  : 'bg-navy-950/80 border border-glass-border/70 text-text-primary rounded-bl-none shadow-md'
              }`}
            >
              <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>

              {/* Source Citations */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-glass-border/40">
                  <span className="text-[10px] font-semibold text-text-muted uppercase block mb-1.5">
                    Referenced Sources ({msg.sources.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((src, i) => (
                      <span
                        key={i}
                        className={`text-[10px] px-2 py-0.5 rounded-md border font-mono flex items-center gap-1 ${getSourceBadgeStyle(
                          src.type
                        )}`}
                      >
                        <span>{src.label}</span>
                        {src.detail && <span className="opacity-75">· {src.detail}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span className="text-[9px] text-text-muted mt-1 px-1">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-text-muted bg-navy-950/60 p-3 rounded-xl w-fit border border-glass-border/40 animate-pulse">
            <svg className="w-4 h-4 animate-spin text-accent-cyan" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Consulting project memory for {repoName}...
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
        className="flex items-center gap-2 mt-auto pt-2 border-t border-glass-border/30"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask a question about your project history..."
          disabled={loading}
          className="flex-1 bg-navy-950/80 border border-glass-border/60 rounded-xl px-4 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/50 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue text-white text-xs font-bold hover:shadow-lg hover:shadow-accent-cyan/25 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
        >
          <span>Ask</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </form>
    </div>
  );
}
