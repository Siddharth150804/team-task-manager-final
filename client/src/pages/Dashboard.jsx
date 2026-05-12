import { useState, useEffect } from 'react';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);
  const fetchStats = async () => {
    try {
      const res = await API.get('/dashboard');
      setStats(res.data.data);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    const cls = status === 'Done' ? 'badge-done' : status === 'In Progress' ? 'badge-progress' : 'badge-todo';
    return <span className={"badge "+cls}>{status}</span>;
  };

  const getPriorityBadge = (p) => {
    const cls = p === 'High' ? 'badge-high' : p === 'Medium' ? 'badge-medium' : 'badge-low';
    return <span className={"badge "+cls}>{p}</span>;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '—';
  const isOverdue = (d) => d && new Date(d) < new Date();

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="navbar">
          <div><h1 className="navbar-title">Dashboard</h1></div>
          <div className="navbar-user">
            <span style={{color:'var(--text-muted)',fontSize:'14px'}}>Welcome, {user?.name}</span>
            <div className="navbar-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          </div>
        </div>
        {loading ? <div className="loader-wrapper"><div className="loader"></div></div> : stats && (
          <div className="fade-in">
            <div className="stats-grid">
              <div className="stat-card blue"><div className="stat-label">Total Projects</div><div className="stat-value">{stats.totalProjects}</div></div>
              <div className="stat-card purple"><div className="stat-label">Total Tasks</div><div className="stat-value">{stats.totalTasks}</div></div>
              <div className="stat-card green"><div className="stat-label">My Tasks</div><div className="stat-value">{stats.myTasks}</div></div>
              <div className="stat-card yellow"><div className="stat-label">Overdue</div><div className="stat-value">{stats.overdueTasks}</div></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
              <div className="glass-card" style={{cursor:'default'}}>
                <h3 style={{marginBottom:'16px',fontWeight:700}}>📊 Task Status Breakdown</h3>
                <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                  {Object.entries(stats.statusCounts).map(([k,v])=>(
                    <div key={k} style={{display:'flex',alignItems:'center',gap:'12px'}}>
                      {getStatusBadge(k)}
                      <div style={{flex:1,height:'8px',background:'rgba(255,255,255,0.05)',borderRadius:'4px',overflow:'hidden'}}>
                        <div style={{height:'100%',width:stats.totalTasks?((v/stats.totalTasks)*100)+'%':'0%',background:k==='Done'?'var(--accent-green)':k==='In Progress'?'var(--accent-yellow)':'var(--accent-blue)',borderRadius:'4px',transition:'width 0.5s ease'}}></div>
                      </div>
                      <span style={{fontWeight:700,minWidth:'30px',textAlign:'right'}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card" style={{cursor:'default'}}>
                <h3 style={{marginBottom:'16px',fontWeight:700}}>⚡ Priority Distribution</h3>
                <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                  {Object.entries(stats.priorityCounts).map(([k,v])=>(
                    <div key={k} style={{display:'flex',alignItems:'center',gap:'12px'}}>
                      {getPriorityBadge(k)}
                      <div style={{flex:1,height:'8px',background:'rgba(255,255,255,0.05)',borderRadius:'4px',overflow:'hidden'}}>
                        <div style={{height:'100%',width:stats.totalTasks?((v/stats.totalTasks)*100)+'%':'0%',background:k==='High'?'var(--accent-red)':k==='Medium'?'var(--accent-yellow)':'var(--accent-green)',borderRadius:'4px',transition:'width 0.5s ease'}}></div>
                      </div>
                      <span style={{fontWeight:700,minWidth:'30px',textAlign:'right'}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {stats.overdueTasksList?.length > 0 && (
              <div className="glass-card" style={{marginTop:'20px',cursor:'default'}}>
                <h3 style={{marginBottom:'16px',fontWeight:700,color:'var(--accent-red)'}}>🔴 Overdue Tasks</h3>
                <div className="task-list">
                  {stats.overdueTasksList.map(t=>(
                    <div className="task-item" key={t._id}>
                      <div className="task-title">{t.title}</div>
                      {getPriorityBadge(t.priority)}
                      <span className="task-due overdue">Due {formatDate(t.dueDate)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {stats.recentTasks?.length > 0 && (
              <div className="glass-card" style={{marginTop:'20px',cursor:'default'}}>
                <h3 style={{marginBottom:'16px',fontWeight:700}}>🕐 Recent Tasks</h3>
                <div className="task-list">
                  {stats.recentTasks.map(t=>(
                    <div className="task-item" key={t._id}>
                      <div className="task-title">{t.title}</div>
                      {getStatusBadge(t.status)}
                      {getPriorityBadge(t.priority)}
                      <span className="task-due" style={isOverdue(t.dueDate)&&t.status!=='Done'?{color:'var(--accent-red)'}:{}}>{formatDate(t.dueDate)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
