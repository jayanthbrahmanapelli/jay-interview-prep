import { useState } from 'react'

export default function QACard({ qa, index }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      background: '#0a1628',
      border: '1px solid #1e2d3d',
      borderRadius: '10px',
      marginBottom: '12px',
      overflow: 'hidden',
      transition: 'border-color 0.15s ease',
      ...(open ? { borderColor: '#1e3a5f' } : {})
    }}>
      {/* Question */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <span style={{
          background: '#071221',
          border: '1px solid #1e2d3d',
          color: '#00BFFF',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 700,
          minWidth: '28px'
        }}>
          {index + 1}
        </span>
        <span style={{
          color: open ? '#e2e8f0' : '#94a3b8',
          fontSize: '14px',
          fontWeight: open ? 600 : 400,
          flex: 1,
          lineHeight: 1.4
        }}>
          {qa.q}
        </span>
        <span style={{
          color: '#64748b',
          fontSize: '18px',
          transform: open ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.2s ease',
          minWidth: '18px'
        }}>
          ↓
        </span>
      </div>

      {/* Answer */}
      {open && (
        <div style={{
          padding: '0 20px 20px',
          borderTop: '1px solid #1e2d3d'
        }}>
          <div style={{
            paddingTop: '16px',
            color: '#cbd5e1',
            fontSize: '14px',
            lineHeight: 1.75,
            whiteSpace: 'pre-line'
          }}>
            {qa.a}
          </div>
        </div>
      )}
    </div>
  )
}
