# Rewind ⏪

> **Pick up where you left off.**  
> An intelligent Developer Memory System (DMS) that tracks your local Git repositories, work sessions, architectural decisions, and allows you to query past context using AI.

[![React](https://img.shields.io/badge/React-19-blue.svg?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000.svg?logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1.svg?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Memory-8E75B2.svg?logo=google&logoColor=white)](https://ai.google.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20PKCE-3ECF8E.svg?logo=supabase&logoColor=white)](https://supabase.com/)

---

## ⚡ Overview

Context switching is one of the biggest productivity killers in software development. Stepping away from a codebase for a weekend or switching branches often means losing track of:
- *What was I in the middle of?*
- *Why did we make that architectural change?*
- *Which files were modified across recent experiments?*

**Rewind** bridges this gap by turning your active Git workspaces into a persistent memory stream. It watches file changes, groups work into focused sessions, records architectural decisions, and leverages **Google Gemini** for semantic search across your project's development history.

---

## ✨ Features

- **🧠 AI Memory Assistant**: Chat with your repository using natural language powered by Google Gemini. Ask *"What was I working on recently?"*, *"Why was the latest feature added?"*, or *"Which files are related to timeline or sessions?"*.
- **📝 Formatted Markdown Responses**: Gemini responses render with rich GitHub-flavored Markdown (GFM), including syntax-highlighted code blocks, inline code badges, tables, and clickable references.
- **⏱️ Work Sessions**: Start and end focused development sessions with notes and goal tracking. Rewind automatically correlates session windows with commits and file modifications.
- **🧭 Resume Context**: Instantly see your last-worked timestamp, active branch, pending uncommitted changes, recent commit messages, and a summary of what changed since your last session.
- **📐 Decision Memory (ADRs)**: Log and manage architectural decisions with rationale, status (`proposed`, `accepted`, `superseded`, `deprecated`), context, and searchable tags.
- **📈 Interactive Timeline & Activity Feed**: Chronological view of sessions, commit clusters, branch switches, and file changes.
- **🔒 Supabase PKCE Authentication**: Secure authentication via GitHub and Google OAuth with PKCE flow.
- **🛡️ Multi-User Data Isolation**: Workspaces, connected repositories, and cached states are strictly isolated per Supabase user ID on both the server and client.
- **📂 Native Folder Picker**: macOS AppleScript integration for selecting local Git repositories with a single click.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite 8
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + Custom Design System
- **Markdown**: `react-markdown` + `remark-gfm`
- **Authentication**: Supabase Auth (`@supabase/supabase-js`) with PKCE flow

### Backend
- **Server**: Node.js + Express
- **Language**: TypeScript (running via `tsx` watch mode)
- **Database**: MySQL (`mysql2` connection pool with auto-migrating schema)
- **AI / LLM**: Google Gemini API (`@google/genai`, `@google/generative-ai`)
- **Git & Filesystem**: `simple-git`, `chokidar`

---

## 📁 Project Structure

```text
Rewind/
├── client/                     # Frontend React application
│   ├── src/
│   │   ├── components/         # UI components (AIMemoryChat, Dashboard, Timeline, etc.)
│   │   │   └── auth/           # ProtectedRoute, UserProfileMenu
│   │   ├── hooks/              # Custom React hooks (useApi, useAuth, etc.)
│   │   ├── lib/                # API client with Bearer auth, Supabase client
│   │   ├── pages/              # Login, AuthCallback, Dashboard views
│   │   ├── index.css           # Tailwind v4 theme tokens & global styles
│   │   └── App.tsx             # Root router with auth guards
│   ├── package.json
│   └── vite.config.ts
│
├── server/                     # Backend Express API & Database
│   ├── src/
│   │   ├── db/                 # MySQL connection pool & table schemas
│   │   ├── middleware/         # Supabase Bearer token verification
│   │   ├── routes/             # REST routes (repo, session, git, ai, decision, etc.)
│   │   ├── services/           # AI service (Gemini), Git service, Watcher service
│   │   └── index.ts            # Express server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── package.json                # Root package with concurrent dev scripts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher (v20+ recommended)
- **MySQL** running locally or remotely
- **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com))
- **Supabase Project** (for OAuth & User Authentication)

---

### 1. Clone the Repository

```bash
git clone https://github.com/Abhinav-Prakashh/Rewind.git
cd Rewind
```

### 2. Install Dependencies

Install root, server, and client dependencies:

```bash
npm run install:all
```

---

### 3. Configure Environment Variables

#### Backend (`server/.env`)
Create `server/.env` with your MySQL credentials, Gemini key, and Supabase config:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=dms

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Supabase (for server-side token verification)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Frontend (`client/.env`)
Create `client/.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

> **Note**: In your Supabase Dashboard, set the OAuth redirect URL to:
> `http://localhost:5173/auth/callback` (or your client dev port).

---

### 4. Database Setup

Ensure MySQL is running. When you start the server, Rewind will **automatically** create the `dms` database and initialize all required tables (`repositories`, `sessions`, `activities`, `decisions`) along with necessary indexes.

---

### 5. Run the Application

Start both the backend API and frontend dev server concurrently:

```bash
npm run dev
```

- **Client**: `http://localhost:5173`
- **Server API**: `http://localhost:3001`
- **Health Check**: `http://localhost:3001/api/health`

---

## 📖 Key Workflows

1. **Sign in**: Log in via GitHub or Google OAuth on `/login`.
2. **Connect a Repository**: Browse to a local Git repository on your machine or paste its absolute path.
3. **Start a Session**: Click **Start Session**, enter what you are focusing on, and develop as usual.
4. **View Context & Activity**: Switch between Overview, Timeline, Decisions, and AI Memory tabs to review what has changed.
5. **Ask Gemini**: Open the **AI Memory Assistant** to ask questions about your recent work, git diffs, or architectural choices.

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).
