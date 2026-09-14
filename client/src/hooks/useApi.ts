import { useState, useEffect, useCallback } from 'react';
import {
  repoApi,
  sessionApi,
  gitApi,
  activityApi,
} from '../lib/api';
import type {
  Repository,
  Session,
  CommitInfo,
  GitStatus,
  Activity,
} from '../lib/api';
import { supabase } from '../lib/supabase';

// ─── Repository Hook ─────────────────────────────────────────

/** Returns the localStorage key scoped to a specific Supabase user. */
function activeRepoKey(userId: string): string {
  return `rewind:activeRepoId:${userId}`;
}

export function useRepo() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [activeRepo, setActiveRepo] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Resolve the current user once on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
    });
  }, []);

  const fetchRepos = useCallback(async (uid: string) => {
    try {
      setLoading(true);
      const data = await repoApi.list();
      setRepos(data);

      // Restore last active repo from localStorage — scoped to this user
      const savedId = localStorage.getItem(activeRepoKey(uid));
      if (savedId) {
        const saved = data.find((r) => r.id === savedId);
        if (saved) {
          try {
            const full = await repoApi.get(saved.id);
            setActiveRepo(full);
          } catch {
            setActiveRepo(saved);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repos');
    } finally {
      setLoading(false);
    }
  }, []);

  const connectRepo = useCallback(async (path: string | import('../lib/snapshotPolicy').RepositorySnapshot) => {
    if (!userId) throw new Error('Not authenticated');
    try {
      setError(null);
      const repo = typeof path === 'string' ? await repoApi.connect(path) : await repoApi.upload(path);
      setRepos((prev) => [repo, ...prev]);
      setActiveRepo(repo);
      localStorage.setItem(activeRepoKey(userId), repo.id);
      return repo;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      setError(message);
      throw err;
    }
  }, [userId]);

  const disconnectRepo = useCallback(async (id: string) => {
    try {
      await repoApi.disconnect(id);
      setRepos((prev) => prev.filter((r) => r.id !== id));
      setActiveRepo((prev) => {
        if (prev?.id === id) {
          if (userId) localStorage.removeItem(activeRepoKey(userId));
          return null;
        }
        return prev;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    }
  }, [userId]);

  const selectRepo = useCallback(async (repo: Repository) => {
    if (!userId) return;
    try {
      const fullRepo = await repoApi.get(repo.id);
      setActiveRepo(fullRepo);
      localStorage.setItem(activeRepoKey(userId), fullRepo.id);
    } catch {
      setActiveRepo(repo);
      localStorage.setItem(activeRepoKey(userId), repo.id);
    }
  }, [userId]);

  const deselectRepo = useCallback(() => {
    setActiveRepo(null);
    if (userId) localStorage.removeItem(activeRepoKey(userId));
  }, [userId]);

  // Fetch repos once the user ID is resolved
  useEffect(() => {
    if (userId) {
      fetchRepos(userId);
    }
  }, [userId, fetchRepos]);

  return { repos, activeRepo, loading, error, connectRepo, disconnectRepo, deselectRepo, selectRepo, refresh: () => { if (userId) fetchRepos(userId); } };
}

// ─── Session Hook ─────────────────────────────────────────────
export function useSessions(repoId: string | undefined) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!repoId) return;
    try {
      setLoading(true);
      const [sessionList, active] = await Promise.all([
        sessionApi.list(repoId),
        sessionApi.getActive(repoId),
      ]);
      setSessions(sessionList);
      setActiveSession(active);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [repoId]);

  const startSession = useCallback(async (notes?: string) => {
    if (!repoId) return;
    try {
      const session = await sessionApi.start(repoId);
      // If notes (name) provided, update session immediately
      if (notes) {
        const updated = await sessionApi.updateNotes(session.id, notes);
        setActiveSession(updated);
        setSessions((prev) => [updated, ...prev]);
        return updated;
      }
      setActiveSession(session);
      setSessions((prev) => [session, ...prev]);
      return session;
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  }, [repoId]);

  const endSession = useCallback(async () => {
    if (!activeSession) return;
    try {
      const updated = await sessionApi.end(activeSession.id);
      setActiveSession(null);
      setSessions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      return updated;
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  }, [activeSession]);

  // Delete a session (remove from timeline)
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await sessionApi.delete(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSession?.id === sessionId) setActiveSession(null);
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  }, [activeSession]);

  const updateNotes = useCallback(async (notes: string) => {
    if (!activeSession) return;
    try {
      const updated = await sessionApi.updateNotes(activeSession.id, notes);
      setActiveSession(updated);
      setSessions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
    } catch (err) {
      console.error('Failed to update notes:', err);
    }
  }, [activeSession]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, activeSession, loading, startSession, endSession, updateNotes, deleteSession, refresh: fetchSessions };
}

// ─── Git Info Hook ────────────────────────────────────────────
export function useGitInfo(repoId: string | undefined) {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGitInfo = useCallback(async () => {
    if (!repoId) return;
    try {
      setLoading(true);
      const [gitStatus, gitCommits] = await Promise.all([
        gitApi.status(repoId),
        gitApi.commits(repoId, 8),
      ]);
      setStatus(gitStatus);
      setCommits(gitCommits);
    } catch (err) {
      console.error('Failed to fetch git info:', err);
    } finally {
      setLoading(false);
    }
  }, [repoId]);

  useEffect(() => {
    fetchGitInfo();
  }, [fetchGitInfo]);

  return { status, commits, loading, refresh: fetchGitInfo };
}

// ─── Activity Hook ───────────────────────────────────────────
export function useActivities(repoId: string | undefined) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!repoId) return;
    try {
      const data = await activityApi.list(repoId, 50);
      setActivities(data);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
    }
  }, [repoId]);

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 3000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  return { activities, loading, refresh: fetchActivities };
}

// ─── Resume Context Hook (V3) ──────────────────────────────────
export function useResumeContext(repoId: string | undefined) {
  const [context, setContext] = useState<import('../lib/api').ResumeContext | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchResumeContext = useCallback(async () => {
    if (!repoId) return;
    try {
      setLoading(true);
      const data = await (await import('../lib/api')).resumeApi.get(repoId);
      setContext(data);
    } catch (err) {
      console.error('Failed to fetch resume context:', err);
    } finally {
      setLoading(false);
    }
  }, [repoId]);

  useEffect(() => {
    fetchResumeContext();
  }, [fetchResumeContext]);

  return { context, loading, refresh: fetchResumeContext };
}

// ─── Timeline Hook (V4) ────────────────────────────────────────
export function useTimeline(repoId: string | undefined) {
  const [timeline, setTimeline] = useState<import('../lib/api').TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = useCallback(async () => {
    if (!repoId) return;
    try {
      setLoading(true);
      const data = await (await import('../lib/api')).timelineApi.get(repoId);
      setTimeline(data);
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
    } finally {
      setLoading(false);
    }
  }, [repoId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return { timeline, loading, refresh: fetchTimeline };
}

// ─── Decision Hook (V8) ────────────────────────────────────────
export function useDecisions(repoId: string | undefined) {
  const [decisions, setDecisions] = useState<import('../lib/api').Decision[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDecisions = useCallback(async () => {
    if (!repoId) return;
    try {
      setLoading(true);
      const data = await (await import('../lib/api')).decisionApi.list(repoId);
      setDecisions(data);
    } catch (err) {
      console.error('Failed to fetch decisions:', err);
    } finally {
      setLoading(false);
    }
  }, [repoId]);

  const createDecision = useCallback(
    async (input: import('../lib/api').CreateDecisionInput) => {
      if (!repoId) return;
      const created = await (await import('../lib/api')).decisionApi.create(repoId, input);
      setDecisions((prev) => [created, ...prev]);
      return created;
    },
    [repoId]
  );

  const updateDecision = useCallback(
    async (id: string, input: Partial<import('../lib/api').CreateDecisionInput>) => {
      const updated = await (await import('../lib/api')).decisionApi.update(id, input);
      setDecisions((prev) => prev.map((d) => (d.id === id ? updated : d)));
      return updated;
    },
    []
  );

  const deleteDecision = useCallback(async (id: string) => {
    await (await import('../lib/api')).decisionApi.delete(id);
    setDecisions((prev) => prev.filter((d) => d.id !== id));
  }, []);

  useEffect(() => {
    fetchDecisions();
  }, [fetchDecisions]);

  return {
    decisions,
    loading,
    createDecision,
    updateDecision,
    deleteDecision,
    refresh: fetchDecisions,
  };
}




