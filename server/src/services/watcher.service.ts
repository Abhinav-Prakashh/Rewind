import chokidar, { FSWatcher } from 'chokidar';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/database.js';
import { GitService, CommitInfo } from './git.service.js';

interface ActiveWatcher {
  repoId: string;
  repoPath: string;
  watcher: FSWatcher;
  lastBranch: string;
  lastCommitHash: string;
}

export class WatcherService {
  private static watchers: Map<string, ActiveWatcher> = new Map();
  private static debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Starts watching a repository for file and git changes
   */
  static async startWatching(repoId: string, repoPath: string): Promise<void> {
    // Local filesystem watchers are only meaningful in development.
    // On Render (or any production deployment) the local paths do not exist,
    // so we skip watcher setup entirely while keeping all API/DB functionality.
    if (process.env.NODE_ENV === 'production' || repoPath.startsWith('snapshot:')) {
      console.log(`⏭️  Skipping file watcher in production for repo (${repoId})`);
      return;
    }

    if (this.watchers.has(repoId)) {
      return; // Already watching
    }

    try {
      const gitService = new GitService(repoPath);
      const branch = await gitService.getCurrentBranch().catch(() => 'main');
      const commits = await gitService.getRecentCommits(1).catch(() => []);
      const commitHash = commits[0]?.hash || '';

      const watcher = chokidar.watch(repoPath, {
        ignored: [
          /(^|[\/\\])\../, // ignore dotfiles/dotfolders (.git, .vscode, .idea, etc.)
          /(^|[\/\\])(node_modules|dist|build|\.next|\.output|\.cache|coverage|vendor|\.venv|venv|env|target|out)[\/\\]/,
          '**/*.tmp',
          '**/*.log',
          '**/*.lock',
        ],
        ignoreInitial: true,
        persistent: true,
        depth: 8,
        awaitWriteFinish: {
          stabilityThreshold: 300,
          pollInterval: 100,
        },
      });

      watcher
        .on('change', (filePath) => this.handleFileEvent(repoId, repoPath, 'file_modified', filePath))
        .on('add', (filePath) => this.handleFileEvent(repoId, repoPath, 'file_created', filePath))
        .on('unlink', (filePath) => this.handleFileEvent(repoId, repoPath, 'file_deleted', filePath))
        .on('error', (err: any) => console.warn(`Watcher warning for ${path.basename(repoPath)}:`, err?.message || err));

      this.watchers.set(repoId, {
        repoId,
        repoPath,
        watcher,
        lastBranch: branch,
        lastCommitHash: commitHash,
      });

      console.log(`👁️ Started watching repository: ${path.basename(repoPath)} (${repoId})`);
    } catch (error) {
      console.error(`Failed to start watcher for ${repoPath}:`, error);
    }
  }

  /**
   * Stops watching a repository
   */
  static async stopWatching(repoId: string): Promise<void> {
    const active = this.watchers.get(repoId);
    if (active) {
      await active.watcher.close();
      this.watchers.delete(repoId);
      console.log(`🛑 Stopped watching repo (${repoId})`);
    }
  }

  /**
   * Handles file system events with debouncing per file
   */
  private static handleFileEvent(
    repoId: string,
    repoPath: string,
    type: 'file_modified' | 'file_created' | 'file_deleted',
    fullPath: string
  ) {
    const relativePath = path.relative(repoPath, fullPath);
    const key = `${repoId}:${type}:${relativePath}`;

    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key)!);
    }

    this.debounceTimers.set(
      key,
      setTimeout(async () => {
        this.debounceTimers.delete(key);
        await this.recordActivity(repoId, type, relativePath);
        await this.checkGitState(repoId, repoPath);
      }, 500)
    );
  }

  /**
   * Checks git branch & commit changes
   */
  static async checkGitState(repoId: string, repoPath: string): Promise<void> {
    if (process.env.NODE_ENV === 'production') return;

    const watcherInfo = this.watchers.get(repoId);
    if (!watcherInfo) return;

    try {
      const gitService = new GitService(repoPath);
      const currentBranch = await gitService.getCurrentBranch();

      if (currentBranch && currentBranch !== watcherInfo.lastBranch) {
        await this.recordActivity(
          repoId,
          'branch_changed',
          null,
          `Switched branch from ${watcherInfo.lastBranch} to ${currentBranch}`
        );
        watcherInfo.lastBranch = currentBranch;
      }

      const recentCommits = await gitService.getRecentCommits(1);
      const latestCommit = recentCommits[0];

      if (latestCommit && latestCommit.hash !== watcherInfo.lastCommitHash) {
        await this.recordActivity(
          repoId,
          'commit_created',
          null,
          `Commit ${latestCommit.hash}: ${latestCommit.message}`
        );
        watcherInfo.lastCommitHash = latestCommit.hash;
      }
    } catch {
      // Ignore git check errors during file operations
    }
  }

  /**
   * Persists activity record to database
   */
  static async recordActivity(
    repoId: string,
    type: string,
    filePath: string | null = null,
    details: string | null = null
  ): Promise<void> {
    try {
      // Check if there is an active session
      const { rows: activeSessions } = await pool.query<{ id: string }>(
        'SELECT id FROM sessions WHERE repo_id = $1 AND status = $2 LIMIT 1',
        [repoId, 'active']
      );
      const sessionId = activeSessions.length > 0 ? activeSessions[0].id : null;

      const id = uuidv4();
      await pool.query(
        'INSERT INTO activities (id, repo_id, session_id, type, file_path, details) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, repoId, sessionId, type, filePath, details]
      );
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  }
}
