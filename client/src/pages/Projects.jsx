import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchProjects(); }, []);
  const fetchProjects = async () => {
    try { const res = await API.get('/projects'); setProjects(res.data.data); } catch(e){ console.error(e); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('/projects', { name, description: desc });
      setShowModal(false); setName(''); setDesc('');
      fetchProjects();
    } catch(err) { setError(err.response?.data?.message || 'Failed to create project'); }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="navbar">
          <h1 className="navbar-title">Projects</h1>
          <button className="btn btn-primary" onClick={()=>setShowModal(true)}>+ New Project</button>
        </div>
        {loading ? <div className="loader-wrapper"><div className="loader"></div></div> : (
          <div className="fade-in">
            {projects.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📁</div><div className="empty-title">No projects yet</div><p>Create your first project to get started</p></div>
            ) : (
              <div className="project-grid">
                {projects.map(p=>(
                  <div className="project-card" key={p._id} onClick={()=>navigate('/projects/'+p._id)}>
                    <div className="project-name">{p.name}</div>
                    <div className="project-desc">{p.description || 'No description'}</div>
                    <div className="project-stats">
                      <div className="project-stat"><div className="project-stat-dot" style={{background:'var(--accent-blue)'}}></div>{p.taskCounts?.['To Do']||0} To Do</div>
                      <div className="project-stat"><div className="project-stat-dot" style={{background:'var(--accent-yellow)'}}></div>{p.taskCounts?.['In Progress']||0} Active</div>
                      <div className="project-stat"><div className="project-stat-dot" style={{background:'var(--accent-green)'}}></div>{p.taskCounts?.Done||0} Done</div>
                    </div>
                    <div style={{marginTop:'12px',fontSize:'12px',color:'var(--text-muted)'}}>
                      {p.members?.length||0} member{(p.members?.length||0)!==1?'s':''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {showModal && (
          <Modal title="Create Project" onClose={()=>setShowModal(false)}>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group"><label className="form-label">Project Name</label><input className="form-input" value={name} onChange={e=>setName(e.target.value)} placeholder="My Project" required /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Optional description..." /></div>
              <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create Project</button></div>
            </form>
          </Modal>
        )}
      </main>
    </div>
  );
}
