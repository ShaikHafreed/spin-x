import PropTypes from 'prop-types'

export default function DashboardStatCard({ card, onClick, isActive }) {
  if (onClick) {
    return (
      <button type="button" className={`card card-button${isActive ? ' active' : ''}`} onClick={onClick}>
        <h3>{card.title}</h3>
        <strong>{card.value}</strong>
        <span>{card.note}</span>
      </button>
    )
  }

  return (
    <article className="card">
      <h3>{card.title}</h3>
      <strong>{card.value}</strong>
      <span>{card.note}</span>
    </article>
  )
}

DashboardStatCard.propTypes = {
  card: PropTypes.shape({
    title: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    note: PropTypes.string.isRequired,
  }).isRequired,
  onClick: PropTypes.func,
  isActive: PropTypes.bool,
}

DashboardStatCard.defaultProps = {
  onClick: undefined,
  isActive: false,
}
