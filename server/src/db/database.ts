import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dms',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function initializeDatabase(): Promise<void> {
  // Create the database if it doesn't exist (connect without specifying db)
  const initConn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: Number(process.env.DB_PORT) || 3306,
  });

  const dbName = process.env.DB_NAME || 'dms';
  await initConn.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await initConn.end();

  // Create tables
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS repositories (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NULL,
      name VARCHAR(255) NOT NULL,
      path TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_repositories_user_id (user_id)
    )
  `);

  // Migration: add user_id to existing installations that lack it
  const [cols] = await pool.execute<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'repositories'
       AND COLUMN_NAME = 'user_id'`
  );
  if ((cols[0] as { cnt: number }).cnt === 0) {
    await pool.execute(
      'ALTER TABLE repositories ADD COLUMN user_id VARCHAR(36) NULL AFTER id'
    );
    await pool.execute(
      'CREATE INDEX idx_repositories_user_id ON repositories (user_id)'
    );
    console.log('✅ Migration: added user_id column to repositories');
  }

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(36) PRIMARY KEY,
      repo_id VARCHAR(36) NOT NULL,
      branch VARCHAR(255),
      start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      end_time TIMESTAMP NULL,
      notes TEXT,
      status ENUM('active', 'completed') DEFAULT 'active',
      FOREIGN KEY (repo_id) REFERENCES repositories(id) ON DELETE CASCADE
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS activities (
      id VARCHAR(36) PRIMARY KEY,
      repo_id VARCHAR(36) NOT NULL,
      session_id VARCHAR(36) NULL,
      type VARCHAR(50) NOT NULL,
      file_path TEXT NULL,
      details TEXT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (repo_id) REFERENCES repositories(id) ON DELETE CASCADE
    )
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS decisions (
      id VARCHAR(36) PRIMARY KEY,
      repo_id VARCHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      context TEXT NULL,
      decision TEXT NOT NULL,
      reason TEXT NOT NULL,
      status ENUM('proposed', 'accepted', 'superseded', 'deprecated') DEFAULT 'accepted',
      tags VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (repo_id) REFERENCES repositories(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Database initialized successfully');
}

export default pool;
