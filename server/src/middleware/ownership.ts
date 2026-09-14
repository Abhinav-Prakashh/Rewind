import { Request, Response, NextFunction } from 'express';
import pool from '../db/database.js';
import { AuthenticatedRequest } from './auth.js';
export async function requireOwnership(req: Request, res: Response, next: NextFunction): Promise<void> {
  const match = /^\/(repos|sessions|decisions)\/([^/]+)/i.exec(req.path);
  if (!match || (match[1].toLowerCase() === 'repos' && ['browse','snapshots'].includes(match[2].toLowerCase()))) { next(); return; }
  const [, resource, id] = match;
  if (!/^[0-9a-f-]{36}$/i.test(id)) { res.status(404).json({error:'Resource not found'}); return; }
  try {
    const table = resource.toLowerCase() === 'sessions' ? 'sessions' : 'decisions';
    const sql = resource.toLowerCase() === 'repos'
      ? 'SELECT id FROM repositories WHERE id=$1 AND user_id=$2'
      : `SELECT child.id FROM ${table} child JOIN repositories r ON r.id=child.repo_id WHERE child.id=$1 AND r.user_id=$2`;
    const result = await pool.query(sql, [id,(req as AuthenticatedRequest).userId]);
    if (!result.rowCount) { res.status(404).json({error:'Resource not found'}); return; }
    next();
  } catch { res.status(500).json({error:'Could not authorize resource'}); }
}
