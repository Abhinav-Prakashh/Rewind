import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/database.js';
import { RowDataPacket } from 'mysql2';

const router = Router();

export interface Decision {
  id: string;
  repo_id: string;
  title: string;
  context: string | null;
  decision: string;
  reason: string;
  status: 'proposed' | 'accepted' | 'superseded' | 'deprecated';
  tags: string | null;
  created_at: string;
}

// GET /api/repos/:repoId/decisions — List all decisions for a repo
router.get('/repos/:repoId/decisions', async (req: Request, res: Response) => {
  try {
    const { repoId } = req.params;

    const [decisions] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM decisions WHERE repo_id = ? ORDER BY created_at DESC',
      [repoId]
    );

    res.json(decisions);
  } catch (error) {
    console.error('Error fetching decisions:', error);
    res.status(500).json({ error: 'Failed to fetch decisions' });
  }
});

// POST /api/repos/:repoId/decisions — Record a new decision
router.post('/repos/:repoId/decisions', async (req: Request, res: Response) => {
  try {
    const { repoId } = req.params;
    const { title, context, decision, reason, status, tags } = req.body;

    if (!title || !decision || !reason) {
      res.status(400).json({ error: 'Title, decision, and reason are required' });
      return;
    }

    const id = uuidv4();
    const decisionStatus = status || 'accepted';

    await pool.execute(
      'INSERT INTO decisions (id, repo_id, title, context, decision, reason, status, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, repoId, title, context || null, decision, reason, decisionStatus, tags || null]
    );

    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM decisions WHERE id = ?',
      [id]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating decision:', error);
    res.status(500).json({ error: 'Failed to record decision' });
  }
});

// PATCH /api/decisions/:id — Update a decision
router.patch('/decisions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, context, decision, reason, status, tags } = req.body;

    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM decisions WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      res.status(404).json({ error: 'Decision not found' });
      return;
    }

    const current = existing[0];
    const newTitle = title !== undefined ? title : current.title;
    const newContext = context !== undefined ? context : current.context;
    const newDecision = decision !== undefined ? decision : current.decision;
    const newReason = reason !== undefined ? reason : current.reason;
    const newStatus = status !== undefined ? status : current.status;
    const newTags = tags !== undefined ? tags : current.tags;

    await pool.execute(
      'UPDATE decisions SET title = ?, context = ?, decision = ?, reason = ?, status = ?, tags = ? WHERE id = ?',
      [newTitle, newContext, newDecision, newReason, newStatus, newTags, id]
    );

    const [updated] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM decisions WHERE id = ?',
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating decision:', error);
    res.status(500).json({ error: 'Failed to update decision' });
  }
});

// DELETE /api/decisions/:id — Delete a decision
router.delete('/decisions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM decisions WHERE id = ?',
      [id]
    );

    const affectedRows = (result as { affectedRows: number }).affectedRows;
    if (affectedRows === 0) {
      res.status(404).json({ error: 'Decision not found' });
      return;
    }

    res.json({ message: 'Decision deleted successfully' });
  } catch (error) {
    console.error('Error deleting decision:', error);
    res.status(500).json({ error: 'Failed to delete decision' });
  }
});

export default router;
