import express from 'express';
import { requireAuth } from './middleware/auth.js';
import { requireOwnership } from './middleware/ownership.js';
import snapshotRoutes from './routes/snapshot.routes.js';
import cors from 'cors';
import dotenv from 'dotenv';
import pool, { initializeDatabase } from './db/database.js';
import repoRoutes from './routes/repo.routes.js';
import sessionRoutes from './routes/session.routes.js';
import gitRoutes from './routes/git.routes.js';
import activityRoutes from './routes/activity.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import timelineRoutes from './routes/timeline.routes.js';
import aiRoutes from './routes/ai.routes.js';
import decisionRoutes from './routes/decision.routes.js';
import { WatcherService } from './services/watcher.service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173,https://rewind-silk.vercel.app').split(',').map(s => s.trim());
app.use(cors({ origin: origins, allowedHeaders: ['Content-Type', 'Authorization'] }));
app.get('/api/health', (_req, res) => res.json({status: 'ok'}));
app.use('/api', requireAuth, requireOwnership);
// Authenticate before accepting large request bodies. Uploads go directly to Render.
app.use('/api/repos', snapshotRoutesMiddleware);
function snapshotRoutesMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const upload = req.method === 'POST' && (req.path === '/snapshots' || /^\/[^/]+\/snapshot$/.test(req.path));
  express.json({limit: upload ? '6mb' : '100kb', inflate: false})(req, res, next);
}
app.use(express.json({limit: '100kb'}));
app.use('/api/repos', snapshotRoutes);

// Routes
app.use('/api/repos', repoRoutes);
app.use('/api', sessionRoutes);
app.use('/api/repos', gitRoutes);
app.use('/api', activityRoutes);
app.use('/api', resumeRoutes);
app.use('/api', timelineRoutes);
app.use('/api', aiRoutes);
app.use('/api', decisionRoutes);





// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((error: {status?: number; type?: string}, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = error.status || 500;
  res.status(status).json({error: status === 413 ? 'Upload exceeds the 6 MiB request limit.' : status === 400 ? 'Invalid JSON request.' : 'Request failed.'});
});
export { app };

// Initialize database and start server
async function start() {
  try {
    await initializeDatabase();

    // Start watching existing connected repositories
    const { rows: repos } = await pool.query<{ id: string; path: string }>("SELECT id, path FROM repositories WHERE source='local'");
    for (const repo of repos) {
      WatcherService.startWatching(repo.id, repo.path).catch(() => {});
    }

    app.listen(PORT, () => {
      console.log(`\n🧠 DMS Server running at http://localhost:${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') start();
