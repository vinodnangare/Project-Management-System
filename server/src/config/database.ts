import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * MySQL Database Configuration
 * 
 * Why MySQL:
 * - Reliable relational database for production
 * - Better for distributed systems than SQLite
 * - Easy to scale and backup
 * - Industry standard for task/project management systems
 * - Connection pooling for optimal performance
 */

// MySQL connection pool configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'task_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * Initialize database schema
 * Creates tables for tasks, comments, and activity logs if they don't exist
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();

    // Users table - authentication and user management
    await connection.execute(
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );

    // Tasks table - main task data
    await connection.execute(
      `CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description LONGTEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'TODO',
        priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
        assigned_to VARCHAR(255),
        created_by VARCHAR(255) NOT NULL,
        due_date DATETIME,
        estimated_hours DECIMAL(10,2) DEFAULT NULL,
        is_deleted BOOLEAN DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_created_by (created_by),
        INDEX idx_assigned_to (assigned_to),
        INDEX idx_is_deleted (is_deleted)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );

    // Add estimated_hours column if it doesn't exist (for existing databases)
    try {
      await connection.execute(
        `ALTER TABLE tasks ADD COLUMN estimated_hours DECIMAL(10,2) DEFAULT NULL`
      );
      console.log('✓ Added estimated_hours column to tasks table');
    } catch (error: any) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        // Only log if it's not a "column already exists" error
        console.log('⚠ estimated_hours column already exists or error:', error.message);
      }
    }

    // Comments table - stores task discussions
    await connection.execute(
      `CREATE TABLE IF NOT EXISTS task_comments (
        id VARCHAR(36) PRIMARY KEY,
        task_id VARCHAR(36) NOT NULL,
        comment LONGTEXT NOT NULL,
        created_by VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        INDEX idx_task_id (task_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );

    // Activity logs table - audit trail of all changes
    await connection.execute(
      `CREATE TABLE IF NOT EXISTS task_activities (
        id VARCHAR(36) PRIMARY KEY,
        task_id VARCHAR(36) NOT NULL,
        action VARCHAR(100) NOT NULL,
        old_value LONGTEXT,
        new_value LONGTEXT,
        performed_by VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        INDEX idx_task_id (task_id),
        INDEX idx_action (action),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );

    // Time Logs table - daily time tracking for employees
    await connection.execute(
      `CREATE TABLE IF NOT EXISTS time_logs (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        task_id VARCHAR(36),
        hours_worked DECIMAL(5,2) NOT NULL,
        date DATE NOT NULL,
        description LONGTEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_date (date),
        INDEX idx_task_id (task_id),
        UNIQUE KEY unique_user_date (user_id, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );

    // Task Assignees Junction Table - supports multiple assignees per task
    await connection.execute(
      `CREATE TABLE IF NOT EXISTS task_assignees (
        id VARCHAR(36) PRIMARY KEY,
        task_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        assigned_by VARCHAR(255) NOT NULL,
        assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_task_user (task_id, user_id),
        INDEX idx_task_id (task_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );

    connection.release();
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

/**
 * Get a connection from the pool
 * @returns Promise<PoolConnection>
 */
export const getConnection = async () => {
  return pool.getConnection();
};

/**
 * Execute a query with parameters
 * @param query SQL query string
 * @param params Query parameters
 * @returns Promise<[rows, fields]>
 */
export const executeQuery = async (query: string, params: any[] = []) => {
  const connection = await getConnection();
  try {
    const result = await connection.execute(query, params);
    return result;
  } finally {
    connection.release();
  }
};

export default pool;
