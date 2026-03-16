import PropTypes from 'prop-types'
import { getKickPlayStyle, getPerformanceBand } from '../utils/dashboardUtils'

export default function StudentKickCard({ kick }) {
  const playStyle = getKickPlayStyle(kick.force, kick.spinX, kick.spinY, kick.spinZ)
  const performanceBand = getPerformanceBand(kick.score)

  return (
    <article className="card analytics-card">
      <h4>{new Date(kick.createdAt).toLocaleString()}</h4>
      <p>
        Force: <strong>{kick.force}</strong>
      </p>
      <p>
        Spin (X/Y/Z): <strong>{kick.spinX}/{kick.spinY}/{kick.spinZ}</strong>
      </p>
      <p>
        Score: <strong>{kick.score}/100</strong>
      </p>
      <p>
        Performance Level: <strong>{performanceBand}</strong>
      </p>
      <p>
        Play Style (IoT): <strong>{playStyle}</strong>
      </p>
    </article>
  )
}

StudentKickCard.propTypes = {
  kick: PropTypes.shape({
    createdAt: PropTypes.string.isRequired,
    force: PropTypes.number.isRequired,
    spinX: PropTypes.number.isRequired,
    spinY: PropTypes.number.isRequired,
    spinZ: PropTypes.number.isRequired,
    score: PropTypes.number.isRequired,
  }).isRequired,
}
