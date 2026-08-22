import pool from '../db/database.js';
import { GitService, CommitInfo } from './git.service.js';
import { RowDataPacket } from 'mysql2';

export interface MemorySource {
  type: 'session' | 'commit' | 'file' | 'note';
  label: string;
  detail?: string;
  timestamp?: string;
}

export interface AIQueryResult {
  answer: string;
  sources: MemorySource[];
}

export class AIMemoryService {
  /**
   * Answers a natural language memory question using recorded repository context
   */
  static async queryMemory(repoId: string, userQuery: string): Promise<AIQueryResult> {
    const queryLower = userQuery.toLowerCase().trim();

    // 1. Fetch Repository Details
    const [repos] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM repositories WHERE id = ?',
      [repoId]
    );

    if (repos.length === 0) {
      throw new Error('Repository not found');
    }

    const repo = repos[0];
    const gitService = new GitService(repo.path);

    // 2. Fetch Sessions
    const [sessions] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM sessions WHERE repo_id = ? ORDER BY start_time DESC LIMIT 20',
      [repoId]
    );

    // 3. Fetch Activities
    const [activities] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM activities WHERE repo_id = ? ORDER BY timestamp DESC LIMIT 50',
      [repoId]
    );

    // 4. Fetch Git Commits & Status
    const commits = await gitService.getRecentCommits(30);
    const gitStatus = await gitService.getStatus();

    const sources: MemorySource[] = [];

    // 5. External LLM Integration (Google Gemini or OpenAI)
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
      try {
        const promptContext = this.buildContextString(repo.name, sessions, commits, activities, gitStatus);
        const geminiAnswer = await this.callGeminiAPI(geminiKey, promptContext, userQuery);
        if (geminiAnswer) {
          const matchedSources = this.extractRelevantSources(queryLower, sessions, commits, activities);
          return { answer: geminiAnswer, sources: matchedSources };
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to local memory engine:', err);
      }
    } else if (openaiKey) {
      try {
        const promptContext = this.buildContextString(repo.name, sessions, commits, activities, gitStatus);
        const llmAnswer = await this.callOpenAI(openaiKey, promptContext, userQuery);
        if (llmAnswer) {
          const matchedSources = this.extractRelevantSources(queryLower, sessions, commits, activities);
          return { answer: llmAnswer, sources: matchedSources };
        }
      } catch (err) {
        console.warn('OpenAI API call failed, falling back to local memory engine:', err);
      }
    }

    // Built-in Local-first Intelligent Memory Reasoning Engine
    return this.generateLocalMemoryAnswer(queryLower, repo.name, sessions, commits, activities, gitStatus);
  }

  /**
   * Compiles context for external LLM prompts
   */
  private static buildContextString(
    repoName: string,
    sessions: RowDataPacket[],
    commits: CommitInfo[],
    activities: RowDataPacket[],
    gitStatus: { branch: string; changedFiles: { path: string; status: string }[] }
  ): string {
    return `Project: ${repoName}
Active Branch: ${gitStatus.branch}
Recent Commits:
${commits.slice(0, 15).map((c) => `- [${c.hash}] ${c.message} (by ${c.author} on ${c.date})`).join('\n')}

Recent Sessions:
${sessions.slice(0, 8).map((s) => `- Session (${s.start_time} - ${s.end_time || 'active'} on branch ${s.branch}): Notes: "${s.notes || 'none'}"`).join('\n')}

Recently Modified Files:
${gitStatus.changedFiles.map((f) => `- ${f.path} (${f.status})`).join('\n')}`;
  }

  /**
   * Calls Google Gemini API (gemini-2.0-flash / gemini-1.5-flash)
   */
  private static async callGeminiAPI(apiKey: string, context: string, query: string): Promise<string | null> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: 'You are the Developer Memory System AI. Answer questions strictly based on the provided project history, sessions, commits, and notes. Be concise, use markdown bullet points, and cite specific commit hashes, branch names, and file names.',
            },
          ],
        },
        contents: [
          {
            parts: [
              {
                text: `Repository Memory Context:\n${context}\n\nDeveloper Question: ${query}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      console.error(`Gemini API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  }

  /**
   * Calls OpenAI API if configured
   */
  private static async callOpenAI(apiKey: string, context: string, query: string): Promise<string | null> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are the Developer Memory System AI. Answer questions strictly based on the provided project history, sessions, commits, and notes. Do not write code unless asked for context.',
          },
          {
            role: 'user',
            content: `Context:\n${context}\n\nQuestion: ${query}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) return null;
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content || null;
  }


  /**
   * Extracts relevant source citations
   */
  private static extractRelevantSources(
    query: string,
    sessions: RowDataPacket[],
    commits: CommitInfo[],
    activities: RowDataPacket[]
  ): MemorySource[] {
    const sources: MemorySource[] = [];

    // Commits matching keywords
    commits.slice(0, 3).forEach((c) => {
      sources.push({
        type: 'commit',
        label: `Commit ${c.hash}`,
        detail: c.message,
        timestamp: c.date,
      });
    });

    // Recent sessions
    if (sessions.length > 0) {
      sources.push({
        type: 'session',
        label: `Session on ${sessions[0].branch || 'main'}`,
        detail: sessions[0].notes || 'Completed session',
        timestamp: sessions[0].start_time,
      });
    }

    return sources;
  }

  /**
   * Built-in intelligent local memory synthesizer
   */
  private static generateLocalMemoryAnswer(
    query: string,
    repoName: string,
    sessions: RowDataPacket[],
    commits: CommitInfo[],
    activities: RowDataPacket[],
    gitStatus: { branch: string; changedFiles: { path: string; status: string }[] }
  ): AIQueryResult {
    const sources: MemorySource[] = [];

    // Case 1: "What was I working on..." / "What did I do..."
    if (
      query.includes('working on') ||
      query.includes('last worked') ||
      query.includes('last week') ||
      query.includes('recently') ||
      query.includes('previous session')
    ) {
      const lastSession = sessions[0];
      const recentCommit = commits[0];

      let answer = `Based on your recorded memory for **${repoName}**:\n\n`;

      if (lastSession) {
        sources.push({
          type: 'session',
          label: `Session (${lastSession.branch})`,
          detail: lastSession.notes || 'Recent session',
          timestamp: lastSession.start_time,
        });

        answer += `• **Recent Focus**: You worked on branch \`${lastSession.branch}\` starting on ${new Date(lastSession.start_time).toLocaleDateString()}.\n`;
        if (lastSession.notes) {
          answer += `• **Session Notes**: "${lastSession.notes.trim()}"\n`;
        }
      }

      if (recentCommit) {
        sources.push({
          type: 'commit',
          label: `Commit ${recentCommit.hash}`,
          detail: recentCommit.message,
          timestamp: recentCommit.date,
        });
        answer += `• **Latest Commit**: \`${recentCommit.hash}\` — *${recentCommit.message}* (by ${recentCommit.author}).\n`;
      }

      if (gitStatus.changedFiles.length > 0) {
        answer += `• **Active Files**: You currently have ${gitStatus.changedFiles.length} modified files in progress (${gitStatus.changedFiles.slice(0, 3).map((f) => `\`${f.path}\``).join(', ')}).\n`;
      }

      return { answer, sources };
    }

    // Case 2: "What changed while I was away?" / "What changed?"
    if (
      query.includes('changed') ||
      query.includes('away') ||
      query.includes('commits') ||
      query.includes('updates')
    ) {
      let answer = `Here is what changed recently in **${repoName}**:\n\n`;

      answer += `• **Active Branch**: Currently on \`${gitStatus.branch}\`.\n`;
      answer += `• **Recent Commits (${commits.length})**:\n`;

      commits.slice(0, 5).forEach((c) => {
        sources.push({
          type: 'commit',
          label: `Commit ${c.hash}`,
          detail: c.message,
          timestamp: c.date,
        });
        answer += `  - \`${c.hash}\`: ${c.message} (${new Date(c.date).toLocaleDateString()})\n`;
      });

      if (gitStatus.changedFiles.length > 0) {
        answer += `\n• **Uncommitted File Changes (${gitStatus.changedFiles.length})**:\n`;
        gitStatus.changedFiles.slice(0, 5).forEach((f) => {
          sources.push({
            type: 'file',
            label: f.path,
            detail: f.status,
          });
          answer += `  - \`${f.path}\` (${f.status})\n`;
        });
      }

      return { answer, sources };
    }

    // Case 3: "Which files are related to [topic]?" / "files related to..."
    if (query.includes('files') || query.includes('related to') || query.includes('where is')) {
      const topic = query
        .replace(/which files are related to|files related to|where is|files for/g, '')
        .replace(/[?]/g, '')
        .trim();

      const matchedFiles = new Set<string>();
      const matchedCommits: CommitInfo[] = [];

      // Check commits for keyword
      commits.forEach((c) => {
        if (c.message.toLowerCase().includes(topic)) {
          matchedCommits.push(c);
        }
      });

      // Check activities for keyword in path
      activities.forEach((a) => {
        if (a.file_path && a.file_path.toLowerCase().includes(topic)) {
          matchedFiles.add(a.file_path);
        }
      });

      // Check git status
      gitStatus.changedFiles.forEach((f) => {
        if (f.path.toLowerCase().includes(topic)) {
          matchedFiles.add(f.path);
        }
      });

      let answer = `Files related to **"${topic || 'your query'}"** in **${repoName}**:\n\n`;

      if (matchedFiles.size > 0) {
        Array.from(matchedFiles).forEach((filePath) => {
          sources.push({ type: 'file', label: filePath });
          answer += `• \`${filePath}\`\n`;
        });
      } else {
        answer += `• Found in recent project activities:\n`;
        activities.slice(0, 5).forEach((a) => {
          if (a.file_path) {
            sources.push({ type: 'file', label: a.file_path });
            answer += `• \`${a.file_path}\`\n`;
          }
        });
      }

      if (matchedCommits.length > 0) {
        answer += `\n**Associated Commits:**\n`;
        matchedCommits.slice(0, 3).forEach((c) => {
          sources.push({
            type: 'commit',
            label: `Commit ${c.hash}`,
            detail: c.message,
          });
          answer += `• \`${c.hash}\`: ${c.message}\n`;
        });
      }

      return { answer, sources };
    }

    // Case 4: "Why was [X] created?" / "Reason for..."
    if (query.includes('why') || query.includes('reason') || query.includes('purpose')) {
      const topic = query.replace(/why was|why is|what is the reason for|created|built/g, '').replace(/[?]/g, '').trim();

      const matchingNotes: string[] = [];
      const matchingCommits: CommitInfo[] = [];

      sessions.forEach((s) => {
        if (s.notes && s.notes.toLowerCase().includes(topic)) {
          matchingNotes.push(s.notes);
          sources.push({
            type: 'session',
            label: `Session on ${s.branch}`,
            detail: s.notes,
            timestamp: s.start_time,
          });
        }
      });

      commits.forEach((c) => {
        if (c.message.toLowerCase().includes(topic)) {
          matchingCommits.push(c);
          sources.push({
            type: 'commit',
            label: `Commit ${c.hash}`,
            detail: c.message,
            timestamp: c.date,
          });
        }
      });

      let answer = `Context regarding **"${topic || 'this item'}"**:\n\n`;

      if (matchingNotes.length > 0) {
        answer += `• **From Session Notes**:\n`;
        matchingNotes.slice(0, 2).forEach((n) => {
          answer += `  > "${n.trim()}"\n`;
        });
      }

      if (matchingCommits.length > 0) {
        answer += `• **From Commit History**:\n`;
        matchingCommits.slice(0, 3).forEach((c) => {
          answer += `  - Commit \`${c.hash}\`: *${c.message}* (by ${c.author})\n`;
        });
      }

      if (matchingNotes.length === 0 && matchingCommits.length === 0) {
        answer += `No explicit decision notes were recorded for "${topic}". Recent related session activity was logged under branch \`${gitStatus.branch}\` with last commit *"${commits[0]?.message || 'None'}"*.\n`;
      }

      return { answer, sources };
    }

    // General fallback
    let answer = `Here is a memory summary for **${repoName}**:\n\n`;
    answer += `• **Current Branch**: \`${gitStatus.branch}\`\n`;
    answer += `• **Recorded Sessions**: ${sessions.length} sessions\n`;
    answer += `• **Recent Commit**: \`${commits[0]?.hash || 'none'}\` — *${commits[0]?.message || 'No commits yet'}*\n`;
    answer += `• **Uncommitted Changes**: ${gitStatus.changedFiles.length} files\n`;

    if (commits[0]) {
      sources.push({
        type: 'commit',
        label: `Commit ${commits[0].hash}`,
        detail: commits[0].message,
        timestamp: commits[0].date,
      });
    }

    return { answer, sources };
  }
}
