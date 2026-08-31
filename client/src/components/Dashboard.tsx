import { useState } from 'react';
import type { Repository } from '../lib/api';
import {
  useSessions,
  useGitInfo,
  useActivities,
  useResumeContext,
  useTimeline,
  useDecisions,
} from '../hooks/useApi';
import { ResumeEngine } from './ResumeEngine';
import { DecisionMemory } from './DecisionMemory';
import { AIMemoryChat } from './AIMemoryChat';
import { ProjectTimeline } from './ProjectTimeline';
import { SessionPanel } from './SessionPanel';
import { SessionModal } from './SessionModal';
import { GitInfo } from './GitInfo';
import { ActivityTimeline } from './ActivityTimeline';

interface DashboardProps {
  repo: Repository;
  onDisconnect: () => void;
}

type TabType = 'overview' | 'timeline' | 'ai-memory' | 'decisions' | 'activity' | 'git';

export function Dashboard({ repo, onDisconnect }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isSessionModalOpen, setSessionModalOpen] = useState(false);

  const { sessions, activeSession, startSession, endSession, updateNotes, deleteSession } = useSessions(repo.id);
  const { status, commits, loading: gitLoading, refresh: refreshGit } = useGitInfo(repo.id);
  const { activities, loading: activitiesLoading } = useActivities(repo.id);
  const { context: resumeContext, loading: loadingResumeContext, refresh: refreshResume } = useResumeContext(repo.id);
  const { timeline, loading: timelineLoading, refresh: refreshTimeline } = useTimeline(repo.id);
  const {
    decisions,
    loading: decisionsLoading,
    createDecision,
    deleteDecision,
  } = useDecisions(repo.id);

  const handleResume = () => {
    setSessionModalOpen(true);
  };

  const handleStartSession = async (name?: string) => {
    await startSession(name);
    refreshGit();
    refreshResume();
    refreshTimeline();
    setSessionModalOpen(false);
  };

  const handleEndSession = async () => {
    await endSession();
    refreshGit();
    refreshResume();
    refreshTimeline();
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
    refreshTimeline();
  };

  const completedSessions = sessions.filter((s) => s.status === 'completed');

  return (
    <div className="h-screen w-full bg-app-bg flex flex-col md:flex-row overflow-hidden relative">
      {/* Left Charcoal Sidebar - Solid fixed full-height with zero scroll whitespace */}
      <aside className="w-full md:w-[84px] md:fixed md:inset-y-0 md:left-0 h-16 md:h-screen bg-ink text-white p-3 md:py-6 flex md:flex-col items-center justify-between shrink-0 z-30 select-none">
        {/* Top Logo */}
        <div className="flex md:flex-col items-center gap-6">
          <div className="w-11 h-11 rounded-[14px] bg-white/10 flex items-center justify-center text-accent hover:bg-white/15 transition-colors cursor-pointer" title="Recall">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </div>

          {/* Nav Icon Buttons */}
          <nav className="flex md:flex-col items-center gap-1.5">
            {[
              { id: 'overview' as TabType, label: 'Overview', icon: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z' },
              { id: 'timeline' as TabType, label: 'Timeline', icon: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
              { id: 'ai-memory' as TabType, label: 'AI Memory', icon: 'M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z' },
              { id: 'decisions' as TabType, label: 'Decisions', icon: 'M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.516 0c.85.493 1.508 1.333 1.508 2.316V18' },
              { id: 'activity' as TabType, label: 'Live Stream', icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' },
              { id: 'git' as TabType, label: 'Git History', icon: 'M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className={`w-11 h-11 rounded-[14px] flex items-center justify-center transition-all cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-white/20 text-accent'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom Avatar & Disconnect */}
        <div className="flex md:flex-col items-center gap-3">
          <button
            onClick={onDisconnect}
            title="Disconnect repository"
            className="w-10 h-10 rounded-[12px] bg-white/5 hover:bg-danger/20 hover:text-danger text-white/50 flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
          </button>
          <div className="w-9 h-9 rounded-full bg-accent text-accent-ink font-bold text-xs flex items-center justify-center">
            {repo.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </aside>

      {/* Main Canvas - scroll container */}
      <div className="flex-1 flex flex-col min-w-0 h-full md:pl-[84px] overflow-y-auto">
        {/* Inner wrapper: min-h-full makes flex-1 children fill the scroll viewport */}
        <div className="min-h-full flex flex-col p-4 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 mb-3.5 shrink-0">
            {/* Header Title & Status */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted font-mono">
                  {repo.name}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface text-ink-soft border border-border font-mono">
                  {repo.branch || status?.branch || 'main'}
                </span>
                {activeSession && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 font-medium font-mono">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                    </span>
                    Session Active
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink leading-[1.05]">
                Pick Up Where<br className="hidden sm:inline" /> You Left Off
              </h1>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2.5">
              {activeSession ? (
                <button
                  onClick={handleEndSession}
                  className="px-4 py-2 rounded-[14px] bg-danger/15 text-ink hover:bg-danger/25 border border-danger/30 font-medium text-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-danger animate-ping" />
                  End Session
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  className="px-4 py-2 rounded-[14px] bg-ink text-white font-medium text-xs hover:bg-ink-soft transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span className="text-accent">+</span>
                  <span>Capture Session</span>
                </button>
              )}
            </div>
          </header>

          {/* Context Segmented Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar mb-3.5 p-1 bg-surface rounded-full border border-border w-fit max-w-full shrink-0">
            {[
              { id: 'overview' as TabType, label: 'Overview' },
              { id: 'timeline' as TabType, label: 'Timeline' },
              { id: 'ai-memory' as TabType, label: 'AI Memory' },
              { id: 'decisions' as TabType, label: 'Decisions' },
              { id: 'activity' as TabType, label: 'Live Stream' },
              { id: 'git' as TabType, label: 'Git History' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-ink text-white shadow-xs'
                    : 'text-muted hover:text-ink hover:bg-surface-raised'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area — flex-1 stretches to fill remaining min-h-full space */}
          <div className="flex-1 flex flex-col space-y-3.5">
            {activeTab === 'overview' && (
              <>
                {/* 3 Asymmetric Modular Cards */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  
                  {/* Card 1: Current Project */}
                  <div className="md:col-span-4 recall-card-neutral p-4 rounded-[20px] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted font-mono">
                          Current Project
                        </span>
                        <span className="text-xs font-mono text-muted">
                          {repo.branch || status?.branch || 'main'}
                        </span>
                      </div>
                      <h3 className="text-xl font-medium text-ink mb-0.5 truncate">{repo.name}</h3>
                      <p className="text-[11px] text-muted font-mono truncate mb-3">{repo.path}</p>
                    </div>

                    <div className="pt-2.5 border-t border-border flex items-center justify-between text-[11px] text-muted font-mono">
                      <span>{sessions.length} sessions</span>
                      <span>{decisions.length} decisions</span>
                      <span>{timeline.length} milestones</span>
                    </div>
                  </div>

                  {/* Card 2: Memories Captured (Acid-Lime Accent - Clean Metrics) */}
                  <div className="md:col-span-4 recall-card-accent p-4 rounded-[20px] flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-accent-ink font-mono">
                          Memories
                        </span>
                        <span className="text-[10px] font-semibold text-accent-ink bg-black/10 px-2 py-0.5 rounded-full font-mono">
                          Active Index
                        </span>
                      </div>
                      <div className="text-3xl sm:text-4xl font-medium tracking-tight text-accent-ink mb-0.5">
                        {activities.length + decisions.length + sessions.length}
                      </div>
                      <p className="text-[11px] text-accent-ink/80 truncate">
                        Context events indexed for workspace
                      </p>
                    </div>

                    {/* Clean Activity Metric Badges */}
                    <div className="pt-2.5 mt-2 border-t border-black/10 flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-accent-ink font-medium">
                      <span className="bg-black/10 px-2 py-0.5 rounded-full">{activities.length} events</span>
                      <span className="bg-black/10 px-2 py-0.5 rounded-full">{sessions.length} sessions</span>
                      <span className="bg-black/10 px-2 py-0.5 rounded-full">{decisions.length} ADRs</span>
                    </div>
                  </div>

                  {/* Card 3: Resume Work (Charcoal Dark Card) */}
                  <div className="md:col-span-4 recall-card-dark p-4 rounded-[20px] flex flex-col justify-between shadow-sm">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-accent font-mono">
                          Resume Work
                        </span>
                        {resumeContext?.lastWorked?.relativeText && (
                          <span className="text-[11px] text-white/50 font-mono">
                            {resumeContext.lastWorked.relativeText}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-medium text-white mb-1 leading-snug">
                        Continue exactly where you stopped.
                      </h4>
                      <p className="text-[11px] text-white/70 line-clamp-1 mb-2">
                        {resumeContext?.workingOn || 'Pick up recent tasks and code modifications.'}
                      </p>
                    </div>

                    <div>
                      {activeSession ? (
                        <button
                          onClick={handleEndSession}
                          className="w-full py-2 px-3 rounded-[12px] bg-danger text-white text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                        >
                          End Active Session
                        </button>
                      ) : (
                        <button
                          onClick={handleResume}
                          className="w-full py-2 px-3 rounded-[12px] bg-white text-ink text-xs font-medium hover:bg-accent transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>Resume Work</span>
                          <span>→</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resume Engine Core View */}
                <div className="flex-1 min-h-0">
                  <ResumeEngine
                    repoName={repo.name}
                    branch={repo.branch || status?.branch || 'main'}
                    activeSession={activeSession}
                    resumeContext={resumeContext}
                    loadingContext={loadingResumeContext}
                    onResume={handleResume}
                    onEndSession={handleEndSession}
                  />
                </div>
              </>
            )}

            {activeTab === 'timeline' && (
              <div className="flex-1 min-h-0">
                <ProjectTimeline timeline={timeline} loading={timelineLoading} deleteSession={handleDeleteSession} />
              </div>
            )}

            {activeTab === 'ai-memory' && (
              <AIMemoryChat repoId={repo.id} repoName={repo.name} />
            )}

            {activeTab === 'decisions' && (
              <div className="flex-1 min-h-0">
                <DecisionMemory
                  decisions={decisions}
                  loading={decisionsLoading}
                  onCreateDecision={createDecision}
                  onDeleteDecision={deleteDecision}
                />
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8">
                  <ActivityTimeline activities={activities} loading={activitiesLoading} />
                </div>
                <div className="lg:col-span-4">
                  <SessionPanel
                    activeSession={activeSession}
                    sessions={sessions}
                    onUpdateNotes={updateNotes}
                  />
                </div>
              </div>
            )}

            {activeTab === 'git' && (
              <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-7">
                  <GitInfo status={status} commits={commits} loading={gitLoading} />
                </div>
                <div className="lg:col-span-5">
                  <ActivityTimeline activities={activities} loading={activitiesLoading} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <SessionModal
        isOpen={isSessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        onConfirm={handleStartSession}
        lastSession={completedSessions[0] || null}
      />
    </div>
  );
}



