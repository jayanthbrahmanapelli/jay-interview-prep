import { Link } from 'react-router-dom'
import { curriculum } from '../data/curriculum'
import Navbar from '../components/Navbar'

const difficultyLabel = {
  easy: 'Beginner',
  medium: 'Intermediate',
  hard: 'Advanced'
}

export default function Home() {
  const completed = JSON.parse(localStorage.getItem('completedDays') || '[]')

  return (
    <div style={{ minHeight: '100vh', background: '#0A0F1F' }}>
      <Navbar />

      {/* Hero */}
      <div style={{
        textAlign: 'center',
        padding: '72px 24px 48px',
        maxWidth: '700px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'inline-block',
          background: '#071221',
          border: '1px solid #1e3a5f',
          color: '#00BFFF',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: '24px'
        }}>
          14-Day Interview Sprint
        </div>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 800,
          color: '#e2e8f0',
          lineHeight: 1.15,
          marginBottom: '16px',
          letterSpacing: '-1px'
        }}>
          Get Interview{' '}
          <span style={{
            background: 'linear-gradient(135deg, #00BFFF, #0080ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Ready
          </span>
        </h1>
        <p style={{
          color: '#64748b',
          fontSize: '18px',
          lineHeight: 1.6,
          marginBottom: '40px'
        }}>
          JavaScript, React, Vue, Node.js, Databases, System Design, DSA, Projects, Behavioural — everything for a senior full-stack role.
        </p>

        {/* Progress bar */}
        <div style={{
          background: '#0a1628',
          border: '1px solid #1e2d3d',
          borderRadius: '12px',
          padding: '20px 24px',
          marginBottom: '48px',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Your Progress</span>
            <span style={{ color: '#00BFFF', fontSize: '14px', fontWeight: 600 }}>
              {completed.length} / 14 days
            </span>
          </div>
          <div style={{ height: '6px', background: '#1e2d3d', borderRadius: '3px' }}>
            <div style={{
              height: '100%',
              width: `${(completed.length / 14) * 100}%`,
              background: 'linear-gradient(90deg, #00BFFF, #0080ff)',
              borderRadius: '3px',
              transition: 'width 0.4s ease'
            }} />
          </div>
          {completed.length === 0 && (
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '10px', margin: '10px 0 0' }}>
              Start with Day 1 ↓
            </p>
          )}
          {completed.length === 14 && (
            <p style={{ color: '#22c55e', fontSize: '13px', marginTop: '10px', margin: '10px 0 0' }}>
              🎉 All days complete — you're ready!
            </p>
          )}
        </div>
      </div>

      {/* Day Grid */}
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '0 24px 80px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px'
      }}>
        {curriculum.map(day => {
          const isDone = completed.includes(day.id)

          return (
            <Link key={day.id} to={`/day/${day.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#0a1628',
                border: `1px solid ${isDone ? '#166534' : '#1e2d3d'}`,
                borderRadius: '12px',
                padding: '24px',
                height: '100%',
                transition: 'all 0.2s ease',
                position: 'relative',
                cursor: 'pointer'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#1e3a5f'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 191, 255, 0.08)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = isDone ? '#166534' : '#1e2d3d'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}>
                {/* Done badge */}
                {isDone && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: '#052e16',
                    border: '1px solid #166534',
                    color: '#22c55e',
                    padding: '2px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    ✓ Done
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{day.emoji}</span>
                  <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 500 }}>Day {day.id}</span>
                </div>

                <h3 style={{
                  color: '#e2e8f0',
                  fontSize: '17px',
                  fontWeight: 700,
                  marginBottom: '6px',
                  lineHeight: 1.3
                }}>
                  {day.title}
                </h3>
                <p style={{
                  color: '#64748b',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  marginBottom: '16px'
                }}>
                  {day.subtitle}
                </p>

                {/* Topics */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {day.topics.slice(0, 3).map(topic => (
                    <span key={topic} style={{
                      background: '#071221',
                      border: '1px solid #1e2d3d',
                      color: '#94a3b8',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}>
                      {topic}
                    </span>
                  ))}
                  {day.topics.length > 3 && (
                    <span style={{
                      background: '#071221',
                      border: '1px solid #1e2d3d',
                      color: '#64748b',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}>
                      +{day.topics.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
