import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tasks');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [error, setError] = useState('');
  const [taskForm, setTaskForm] = useState({ title:'', description:'', assignee:'', status:'To Do', priority:'Medium', dueDate:'' });
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('Member');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  useEffect(() => { fetchProject(); fetchTasks(); }, [id]);

  const fetchProject = async () => {
    try { const res = await API.get('/projects/'+id); setProject(res.data.data); }
    catch(e) { console.error(e); navigate('/projects'); }
    setLoading(false);
  };
  const fetchTasks = async () => {
    try { const res = await API.get('/projects/'+id+'/tasks'); setTasks(res.data.data); }
    catch(e) { console.error(e); }
  };

  const isAdmin = project?.userRole === 'Admin';
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—';
  const isOverdue = (d) => d && new Date(d) < new Date();

  const getStatusBadge = (s) => {
    const cls = s==='Done'?'badge-done':s==='In Progress'?'badge-progress':'badge-todo';
    return <span className={"badge "+cls}>{s}</span>;
  };
  const getPriorityBadge = (p) => {
    const cls = p==='High'?'badge-high':p==='Medium'?'badge-medium':'badge-low';
    return <span className={"badge "+cls}>{p}</span>;
  };

  const handleCreateTask = async (e) => {
    e.preventDefault(); setError('');
    try {
      const payload = { ...taskForm };
      if (!payload.assignee) delete payload.assignee;
      if (!payload.dueDate) delete payload.dueDate;
      await API.post('/projects/'+id+'/tasks', payload);
      setShowTaskModal(false);
      setTaskForm({ title:'', description:'', assignee:'', status:'To Do', priority:'Medium', dueDate:'' });
      fetchTasks();
    } catch(err) { setError(err.response?.data?.message || 'Failed to create task'); }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault(); setError('');
    try {
      const payload = { ...taskForm };
      if (!payload.assignee) payload.assignee = null;
      if (!payload.dueDate) payload.dueDate = null;
      await API.put('/projects/'+id+'/tasks/'+editTask._id, payload);
      setEditTask(null); setShowTaskModal(false);
      setTaskForm({ title:'', description:'', assignee:'', status:'To Do', priority:'Medium', dueDate:'' });
      fetchTasks();
    } catch(err) { setError(err.response?.data?.message || 'Failed to update task'); }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await API.put('/projects/'+id+'/tasks/'+task._id, { status: newStatus });
      fetchTasks();
    } catch(err) { console.error(err); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try { await API.delete('/projects/'+id+'/tasks/'+taskId); fetchTasks(); }
    catch(err) { console.error(err); }
  };

  const handleAddMember = async (e) => {
    e.preventDefault(); setError('');
    try {
      await API.post('/projects/'+id+'/members', { email: memberEmail, role: memberRole });
      setShowMemberModal(false); setMemberEmail(''); setMemberRole('Member');
      fetchProject();
    } catch(err) { setError(err.response?.data?.message || 'Failed to add member'); }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try { await API.delete('/projects/'+id+'/members/'+userId); fetchProject(); }
    catch(err) { console.error(err); }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and all tasks?')) return;
    try { await API.delete('/projects/'+id); navigate('/projects'); }
    catch(err) { console.error(err); }
  };

  const openEditTask = (t) => {
    setEditTask(t);
    setTaskForm({
      title: t.title, description: t.description||'',
      assignee: t.assignee?._id||'', status: t.status,
      priority: t.priority, dueDate: t.dueDate ? t.dueDate.slice(0,10) : ''
    });
    setError('');
    setShowTaskModal(true);
  };

  const openNewTask = () => {
    setEditTask(null);
    setTaskForm({ title:'', description:'', assignee:'', status:'To Do', priority:'Medium', dueDate:'' });
    setError('');
    setShowTaskModal(true);
  };

  const filteredTasks = tasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  if (loading) return <div className="app-layout"><Sidebar/><main className="main-content"><div className="loader-wrapper"><div className="loader"></div></div></main></div>;

  return (
    <div className="app-layout">
      <Sidebar/>
      <main className="main-content">
        <div className="navbar">
          <div>
            <button className="btn btn-secondary btn-sm" onClick={()=>navigate('/projects')} style={{marginBottom:'8px'}}>← Back</button>
            <h1 className="navbar-title">{project?.name}</h1>
            {project?.description && <p style={{color:'var(--text-muted)',fontSize:'14px',marginTop:'4px'}}>{project.description}</p>}
          </div>
          <div style={{display:'flex',gap:'8px'}}>
            {isAdmin && <button className="btn btn-primary" onClick={openNewTask}>+ New Task</button>}
            {isAdmin && <button className="btn btn-secondary" onClick={()=>{setError('');setShowMemberModal(true)}}>+ Add Member</button>}
            {isAdmin && <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>Delete</button>}
          </div>
        </div>

        <div className="tabs">
          <button className={"tab"+(tab==='tasks'?' active':'')} onClick={()=>setTab('tasks')}>Tasks ({tasks.length})</button>
          <button className={"tab"+(tab==='members'?' active':'')} onClick={()=>setTab('members')}>Members ({project?.members?.length||0})</button>
        </div>

        {tab === 'tasks' && (
          <div className="fade-in">
            <div className="filters">
              <select className="form-select" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
              <select className="form-select" value={filterPriority} onChange={e=>setFilterPriority(e.target.value)}>
                <option value="">All Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            {filteredTasks.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">No tasks yet</div></div>
            ) : (
              <div className="task-list">
                {filteredTasks.map(t=>(
                  <div className="task-item" key={t._id}>
                    <div style={{flex:1}}>
                      <div className="task-title">{t.title}</div>
                      {t.description && <div style={{fontSize:'13px',color:'var(--text-muted)',marginTop:'4px'}}>{t.description}</div>}
                      <div style={{display:'flex',gap:'8px',marginTop:'8px',alignItems:'center',flexWrap:'wrap'}}>
                        {getStatusBadge(t.status)}
                        {getPriorityBadge(t.priority)}
                        {t.assignee && <span style={{fontSize:'12px',color:'var(--text-secondary)'}}>👤 {t.assignee.name}</span>}
                        {t.dueDate && <span className={"task-due"+(isOverdue(t.dueDate)&&t.status!=='Done'?' overdue':'')}>📅 {formatDate(t.dueDate)}</span>}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                      <select className="form-select" value={t.status} onChange={e=>handleStatusChange(t,e.target.value)} style={{width:'auto',padding:'6px 10px',fontSize:'12px'}}>
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>
                      {isAdmin && <button className="btn btn-secondary btn-sm" onClick={()=>openEditTask(t)}>Edit</button>}
                      {isAdmin && <button className="btn btn-danger btn-sm" onClick={()=>handleDeleteTask(t._id)}>✕</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'members' && (
          <div className="fade-in member-list">
            {project?.members?.map(m=>(
              <div className="member-item" key={m.user._id}>
                <div className="member-info">
                  <div className="member-avatar" style={{background: m.role==='Admin'?'var(--gradient-primary)':'var(--gradient-secondary)'}}>{m.user.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <div style={{fontWeight:600}}>{m.user.name}</div>
                    <div style={{fontSize:'12px',color:'var(--text-muted)'}}>{m.user.email}</div>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <span className={"badge "+(m.role==='Admin'?'badge-admin':'badge-member')}>{m.role}</span>
                  {isAdmin && m.user._id !== project.owner && (
                    <button className="btn btn-danger btn-sm" onClick={()=>handleRemoveMember(m.user._id)}>Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showTaskModal && (
          <Modal title={editTask?'Edit Task':'Create Task'} onClose={()=>{setShowTaskModal(false);setEditTask(null)}}>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={editTask?handleUpdateTask:handleCreateTask}>
              <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={taskForm.title} onChange={e=>setTaskForm({...taskForm,title:e.target.value})} required /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={taskForm.description} onChange={e=>setTaskForm({...taskForm,description:e.target.value})} /></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={taskForm.status} onChange={e=>setTaskForm({...taskForm,status:e.target.value})}><option value="To Do">To Do</option><option value="In Progress">In Progress</option><option value="Done">Done</option></select></div>
                <div className="form-group"><label className="form-label">Priority</label><select className="form-select" value={taskForm.priority} onChange={e=>setTaskForm({...taskForm,priority:e.target.value})}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>
              </div>
              <div className="form-group"><label className="form-label">Assignee</label><select className="form-select" value={taskForm.assignee} onChange={e=>setTaskForm({...taskForm,assignee:e.target.value})}><option value="">Unassigned</option>{project?.members?.map(m=><option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Due Date</label><input className="form-input" type="date" value={taskForm.dueDate} onChange={e=>setTaskForm({...taskForm,dueDate:e.target.value})} /></div>
              <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={()=>{setShowTaskModal(false);setEditTask(null)}}>Cancel</button><button type="submit" className="btn btn-primary">{editTask?'Update':'Create'} Task</button></div>
            </form>
          </Modal>
        )}

        {showMemberModal && (
          <Modal title="Add Member" onClose={()=>setShowMemberModal(false)}>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleAddMember}>
              <div className="form-group"><label className="form-label">Email Address</label><input className="form-input" type="email" value={memberEmail} onChange={e=>setMemberEmail(e.target.value)} placeholder="user@example.com" required /></div>
              <div className="form-group"><label className="form-label">Role</label><select className="form-select" value={memberRole} onChange={e=>setMemberRole(e.target.value)}><option value="Member">Member</option><option value="Admin">Admin</option></select></div>
              <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={()=>setShowMemberModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Add Member</button></div>
            </form>
          </Modal>
        )}
      </main>
    </div>
  );
}
