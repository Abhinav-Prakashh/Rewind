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
      notes: `Repository ${repo.name} connected to Developer Memory System.`,
      commits: recentCommits.slice(-1), // earliest recorded commit if available
      files: [],
    });

    // 2. Map Sessions to Timeline Events
    for (const session of sessions) {
      const sessionStart = new Date(session.start_time).getTime();
      const sessionEnd = session.end_time ? new Date(session.end_time).getTime() : Date.now();

      // Filter commits during session timeframe
      const sessionCommits = recentCommits.filter((c) => {
        const commitTime = new Date(c.date).getTime();
        return commitTime >= sessionStart - 300000 && commitTime <= sessionEnd + 300000;
      });

      // Filter activities during session
      const sessionActivities = activities.filter((a) => a.session_id === session.id);
      const filesMap = new Map<string, string>();

      sessionActivities.forEach((act) => {
        if (act.file_path) {
          filesMap.set(act.file_path, act.type.replace('file_', ''));
        }
      });

      // Deriving title
      let title = `Session on ${session.branch || 'main'}`;
      if (session.notes && session.notes.trim()) {
        const firstLine = session.notes.trim().split('\n')[0].replace(/^[-*#\s]+/, '');
        if (firstLine) title = firstLine;
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
        notes: session.notes || null,
        commits: sessionCommits,
        files: Array.from(filesMap.entries()).map(([path, status]) => ({ path, status })),
      });
    }

    // 3. If no sessions exist yet, create a default "Recent Activity & Git History" event
    if (sessions.length === 0 && recentCommits.length > 0) {
      const latestCommit = recentCommits[0];
      timelineEvents.push({
        id: `recent-commits-${repo.id}`,
        title: latestCommit.message || 'Recent Commits Work',
        type: 'commit_cluster',
        branch: gitStatus.branch || 'main',
        startTime: latestCommit.date,
        endTime: latestCommit.date,
        notes: 'Git commits recorded prior to explicit session tracking.',
        commits: recentCommits.slice(0, 5),
        files: gitStatus.changedFiles.map((f) => ({ path: f.path, status: f.status })),
      });
    }

    res.json(timelineEvents);
  } catch (error) {
    console.error('Error generating timeline:', error);
    res.status(500).json({ error: 'Failed to generate project timeline' });
  }
});

export default router;
