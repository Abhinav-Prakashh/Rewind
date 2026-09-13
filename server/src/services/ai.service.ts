import pool from '../db/database.js';
import { GitService, CommitInfo } from './git.service.js';
import { GoogleGenAI } from '@google/genai';

export interface DBSession {
  id: string;
  repo_id: string;
  branch: string;
  start_time: string;
  end_time: string | null;
  notes: string | null;
  status: string;
}

export interface DBActivity {
  id: string;
  repo_id: string;
  session_id: string | null;
  type: string;
  file_path: string | null;
  details: string | null;
  timestamp: string;
}

export interface DBDecision {
  id: string;
  repo_id: string;
  title: string;
  context: string | null;
  decision: string;
  reason: string;
  status: string;
  tags: string | null;
  created_at: string;
}

export interface MemorySource {
  type: 'session' | 'commit' | 'file' | 'note' | 'decision';
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
    const { rows: repos } = await pool.query(
      'SELECT * FROM repositories WHERE id = $1',
      [repoId]
    );

    if (repos.length === 0) {
      throw new Error('Repository not found');
    }

    const repo = repos[0];
    const gitService = new GitService(repo.path);

    // 2. Fetch Sessions
    const { rows: sessions } = await pool.query(
      'SELECT * FROM sessions WHERE repo_id = $1 ORDER BY start_time DESC LIMIT 20',
      [repoId]
    );

    // 3. Fetch Activities
    const { rows: activities } = await pool.query(
      'SELECT * FROM activities WHERE repo_id = $1 ORDER BY timestamp DESC LIMIT 50',
      [repoId]
    );

    // 4. Fetch Decisions (V8)
    const { rows: decisions } = await pool.query(
      'SELECT * FROM decisions WHERE repo_id = $1 ORDER BY created_at DESC',
      [repoId]
    );

    // 5. Fetch Git Commits & Status
    const commits = await gitService.getRecentCommits(30);
    const gitStatus = await gitService.getStatus();

    const sources: MemorySource[] = [];

    // 6. External LLM Integration (Google Gemini or OpenAI)
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
      try {
        const promptContext = this.buildContextString(repo.name, sessions, commits, activities, gitStatus, decisions);
        const geminiAnswer = await this.callGeminiAPI(geminiKey, promptContext, userQuery);
        if (geminiAnswer) {
          const matchedSources = this.extractRelevantSources(queryLower, sessions, commits, activities, decisions);
          return { answer: geminiAnswer, sources: matchedSources };
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to local memory engine:', err);
      }
    } else if (openaiKey) {
      try {
        const promptContext = this.buildContextString(repo.name, sessions, commits, activities, gitStatus, decisions);
        const llmAnswer = await this.callOpenAI(openaiKey, promptContext, userQuery);
        if (llmAnswer) {
          const matchedSources = this.extractRelevantSources(queryLower, sessions, commits, activities, decisions);
          return { answer: llmAnswer, sources: matchedSources };
        }
      } catch (err) {
        console.warn('OpenAI API call failed, falling back to local memory engine:', err);
      }
    }

    // Built-in Local-first Intelligent Memory Reasoning Engine
    return this.generateLocalMemoryAnswer(queryLower, repo.name, sessions, commits, activities, gitStatus, decisions);
  }

  /**
   * Compiles context for external LLM prompts
   */
  private static buildContextString(
    repoName: string,
    sessions: DBSession[],
    commits: CommitInfo[],
    activities: DBActivity[],
    gitStatus: { branch: string; changedFiles: { path: string; status: string }[] },
    decisions: DBDecision[] = []
  ): string {
    let context = `Project: ${repoName}
Active Branch: ${gitStatus.branch}
Recent Commits:
${commits.slice(0, 15).map((c) => `- [${c.hash}] ${c.message} (by ${c.author} on ${c.date})`).join('\n')}

Recent Sessions:
${sessions.slice(0, 8).map((s) => `- Session (${s.start_time} - ${s.end_time || 'active'} on branch ${s.branch}): Notes: "${s.notes || 'none'}"`).join('\n')}

Recently Modified Files:
${gitStatus.changedFiles.map((f) => `- ${f.path} (${f.status})`).join('\n')}`;

    if (decisions.length > 0) {
      context += `\n\nArchitecture Decisions (Decision Memory):\n${decisions
        .map((d) => `- [${d.status.toUpperCase()}] ${d.title}: Decision: "${d.decision}" | Reason: "${d.reason}" (Date: ${d.created_at})`)
        .join('\n')}`;
    }

    return context;
  }


  /**
   * Calls Google Gemini API using Google Gen AI SDK (gemini-3.6-flash / gemini-3.1-pro-preview)
   */
  private static async callGeminiAPI(apiKey: string, context: string, query: string): Promise<string | null> {
    const modelsToTry = ['gemini-3.6-flash', 'gemini-3.1-pro-preview', 'gemini-2.5-flash', 'gemini-2.0-flash'];
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });


    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `Repository Memory Context:\n${context}\n\nDeveloper Question: ${query}`,
          config: {
            systemInstruction:
              'You are the Rewind AI. Answer questions strictly based on the provided project history, sessions, commits, and notes. Be concise, use markdown bullet points, and cite specific commit hashes, branch names, and file names.',
            temperature: 0.2,
          },
        });

        const text = response.text;
        if (text) {
          console.log(`✅ Successfully generated AI memory response using Gemini (${modelName})`);
          return text;
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn(`Gemini attempt with ${modelName} returned:`, errorMsg);
      }
    }

    return null;
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
              'You are the Rewind AI. Answer questions strictly based on the provided project history, sessions, commits, and notes. Do not write code unless asked for context.',
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
    sessions: DBSession[],
    commits: CommitInfo[],
    activities: DBActivity[],
    decisions: DBDecision[] = []
  ): MemorySource[] {
    const sources: MemorySource[] = [];

    // Decisions matching keywords
    decisions.forEach((d) => {
      if (
        query.includes(d.title.toLowerCase()) ||
        query.includes(d.decision.toLowerCase()) ||
        query.includes(d.reason.toLowerCase())
      ) {
        sources.push({
          type: 'decision',
          label: `Decision: ${d.title}`,
          detail: d.reason,
          timestamp: d.created_at,
        });
      }
    });

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
    sessions: DBSession[],
    commits: CommitInfo[],
    activities: DBActivity[],
    gitStatus: { branch: string; changedFiles: { path: string; status: string }[] },
    decisions: DBDecision[] = []
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

    // Case 4: "Why was [X] created?" / "Reason for..." / "Decisions..."
    if (
      query.includes('why') ||
      query.includes('reason') ||
      query.includes('purpose') ||
      query.includes('decision')
    ) {
      const topic = query.replace(/why was|why is|what is the reason for|created|built|decision on|decisions for/g, '').replace(/[?]/g, '').trim();

      const matchingDecisions = decisions.filter(
        (d) =>
          d.title.toLowerCase().includes(topic) ||
          d.decision.toLowerCase().includes(topic) ||
          d.reason.toLowerCase().includes(topic) ||
          (d.tags && d.tags.toLowerCase().includes(topic))
      );

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

      let answer = `Context regarding **"${topic || 'this item'}"** in **${repoName}**:\n\n`;

      if (matchingDecisions.length > 0) {
        answer += `• **From Decision Memory (ADRs)**:\n`;
        matchingDecisions.forEach((d) => {
          sources.push({
            type: 'decision',
            label: `Decision: ${d.title}`,
            detail: d.reason,
            timestamp: d.created_at,
          });
          answer += `  - **${d.title}** (\`${d.status}\`): "${d.decision}"\n    *Reason:* ${d.reason}\n`;
        });
      }

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

      if (matchingDecisions.length === 0 && matchingNotes.length === 0 && matchingCommits.length === 0) {
        answer += `No explicit decision records or notes were found for "${topic}". Recent session activity was logged under branch \`${gitStatus.branch}\` with last commit *"${commits[0]?.message || 'None'}"*.\n`;
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
