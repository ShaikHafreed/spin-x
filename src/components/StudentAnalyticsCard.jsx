import PropTypes from 'prop-types'
import SeasonList from './SeasonList'

export default function StudentAnalyticsCard({ student, isHighlighted }) {
  return (
    <article className={`card analytics-card${isHighlighted ? ' selected' : ''}`}>
      <h4>{student.name}</h4>
      <p>
        Avg Performance Score: <strong>{student.score}/100</strong>
      </p>
      <p>
        Performance Level: <strong>{student.performanceBand}</strong>
      </p>
      <p>
        Play Style (IoT): <strong>{student.playStyle}</strong>
      </p>
      <p>
        Kicks Recorded: <strong>{student.kicks}</strong>
      </p>
      <p>
        Trend: <strong>{student.trend}</strong>
      </p>
      <p>
        Matches Played: <strong>{student.matchesPlayed}</strong>
      </p>
      <p>
        Matches To Be Played: <strong>{student.matchesToPlay}</strong>
      </p>
      <SeasonList title="Schedule" items={student.schedule} itemKeyPrefix={`${student.name}-schedule`} />
      <SeasonList title="Practice Plan" items={student.practicePlan} itemKeyPrefix={`${student.name}-practice`} />
    </article>
  )
}

StudentAnalyticsCard.propTypes = {
  student: PropTypes.shape({
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
  }).isRequired,
  isHighlighted: PropTypes.bool,
}

StudentAnalyticsCard.defaultProps = {
  isHighlighted: false,
}
