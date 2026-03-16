import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initializeDatabase, pool } from './db.js'
import { buildDefaultPlan } from './plans.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const app = express()
const port = Number(process.env.PORT || 4000)
const host = process.env.HOST || '0.0.0.0'
const jwtSecret = process.env.JWT_SECRET || 'spin-x-dev-secret'

app.set('trust proxy', 1)

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

async function initializeDatabaseWithRetry() {
  const maxRetries = Number(process.env.STARTUP_MAX_RETRIES || 0)
  const retryDelayMs = Number(process.env.STARTUP_RETRY_DELAY_MS || 5000)

  for (let attempt = 0; ; attempt += 1) {
    try {
      await initializeDatabase()
      return
    } catch (error) {
      if (attempt >= maxRetries) {
        throw error
      }

      console.error(
        `Database initialization failed. Retrying in ${retryDelayMs}ms (${attempt + 1}/${maxRetries}).`,
        error,
      )
      await sleep(retryDelayMs)
    }
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true)
        return
      }

      const configuredOrigins = (process.env.FRONTEND_ORIGIN || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
      const isConfiguredMatch = configuredOrigins.includes(origin)
      const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
      const isPrivateNetwork = /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)[^:]+:\d+$/.test(origin)

      if (isConfiguredMatch || isLocalhost || isPrivateNetwork) {
        callback(null, true)
        return
      }

      callback(new Error('Origin not allowed by CORS'))
    },
    credentials: false,
  }),
)
app.use(express.json())

function toClientUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    preferredCoachEmail: row.preferred_coach_email || '',
  }
}

function createToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    jwtSecret,
    { expiresIn: '7d' },
  )
}

function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''

  if (!token) {
    return res.status(401).json({ error: 'Authentication token is required.' })
  }

  try {
    req.auth = jwt.verify(token, jwtSecret)
    return next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' })
  }
}

async function writeLoginAudit({ req, userId = null, email = '', role = null, wasSuccessful, failureReason = null }) {
  const forwardedFor = req.headers['x-forwarded-for']
  let ipAddress = req.ip || null

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    ipAddress = forwardedFor[0]
  } else if (typeof forwardedFor === 'string') {
    ipAddress = forwardedFor.split(',')[0].trim()
  }

  const userAgent = (req.headers['user-agent'] || '').slice(0, 255)
  const normalizedEmail = (email || '').trim().toLowerCase()
  const normalizedRole = role && ['coach', 'student'].includes(role) ? role : null

  await pool.query(
    `INSERT INTO login_audit (user_id, user_email, role, was_successful, failure_reason, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      normalizedEmail || 'unknown',
      normalizedRole,
      wasSuccessful ? 1 : 0,
      failureReason,
      ipAddress ? String(ipAddress).slice(0, 64) : null,
      userAgent || null,
    ],
  )
}

async function ensurePlanIfMissing(user, index = 0) {
  if (user.role !== 'student') {
    return null
  }

  const [existing] = await pool.query('SELECT id FROM student_plans WHERE student_email = ? LIMIT 1', [
    user.email,
  ])

  if (existing.length > 0) {
    return null
  }

  const plan = buildDefaultPlan(user.name, user.email, index)
  await pool.query(
    `INSERT INTO student_plans (student_email, student_name, matches_played, matches_to_play, schedule_json, practice_json)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      plan.studentEmail,
      plan.studentName,
      plan.matchesPlayed,
      plan.matchesToPlay,
      JSON.stringify(plan.schedule),
      JSON.stringify(plan.practicePlan),
    ],
  )

  return plan
}

app.get('/api/health', async (_, res) => {
  await pool.query('SELECT 1')
  res.json({ ok: true })
})

app.get('/api/users', async (_, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, preferred_coach_email FROM users ORDER BY id ASC',
  )
  res.json(rows.map(toClientUser))
})

app.get('/api/plans', async (_, res) => {
  const [rows] = await pool.query(
    `SELECT student_email, student_name, matches_played, matches_to_play, schedule_json, practice_json
     FROM student_plans
     ORDER BY student_name ASC`,
  )

  const plans = rows.map((row) => ({
    email: row.student_email,
    name: row.student_name,
    matchesPlayed: row.matches_played,
    matchesToPlay: row.matches_to_play,
    schedule: Array.isArray(row.schedule_json) ? row.schedule_json : JSON.parse(row.schedule_json || '[]'),
    practicePlan: Array.isArray(row.practice_json) ? row.practice_json : JSON.parse(row.practice_json || '[]'),
  }))

  res.json(plans)
})

app.get('/api/kicks', async (_, res) => {
  const [rows] = await pool.query(
    `SELECT student_email, student_name, kick_force, spin_x, spin_y, spin_z, score, created_at
     FROM kick_history
     ORDER BY created_at ASC`,
  )

  const kicks = rows.map((row) => ({
    studentEmail: row.student_email,
    studentName: row.student_name,
    force: Number(row.kick_force),
    spinX: row.spin_x,
    spinY: row.spin_y,
    spinZ: row.spin_z,
    score: row.score,
    createdAt: new Date(row.created_at).toISOString(),
  }))

  res.json(kicks)
})

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, role } = req.body || {}
  const normalizedName = (name || '').trim()
  const normalizedEmail = (email || '').trim().toLowerCase()

  if (!normalizedName || !normalizedEmail || !password || !role) {
    return res.status(400).json({ error: 'Missing required signup fields.' })
  }

  if (!['coach', 'student'].includes(role)) {
    return res.status(400).json({ error: 'Role must be coach or student.' })
  }

  const [exists] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail])
  if (exists.length > 0) {
    return res.status(409).json({ error: 'An account with this email already exists.' })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const [insertResult] = await pool.query(
    'INSERT INTO users (name, email, password, role, preferred_coach_email) VALUES (?, ?, ?, ?, ?)',
    [normalizedName, normalizedEmail, passwordHash, role, null],
  )

  const user = { id: insertResult.insertId, name: normalizedName, email: normalizedEmail, role, preferredCoachEmail: '' }
  const token = createToken(user)
  await ensurePlanIfMissing(user, Number(insertResult.insertId % 3))

  return res.status(201).json({ user, token })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body || {}
  const normalizedEmail = (email || '').trim().toLowerCase()

  if (!normalizedEmail || !password) {
    await writeLoginAudit({
      req,
      email: normalizedEmail,
      role,
      wasSuccessful: false,
      failureReason: 'Missing login email or password',
    })
    return res.status(400).json({ error: 'Email and password are required.' })
  }

  const [rows] = await pool.query(
    'SELECT id, name, email, role, password, preferred_coach_email FROM users WHERE email = ? LIMIT 1',
    [normalizedEmail],
  )

  if (rows.length === 0) {
    await writeLoginAudit({
      req,
      email: normalizedEmail,
      role: null,
      wasSuccessful: false,
      failureReason: 'User not found',
    })
    return res.status(401).json({ error: 'Invalid credentials.' })
  }

  const storedPassword = rows[0].password
  const isHash = typeof storedPassword === 'string' && storedPassword.startsWith('$2')

  const isPasswordValid = isHash ? await bcrypt.compare(password, storedPassword) : storedPassword === password

  if (!isPasswordValid) {
    await writeLoginAudit({
      req,
      userId: rows[0].id,
      email: normalizedEmail,
      role: rows[0].role,
      wasSuccessful: false,
      failureReason: 'Invalid password',
    })
    return res.status(401).json({ error: 'Invalid credentials.' })
  }

  if (!isHash) {
    const upgradedHash = await bcrypt.hash(password, 10)
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [upgradedHash, rows[0].id])
  }

  const user = toClientUser(rows[0])
  const token = createToken(user)
  await ensurePlanIfMissing(user, Number(rows[0].id % 3))

  await writeLoginAudit({
    req,
    userId: rows[0].id,
    email: rows[0].email,
    role: rows[0].role,
    wasSuccessful: true,
  })

  return res.json({ user, token })
})

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email, newPassword } = req.body || {}
  const normalizedEmail = (email || '').trim().toLowerCase()

  if (!normalizedEmail || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required.' })
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' })
  }

  const [rows] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail])

  if (rows.length === 0) {
    return res.status(404).json({ error: 'No account found for this email.' })
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await pool.query('UPDATE users SET password = ? WHERE id = ?', [passwordHash, rows[0].id])

  return res.json({ message: 'Password reset successful.' })
})

app.post('/api/kicks', requireAuth, async (req, res) => {
  const { studentEmail, studentName, force, spinX, spinY, spinZ, score, createdAt } = req.body || {}

  if (!studentEmail || !studentName) {
    return res.status(400).json({ error: 'studentEmail and studentName are required.' })
  }

  const parsedForce = Number(force)
  const parsedSpinX = Number(spinX)
  const parsedSpinY = Number(spinY)
  const parsedSpinZ = Number(spinZ)
  const parsedScore = Number(score)

  if ([parsedForce, parsedSpinX, parsedSpinY, parsedSpinZ, parsedScore].some(Number.isNaN)) {
    return res.status(400).json({ error: 'Kick values must be valid numbers.' })
  }

  const createdDate = createdAt ? new Date(createdAt) : new Date()

  await pool.query(
    `INSERT INTO kick_history (student_email, student_name, kick_force, spin_x, spin_y, spin_z, score, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [studentEmail, studentName, parsedForce, parsedSpinX, parsedSpinY, parsedSpinZ, parsedScore, createdDate],
  )

  return res.status(201).json({
    kick: {
      studentEmail,
      studentName,
      force: parsedForce,
      spinX: parsedSpinX,
      spinY: parsedSpinY,
      spinZ: parsedSpinZ,
      score: parsedScore,
      createdAt: createdDate.toISOString(),
    },
  })
})

app.put('/api/plans/:studentEmail', requireAuth, async (req, res) => {
  const studentEmail = decodeURIComponent(req.params.studentEmail)
  const { name, matchesPlayed, matchesToPlay, schedule, practicePlan } = req.body || {}

  if (!studentEmail || !name) {
    return res.status(400).json({ error: 'studentEmail and name are required.' })
  }

  if (!Array.isArray(schedule) || !Array.isArray(practicePlan)) {
    return res.status(400).json({ error: 'schedule and practicePlan must be arrays.' })
  }

  await pool.query(
    `INSERT INTO student_plans (student_email, student_name, matches_played, matches_to_play, schedule_json, practice_json)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       student_name = VALUES(student_name),
       matches_played = VALUES(matches_played),
       matches_to_play = VALUES(matches_to_play),
       schedule_json = VALUES(schedule_json),
       practice_json = VALUES(practice_json)`,
    [
      studentEmail,
      name,
      Number(matchesPlayed || 0),
      Number(matchesToPlay || 0),
      JSON.stringify(schedule),
      JSON.stringify(practicePlan),
    ],
  )

  return res.json({ ok: true })
})

app.put('/api/students/:studentEmail/coach', requireAuth, async (req, res) => {
  const studentEmail = decodeURIComponent(req.params.studentEmail)
  const { coachEmail } = req.body || {}

  if (req.auth.role !== 'student' || req.auth.email !== studentEmail) {
    return res.status(403).json({ error: 'Only the logged in student can choose their coach.' })
  }

  const normalizedCoachEmail = (coachEmail || '').trim().toLowerCase()

  if (!normalizedCoachEmail) {
    await pool.query('UPDATE users SET preferred_coach_email = NULL WHERE email = ? AND role = ?', [studentEmail, 'student'])

    const [studentRows] = await pool.query(
      'SELECT id, name, email, role, preferred_coach_email FROM users WHERE email = ? AND role = ? LIMIT 1',
      [studentEmail, 'student'],
    )

    return res.json({ user: toClientUser(studentRows[0]) })
  }

  const [coachRows] = await pool.query('SELECT email FROM users WHERE email = ? AND role = ? LIMIT 1', [
    normalizedCoachEmail,
    'coach',
  ])

  if (coachRows.length === 0) {
    return res.status(404).json({ error: 'Selected coach not found.' })
  }

  await pool.query('UPDATE users SET preferred_coach_email = ? WHERE email = ? AND role = ?', [
    normalizedCoachEmail,
    studentEmail,
    'student',
  ])

  const [studentRows] = await pool.query(
    'SELECT id, name, email, role, preferred_coach_email FROM users WHERE email = ? AND role = ? LIMIT 1',
    [studentEmail, 'student'],
  )

  return res.json({ user: toClientUser(studentRows[0]) })
})

app.get('/api/sessions/today', requireAuth, async (req, res) => {
  if (req.auth.role !== 'coach') {
    return res.status(403).json({ error: 'Only coaches can view today sessions.' })
  }

  const [rows] = await pool.query(
    `SELECT id, coach_email, title, focus_area, location, scheduled_at, created_at
     FROM coach_sessions
     WHERE coach_email = ? AND DATE(scheduled_at) = CURDATE()
     ORDER BY scheduled_at ASC`,
    [req.auth.email],
  )

  const sessions = rows.map((row) => ({
    id: row.id,
    coachEmail: row.coach_email,
    title: row.title,
    focusArea: row.focus_area || '',
    location: row.location || '',
    scheduledAt: new Date(row.scheduled_at).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
  }))

  return res.json(sessions)
})

app.post('/api/sessions', requireAuth, async (req, res) => {
  if (req.auth.role !== 'coach') {
    return res.status(403).json({ error: 'Only coaches can create sessions.' })
  }

  const { title, focusArea, location, scheduledAt } = req.body || {}

  if (!title || !scheduledAt) {
    return res.status(400).json({ error: 'title and scheduledAt are required.' })
  }

  const scheduledDate = new Date(scheduledAt)
  if (Number.isNaN(scheduledDate.getTime())) {
    return res.status(400).json({ error: 'scheduledAt must be a valid date-time.' })
  }

  await pool.query(
    `INSERT INTO coach_sessions (coach_email, title, focus_area, location, scheduled_at)
     VALUES (?, ?, ?, ?, ?)`,
    [req.auth.email, title.trim(), (focusArea || '').trim() || null, (location || '').trim() || null, scheduledDate],
  )

  const [rows] = await pool.query(
    `SELECT id, coach_email, title, focus_area, location, scheduled_at, created_at
     FROM coach_sessions
     WHERE coach_email = ? AND DATE(scheduled_at) = CURDATE()
     ORDER BY id DESC
     LIMIT 1`,
    [req.auth.email],
  )

  const row = rows[0]
  return res.status(201).json({
    session: {
      id: row.id,
      coachEmail: row.coach_email,
      title: row.title,
      focusArea: row.focus_area || '',
      location: row.location || '',
      scheduledAt: new Date(row.scheduled_at).toISOString(),
      createdAt: new Date(row.created_at).toISOString(),
    },
  })
})

app.get('/api/reviews/pending', requireAuth, async (req, res) => {
  if (req.auth.role !== 'coach') {
    return res.status(403).json({ error: 'Only coaches can view pending reviews.' })
  }

  const [rows] = await pool.query(
    `SELECT
       student.email AS student_email,
       student.name AS student_name,
       MAX(review.reviewed_at) AS last_reviewed_at
     FROM users AS student
     LEFT JOIN coach_reviews AS review
       ON review.student_email = student.email
       AND review.coach_email = ?
     WHERE student.role = 'student'
       AND student.preferred_coach_email = ?
     GROUP BY student.email, student.name
     HAVING last_reviewed_at IS NULL OR DATE(last_reviewed_at) < CURDATE()
     ORDER BY student.name ASC`,
    [req.auth.email, req.auth.email],
  )

  const pending = rows.map((row) => ({
    studentEmail: row.student_email,
    studentName: row.student_name,
    lastReviewedAt: row.last_reviewed_at ? new Date(row.last_reviewed_at).toISOString() : null,
  }))

  return res.json(pending)
})

app.get('/api/reviews', requireAuth, async (req, res) => {
  if (req.auth.role !== 'coach') {
    return res.status(403).json({ error: 'Only coaches can view reviews.' })
  }

  const fromDate = (req.query.fromDate || '').toString().trim()
  const toDate = (req.query.toDate || '').toString().trim()

  const filters = ['coach_email = ?']
  const params = [req.auth.email]

  if (fromDate) {
    filters.push('DATE(reviewed_at) >= ?')
    params.push(fromDate)
  }

  if (toDate) {
    filters.push('DATE(reviewed_at) <= ?')
    params.push(toDate)
  }

  const [rows] = await pool.query(
    `SELECT id, coach_email, student_email, student_name, notes, rating, reviewed_at, created_at
     FROM coach_reviews
     WHERE ${filters.join(' AND ')}
     ORDER BY reviewed_at DESC`,
    params,
  )

  const reviews = rows.map((row) => ({
    id: row.id,
    coachEmail: row.coach_email,
    studentEmail: row.student_email,
    studentName: row.student_name,
    notes: row.notes || '',
    rating: row.rating,
    reviewedAt: new Date(row.reviewed_at).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
  }))

  return res.json(reviews)
})

app.post('/api/reviews', requireAuth, async (req, res) => {
  if (req.auth.role !== 'coach') {
    return res.status(403).json({ error: 'Only coaches can submit reviews.' })
  }

  const { studentEmail, notes, rating } = req.body || {}
  const normalizedStudentEmail = (studentEmail || '').trim().toLowerCase()

  if (!normalizedStudentEmail) {
    return res.status(400).json({ error: 'studentEmail is required.' })
  }

  const [studentRows] = await pool.query(
    `SELECT name, email
     FROM users
     WHERE role = 'student'
       AND email = ?
       AND preferred_coach_email = ?
     LIMIT 1`,
    [normalizedStudentEmail, req.auth.email],
  )

  if (studentRows.length === 0) {
    return res.status(404).json({ error: 'Student not found under this coach.' })
  }

  const reviewedAt = new Date()
  const normalizedRating = Number.isFinite(Number(rating)) ? Number(rating) : null

  await pool.query(
    `INSERT INTO coach_reviews (coach_email, student_email, student_name, notes, rating, reviewed_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      req.auth.email,
      normalizedStudentEmail,
      studentRows[0].name,
      (notes || '').trim() || null,
      normalizedRating,
      reviewedAt,
    ],
  )

  return res.status(201).json({
    review: {
      coachEmail: req.auth.email,
      studentEmail: normalizedStudentEmail,
      studentName: studentRows[0].name,
      notes: (notes || '').trim() || '',
      rating: normalizedRating,
      reviewedAt: reviewedAt.toISOString(),
    },
  })
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: error.message || 'Internal server error' })
})

try {
  await initializeDatabaseWithRetry()
  app.listen(port, host, () => {
    console.log(`API running on http://${host}:${port}`)
  })
} catch (error) {
  console.error('Failed to start API:', error)
  process.exit(1)
}
