import { useState } from 'react'

const difficultyColors = {
  easy: { bg: '#052e16', text: '#22c55e', border: '#166534' },
  medium: { bg: '#451a03', text: '#f97316', border: '#7c2d12' },
  hard: { bg: '#2d1b69', text: '#a855f7', border: '#4c1d95' }
}

export default function ConceptCard({ concept }) {
  const [codeOpen, setCodeOpen] = useState(false)
  const [answerOpen, setAnswerOpen] = useState(false)
  const diff = difficultyColors[concept.difficulty] || difficultyColors.medium

  return (
    <div style={{
      background: '#0a1628',
      border: '1px solid #1e2d3d',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '20px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
        <h3 style={{ color: '#e2e8f0', fontSize: '18px', fontWeight: 700, lineHeight: 1.3, margin: 0 }}>
          {concept.title}
        </h3>
        <span style={{
          background: diff.bg,
          color: diff.text,
          border: `1px solid ${diff.border}`,
          padding: '3px 10px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          whiteSpace: 'nowrap'
        }}>
          {concept.difficulty}
        </span>
      </div>

      {/* Explanation */}
      <div style={{
        color: '#94a3b8',
        fontSize: '14px',
        lineHeight: 1.7,
        whiteSpace: 'pre-line',
        marginBottom: '16px'
      }}>
        {concept.explanation}
      </div>

      {/* Gotcha */}
      {concept.gotcha && (
        <div style={{
          background: '#1a0a00',
          border: '1px solid #7c2d12',
          borderLeft: '4px solid #f97316',
          borderRadius: '6px',
          padding: '12px 16px',
          marginBottom: '12px',
          color: '#fb923c',
          fontSize: '13px'
        }}>
          ⚠️ <strong>Gotcha:</strong> {concept.gotcha}
        </div>
      )}

      {/* Tip */}
      {concept.tip && (
        <div style={{
          background: '#001a2e',
          border: '1px solid #1e3a5f',
          borderLeft: '4px solid #00BFFF',
          borderRadius: '6px',
          padding: '12px 16px',
          marginBottom: '12px',
          color: '#7dd3fc',
          fontSize: '13px'
        }}>
          💡 <strong>Tip:</strong> {concept.tip}
        </div>
      )}

      {/* Code toggle */}
      {concept.code && (
        <div style={{ marginBottom: '12px' }}>
          <button
            onClick={() => setCodeOpen(!codeOpen)}
            style={{
              background: 'transparent',
              border: '1px solid #1e2d3d',
              color: '#00BFFF',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{codeOpen ? '▼' : '▶'}</span>
            {codeOpen ? 'Hide Code' : 'View Code Example'}
          </button>
          {codeOpen && (
            <pre className="code-block" style={{ marginTop: '12px', overflowX: 'auto' }}>
              <code style={{ fontSize: '13px', lineHeight: 1.6 }}>{concept.code}</code>
            </pre>
          )}
        </div>
      )}

      {/* Interview Q&A */}
      <div style={{ borderTop: '1px solid #1e2d3d', paddingTop: '16px', marginTop: '8px' }}>
        <div
          onClick={() => setAnswerOpen(!answerOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <span style={{ color: '#00BFFF', fontSize: '13px' }}>🎤</span>
          <span style={{ color: '#00BFFF', fontSize: '14px', fontWeight: 600 }}>
            {concept.interviewQ}
          </span>
          <span style={{ color: '#64748b', marginLeft: 'auto', fontSize: '12px' }}>
            {answerOpen ? 'Hide' : 'Show Answer'}
          </span>
        </div>
        {answerOpen && (
          <div style={{
            marginTop: '12px',
            padding: '16px',
            background: '#071221',
            border: '1px solid #1e2d3d',
            borderRadius: '8px',
            color: '#cbd5e1',
            fontSize: '14px',
            lineHeight: 1.7
          }}>
            {concept.interviewA}
          </div>
        )}
      </div>
    </div>
  )
}
