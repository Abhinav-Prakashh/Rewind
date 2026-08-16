import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool, { initializeDatabase } from './db/database.js';
import repoRoutes from './routes/repo.routes.js';
import sessionRoutes from './routes/session.routes.js';
import gitRoutes from './routes/git.routes.js';
import activityRoutes from './routes/activity.routes.js';
import { WatcherService } from './services/watcher.service.js';
import { RowDataPacket } from 'mysql2';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/repos', repoRoutes);
app.use('/api', sessionRoutes);
app.use('/api/repos', gitRoutes);
app.use('/api', activityRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database and start server
async function start() {
  try {
    await initializeDatabase();

    // Start watching existing connected repositories
    const [repos] = await pool.execute<RowDataPacket[]>('SELECT id, path FROM repositories');
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

start();
