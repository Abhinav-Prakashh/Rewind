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

// ─── Repository Hook ─────────────────────────────────────────
export function useRepo() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [activeRepo, setActiveRepo] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRepos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await repoApi.list();
      setRepos(data);
      if (data.length > 0 && !activeRepo) {
        // Auto-select first repo, fetch full details
        const fullRepo = await repoApi.get(data[0].id);
        setActiveRepo(fullRepo);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch repos');
    } finally {
      setLoading(false);
    }
  }, []);

  const connectRepo = useCallback(async (path: string) => {
    try {
      setError(null);
      const repo = await repoApi.connect(path);
      setRepos((prev) => [repo, ...prev]);
      setActiveRepo(repo);
      return repo;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      setError(message);
      throw err;
    }
  }, []);

  const disconnectRepo = useCallback(async (id: string) => {
    try {
      await repoApi.disconnect(id);
      setRepos((prev) => prev.filter((r) => r.id !== id));
      setActiveRepo((prev) => (prev?.id === id ? null : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    }
  }, []);

  const selectRepo = useCallback(async (repo: Repository) => {
    try {
      const fullRepo = await repoApi.get(repo.id);
      setActiveRepo(fullRepo);
    } catch {
      setActiveRepo(repo);
    }
  }, []);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  return { repos, activeRepo, loading, error, connectRepo, disconnectRepo, selectRepo, refresh: fetchRepos };
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

  const startSession = useCallback(async () => {
    if (!repoId) return;
    try {
      const session = await sessionApi.start(repoId);
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

  return { sessions, activeSession, loading, startSession, endSession, updateNotes, refresh: fetchSessions };
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

