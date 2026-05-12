import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">TaskFlow</div>
        <div style={{fontSize:'12px',color:'var(--text-muted)',marginTop:'4px'}}>Team Task Manager</div>
      </div>
      <nav className="sidebar-nav">
        <div className="sidebar-section">Navigation</div>
        <NavLink to="/dashboard" className={({isActive})=>'sidebar-link'+(isActive?' active':'')}>
          <span>📊</span> Dashboard
        </NavLink>
        <NavLink to="/projects" className={({isActive})=>'sidebar-link'+(isActive?' active':'')}>
          <span>📁</span> Projects
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px'}}>
          <div className="navbar-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={{fontSize:'14px',fontWeight:600}}>{user?.name}</div>
            <div style={{fontSize:'12px',color:'var(--text-muted)'}}>{user?.email}</div>
          </div>
        </div>
        <button className="btn btn-secondary" style={{width:'100%'}} onClick={handleLogout}>Logout</button>
      </div>
    </aside>
  );
}
