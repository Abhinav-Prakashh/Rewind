const API_BASE = 'http://localhost:3001/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Repository types
export interface Repository {
  id: string;
  name: string;
  path: string;
  branch?: string;
  created_at: string;
}

// Session types
export interface Session {
  id: string;
  repo_id: string;
  branch: string;
  start_time: string;
  end_time: string | null;
  notes: string | null;
  status: 'active' | 'completed';
}

// Git types
export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export interface GitStatus {
  branch: string;
  changedFiles: { path: string; status: string }[];
  ahead: number;
  behind: number;
}

// Repository API
export const repoApi = {
  list: () => request<Repository[]>('/repos'),
  get: (id: string) => request<Repository>(`/repos/${id}`),
  connect: (path: string) =>
    request<Repository>('/repos', {
      method: 'POST',
      body: JSON.stringify({ path }),
    }),
  disconnect: (id: string) =>
    request<{ message: string }>(`/repos/${id}`, { method: 'DELETE' }),
};

// Session API
export const sessionApi = {
  list: (repoId: string) => request<Session[]>(`/repos/${repoId}/sessions`),
  getActive: (repoId: string) => request<Session | null>(`/repos/${repoId}/sessions/active`),
  start: (repoId: string) =>
    request<Session>(`/repos/${repoId}/sessions`, { method: 'POST' }),
  end: (sessionId: string) =>
    request<Session>(`/sessions/${sessionId}/end`, { method: 'PATCH' }),
  updateNotes: (sessionId: string, notes: string) =>
    request<Session>(`/sessions/${sessionId}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    }),
};

// Activity types
export interface Activity {
  id: string;
  repo_id: string;
  session_id: string | null;
  type: 'file_modified' | 'file_created' | 'file_deleted' | 'branch_changed' | 'commit_created';
  file_path: string | null;
  details: string | null;
  timestamp: string;
}

// Git API
export const gitApi = {
  status: (repoId: string) => request<GitStatus>(`/repos/${repoId}/git/status`),
  commits: (repoId: string, count = 10) =>
    request<CommitInfo[]>(`/repos/${repoId}/git/commits?count=${count}`),
  branch: (repoId: string) => request<{ branch: string }>(`/repos/${repoId}/git/branch`),
};

// Activity API
export const activityApi = {
  list: (repoId: string, limit = 50) =>
    request<Activity[]>(`/repos/${repoId}/activities?limit=${limit}`),
  getSessionActivities: (sessionId: string) =>
    request<Activity[]>(`/sessions/${sessionId}/activities`),
};

// V3 Resume Context types
export interface ResumeContext {
  lastWorked: {
    timestamp: string | null;
    relativeText: string;
  };
  workingOn: string;
  files: {
    path: string;
    status?: string;
  }[];
  lastCommit: CommitInfo | null;
  pending: string[];
  changesSinceLastSession: {
    commitsCount: number;
    modifiedFilesCount: number;
    branchChanged: boolean;
    lastSessionBranch?: string;
    currentBranch?: string;
  };
}

// Resume API
export const resumeApi = {
  get: (repoId: string) => request<ResumeContext>(`/repos/${repoId}/resume`),
};

// V4 Timeline types
export interface TimelineEvent {
  id: string;
  title: string;
  type: 'session' | 'commit_cluster' | 'repository_init';
  branch: string;
  startTime: string;
  endTime: string | null;
  notes: string | null;
  commits: CommitInfo[];
  files: {
    path: string;
    status?: string;
  }[];
}

// Timeline API
export const timelineApi = {
  get: (repoId: string) => request<TimelineEvent[]>(`/repos/${repoId}/timeline`),
};

// V5 AI Memory Layer types
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

export interface AISuggestionsResult {
  suggestions: string[];
}

// AI API
export const aiApi = {
  query: (repoId: string, query: string) =>
    request<AIQueryResult>(`/repos/${repoId}/ai/query`, {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
  getSuggestions: (repoId: string) =>
    request<AISuggestionsResult>(`/repos/${repoId}/ai/suggestions`),
};



