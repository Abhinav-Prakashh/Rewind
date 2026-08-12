import { Router, Request, Response } from 'express';
import pool from '../db/database.js';
import { GitService } from '../services/git.service.js';
import { RowDataPacket } from 'mysql2';

const router = Router();

// GET /api/repos/:repoId/git/status — Get git status
router.get('/:repoId/git/status', async (req: Request, res: Response) => {
  try {
    const { repoId } = req.params;

    const [repos] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM repositories WHERE id = ?',
      [repoId]
    );

    if (repos.length === 0) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }

    const gitService = new GitService(repos[0].path);
    const status = await gitService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting git status:', error);
    res.status(500).json({ error: 'Failed to get git status' });
  }
});

// GET /api/repos/:repoId/git/commits — Get recent commits
router.get('/:repoId/git/commits', async (req: Request, res: Response) => {
  try {
    const { repoId } = req.params;
    const count = parseInt(req.query.count as string) || 10;

    const [repos] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM repositories WHERE id = ?',
      [repoId]
    );

    if (repos.length === 0) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }

    const gitService = new GitService(repos[0].path);
    const commits = await gitService.getRecentCommits(count);
    res.json(commits);
  } catch (error) {
    console.error('Error getting commits:', error);
    res.status(500).json({ error: 'Failed to get commits' });
  }
});

// GET /api/repos/:repoId/git/branch — Get current branch
router.get('/:repoId/git/branch', async (req: Request, res: Response) => {
  try {
    const { repoId } = req.params;

    const [repos] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM repositories WHERE id = ?',
      [repoId]
    );

    if (repos.length === 0) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }

    const gitService = new GitService(repos[0].path);
    const branch = await gitService.getCurrentBranch();
    res.json({ branch });
  } catch (error) {
    console.error('Error getting branch:', error);
    res.status(500).json({ error: 'Failed to get branch' });
  }
});

export default router;
