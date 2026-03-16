import PropTypes from 'prop-types'
import { useState } from 'react'
import DashboardStatCard from './DashboardStatCard'
import StudentAnalyticsCard from './StudentAnalyticsCard'
import StudentKickCard from './StudentKickCard'
import StudentSeasonPlanCard from './StudentSeasonPlanCard'

const studentAnalyticsShape = PropTypes.shape({
  name: PropTypes.string.isRequired,
  score: PropTypes.number.isRequired,
  performanceBand: PropTypes.string.isRequired,
  playStyle: PropTypes.string.isRequired,
  kicks: PropTypes.number.isRequired,
  trend: PropTypes.string.isRequired,
  matchesPlayed: PropTypes.number.isRequired,
  matchesToPlay: PropTypes.number.isRequired,
  schedule: PropTypes.arrayOf(PropTypes.string).isRequired,
  practicePlan: PropTypes.arrayOf(PropTypes.string).isRequired,
})

const studentPlanShape = PropTypes.shape({
  name: PropTypes.string.isRequired,
  matchesPlayed: PropTypes.number.isRequired,
  matchesToPlay: PropTypes.number.isRequired,
  schedule: PropTypes.arrayOf(PropTypes.string).isRequired,
  practicePlan: PropTypes.arrayOf(PropTypes.string).isRequired,
})

function TeamRosterPanel({ studentAnalytics, selectedPlayerName, setSelectedPlayerName }) {
  const selectedPlayer = studentAnalytics.find((student) => student.name === selectedPlayerName) || null

  return (
    <div className="team-roster-panel">
      <h3>Team Players</h3>
      {studentAnalytics.length > 0 ? (
        <ul className="team-roster-list">
          {studentAnalytics.map((student) => (
            <li key={student.name}>
              <button
                type="button"
                className={`team-player-button${selectedPlayerName === student.name ? ' active' : ''}`}
                onClick={() => setSelectedPlayerName(student.name)}
              >
                <span className="player-name">{student.name}</span>
                <span>{student.playStyle}</span>
                <span>Avg score {student.score} ({student.performanceBand})</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No players found for this coach yet.</p>
      )}

      {selectedPlayer ? (
        <div className="selected-player-details">
          <h4>{selectedPlayer.name} Plan</h4>
          <p>
            Matches: {selectedPlayer.matchesPlayed} played · {selectedPlayer.matchesToPlay} to play
          </p>
          <p>
            IoT Profile: {selectedPlayer.playStyle} · {selectedPlayer.performanceBand}
          </p>
          <p className="list-title">Schedule</p>
          <ul className="mini-list">
            {selectedPlayer.schedule.map((slot) => (
              <li key={`${selectedPlayer.name}-schedule-${slot}`}>{slot}</li>
            ))}
          </ul>
          <p className="list-title">Practice Plan</p>
          <ul className="mini-list">
            {selectedPlayer.practicePlan.map((drill) => (
              <li key={`${selectedPlayer.name}-practice-${drill}`}>{drill}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

TeamRosterPanel.propTypes = {
  studentAnalytics: PropTypes.arrayOf(studentAnalyticsShape).isRequired,
  selectedPlayerName: PropTypes.string.isRequired,
  setSelectedPlayerName: PropTypes.func.isRequired,
}

function CoachDashboardSection({
  showTeamPlayers,
  studentAnalytics,
  selectedPlayerName,
  setSelectedPlayerName,
  analyticsRange,
  setAnalyticsRange,
  todaySessions,
  sessionForm,
  updateSessionForm,
  onCreateSession,
  pendingReviews,
  reviewForm,
  updateReviewForm,
  onCreateReview,
}) {
  return (
    <section className="analytics-panel">
      {showTeamPlayers ? (
        <TeamRosterPanel
          studentAnalytics={studentAnalytics}
          selectedPlayerName={selectedPlayerName}
          setSelectedPlayerName={setSelectedPlayerName}
        />
      ) : null}

      <div className="today-sessions-panel card analytics-card">
        <h3>Today Sessions</h3>

        {todaySessions.length > 0 ? (
          <ul className="today-sessions-list">
            {todaySessions.map((session) => (
              <li key={session.id}>
                <strong>{session.title}</strong>
                <span>{new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span>{session.focusArea || 'General Training'}</span>
                <span>{session.location || 'Main Ground'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No sessions scheduled for today.</p>
        )}

        <form className="coach-session-form" onSubmit={onCreateSession}>
          <label>
            <span>Session Title</span>
            <input
              type="text"
              value={sessionForm.title}
              onChange={(event) => updateSessionForm('title', event.target.value)}
              placeholder="e.g. Ball Control Drills"
            />
          </label>
          <label>
            <span>Time (Today)</span>
            <input
              type="time"
              value={sessionForm.time}
              onChange={(event) => updateSessionForm('time', event.target.value)}
            />
          </label>
          <label>
            <span>Focus Area</span>
            <input
              type="text"
              value={sessionForm.focusArea}
              onChange={(event) => updateSessionForm('focusArea', event.target.value)}
              placeholder="e.g. Passing"
            />
          </label>
          <label>
            <span>Location</span>
            <input
              type="text"
              value={sessionForm.location}
              onChange={(event) => updateSessionForm('location', event.target.value)}
              placeholder="e.g. Ground A"
            />
          </label>

          <button type="submit" className="primary-button">
            Create Session
          </button>
        </form>
      </div>

      <div className="pending-reviews-panel card analytics-card">
        <h3>Pending Reviews</h3>
        {pendingReviews.length > 0 ? (
          <ul className="pending-reviews-list">
            {pendingReviews.map((review) => (
              <li key={review.studentEmail}>
                <strong>{review.studentName}</strong>
                <span>{review.studentEmail}</span>
                <span>
                  {review.lastReviewedAt
                    ? `Last reviewed: ${new Date(review.lastReviewedAt).toLocaleString()}`
                    : 'Not reviewed yet'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No pending students for review today.</p>
        )}

        <form className="coach-session-form" onSubmit={onCreateReview}>
          <label>
            <span>Student</span>
            <select
              value={reviewForm.studentEmail}
              onChange={(event) => updateReviewForm('studentEmail', event.target.value)}
            >
              <option value="">Select student</option>
              {pendingReviews.map((review) => (
                <option key={review.studentEmail} value={review.studentEmail}>
                  {review.studentName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Rating (1-10)</span>
            <input
              type="number"
              min="1"
              max="10"
              value={reviewForm.rating}
              onChange={(event) => updateReviewForm('rating', event.target.value)}
              placeholder="e.g. 8"
            />
          </label>
          <label>
            <span>Review Notes</span>
            <input
              type="text"
              value={reviewForm.notes}
              onChange={(event) => updateReviewForm('notes', event.target.value)}
              placeholder="e.g. Good progress in passing drills"
            />
          </label>

          <button type="submit" className="primary-button">
            Save Review
          </button>
        </form>
      </div>

      <h3>Student Analytics</h3>
      <div className="analytics-filter" role="tablist" aria-label="Analytics range">
        <button className={analyticsRange === 'today' ? 'active' : ''} onClick={() => setAnalyticsRange('today')}>
          Today
        </button>
        <button className={analyticsRange === 'weekly' ? 'active' : ''} onClick={() => setAnalyticsRange('weekly')}>
          Weekly
        </button>
        <button className={analyticsRange === 'monthly' ? 'active' : ''} onClick={() => setAnalyticsRange('monthly')}>
          Monthly
        </button>
      </div>

      <div className="analytics-grid">
        {studentAnalytics.map((student) => (
          <StudentAnalyticsCard
            key={student.name}
            student={student}
            isHighlighted={selectedPlayerName !== '' && selectedPlayerName === student.name}
          />
        ))}
      </div>
    </section>
  )
}

CoachDashboardSection.propTypes = {
  showTeamPlayers: PropTypes.bool.isRequired,
  studentAnalytics: PropTypes.arrayOf(studentAnalyticsShape).isRequired,
  selectedPlayerName: PropTypes.string.isRequired,
  setSelectedPlayerName: PropTypes.func.isRequired,
  analyticsRange: PropTypes.oneOf(['today', 'weekly', 'monthly']).isRequired,
  setAnalyticsRange: PropTypes.func.isRequired,
  todaySessions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      focusArea: PropTypes.string.isRequired,
      location: PropTypes.string.isRequired,
      scheduledAt: PropTypes.string.isRequired,
    }),
  ).isRequired,
  sessionForm: PropTypes.shape({
    title: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
    focusArea: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
  }).isRequired,
  updateSessionForm: PropTypes.func.isRequired,
  onCreateSession: PropTypes.func.isRequired,
  pendingReviews: PropTypes.arrayOf(
    PropTypes.shape({
      studentEmail: PropTypes.string.isRequired,
      studentName: PropTypes.string.isRequired,
      lastReviewedAt: PropTypes.string,
    }),
  ).isRequired,
  reviewForm: PropTypes.shape({
    studentEmail: PropTypes.string.isRequired,
    notes: PropTypes.string.isRequired,
    rating: PropTypes.string.isRequired,
  }).isRequired,
  updateReviewForm: PropTypes.func.isRequired,
  onCreateReview: PropTypes.func.isRequired,
}

function StudentDashboardSection({
  currentStudentPlan,
  handleKickLog,
  kickForm,
  updateKickForm,
  currentStudentKicks,
  availableCoaches,
  selectedCoachEmail,
  onSelectCoach,
}) {
  return (
    <section className="analytics-panel">
      {currentStudentPlan ? <StudentSeasonPlanCard studentPlan={currentStudentPlan} /> : null}

      <article className="card analytics-card coach-selection-card">
        <h4>Choose Your Coach</h4>
        {availableCoaches.length > 0 ? (
          <>
            <label className="coach-select-label" htmlFor="coach-select">
              Registered Coaches
            </label>
            <select id="coach-select" value={selectedCoachEmail} onChange={(event) => onSelectCoach(event.target.value)}>
              <option value="">Select a coach</option>
              {availableCoaches.map((coach) => (
                <option key={coach.email} value={coach.email}>
                  {coach.name}
                </option>
              ))}
            </select>
          </>
        ) : (
          <p>No registered coaches available yet. Ask a coach to sign up first.</p>
        )}
      </article>

      <h3>Log Kick Session</h3>
      <form className="kick-log-form" onSubmit={handleKickLog}>
        <label>
          <span>Kick Force (g)</span>
          <input
            type="number"
            step="0.1"
            value={kickForm.force}
            onChange={(event) => updateKickForm('force', event.target.value)}
          />
        </label>
        <label>
          <span>Spin X</span>
          <input type="number" value={kickForm.spinX} onChange={(event) => updateKickForm('spinX', event.target.value)} />
        </label>
        <label>
          <span>Spin Y</span>
          <input type="number" value={kickForm.spinY} onChange={(event) => updateKickForm('spinY', event.target.value)} />
        </label>
        <label>
          <span>Spin Z</span>
          <input type="number" value={kickForm.spinZ} onChange={(event) => updateKickForm('spinZ', event.target.value)} />
        </label>

        <button type="submit" className="primary-button">
          Save Kick Data
        </button>
      </form>

      <div className="analytics-grid">
        {currentStudentKicks.map((kick) => (
          <StudentKickCard key={kick.createdAt} kick={kick} />
        ))}
      </div>
    </section>
  )
}

StudentDashboardSection.propTypes = {
  currentStudentPlan: studentPlanShape,
  handleKickLog: PropTypes.func.isRequired,
  kickForm: PropTypes.shape({
    force: PropTypes.string.isRequired,
    spinX: PropTypes.string.isRequired,
    spinY: PropTypes.string.isRequired,
    spinZ: PropTypes.string.isRequired,
  }).isRequired,
  updateKickForm: PropTypes.func.isRequired,
  currentStudentKicks: PropTypes.arrayOf(
    PropTypes.shape({
      createdAt: PropTypes.string.isRequired,
      force: PropTypes.number.isRequired,
      spinX: PropTypes.number.isRequired,
      spinY: PropTypes.number.isRequired,
      spinZ: PropTypes.number.isRequired,
      score: PropTypes.number.isRequired,
    }),
  ).isRequired,
  availableCoaches: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      role: PropTypes.oneOf(['coach', 'student']).isRequired,
    }),
  ).isRequired,
  selectedCoachEmail: PropTypes.string.isRequired,
  onSelectCoach: PropTypes.func.isRequired,
}

export default function DashboardView({
  sessionUser,
  logout,
  dashboardCards,
  analyticsRange,
  setAnalyticsRange,
  studentAnalytics,
  currentStudentPlan,
  handleKickLog,
  kickForm,
  updateKickForm,
  currentStudentKicks,
  availableCoaches,
  selectedCoachEmail,
  onSelectCoach,
  todaySessions,
  sessionForm,
  updateSessionForm,
  onCreateSession,
  pendingReviews,
  reviewForm,
  updateReviewForm,
  onCreateReview,
}) {
  const [showTeamPlayers, setShowTeamPlayers] = useState(false)
  const [selectedPlayerName, setSelectedPlayerName] = useState('')

  const toggleTeamOverview = () => {
    setShowTeamPlayers((current) => {
      const nextValue = !current
      if (nextValue && studentAnalytics.length > 0) {
        setSelectedPlayerName((currentName) => currentName || studentAnalytics[0].name)
      }
      if (!nextValue) {
        setSelectedPlayerName('')
      }
      return nextValue
    })
  }

  return (
    <main className="app-shell">
      <header className="dashboard-header">
        <div>
          <p className="subheading">Welcome back</p>
          <h1>
            {sessionUser.name} ({sessionUser.role === 'coach' ? 'Coach' : 'Student'})
          </h1>
        </div>
        <button className="secondary-button" onClick={logout}>
          Log out
        </button>
      </header>

      <section className="panel">
        <h2>{sessionUser.role === 'coach' ? 'Coach Dashboard' : 'Student Dashboard'}</h2>
        <p>
          {sessionUser.role === 'coach'
            ? 'Track team performance, schedule drills, and review player development.'
            : 'Check your training progress, session details, and coach feedback.'}
        </p>

        <div className="card-grid">
          {dashboardCards.map((card) => (
            <DashboardStatCard
              key={card.title}
              card={card}
              onClick={sessionUser.role === 'coach' && card.title === 'Team Overview' ? toggleTeamOverview : undefined}
              isActive={sessionUser.role === 'coach' && card.title === 'Team Overview' && showTeamPlayers}
            />
          ))}
        </div>

        {sessionUser.role === 'coach' ? (
          <CoachDashboardSection
            showTeamPlayers={showTeamPlayers}
            studentAnalytics={studentAnalytics}
            selectedPlayerName={selectedPlayerName}
            setSelectedPlayerName={setSelectedPlayerName}
            analyticsRange={analyticsRange}
            setAnalyticsRange={setAnalyticsRange}
            todaySessions={todaySessions}
            sessionForm={sessionForm}
            updateSessionForm={updateSessionForm}
            onCreateSession={onCreateSession}
            pendingReviews={pendingReviews}
            reviewForm={reviewForm}
            updateReviewForm={updateReviewForm}
            onCreateReview={onCreateReview}
          />
        ) : (
          <StudentDashboardSection
            currentStudentPlan={currentStudentPlan}
            handleKickLog={handleKickLog}
            kickForm={kickForm}
            updateKickForm={updateKickForm}
            currentStudentKicks={currentStudentKicks}
            availableCoaches={availableCoaches}
            selectedCoachEmail={selectedCoachEmail}
            onSelectCoach={onSelectCoach}
          />
        )}
      </section>
    </main>
  )
}

DashboardView.propTypes = {
  sessionUser: PropTypes.shape({
    name: PropTypes.string.isRequired,
    role: PropTypes.oneOf(['coach', 'student']).isRequired,
  }).isRequired,
  logout: PropTypes.func.isRequired,
  dashboardCards: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      note: PropTypes.string.isRequired,
    }),
  ).isRequired,
  analyticsRange: PropTypes.oneOf(['today', 'weekly', 'monthly']).isRequired,
  setAnalyticsRange: PropTypes.func.isRequired,
  studentAnalytics: PropTypes.arrayOf(studentAnalyticsShape).isRequired,
  currentStudentPlan: studentPlanShape,
  handleKickLog: PropTypes.func.isRequired,
  kickForm: PropTypes.shape({
    force: PropTypes.string.isRequired,
    spinX: PropTypes.string.isRequired,
    spinY: PropTypes.string.isRequired,
    spinZ: PropTypes.string.isRequired,
  }).isRequired,
  updateKickForm: PropTypes.func.isRequired,
  currentStudentKicks: PropTypes.arrayOf(
    PropTypes.shape({
      createdAt: PropTypes.string.isRequired,
      force: PropTypes.number.isRequired,
      spinX: PropTypes.number.isRequired,
      spinY: PropTypes.number.isRequired,
      spinZ: PropTypes.number.isRequired,
      score: PropTypes.number.isRequired,
    }),
  ).isRequired,
  availableCoaches: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      role: PropTypes.oneOf(['coach', 'student']).isRequired,
    }),
  ).isRequired,
  selectedCoachEmail: PropTypes.string.isRequired,
  onSelectCoach: PropTypes.func.isRequired,
  todaySessions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      focusArea: PropTypes.string.isRequired,
      location: PropTypes.string.isRequired,
      scheduledAt: PropTypes.string.isRequired,
    }),
  ).isRequired,
  sessionForm: PropTypes.shape({
    title: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
    focusArea: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
  }).isRequired,
  updateSessionForm: PropTypes.func.isRequired,
  onCreateSession: PropTypes.func.isRequired,
  pendingReviews: PropTypes.arrayOf(
    PropTypes.shape({
      studentEmail: PropTypes.string.isRequired,
      studentName: PropTypes.string.isRequired,
      lastReviewedAt: PropTypes.string,
    }),
  ).isRequired,
  reviewForm: PropTypes.shape({
    studentEmail: PropTypes.string.isRequired,
    notes: PropTypes.string.isRequired,
    rating: PropTypes.string.isRequired,
  }).isRequired,
  updateReviewForm: PropTypes.func.isRequired,
  onCreateReview: PropTypes.func.isRequired,
}
