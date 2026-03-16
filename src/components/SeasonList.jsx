import PropTypes from 'prop-types'

export default function SeasonList({ title, items, itemKeyPrefix }) {
  return (
    <>
      <p className="list-title">{title}</p>
      <ul className="mini-list">
        {items.map((item) => (
          <li key={`${itemKeyPrefix}-${item}`}>{item}</li>
        ))}
      </ul>
    </>
  )
}

SeasonList.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  itemKeyPrefix: PropTypes.string.isRequired,
}
