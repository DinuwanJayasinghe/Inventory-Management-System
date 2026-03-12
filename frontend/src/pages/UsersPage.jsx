// UsersPage.jsx — Real API: /api/users (admin only)
import { useState, useEffect } from 'react';
import { Plus, Trash2, Shield, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import { usersAPI } from '../services/api';

export default function UsersPage() {
  const { state, toast } = useApp();
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);
  const [form, setForm] = useState({name:'',email:'',password:'',role:'staff'});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const fetchUsers = async () => { setLoading(true); try { const r=await usersAPI.list(); setUsers(r.data||[]); } catch(e){toast(e.message,'error');} finally{setLoading(false);} };
  useEffect(()=>{fetchUsers();},[]);

  const handleAdd = async () => {
    try { await usersAPI.create(form); toast('User created','success'); setForm({name:'',email:'',password:'',role:'staff'}); setShowAdd(false); fetchUsers(); }
    catch(e){toast(e.message,'error');}
  };
  const handleDelete = async () => {
    try { await usersAPI.delete(deleteUser.id); toast('User removed','info'); setDeleteUser(null); fetchUsers(); }
    catch(e){toast(e.message,'error');}
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div><h1 className="page-title">User Management</h1><p className="page-subtitle">Admin-only · {users.length} registered users</p></div>
          <button className="btn btn-primary" onClick={()=>setShowAdd(true)}><Plus size={16}/> Create User</button>
        </div>
      </div>
      <div className="content-area">
        <div style={{display:'flex',gap:12,marginBottom:20}}>
          <div style={{background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',padding:'10px 16px',display:'flex',alignItems:'center',gap:8}}><Shield size={14} color="var(--accent)"/><span style={{fontSize:13}}><strong>{users.filter(u=>u.role==='admin').length}</strong> Admin</span></div>
          <div style={{background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',padding:'10px 16px',display:'flex',alignItems:'center',gap:8}}><UserCheck size={14} color="var(--blue)"/><span style={{fontSize:13}}><strong>{users.filter(u=>u.role==='staff').length}</strong> Staff</span></div>
        </div>
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          {loading?<div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Loading...</div>:(
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.map(u=>(
                    <tr key={u.id}>
                      <td><div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:30,height:30,borderRadius:'50%',background:u.role==='admin'?'var(--accent-subtle)':'var(--blue-bg)',display:'grid',placeItems:'center',fontSize:11,fontWeight:800,color:u.role==='admin'?'var(--accent)':'var(--blue)',fontFamily:'var(--font-display)',flexShrink:0}}>{u.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</div>
                        <div><div style={{fontWeight:600}}>{u.name}</div>{u.id===state.currentUser?.id&&<div style={{fontSize:10,color:'var(--accent)',textTransform:'uppercase',letterSpacing:'0.06em'}}>You</div>}</div>
                      </div></td>
                      <td style={{fontSize:13}}>{u.email}</td>
                      <td>{u.role==='admin'?<span className="badge badge-amber"><Shield size={10}/> Admin</span>:<span className="badge badge-blue"><UserCheck size={10}/> Staff</span>}</td>
                      <td style={{fontSize:13,color:'var(--text-muted)'}}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>{u.id!==state.currentUser?.id&&<button className="btn btn-danger btn-sm" onClick={()=>setDeleteUser(u)}><Trash2 size={13}/></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAdd&&<Modal title="Create New User" onClose={()=>setShowAdd(false)}>
        <div style={{background:'var(--accent-subtle)',border:'1px solid var(--border-accent)',borderRadius:'var(--radius-md)',padding:'10px 14px',marginBottom:20,fontSize:12,color:'var(--text-secondary)'}}>Only administrators can create user accounts.</div>
        <div className="form-group"><label className="label">Full Name *</label><input className="input" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Kasun Perera"/></div>
        <div className="form-group"><label className="label">Email *</label><input className="input" type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="kasun@ceyntics.com"/></div>
        <div className="form-group"><label className="label">Password *</label><input className="input" type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Min. 6 characters"/></div>
        <div className="form-group" style={{marginBottom:0}}><label className="label">Role</label><select className="input" value={form.role} onChange={e=>set('role',e.target.value)}><option value="staff">Staff — Standard access</option><option value="admin">Admin — Full access</option></select></div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}><button className="btn btn-ghost" onClick={()=>setShowAdd(false)}>Cancel</button><button className="btn btn-primary" onClick={handleAdd}>Create User</button></div>
      </Modal>}

      {deleteUser&&<Modal title="Remove User" onClose={()=>setDeleteUser(null)}>
        <p style={{color:'var(--text-secondary)',marginBottom:20}}>Remove <strong style={{color:'var(--text-primary)'}}>{deleteUser.name}</strong>? They will lose all access.</p>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}><button className="btn btn-ghost" onClick={()=>setDeleteUser(null)}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Remove User</button></div>
      </Modal>}
    </div>
  );
}
