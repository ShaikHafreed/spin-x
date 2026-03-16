import PropTypes from 'prop-types'
import SeasonList from './SeasonList'

export default function StudentSeasonPlanCard({ studentPlan }) {
  return (
    <article className="card analytics-card student-plan-card">
      <h4>{studentPlan.name} - Season Plan</h4>
      <p>
        Matches Played: <strong>{studentPlan.matchesPlayed}</strong>
      </p>
      <p>
        Matches To Be Played: <strong>{studentPlan.matchesToPlay}</strong>
      </p>
      <SeasonList title="Schedule" items={studentPlan.schedule} itemKeyPrefix="student-schedule" />
      <SeasonList title="Practice Plan" items={studentPlan.practicePlan} itemKeyPrefix="student-practice" />
    </article>
  )
}

StudentSeasonPlanCard.propTypes = {
  studentPlan: PropTypes.shape({
    name: PropTypes.string.isRequired,
    matchesPlayed: PropTypes.number.isRequired,
    matchesToPlay: PropTypes.number.isRequired,
    schedule: PropTypes.arrayOf(PropTypes.string).isRequired,
    practicePlan: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
}
