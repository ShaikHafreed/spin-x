import { useEffect, useMemo, useState } from 'react'
import AuthView from './components/AuthView'
import DashboardView from './components/DashboardView'
import {
  clearSession,
  filterKicksByRange,
  getCurrentStudentPlanData,
  getDashboardCards,
  getRecentStudentKicks,
  getStudentPlans,
  buildStudentAnalytics,
  prepareKickLog,
  readSession,
  readSessionToken,
  saveSession,
} from './utils/dashboardUtils'
import {
  createReview,
  createCoachSession,
  createKick,
  fetchBootstrap,
  fetchCoachTodaySessions,
  fetchPendingReviews,
  fetchStudentPlans,
  forgotPasswordUser,
  loginUser,
  signupUser,
  updateStudentCoachPreference,
  updateStudentProfile,
} from './utils/dashboardApi'
import './App.css'

function App() {
  const [users, setUsers] = useState([])
  const [kickHistory, setKickHistory] = useState([])
  const [studentPlans, setStudentPlans] = useState([])
  const [todaySessions, setTodaySessions] = useState([])
  const [pendingReviews, setPendingReviews] = useState([])
  const [sessionUser, setSessionUser] = useState(readSession)
  const [authToken, setAuthToken] = useState(readSessionToken)
  const [mode, setMode] = useState('login')
  const [analyticsRange, setAnalyticsRange] = useState('weekly')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  })

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })

  const [forgotPasswordForm, setForgotPasswordForm] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const [kickForm, setKickForm] = useState({
    force: '',
    spinX: '',
    spinY: '',
    spinZ: '',
  })

  const [sessionForm, setSessionForm] = useState({
    title: '',
    time: '',
    focusArea: '',
    location: '',
  })

  const [reviewForm, setReviewForm] = useState({
    studentEmail: '',
    notes: '',
    rating: '',
  })

  const dashboardCards = useMemo(
    () => {
      const teamPlayersCount =
        sessionUser?.role === 'coach'
          ? users.filter((user) => user.role === 'student' && user.preferredCoachEmail === sessionUser.email).length
          : 0

      return getDashboardCards(sessionUser, {
        teamPlayersCount,
        todaySessionsCount: todaySessions.length,
        pendingReviewsCount: pendingReviews.length,
      })
    },
    [sessionUser, users, todaySessions.length, pendingReviews.length],
  )

  const filteredKickHistory = useMemo(
    () => filterKicksByRange(kickHistory, analyticsRange),
    [kickHistory, analyticsRange],
  )

  const derivedStudentPlans = useMemo(
    () => (studentPlans.length > 0 ? studentPlans : getStudentPlans(users)),
    [studentPlans, users],
  )

  const studentAnalytics = useMemo(
    () => buildStudentAnalytics(derivedStudentPlans, filteredKickHistory),
    [derivedStudentPlans, filteredKickHistory],
  )

  const coachStudentAnalytics = useMemo(() => {
    if (sessionUser?.role !== 'coach') {
      return studentAnalytics
    }

    const registeredStudents = new Set(
      users
        .filter((user) => user.role === 'student' && user.preferredCoachEmail === sessionUser.email)
        .map((user) => user.email),
    )

    return studentAnalytics.filter((student) => {
      const matchingPlan = derivedStudentPlans.find((plan) => plan.name === student.name)
      return matchingPlan ? registeredStudents.has(matchingPlan.email) : false
    })
  }, [sessionUser, users, studentAnalytics, derivedStudentPlans])

  const currentStudentPlan = useMemo(
    () => getCurrentStudentPlanData(sessionUser, derivedStudentPlans),
    [sessionUser, derivedStudentPlans],
  )

  const currentStudentKicks = useMemo(
    () => getRecentStudentKicks(sessionUser, kickHistory),
    [sessionUser, kickHistory],
  )

  const availableCoaches = useMemo(() => users.filter((user) => user.role === 'coach'), [users])

  const updateSignupForm = (field, value) => {
    setSignupForm((current) => ({ ...current, [field]: value }))
  }

  const updateLoginForm = (field, value) => {
    setLoginForm((current) => ({ ...current, [field]: value }))
  }

  const updateKickForm = (field, value) => {
    setKickForm((current) => ({ ...current, [field]: value }))
  }

  const updateForgotPasswordForm = (field, value) => {
    setForgotPasswordForm((current) => ({ ...current, [field]: value }))
  }

  const updateSessionForm = (field, value) => {
    setSessionForm((current) => ({ ...current, [field]: value }))
  }

  const updateReviewForm = (field, value) => {
    setReviewForm((current) => ({ ...current, [field]: value }))
  }

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const data = await fetchBootstrap()
        setUsers(data.users)
        setKickHistory(data.kicks)
        setStudentPlans(data.plans)
      } catch (loadError) {
        setError(loadError.message || 'Failed to load data from database API.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    const loadCoachSessions = async () => {
      if (sessionUser?.role !== 'coach' || !authToken) {
        setTodaySessions([])
        return
      }

      try {
        const sessions = await fetchCoachTodaySessions(authToken)
        setTodaySessions(sessions)
      } catch {
        setTodaySessions([])
      }
    }

    loadCoachSessions()
  }, [sessionUser, authToken])

  useEffect(() => {
    const loadPendingReviews = async () => {
      if (sessionUser?.role !== 'coach' || !authToken) {
        setPendingReviews([])
        return
      }

      try {
        const pending = await fetchPendingReviews(authToken)
        setPendingReviews(pending)
        setReviewForm((current) => ({
          ...current,
          studentEmail: current.studentEmail || (pending[0]?.studentEmail || ''),
        }))
      } catch {
        setPendingReviews([])
      }
    }

    loadPendingReviews()
  }, [sessionUser, authToken])

  const handleSignup = async (event) => {
    event.preventDefault()
    clearMessages()

    if (!signupForm.name || !signupForm.email || !signupForm.password) {
      setError('Please fill in all sign-up fields.')
      return
    }

    try {
      const result = await signupUser(signupForm)
      const newUser = result.user
      const token = result.token

      setUsers((current) => [...current, newUser])
      saveSession(newUser, token)
      setSessionUser(newUser)
      setAuthToken(token)

      if (newUser.role === 'student') {
        try {
          const plans = await fetchStudentPlans()
          setStudentPlans(plans)
        } catch {
          setStudentPlans((current) => current)
        }
      }

      setSuccess('Account created successfully.')
      setSignupForm({ name: '', email: '', password: '', role: newUser.role })
    } catch (signupError) {
      setError(signupError.message || 'Failed to create account.')
    }
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    clearMessages()

    if (!loginForm.email || !loginForm.password) {
      setError('Please enter both email and password.')
      return
    }

    try {
      const result = await loginUser({
        email: loginForm.email,
        password: loginForm.password,
      })
      const matchedUser = result.user
      const token = result.token
      setSessionUser(matchedUser)
      setAuthToken(token)
      saveSession(matchedUser, token)
      setSuccess('Logged in successfully.')
    } catch (loginError) {
      setError(loginError.message || 'Login failed.')
    }
  }

  const handleForgotPassword = async (event) => {
    event.preventDefault()
    clearMessages()

    if (!forgotPasswordForm.email || !forgotPasswordForm.newPassword || !forgotPasswordForm.confirmPassword) {
      setError('Please fill in all reset password fields.')
      return
    }

    if (forgotPasswordForm.newPassword !== forgotPasswordForm.confirmPassword) {
      setError('New password and confirm password do not match.')
      return
    }

    try {
      await forgotPasswordUser({
        email: forgotPasswordForm.email,
        newPassword: forgotPasswordForm.newPassword,
      })

      setLoginForm((current) => ({ ...current, email: forgotPasswordForm.email, password: '' }))
      setForgotPasswordForm({ email: '', newPassword: '', confirmPassword: '' })
      setShowForgotPassword(false)
      setSuccess('Password reset successful. Please log in with your new password.')
    } catch (resetError) {
      setError(resetError.message || 'Failed to reset password.')
    }
  }

  const logout = () => {
    setSessionUser(null)
    setAuthToken('')
    clearSession()
    clearMessages()
    setMode('login')
  }

  const handleKickLog = async (event) => {
    event.preventDefault()
    clearMessages()

    const kickResult = prepareKickLog(kickForm, sessionUser)
    if (kickResult.error) {
      setError(kickResult.error)
      return
    }

    try {
      const { newKick } = kickResult
      const result = await createKick(newKick, authToken)
      setKickHistory((current) => [...current, result.kick])
      setKickForm({ force: '', spinX: '', spinY: '', spinZ: '' })
      setSuccess('Kick session logged successfully.')
    } catch (kickError) {
      setError(kickError.message || 'Failed to save kick session.')
    }
  }

  const handleCoachSelection = async (coachEmail) => {
    clearMessages()

    if (sessionUser?.role !== 'student') {
      return
    }

    try {
      const result = await updateStudentCoachPreference(sessionUser.email, coachEmail, authToken)
      const updatedUser = result.user

      setUsers((current) =>
        current.map((user) => (user.email === updatedUser.email ? { ...user, preferredCoachEmail: updatedUser.preferredCoachEmail } : user)),
      )
      setSessionUser(updatedUser)
      saveSession(updatedUser, authToken)
      setSuccess(updatedUser.preferredCoachEmail ? 'Coach updated successfully.' : 'Coach selection cleared.')
    } catch (coachError) {
      setError(coachError.message || 'Failed to update coach preference.')
    }
  }

  const handleCreateSession = async (event) => {
    event.preventDefault()
    clearMessages()

    if (sessionUser?.role !== 'coach') {
      return
    }

    if (!sessionForm.title || !sessionForm.time) {
      setError('Session title and time are required.')
      return
    }

    const today = new Date()
    const datePrefix = today.toISOString().slice(0, 10)
    const scheduledAt = new Date(`${datePrefix}T${sessionForm.time}:00`)

    if (Number.isNaN(scheduledAt.getTime())) {
      setError('Please enter a valid session time.')
      return
    }

    try {
      const result = await createCoachSession(
        {
          title: sessionForm.title,
          focusArea: sessionForm.focusArea,
          location: sessionForm.location,
          scheduledAt: scheduledAt.toISOString(),
        },
        authToken,
      )

      setTodaySessions((current) =>
        [...current, result.session].sort(
          (left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
        ),
      )

      setSessionForm({ title: '', time: '', focusArea: '', location: '' })
      setSuccess('Session created for today successfully.')
    } catch (sessionError) {
      setError(sessionError.message || 'Failed to create today session.')
    }
  }

  const handleCreateReview = async (event) => {
    event.preventDefault()
    clearMessages()

    if (sessionUser?.role !== 'coach') {
      return
    }

    if (!reviewForm.studentEmail) {
      setError('Please choose a student for review.')
      return
    }

    try {
      await createReview(
        {
          studentEmail: reviewForm.studentEmail,
          notes: reviewForm.notes,
          rating: reviewForm.rating === '' ? null : Number(reviewForm.rating),
        },
        authToken,
      )

      const refreshedPending = await fetchPendingReviews(authToken)
      setPendingReviews(refreshedPending)
      setReviewForm({
        studentEmail: refreshedPending[0]?.studentEmail || '',
        notes: '',
        rating: '',
      })
      setSuccess('Review saved to database with timestamp.')
    } catch (reviewError) {
      setError(reviewError.message || 'Failed to save review.')
    }
  }

  const handleUpdateStudentProfile = async (profileData) => {
    clearMessages()

    if (sessionUser?.role !== 'student') {
      return
    }

    try {
      const result = await updateStudentProfile(profileData, authToken)
      const updatedUser = result.user
      const refreshedToken = result.token || authToken

      setUsers((current) => current.map((user) => (user.id === updatedUser.id ? updatedUser : user)))
      setSessionUser(updatedUser)
      setAuthToken(refreshedToken)
      saveSession(updatedUser, refreshedToken)
      setSuccess('Profile updated successfully.')
    } catch (profileError) {
      setError(profileError.message || 'Failed to update profile.')
    }
  }

  if (isLoading) {
    return (
      <main className="app-shell">
        <section className="panel">
          <h2>Loading data...</h2>
          <p>Connecting to football database.</p>
        </section>
      </main>
    )
  }

  if (sessionUser) {
    return (
      <DashboardView
        sessionUser={sessionUser}
        logout={logout}
        dashboardCards={dashboardCards}
        analyticsRange={analyticsRange}
        setAnalyticsRange={setAnalyticsRange}
        studentAnalytics={coachStudentAnalytics}
        currentStudentPlan={currentStudentPlan}
        handleKickLog={handleKickLog}
        kickForm={kickForm}
        updateKickForm={updateKickForm}
        currentStudentKicks={currentStudentKicks}
        onUpdateStudentProfile={handleUpdateStudentProfile}
        availableCoaches={availableCoaches}
        selectedCoachEmail={sessionUser.preferredCoachEmail || ''}
        onSelectCoach={handleCoachSelection}
        todaySessions={todaySessions}
        sessionForm={sessionForm}
        updateSessionForm={updateSessionForm}
        onCreateSession={handleCreateSession}
        pendingReviews={pendingReviews}
        reviewForm={reviewForm}
        updateReviewForm={updateReviewForm}
        onCreateReview={handleCreateReview}
      />
    )
  }

  return (
    <AuthView
      mode={mode}
      setMode={setMode}
      clearMessages={clearMessages}
      handleSignup={handleSignup}
      handleLogin={handleLogin}
      handleForgotPassword={handleForgotPassword}
      signupForm={signupForm}
      loginForm={loginForm}
      forgotPasswordForm={forgotPasswordForm}
      showForgotPassword={showForgotPassword}
      setShowForgotPassword={setShowForgotPassword}
      updateSignupForm={updateSignupForm}
      updateLoginForm={updateLoginForm}
      updateForgotPasswordForm={updateForgotPasswordForm}
      error={error}
      success={success}
    />
  )
}

export default App
