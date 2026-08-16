import { Router, Request, Response } from 'express';
import pool from '../db/database.js';
import { WatcherService } from '../services/watcher.service.js';
import { RowDataPacket } from 'mysql2';

const router = Router();

// GET /api/repos/:repoId/activities — Get activities for a repo
router.get('/repos/:repoId/activities', async (req: Request, res: Response) => {
  try {
    const { repoId } = req.params;
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 100);

    // Trigger git state check to ensure recent commits/branches are captured
    const [repos] = await pool.execute<RowDataPacket[]>(
      'SELECT path FROM repositories WHERE id = ?',
      [repoId]
    );

    if (repos.length > 0) {
      WatcherService.checkGitState(repoId as string, repos[0].path).catch(() => {});
    }

    const [activities] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM activities WHERE repo_id = ? ORDER BY timestamp DESC LIMIT ${limit}`,
      [repoId]
    );

    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.json([]);
  }
});

// GET /api/sessions/:sessionId/activities — Get activities for a session
router.get('/sessions/:sessionId/activities', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const [activities] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM activities WHERE session_id = ? ORDER BY timestamp DESC',
      [sessionId]
    );
    res.json(activities);
  } catch (error) {
    console.error('Error fetching session activities:', error);
    res.status(500).json({ error: 'Failed to fetch session activities' });
  }
});

export default router;
