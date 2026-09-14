import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { promisify } from 'util';
import pool from '../db/database.js';
import { GitService } from '../services/git.service.js';
import { WatcherService } from '../services/watcher.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const execAsync = promisify(exec);
const router = Router();

// All repo routes require authentication
router.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.method === 'POST' && ['/', '/browse'].includes(req.path)) {
    res.status(400).json({error:'Choose a folder in your browser and upload a snapshot. Local paths are only available in development.'}); return;
  }
  next();
});

// POST /api/repos/browse — Open native folder picker on host computer
router.post('/browse', async (_req: Request, res: Response) => {
  try {
    let chosenPath = '';
    if (process.platform === 'darwin') {
      try {
        const { stdout } = await execAsync(
          `osascript -e 'POSIX path of (choose folder with prompt "Select Git Repository:")'`
        );
        chosenPath = stdout.trim();
        // remove trailing slash if any
        if (chosenPath.endsWith('/')) {
          chosenPath = chosenPath.slice(0, -1);
        }
      } catch {
        // User cancelled picker dialog
        res.status(200).json({ path: null, cancelled: true });
        return;
      }
    } else {
      res.status(400).json({ error: 'Folder browsing not supported on this OS' });
      return;
    }

    if (!chosenPath) {
      res.status(200).json({ path: null, cancelled: true });
      return;
    }

    const isValid = await GitService.isValidRepo(chosenPath);
    res.json({ path: chosenPath, isValid });
  } catch (error) {
    console.error('Error browsing folder:', error);
    res.status(500).json({ error: 'Failed to open directory browser' });
  }
});

// POST /api/repos — Connect a local repository (scoped to current user)
router.post('/', async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).userId;

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

    // Check if already connected for THIS user
    const { rows: existing } = await pool.query<{ id: string }>(
      'SELECT id FROM repositories WHERE path = $1 AND user_id = $2',
      [repoPath, userId]
    );
    if (existing.length > 0) {
      res.status(409).json({ error: 'Repository already connected', id: existing[0].id });
      return;
    }

    const id = uuidv4();
    const name = GitService.getRepoName(repoPath);

    await pool.query(
      'INSERT INTO repositories (id, user_id, name, path) VALUES ($1, $2, $3, $4)',
      [id, userId, name, repoPath]
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

// GET /api/repos — List repositories belonging to the authenticated user
// Legacy rows (user_id IS NULL) are intentionally excluded
router.get('/', async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).userId;

  try {
    const { rows: repos } = await pool.query(
      'SELECT * FROM repositories WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(repos);
  } catch (error) {
    console.error('Error listing repositories:', error);
    res.status(500).json({ error: 'Failed to list repositories' });
  }
});

// GET /api/repos/:id — Get repo details (must belong to current user)
router.get('/:id', async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).userId;

  try {
    const { rows: repos } = await pool.query(
      'SELECT * FROM repositories WHERE id = $1 AND user_id = $2',
      [req.params.id, userId]
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

// DELETE /api/repos/:id — Disconnect a repository (must belong to current user)
router.delete('/:id', async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).userId;

  try {
    const result = await pool.query(
      'DELETE FROM repositories WHERE id = $1 AND user_id = $2',
      [req.params.id, userId]
    );

    if (!result.rowCount || result.rowCount === 0) {
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
