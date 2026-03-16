import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const mysqlHost = process.env.MYSQL_HOST
const mysqlPort = Number(process.env.MYSQL_PORT || 3306)
const mysqlUser = process.env.MYSQL_USER
const mysqlPassword = process.env.MYSQL_PASSWORD
const mysqlDatabase = process.env.MYSQL_DATABASE

export const pool = mysql.createPool({
  host: mysqlHost,
  port: mysqlPort,
  user: mysqlUser,
  password: mysqlPassword,
  database: mysqlDatabase,
  waitForConnections: true,
  connectionLimit: 10,
})

async function ensureColumnExists(tableName, columnName, columnDefinition) {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [mysqlDatabase, tableName, columnName],
  )

  if (rows.length === 0) {
    await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`)
  }
}

async function ensureIndexExists(tableName, indexName, indexColumnsSql) {
  const [rows] = await pool.query(
    `SELECT INDEX_NAME
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?
     LIMIT 1`,
    [mysqlDatabase, tableName, indexName],
  )

  if (rows.length === 0) {
    await pool.query(`CREATE INDEX ${indexName} ON ${tableName} (${indexColumnsSql})`)
  }
}

export async function initializeDatabase() {
  const adminConnection = await mysql.createConnection({
    host: mysqlHost,
    port: mysqlPort,
    user: mysqlUser,
    password: mysqlPassword,
  })

  await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${mysqlDatabase}\`;`)
  await adminConnection.end()

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(180) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('coach', 'student') NOT NULL,
      preferred_coach_email VARCHAR(180) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `)

  await ensureColumnExists('users', 'preferred_coach_email', 'preferred_coach_email VARCHAR(180) NULL')
  await ensureIndexExists('users', 'idx_users_role', 'role')
  await ensureIndexExists('users', 'idx_users_preferred_coach_email', 'preferred_coach_email')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS kick_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_email VARCHAR(180) NOT NULL,
      student_name VARCHAR(120) NOT NULL,
      kick_force DECIMAL(8,2) NOT NULL,
      spin_x INT NOT NULL,
      spin_y INT NOT NULL,
      spin_z INT NOT NULL,
      score INT NOT NULL,
      created_at DATETIME NOT NULL,
      INDEX idx_kick_student_email (student_email),
      INDEX idx_kick_created_at (created_at)
    ) ENGINE=InnoDB;
  `)
  await ensureIndexExists('kick_history', 'idx_kick_student_email_created_at', 'student_email, created_at')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_plans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_email VARCHAR(180) NOT NULL UNIQUE,
      student_name VARCHAR(120) NOT NULL,
      matches_played INT NOT NULL DEFAULT 0,
      matches_to_play INT NOT NULL DEFAULT 0,
      schedule_json JSON NOT NULL,
      practice_json JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `)
  await ensureIndexExists('student_plans', 'idx_student_plans_name', 'student_name')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS coach_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      coach_email VARCHAR(180) NOT NULL,
      title VARCHAR(180) NOT NULL,
      focus_area VARCHAR(180) NULL,
      location VARCHAR(180) NULL,
      scheduled_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_coach_sessions_coach_email (coach_email),
      INDEX idx_coach_sessions_scheduled_at (scheduled_at)
    ) ENGINE=InnoDB;
  `)
  await ensureIndexExists('coach_sessions', 'idx_coach_sessions_coach_scheduled', 'coach_email, scheduled_at')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS login_audit (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      user_email VARCHAR(180) NOT NULL,
      role ENUM('coach', 'student') NULL,
      was_successful TINYINT(1) NOT NULL,
      failure_reason VARCHAR(255) NULL,
      ip_address VARCHAR(64) NULL,
      user_agent VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_login_audit_email (user_email),
      INDEX idx_login_audit_created_at (created_at)
    ) ENGINE=InnoDB;
  `)
  await ensureIndexExists('login_audit', 'idx_login_audit_success_created', 'was_successful, created_at')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS coach_reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      coach_email VARCHAR(180) NOT NULL,
      student_email VARCHAR(180) NOT NULL,
      student_name VARCHAR(120) NOT NULL,
      notes TEXT NULL,
      rating INT NULL,
      reviewed_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_coach_reviews_coach_email (coach_email),
      INDEX idx_coach_reviews_student_email (student_email),
      INDEX idx_coach_reviews_reviewed_at (reviewed_at)
    ) ENGINE=InnoDB;
  `)
  await ensureIndexExists('coach_reviews', 'idx_coach_reviews_coach_student_time', 'coach_email, student_email, reviewed_at')

  await pool.query(`
    UPDATE users AS student
    LEFT JOIN users AS coach
      ON LOWER(student.preferred_coach_email) = LOWER(coach.email)
      AND coach.role = 'coach'
    SET student.preferred_coach_email = NULL
    WHERE student.role = 'student'
      AND student.preferred_coach_email IS NOT NULL
      AND coach.id IS NULL;
  `)
}
