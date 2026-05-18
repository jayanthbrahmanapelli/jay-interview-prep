import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav style={{
      background: '#050a14',
      borderBottom: '1px solid #1e2d3d',
      padding: '0 24px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '22px' }}>🎯</span>
        <span style={{ color: '#00BFFF', fontWeight: 700, fontSize: '18px', letterSpacing: '-0.3px' }}>
          Jay's Interview Prep
        </span>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#64748b', fontSize: '13px' }}>14-Day Sprint</span>
        <span style={{ color: '#1e2d3d' }}>|</span>
        <span style={{ color: '#64748b', fontSize: '13px' }}>Full Stack</span>
      </div>
    </nav>
  )
}
