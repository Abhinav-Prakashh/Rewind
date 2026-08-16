import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/database.js';
import { GitService } from '../services/git.service.js';
import { WatcherService } from '../services/watcher.service.js';
import { RowDataPacket } from 'mysql2';

const router = Router();

// POST /api/repos — Connect a local repository
router.post('/', async (req: Request, res: Response) => {
  try {
    const { path: repoPath } = req.body;

    if (!repoPath) {
      res.status(400).json({ error: 'Repository path is required' });
      return;
    }

    const isValid = await GitService.isValidRepo(repoPath);
    if (!isValid) {
      res.status(400).json({ error: 'Invalid Git repository path' });
      return;
    }

    // Check if already connected
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM repositories WHERE path = ?',
      [repoPath]
    );
    if (existing.length > 0) {
      res.status(409).json({ error: 'Repository already connected', id: existing[0].id });
      return;
    }

    const id = uuidv4();
    const name = GitService.getRepoName(repoPath);

    await pool.execute(
      'INSERT INTO repositories (id, name, path) VALUES (?, ?, ?)',
      [id, name, repoPath]
    );

    // Start watching repository
    WatcherService.startWatching(id, repoPath).catch(() => {});

    const gitService = new GitService(repoPath);
    const branch = await gitService.getCurrentBranch();

    res.status(201).json({ id, name, path: repoPath, branch });
  } catch (error) {
    console.error('Error connecting repository:', error);
    res.status(500).json({ error: 'Failed to connect repository' });
  }
});

// GET /api/repos — List connected repositories
router.get('/', async (_req: Request, res: Response) => {
  try {
    const [repos] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM repositories ORDER BY created_at DESC'
    );
    res.json(repos);
  } catch (error) {
    console.error('Error listing repositories:', error);
    res.status(500).json({ error: 'Failed to list repositories' });
  }
});

// GET /api/repos/:id — Get repo details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const [repos] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM repositories WHERE id = ?',
      [req.params.id]
    );

    if (repos.length === 0) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }

    const repo = repos[0];
    const gitService = new GitService(repo.path);
    const branch = await gitService.getCurrentBranch();

    res.json({ ...repo, branch });
  } catch (error) {
    console.error('Error getting repository:', error);
    res.status(500).json({ error: 'Failed to get repository' });
  }
});

// DELETE /api/repos/:id — Disconnect a repository
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM repositories WHERE id = ?',
      [req.params.id]
    );

    const affectedRows = (result as { affectedRows: number }).affectedRows;
    if (affectedRows === 0) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }

    // Stop watching repository
    WatcherService.stopWatching(req.params.id as string).catch(() => {});

    res.json({ message: 'Repository disconnected' });
  } catch (error) {
    console.error('Error disconnecting repository:', error);
    res.status(500).json({ error: 'Failed to disconnect repository' });
  }
});

export default router;
