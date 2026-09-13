import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({
  connectionString,
  ssl:
    process.env.DATABASE_SSL === 'false' || !connectionString || connectionString.includes('localhost')
      ? false
      : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export async function initializeDatabase(): Promise<void> {
  // Test database connection
  await pool.query('SELECT 1');

  // Create repositories table & user index
  await pool.query(`
    CREATE TABLE IF NOT EXISTS repositories (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NULL,
      name VARCHAR(255) NOT NULL,
      path TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories (user_id);
  `);

  // Create sessions table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(36) PRIMARY KEY,
      repo_id VARCHAR(36) NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
      branch VARCHAR(255),
      start_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      end_time TIMESTAMPTZ NULL,
      notes TEXT,
      status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed'))
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_repo_id ON sessions (repo_id);
  `);

  // Create activities table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS activities (
      id VARCHAR(36) PRIMARY KEY,
      repo_id VARCHAR(36) NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
      session_id VARCHAR(36) NULL,
      type VARCHAR(50) NOT NULL,
      file_path TEXT NULL,
      details TEXT NULL,
      timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_activities_repo_id ON activities (repo_id);
    CREATE INDEX IF NOT EXISTS idx_activities_session_id ON activities (session_id);
  `);

  // Create decisions table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS decisions (
      id VARCHAR(36) PRIMARY KEY,
      repo_id VARCHAR(36) NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      context TEXT NULL,
      decision TEXT NOT NULL,
      reason TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'accepted' CHECK (status IN ('proposed', 'accepted', 'superseded', 'deprecated')),
      tags VARCHAR(255) NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_decisions_repo_id ON decisions (repo_id);
  `);

  console.log('✅ PostgreSQL database initialized successfully');
}

export default pool;
