/** Accept either the server origin or its /api URL, including trailing slashes. */
export function resolveApiBase(configured: string | undefined, development: boolean): string {
  const base = (configured?.trim() || (development ? 'http://localhost:3001' : '')).replace(/\/+$/, '');
  if (!base) return '';
  return /\/api$/i.test(base) ? base : `${base}/api`;
}

export async function apiRequest<T>(base: string, url: string, token: string | null, options?: RequestInit): Promise<T> {
  if (!base) throw new Error('The server address is not configured. Set VITE_API_URL and rebuild the frontend.');
  if (!token) throw new Error('Your session has expired. Please sign in again.');
  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${base}${url}`, { ...options, headers });
  } catch {
    throw new Error('Unable to reach the Rewind server. Check your connection and retry. If this continues, check the API URL and allowed frontend origin.');
  }

  let validJson = true;
  const data: unknown = await response.json().catch(() => { validJson = false; return null; });
  if (!response.ok) {
    if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') throw new Error(data.error);
    if (response.status === 413) throw new Error('This upload is too large. Select a smaller repository and retry.');
    if (response.status === 401) throw new Error('Your session has expired. Please sign in again.');
    if (response.status === 404 || response.status === 405) throw new Error(`The Rewind API endpoint was not found (HTTP ${response.status}). Check the deployed API URL and backend version.`);
    throw new Error(`The Rewind server returned HTTP ${response.status}. Please retry shortly.`);
  }
  if (!validJson || !response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('The server returned a web page instead of API data. Check that VITE_API_URL points to the Render backend.');
  }
  return data as T;
}
