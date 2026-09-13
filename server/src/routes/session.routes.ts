import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/database.js';
import { GitService } from '../services/git.service.js';

const router = Router();

// POST /api/repos/:repoId/sessions — Start a new session
router.post('/repos/:repoId/sessions', async (req: Request, res: Response) => {
  try {
    const { repoId } = req.params;

    // Verify repo exists
    const { rows: repos } = await pool.query(
      'SELECT * FROM repositories WHERE id = $1',
      [repoId]
    );
    if (repos.length === 0) {
      res.status(404).json({ error: 'Repository not found' });
      return;
    }

    // End any currently active sessions for this repo
    await pool.query(
      'UPDATE sessions SET status = $1, end_time = NOW() WHERE repo_id = $2 AND status = $3',
      ['completed', repoId, 'active']
    );

    const repo = repos[0];
    const gitService = new GitService(repo.path);
    const branch = await gitService.getCurrentBranch();

    const id = uuidv4();
    const { rows: sessions } = await pool.query(
      'INSERT INTO sessions (id, repo_id, branch) VALUES ($1, $2, $3) RETURNING *',
      [id, repoId, branch]
    );

    res.status(201).json(sessions[0]);
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// PATCH /api/sessions/:id/end — End a session
router.patch('/sessions/:id/end', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { rows: sessions, rowCount } = await pool.query(
      'UPDATE sessions SET status = $1, end_time = NOW() WHERE id = $2 AND status = $3 RETURNING *',
      ['completed', id, 'active']
    );

    if (!rowCount || rowCount === 0) {
      res.status(404).json({ error: 'Active session not found' });
      return;
    }

    res.json(sessions[0]);
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// PATCH /api/sessions/:id/notes — Update session notes
router.patch('/sessions/:id/notes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const { rows: sessions, rowCount } = await pool.query(
      'UPDATE sessions SET notes = $1 WHERE id = $2 RETURNING *',
      [notes, id]
    );

    if (!rowCount || rowCount === 0) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json(sessions[0]);
  } catch (error) {
    console.error('Error updating notes:', error);
    res.status(500).json({ error: 'Failed to update notes' });
  }
});

// GET /api/repos/:repoId/sessions — List sessions for a repo
router.get('/repos/:repoId/sessions', async (req: Request, res: Response) => {
  try {
    const { repoId } = req.params;
    const { rows: sessions } = await pool.query(
      'SELECT * FROM sessions WHERE repo_id = $1 ORDER BY start_time DESC LIMIT 20',
      [repoId]
    );
    res.json(sessions);
  } catch (error) {
    console.error('Error listing sessions:', error);
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

// GET /api/repos/:repoId/sessions/active — Get active session for a repo
router.get('/repos/:repoId/sessions/active', async (req: Request, res: Response) => {
  try {
    const { repoId } = req.params;
    const { rows: sessions } = await pool.query(
      'SELECT * FROM sessions WHERE repo_id = $1 AND status = $2 LIMIT 1',
      [repoId, 'active']
    );

    if (sessions.length === 0) {
      res.json(null);
      return;
    }

    res.json(sessions[0]);
  } catch (error) {
    console.error('Error getting active session:', error);
    res.status(500).json({ error: 'Failed to get active session' });
  }
});

// DELETE /api/sessions/:id — Delete a session
router.delete('/sessions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM sessions WHERE id = $1',
      [id]
    );

    if (!result.rowCount || result.rowCount === 0) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

export default router;
