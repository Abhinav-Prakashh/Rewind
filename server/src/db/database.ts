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
      name VARCHAR(255) NOT NULL,
      path TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

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

  console.log('✅ Database initialized successfully');
}

export default pool;
