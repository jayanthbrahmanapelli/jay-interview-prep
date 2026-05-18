import { Link, useParams } from 'react-router-dom'
import { curriculum } from '../data/curriculum'

export default function Sidebar({ onClose }) {
  const { id } = useParams()
  const currentDay = parseInt(id)
  const completed = JSON.parse(localStorage.getItem('completedDays') || '[]')

  return (
    <aside style={{
      width: '260px',
      minWidth: '260px',
      background: '#050a14',
      borderRight: '1px solid #1e2d3d',
      height: '100%',
      overflowY: 'auto',
      padding: '16px 0',
    }}>
      <div style={{ padding: '0 16px 12px', borderBottom: '1px solid #1e2d3d', marginBottom: '8px' }}>
        <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
          Progress
        </div>
        <div style={{ color: '#e2e8f0', fontSize: '13px' }}>
          {completed.length} / 14 days completed
        </div>
        <div style={{ marginTop: '8px', height: '4px', background: '#1e2d3d', borderRadius: '2px' }}>
          <div style={{
            height: '100%',
            width: `${(completed.length / 14) * 100}%`,
            background: '#00BFFF',
            borderRadius: '2px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {curriculum.map(day => {
        const isActive = day.id === currentDay
        const isDone = completed.includes(day.id)

        return (
          <Link
            key={day.id}
            to={`/day/${day.id}`}
            style={{ textDecoration: 'none', display: 'block' }}
            onClick={onClose}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              background: isActive ? '#0d1f33' : 'transparent',
              borderLeft: isActive ? '3px solid #00BFFF' : '3px solid transparent',
              borderRadius: '0 4px 4px 0',
              marginBottom: '2px',
              transition: 'all 0.15s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={e => {
              if (!isActive) e.currentTarget.style.background = '#0a1628'
            }}
            onMouseLeave={e => {
              if (!isActive) e.currentTarget.style.background = 'transparent'
            }}>
              <span style={{ fontSize: '16px', minWidth: '22px' }}>{day.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: isActive ? '#00BFFF' : '#94a3b8',
                  fontSize: '11px',
                  fontWeight: isActive ? 600 : 400
                }}>
                  Day {day.id}
                </div>
                <div style={{
                  color: isActive ? '#e2e8f0' : '#64748b',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 400,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {day.title}
                </div>
              </div>
              {isDone && (
                <span style={{ color: '#22c55e', fontSize: '14px' }}>✓</span>
              )}
            </div>
          </Link>
        )
      })}
    </aside>
  )
}
