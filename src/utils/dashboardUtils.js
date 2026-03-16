export const USERS_STORAGE_KEY = 'spin-x-users'
export const SESSION_STORAGE_KEY = 'spin-x-session'
export const KICK_HISTORY_KEY = 'spin-x-kick-history'

export function readUsers() {
  const storedUsers = localStorage.getItem(USERS_STORAGE_KEY)
  return storedUsers ? JSON.parse(storedUsers) : []
}

export function readSession() {
  const storedSession = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!storedSession) {
    return null
  }

  const parsedSession = JSON.parse(storedSession)
  return parsedSession.user || parsedSession
}

export function saveUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

export function readSessionToken() {
  const storedSession = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!storedSession) {
    return ''
  }

  const parsedSession = JSON.parse(storedSession)
  return parsedSession.token || ''
}

export function saveSession(user, token = '') {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ user, token }))
}

export function readKickHistory() {
  const storedHistory = localStorage.getItem(KICK_HISTORY_KEY)
  return storedHistory ? JSON.parse(storedHistory) : []
}

export function saveKickHistory(history) {
  localStorage.setItem(KICK_HISTORY_KEY, JSON.stringify(history))
}

export function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

export function calculateKickScore(force, spinX, spinY, spinZ) {
  const spinMagnitude = Math.hypot(spinX, spinY, spinZ)
  const forceScore = Math.min((force / 6) * 100, 100)
  const spinScore = Math.min((spinMagnitude / 1200) * 100, 100)
  return Math.round(forceScore * 0.65 + spinScore * 0.35)
}

export function getPerformanceBand(score) {
  if (score >= 85) {
    return 'Elite'
  }
  if (score >= 70) {
    return 'Strong'
  }
  if (score >= 55) {
    return 'Developing'
  }
  return 'Needs Work'
}

export function getKickPlayStyle(force, spinX, spinY, spinZ) {
  const spinMagnitude = Math.hypot(spinX, spinY, spinZ)

  if (force >= 75 && spinMagnitude >= 140) {
    return 'Power Curver'
  }

  if (force >= 75) {
    return 'Power Striker'
  }

  if (spinMagnitude >= 140) {
    return 'Curve Specialist'
  }

  if (force >= 45 && spinMagnitude >= 80) {
    return 'Balanced Playmaker'
  }

  return 'Control Finisher'
}

function getDominantPlayStyle(studentKicks) {
  if (studentKicks.length === 0) {
    return 'No IoT data yet'
  }

  const styleFrequency = studentKicks.reduce((accumulator, kick) => {
    const style = getKickPlayStyle(kick.force, kick.spinX, kick.spinY, kick.spinZ)
    return {
      ...accumulator,
      [style]: (accumulator[style] || 0) + 1,
    }
  }, {})

  return Object.entries(styleFrequency).sort((left, right) => right[1] - left[1])[0][0]
}

function getScoreTrend(scores) {
  if (scores.length < 2) {
    return 'Stable'
  }

  const latest = scores[scores.length - 1]
  const previous = scores[scores.length - 2]

  if (latest - previous >= 3) {
    return 'Improving'
  }
  if (previous - latest >= 3) {
    return 'Needs focus'
  }
  return 'Stable'
}

function buildStudentPlan(student, index) {
  const scheduleTemplates = [
    ['Mon 5:30 PM - Sprint Drills', 'Wed 5:30 PM - Passing Patterns', 'Fri 6:00 PM - Match Simulation'],
    ['Tue 6:00 PM - Ball Control', 'Thu 5:00 PM - Finishing Practice', 'Sat 7:00 AM - Conditioning'],
    ['Mon 6:00 PM - Agility Work', 'Wed 6:30 PM - Tactical Positioning', 'Sun 8:00 AM - Recovery Session'],
  ]

  const practiceTemplates = [
    ['50 short passes', '20 shooting reps', 'Core workout (15 min)'],
    ['30 cone dribbles', '15 long passes', 'Mobility routine (20 min)'],
    ['10 sprint intervals', '25 first-touch controls', 'Stretching + cooldown'],
  ]

  const templateIndex = index % scheduleTemplates.length
  const matchesPlayed = 6 + index * 2
  const matchesToPlay = Math.max(12 - matchesPlayed, 2)

  return {
    email: student.email,
    name: student.name,
    matchesPlayed,
    matchesToPlay,
    schedule: scheduleTemplates[templateIndex],
    practicePlan: practiceTemplates[templateIndex],
  }
}

export function getDashboardCards(sessionUser, options = {}) {
  if (!sessionUser) {
    return []
  }

  if (sessionUser.role === 'coach') {
    const teamPlayersCount = Number(options.teamPlayersCount || 0)
    const todaySessionsCount = Number(options.todaySessionsCount || 0)
    const pendingReviewsCount = Number(options.pendingReviewsCount || 0)
    return [
      {
        title: 'Team Overview',
        value: `${teamPlayersCount} Players`,
        note: teamPlayersCount > 0 ? 'Players registered under you' : 'No players assigned yet',
      },
      {
        title: 'Today Sessions',
        value: `${todaySessionsCount} Scheduled`,
        note: todaySessionsCount > 0 ? 'Loaded from database' : 'No sessions scheduled today',
      },
      {
        title: 'Pending Reviews',
        value: `${pendingReviewsCount} Students`,
        note: pendingReviewsCount > 0 ? 'Review required today' : 'No pending reviews',
      },
    ]
  }

  return [
    { title: 'Training Streak', value: '12 Days', note: 'Keep it going!' },
    { title: 'Next Practice', value: '5:30 PM', note: 'Speed & endurance drills' },
    { title: 'Coach Feedback', value: '4 Notes', note: 'Review after warm-up' },
  ]
}

export function filterKicksByRange(kicks, range) {
  const now = new Date()

  return kicks.filter((kick) => {
    const kickDate = new Date(kick.createdAt)

    if (range === 'today') {
      return kickDate.toDateString() === now.toDateString()
    }

    if (range === 'weekly') {
      const daysDiff = (now - kickDate) / (1000 * 60 * 60 * 24)
      return daysDiff <= 7
    }

    if (range === 'monthly') {
      return kickDate.getMonth() === now.getMonth() && kickDate.getFullYear() === now.getFullYear()
    }

    return true
  })
}

export function getStudentPlans(users) {
  const students = users.filter((user) => user.role === 'student')
  return students.map((student, index) => buildStudentPlan(student, index))
}

export function buildStudentAnalytics(studentPlans, filteredKickHistory) {
  return studentPlans.map((student) => {
    const studentKicks = filteredKickHistory.filter((kick) => kick.studentEmail === student.email)
    const scores = studentKicks.map((kick) => kick.score)
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length) : 0

    return {
      name: student.name,
      score: averageScore,
      performanceBand: getPerformanceBand(averageScore),
      playStyle: getDominantPlayStyle(studentKicks),
      kicks: studentKicks.length,
      trend: scores.length > 0 ? getScoreTrend(scores) : 'No kicks yet',
      matchesPlayed: student.matchesPlayed,
      matchesToPlay: student.matchesToPlay,
      schedule: student.schedule,
      practicePlan: student.practicePlan,
    }
  })
}

export function getCurrentStudentPlanData(sessionUser, studentPlans) {
  if (sessionUser?.role !== 'student') {
    return null
  }

  const matchedPlan = studentPlans.find((student) => student.email === sessionUser.email)
  if (matchedPlan) {
    return matchedPlan
  }

  return {
    email: sessionUser.email,
    name: sessionUser.name,
    matchesPlayed: 0,
    matchesToPlay: 0,
    schedule: ['No schedule assigned yet'],
    practicePlan: ['No practice plan assigned yet'],
  }
}

export function getRecentStudentKicks(sessionUser, kickHistory) {
  if (sessionUser?.role !== 'student') {
    return []
  }

  return kickHistory.filter((kick) => kick.studentEmail === sessionUser.email).slice(-5).reverse()
}

export function prepareSignup(signupForm, users) {
  const { name, email, password, role } = signupForm

  if (!name || !email || !password) {
    return { error: 'Please fill in all sign-up fields.' }
  }

  const existingUser = users.find((user) => user.email.toLowerCase() === email.toLowerCase())
  if (existingUser) {
    return { error: 'An account with this email already exists.' }
  }

  return { newUser: { name, email, password, role } }
}

export function prepareLogin(loginForm, users) {
  const { email, password, role } = loginForm

  if (!email || !password) {
    return { error: 'Please enter both email and password.' }
  }

  const matchedUser = users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password && user.role === role,
  )

  if (!matchedUser) {
    return { error: 'Invalid credentials for the selected role.' }
  }

  return { matchedUser }
}

export function prepareKickLog(kickForm, sessionUser) {
  if (sessionUser?.role !== 'student') {
    return { error: 'Only students can log kick sessions.' }
  }

  const force = Number(kickForm.force)
  const spinX = Number(kickForm.spinX)
  const spinY = Number(kickForm.spinY)
  const spinZ = Number(kickForm.spinZ)

  if ([force, spinX, spinY, spinZ].some((value) => Number.isNaN(value))) {
    return { error: 'Enter valid numbers for force and spin values.' }
  }

  return {
    newKick: {
      studentEmail: sessionUser.email,
      studentName: sessionUser.name,
      force,
      spinX,
      spinY,
      spinZ,
      score: calculateKickScore(force, spinX, spinY, spinZ),
      createdAt: new Date().toISOString(),
    },
  }
}
