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

// Git API
export const gitApi = {
  status: (repoId: string) => request<GitStatus>(`/repos/${repoId}/git/status`),
  commits: (repoId: string, count = 10) =>
    request<CommitInfo[]>(`/repos/${repoId}/git/commits?count=${count}`),
  branch: (repoId: string) => request<{ branch: string }>(`/repos/${repoId}/git/branch`),
};
