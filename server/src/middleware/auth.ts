import { Request, Response, NextFunction } from 'express';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

export interface AuthenticatedRequest extends Request {
  userId: string;
}

/**
 * Validates the Supabase access token sent as a Bearer header.
 * Calls Supabase's /auth/v1/user endpoint — no JWT secret needed.
 * Attaches req.userId on success; returns 401 on failure.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[auth] SUPABASE_URL or SUPABASE_ANON_KEY not set — cannot validate tokens');
    res.status(500).json({ error: 'Server auth not configured' });
    return;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });

    if (!response.ok) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    const user = (await response.json()) as { id?: string };

    if (!user?.id) {
      res.status(401).json({ error: 'Could not resolve user from token' });
      return;
    }

    (req as AuthenticatedRequest).userId = user.id;
    next();
  } catch (err) {
    console.error('[auth] Token validation error:', err);
    res.status(500).json({ error: 'Auth service unavailable' });
  }
}
