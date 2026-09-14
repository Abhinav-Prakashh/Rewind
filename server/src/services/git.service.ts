import simpleGit, { SimpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs';

export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface GitStatus {
  branch: string;
  changedFiles: {
    path: string;
    status: string;
  }[];
  ahead: number;
  behind: number;
}

export class GitService {
  private git: SimpleGit | null;
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
    this.git = repoPath.startsWith('snapshot:') || process.env.NODE_ENV === 'production' ? null : simpleGit(repoPath);
  }

  /**
   * Validates that the given path is a valid Git repository
   */
  static async isValidRepo(repoPath: string): Promise<boolean> {
    try {
      const resolvedPath = path.resolve(repoPath);
      if (!fs.existsSync(resolvedPath)) {
        return false;
      }
      const git = simpleGit(resolvedPath);
      const isRepo = await git.checkIsRepo();
      return isRepo;
    } catch {
      return false;
    }
  }

  /**
   * Extracts the repository name from the path
   */
  static getRepoName(repoPath: string): string {
    return path.basename(path.resolve(repoPath));
  }

  /**
   * Gets the current active branch
   */
  async getCurrentBranch(): Promise<string> {
    if (!this.git) return this.repoPath.startsWith('snapshot:') ? 'Snapshot' : 'Unavailable';
    const branchSummary = await this.git.branchLocal();
    return branchSummary.current;
  }

  /**
   * Gets recent commits
   */
  async getRecentCommits(count: number = 10): Promise<CommitInfo[]> {
    if (!this.git) return [];
    try {
      const log = await this.git.log({ maxCount: count });
      return log.all.map((commit) => ({
        hash: commit.hash.substring(0, 7),
        message: commit.message,
        author: commit.author_name,
        date: commit.date,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Gets the current git status including changed files
   */
  async getStatus(): Promise<GitStatus> {
    if (!this.git) return {branch: await this.getCurrentBranch(), changedFiles: [], ahead: 0, behind: 0};
    try {
      const status = await this.git.status();
      const branch = await this.getCurrentBranch();

      const changedFiles = [
        ...status.modified.map((f) => ({ path: f, status: 'modified' })),
        ...status.not_added.map((f) => ({ path: f, status: 'untracked' })),
        ...status.created.map((f) => ({ path: f, status: 'added' })),
        ...status.deleted.map((f) => ({ path: f, status: 'deleted' })),
        ...status.renamed.map((f) => ({ path: f.to ?? f.from, status: 'renamed' })),
      ];

      return {
        branch,
        changedFiles,
        ahead: status.ahead,
        behind: status.behind,
      };
    } catch {
      return {
        branch: 'unknown',
        changedFiles: [],
        ahead: 0,
        behind: 0,
      };
    }
  }

  /**
   * Gets commits created since a specific date
   */
  async getCommitsSince(sinceDate: string | Date): Promise<CommitInfo[]> {
    if (!this.git) return [];
    try {
      const sinceISO = typeof sinceDate === 'string' ? sinceDate : new Date(sinceDate).toISOString();
      const log = await this.git.log({ '--since': sinceISO });
      return log.all.map((commit) => ({
        hash: commit.hash.substring(0, 7),
        message: commit.message,
        author: commit.author_name,
        date: commit.date,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Gets list of local branches
   */
  async getLocalBranches(): Promise<string[]> {
    if (!this.git) return [];
    try {
      const branchSummary = await this.git.branchLocal();
      return branchSummary.all;
    } catch {
      return [];
    }
  }
}


