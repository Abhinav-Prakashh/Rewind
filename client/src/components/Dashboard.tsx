import type { Repository } from '../lib/api';
import { useSessions, useGitInfo, useActivities, useResumeContext, useTimeline } from '../hooks/useApi';
import { ResumeEngine } from './ResumeEngine';
import { ProjectTimeline } from './ProjectTimeline';
import { AIMemoryChat } from './AIMemoryChat';
import { SessionPanel } from './SessionPanel';
import { GitInfo } from './GitInfo';
import { ActivityTimeline } from './ActivityTimeline';

interface DashboardProps {
  repo: Repository;
  onDisconnect: () => void;
}

export function Dashboard({ repo, onDisconnect }: DashboardProps) {
  const { sessions, activeSession, startSession, endSession, updateNotes } = useSessions(repo.id);
  const { status, commits, loading: gitLoading, refresh: refreshGit } = useGitInfo(repo.id);
  const { activities, loading: activitiesLoading } = useActivities(repo.id);
  const { context: resumeContext, loading: loadingResumeContext, refresh: refreshResume } = useResumeContext(repo.id);
  const { timeline, loading: timelineLoading, refresh: refreshTimeline } = useTimeline(repo.id);

  const handleResume = async () => {
    await startSession();
    refreshGit();
    refreshResume();
    refreshTimeline();
  };

  const handleEndSession = async () => {
    await endSession();
    refreshGit();
    refreshResume();
    refreshTimeline();
  };

  return (
    <div className="min-h-screen relative z-10">
      {/* Header */}
      <header className="border-b border-glass-border/50 bg-navy-950/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-violet flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
            </div>
            <span className="font-semibold text-text-primary text-sm">Developer Memory</span>
          </div>

          <button
            onClick={onDisconnect}
            className="text-xs text-text-muted hover:text-accent-rose transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            Disconnect
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* V3 Resume Work Engine */}
        <div>
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

        {/* V5 AI Memory Layer */}
        <div>
          <AIMemoryChat repoId={repo.id} repoName={repo.name} />
        </div>

        {/* V4 Visual Project Timeline */}
        <div>
          <ProjectTimeline timeline={timeline} loading={timelineLoading} />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column — Activity Stream & Git Info */}
          <div className="lg:col-span-3 space-y-6">
            <ActivityTimeline activities={activities} loading={activitiesLoading} />
            <GitInfo status={status} commits={commits} loading={gitLoading} />
          </div>

          {/* Right Column — Sessions */}
          <div className="lg:col-span-2">
            <SessionPanel
              activeSession={activeSession}
              sessions={sessions}
              onUpdateNotes={updateNotes}
            />
          </div>
        </div>
      </main>
    </div>
  );
}


