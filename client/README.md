# Rewind Frontend Client

This is the frontend client for **[Rewind](..)**, built with React 19, TypeScript, Vite, and Tailwind CSS v4.

## Features Included
- **Supabase Authentication**: PKCE OAuth with Google & GitHub.
- **AI Memory Assistant**: Markdown-rendered responses via `react-markdown` and `remark-gfm`.
- **Work Session Management**: Active session indicators, timers, and note updates.
- **Repository Dashboard**: Timeline visualizations, resume context view, and decision memory manager.
- **User Scoped Storage**: Isolated workspaces and last-active repository memory per user ID.

## Scripts

```bash
# Start development server
npm run dev

# Type check & build for production
npm run build

# Lint code with oxlint
npm run lint

# Preview production build
npm run preview
```

## Environment Variables

Ensure `.env` contains your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

For the full setup and backend documentation, refer to the [Root README](../README.md).
