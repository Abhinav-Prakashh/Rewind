import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import pool from '../db/database.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { validateSnapshot, hashContent } from '../services/snapshot.service.js';
const router = Router();
router.post(['/snapshots', '/:id/snapshot'], async (req, res) => {
  let snapshot;
  try { snapshot = validateSnapshot(req.body); }
  catch (error) { res.status(400).json({error: (error as Error).message}); return; }
  const userId = (req as AuthenticatedRequest).userId;
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    // Serialize uploads per user, including quota checks and retries.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [userId]);
    const id = req.params.id || randomUUID();
    if (req.params.id) {
      const owned = await client.query("SELECT id FROM repositories WHERE id=$1 AND user_id=$2 AND source='snapshot' FOR UPDATE", [id, userId]);
      if (!owned.rowCount) { await client.query('ROLLBACK'); res.status(404).json({error:'Snapshot repository not found'}); return; }
    } else {
      const quota = await client.query("SELECT count(*)::int AS count FROM repositories WHERE user_id=$1 AND source='snapshot'", [userId]);
      if (quota.rows[0].count >= 20) { await client.query('ROLLBACK'); res.status(409).json({error:'Snapshot limit reached (20 repositories). Remove an old repository first.'}); return; }
      await client.query("INSERT INTO repositories (id,user_id,name,path,source) VALUES ($1,$2,$3,$4,'snapshot')", [id,userId,snapshot.name,`snapshot:${id}`]);
    }
    const previous = await client.query('SELECT path, sha256 FROM repository_files WHERE repo_id=$1', [id]);
    const old = new Map(previous.rows.map(f => [f.path, f.sha256]));
    const changes: {path: string; type: string}[] = [];
    await client.query('DELETE FROM repository_files WHERE repo_id=$1', [id]);
    for (const file of snapshot.files) {
      const hash = hashContent(file.content);
      if (old.get(file.path) !== hash) changes.push({path:file.path,type:old.has(file.path) ? 'file_modified' : 'file_created'});
      old.delete(file.path);
      await client.query('INSERT INTO repository_files (repo_id,path,content,size,last_modified,sha256) VALUES ($1,$2,$3,$4,$5,$6)', [id,file.path,file.content,file.size,file.lastModified,hash]);
    }
    for (const path of old.keys()) changes.push({path,type:'file_deleted'});
    for (const change of changes) await client.query("INSERT INTO activities (id,repo_id,session_id,type,file_path,details) VALUES ($1,$2::varchar,(SELECT id FROM sessions WHERE repo_id=$2 AND status='active' ORDER BY start_time DESC LIMIT 1),$3,$4,$5)", [randomUUID(),id,change.type,change.path,'Uploaded browser snapshot']);
    const result = await client.query('UPDATE repositories SET name=$1,snapshot_at=NOW() WHERE id=$2 AND user_id=$3 RETURNING *', [snapshot.name,id,userId]);
    await client.query('COMMIT');
    res.status(req.params.id ? 200 : 201).json({...result.rows[0],branch:'Snapshot',file_count:snapshot.files.length});
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('Snapshot storage failed', (error as {code?: string}).code || 'unknown');
    res.status(500).json({error:'Could not store snapshot. Please retry.'});
  } finally { client?.release(); }
});
export default router;
