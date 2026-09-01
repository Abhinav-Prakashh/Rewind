import { Router, Request, Response } from 'express';
import pool from '../db/database.js';
import { GitService } from '../services/git.service.js';
import { RowDataPacket } from 'mysql2';

const router = Router();

export interface TimelineEvent {
  id: string;
  title: string;
  type: 'session' | 'commit_cluster' | 'repository_init';
  branch: string;
  startTime: string;
  endTime: string | null;
  notes: string | null;
  commits: {
    hash: string;
    message: string;
    author: string;
    date: string;
  }[];
  files: {
    path: string;
    status?: string;
  }[];
}

// GET /api/repos/:repoId/timeline — Get visual project history timeline
router.get('/repos/:repoId/timeline', async (req: Request, res: Response) => {
  try {
    const { repoId } = req.params;

    // Fetch repository
    const [repos] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM repositories WHERE id = ?',
      [repoId]
    );

    if (repos.length === 0) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }

    const repo = repos[0];
    const gitService = new GitService(repo.path);
    const recentCommits = await gitService.getRecentCommits(50);
    const gitStatus = await gitService.getStatus();

    // Fetch all recorded sessions for repo
    const [sessions] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sessions WHERE repo_id = ? ORDER BY start_time ASC',
      [repoId]
    );

    // Fetch all activities for repo
    const [activities] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM activities WHERE repo_id = ? ORDER BY timestamp ASC',
      [repoId]
    );

    const timelineEvents: TimelineEvent[] = [];

    // 1. Initial Repository Setup Event
    timelineEvents.push({
      id: `repo-init-${repo.id}`,
      title: 'Project Initialized & Connected',
      type: 'repository_init',
      branch: repo.branch || gitStatus.branch || 'main',
      startTime: repo.created_at,
      endTime: repo.created_at,
      notes: `Repository ${repo.name} connected to Rewind.`,
      commits: recentCommits.slice(-1),
      files: [],
    });

    const coveredCommitHashes = new Set<string>();

    // 2. Map Sessions to Timeline Events
    for (const session of sessions) {
      const sessionStart = new Date(session.start_time).getTime();
      const sessionEnd = session.end_time ? new Date(session.end_time).getTime() : Date.now();

      // Filter commits during session timeframe (window around session start/end)
      const sessionCommits = recentCommits.filter((c) => {
        const commitTime = new Date(c.date).getTime();
        return commitTime >= sessionStart - 300000 && commitTime <= sessionEnd + 300000;
      });

      sessionCommits.forEach((c) => coveredCommitHashes.add(c.hash));

      // Filter activities during session
      const sessionActivities = activities.filter((a) => a.session_id === session.id);
      const filesMap = new Map<string, string>();

      sessionActivities.forEach((act) => {
        if (act.file_path) {
          filesMap.set(act.file_path, act.type.replace('file_', ''));
        }
      });

      // Deriving title: If user named the session (in notes), use that name!
      // Otherwise fall back to commit message or branch name.
      let title = `Session on ${session.branch || 'main'}`;
      if (session.notes && session.notes.trim()) {
        const firstLine = session.notes.trim().split('\n')[0].replace(/^[-*#\s]+/, '');
        if (firstLine) {
          title = firstLine;
        }
      } else if (sessionCommits.length > 0) {
        title = sessionCommits[0].message;
      }

      timelineEvents.push({
        id: session.id,
        title,
        type: 'session',
        branch: session.branch || 'main',
        startTime: session.start_time,
        endTime: session.end_time,
        notes: session.notes?.trim() || null,
        commits: sessionCommits,
        files: Array.from(filesMap.entries()).map(([path, status]) => ({ path, status })),
      });
    }

    // 3. Add commits that occurred outside of tracked sessions as standalone milestones
    const orphanCommits = recentCommits.filter((c) => !coveredCommitHashes.has(c.hash));
    for (const commit of orphanCommits) {
      timelineEvents.push({
        id: `commit-${commit.hash}`,
        title: commit.message || 'Git Commit',
        type: 'commit_cluster',
        branch: gitStatus.branch || 'main',
        startTime: commit.date,
        endTime: commit.date,
        notes: `Commit ${commit.hash.slice(0, 7)} by ${commit.author}`,
        commits: [commit],
        files: [],
      });
    }

    // 4. Sort all timeline events chronologically (oldest to newest)
    timelineEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    res.json(timelineEvents);
  } catch (error) {
    console.error('Error generating timeline:', error);
    res.status(500).json({ error: 'Failed to generate project timeline' });
  }
});

export default router;
