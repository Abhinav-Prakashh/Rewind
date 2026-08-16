import { Router, Request, Response } from 'express';
import pool from '../db/database.js';
import { GitService, CommitInfo } from '../services/git.service.js';
import { RowDataPacket } from 'mysql2';

const router = Router();

// Helper to format relative time
function getRelativeTimeText(dateStr: string | null): string {
  if (!dateStr) return 'No previous sessions recorded';
  const now = new Date();
  const date = new Date(dateStr);
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} days ago`;
  return `${Math.floor(diffSec / 604800)} weeks ago`;
}

// Helper to extract pending TODO items from text notes
function extractPendingItems(notesText: string | null): string[] {
  if (!notesText) return [];
  const lines = notesText.split('\n');
  const pending: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Matches bullet points, TODOs, - [ ], - [x]
    if (trimmed.startsWith('- [ ]') || trimmed.startsWith('* [ ]')) {
      pending.push(trimmed.substring(5).trim());
    } else if (trimmed.toLowerCase().startsWith('todo:')) {
      pending.push(trimmed.substring(5).trim());
    } else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      pending.push(trimmed.substring(1).trim());
    }
  }

  return pending;
}

// GET /api/repos/:repoId/resume — Resume Work Engine context
router.get('/repos/:repoId/resume', async (req: Request, res: Response) => {
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

    // Fetch last completed session or active session
    const [sessions] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sessions WHERE repo_id = ? ORDER BY start_time DESC LIMIT 5',
      [repoId]
    );

    const activeSession = sessions.find((s) => s.status === 'active') || null;
    const lastCompletedSession = sessions.find((s) => s.status === 'completed') || null;
    const referenceSession = activeSession || lastCompletedSession;

    // 1. Last Worked
    const lastWorkedTimestamp = referenceSession
      ? (referenceSession.end_time || referenceSession.start_time)
      : null;
    const lastWorkedText = getRelativeTimeText(lastWorkedTimestamp);

    // 2. Recent Commits & Last Commit
    const recentCommits = await gitService.getRecentCommits(10);
    const lastCommit: CommitInfo | null = recentCommits.length > 0 ? recentCommits[0] : null;

    // 3. Working On Context
    let workingOn = 'General project updates';
    if (referenceSession && referenceSession.notes && referenceSession.notes.trim()) {
      const firstLine = referenceSession.notes.trim().split('\n')[0].replace(/^[-*#\s]+/, '');
      if (firstLine) {
        workingOn = firstLine;
      }
    } else if (lastCommit) {
      workingOn = lastCommit.message;
    }

    // 4. Relevant Files (from git status and session activities)
    const gitStatus = await gitService.getStatus();
    const filesSet = new Map<string, string>();

    gitStatus.changedFiles.forEach((f) => {
      filesSet.set(f.path, f.status);
    });

    if (referenceSession) {
      const [activities] = await pool.execute<RowDataPacket[]>(
        'SELECT file_path, type FROM activities WHERE session_id = ? AND file_path IS NOT NULL LIMIT 20',
        [referenceSession.id]
      );
      activities.forEach((act) => {
        if (act.file_path && !filesSet.has(act.file_path)) {
          filesSet.set(act.file_path, act.type.replace('file_', ''));
        }
      });
    }

    const files = Array.from(filesSet.entries()).map(([filePath, status]) => ({
      path: filePath,
      status,
    }));

    // 5. Pending tasks / TODO items
    const pendingItems = extractPendingItems(referenceSession?.notes || null);

    // 6. Changes since last session
    let commitsCountSinceLastSession = 0;
    if (lastCompletedSession && lastCompletedSession.end_time) {
      const commitsSince = await gitService.getCommitsSince(lastCompletedSession.end_time);
      commitsCountSinceLastSession = commitsSince.length;
    } else if (!lastCompletedSession) {
      commitsCountSinceLastSession = recentCommits.length;
    }

    const currentBranch = gitStatus.branch || 'main';
    const lastSessionBranch = referenceSession?.branch || currentBranch;
    const branchChanged = currentBranch !== lastSessionBranch;

    res.json({
      lastWorked: {
        timestamp: lastWorkedTimestamp,
        relativeText: lastWorkedText,
      },
      workingOn,
      files,
      lastCommit,
      pending: pendingItems,
      changesSinceLastSession: {
        commitsCount: commitsCountSinceLastSession,
        modifiedFilesCount: gitStatus.changedFiles.length,
        branchChanged,
        lastSessionBranch,
        currentBranch,
      },
    });
  } catch (error) {
    console.error('Error generating V3 resume context:', error);
    res.status(500).json({ error: 'Failed to generate resume context' });
  }
});

export default router;
