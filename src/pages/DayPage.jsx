import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { allDays } from '../data/days'
import { curriculum } from '../data/curriculum'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import ConceptCard from '../components/ConceptCard'
import QACard from '../components/QACard'

export default function DayPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dayId = parseInt(id)
  const day = allDays[dayId]
  const meta = curriculum.find(d => d.id === dayId)
  const [activeTab, setActiveTab] = useState('concepts')
  const [completed, setCompleted] = useState(
    JSON.parse(localStorage.getItem('completedDays') || '[]')
  )

  useEffect(() => {
    window.scrollTo(0, 0)
    setActiveTab('concepts')
  }, [id])

  if (!day) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0F1F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#64748b', fontSize: '48px', marginBottom: '16px' }}>404</div>
          <div style={{ color: '#e2e8f0', fontSize: '20px', marginBottom: '24px' }}>Day not found</div>
          <button
            onClick={() => navigate('/')}
            style={{ background: '#00BFFF', color: '#0A0F1F', padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const isDone = completed.includes(dayId)

  const toggleComplete = () => {
    const updated = isDone
      ? completed.filter(d => d !== dayId)
      : [...completed, dayId]
    localStorage.setItem('completedDays', JSON.stringify(updated))
    setCompleted(updated)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0F1F' }}>
      <Navbar />
      <div style={{ display: 'flex' }}>
        {/* Sidebar — hidden on small screens via inline check */}
        <div style={{ display: 'flex' }}>
          <Sidebar />
        </div>

        {/* Main content */}
        <main style={{ flex: 1, padding: '32px', minWidth: 0, maxWidth: '900px' }}>
          {/* Day header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '32px' }}>{meta?.emoji}</span>
              <div>
                <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '2px' }}>Day {dayId}</div>
                <h1 style={{ color: '#e2e8f0', fontSize: '28px', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                  {day.title}
                </h1>
              </div>
            </div>
            <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '20px', marginLeft: '44px' }}>
              {day.subtitle}
            </p>

            {/* Topic pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
              {meta?.topics.map(topic => (
                <span key={topic} style={{
                  background: '#071221',
                  border: '1px solid #1e2d3d',
                  color: '#94a3b8',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px'
                }}>
                  {topic}
                </span>
              ))}
            </div>

            {/* Nav + complete button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {dayId > 1 && (
                  <button
                    onClick={() => navigate(`/day/${dayId - 1}`)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #1e2d3d',
                      color: '#94a3b8',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    ← Day {dayId - 1}
                  </button>
                )}
                {dayId < 14 && (
                  <button
                    onClick={() => navigate(`/day/${dayId + 1}`)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #1e2d3d',
                      color: '#94a3b8',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Day {dayId + 1} →
                  </button>
                )}
              </div>
              <button
                onClick={toggleComplete}
                style={{
                  background: isDone ? '#052e16' : '#071221',
                  border: `1px solid ${isDone ? '#166534' : '#1e2d3d'}`,
                  color: isDone ? '#22c55e' : '#64748b',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'all 0.15s ease'
                }}
              >
                {isDone ? '✓ Completed' : '○ Mark Complete'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '0',
            borderBottom: '1px solid #1e2d3d',
            marginBottom: '28px'
          }}>
            {['concepts', 'qa'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #00BFFF' : '2px solid transparent',
                  color: activeTab === tab ? '#00BFFF' : '#64748b',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === tab ? 600 : 400,
                  transition: 'all 0.15s ease',
                  marginBottom: '-1px'
                }}
              >
                {tab === 'concepts' ? (
                  <>📚 Concepts <span style={{ color: '#1e3a5f', fontSize: '12px' }}>({day.concepts.length})</span></>
                ) : (
                  <>🎤 Interview Q&A <span style={{ color: '#1e3a5f', fontSize: '12px' }}>({day.interviewQA.length})</span></>
                )}
              </button>
            ))}
          </div>

          {/* Concepts tab */}
          {activeTab === 'concepts' && (
            <div>
              {day.concepts.map(concept => (
                <ConceptCard key={concept.id} concept={concept} />
              ))}
            </div>
          )}

          {/* Q&A tab */}
          {activeTab === 'qa' && (
            <div>
              <div style={{
                background: '#071221',
                border: '1px solid #1e3a5f',
                borderRadius: '10px',
                padding: '16px 20px',
                marginBottom: '20px',
                color: '#7dd3fc',
                fontSize: '13px',
                lineHeight: 1.5
              }}>
                💡 <strong>Practice tip:</strong> Try answering each question out loud before revealing the answer. Keep your answers under 90 seconds — clear, confident, with a real example.
              </div>
              {day.interviewQA.map((qa, i) => (
                <QACard key={i} qa={qa} index={i} />
              ))}
            </div>
          )}

          {/* Bottom navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '48px',
            paddingTop: '24px',
            borderTop: '1px solid #1e2d3d'
          }}>
            {dayId > 1 ? (
              <button
                onClick={() => navigate(`/day/${dayId - 1}`)}
                style={{
                  background: '#0a1628',
                  border: '1px solid #1e2d3d',
                  color: '#94a3b8',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ← Previous Day
              </button>
            ) : <div />}
            {dayId < 14 ? (
              <button
                onClick={() => navigate(`/day/${dayId + 1}`)}
                style={{
                  background: 'linear-gradient(135deg, #0080ff, #00BFFF)',
                  border: 'none',
                  color: '#fff',
                  padding: '12px 28px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                Next Day →
              </button>
            ) : (
              <button
                onClick={() => navigate('/')}
                style={{
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  border: 'none',
                  color: '#fff',
                  padding: '12px 28px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                🎉 Back to Home
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
