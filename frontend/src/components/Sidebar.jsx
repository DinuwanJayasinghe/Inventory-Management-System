// Sidebar.jsx — Uses real auth state (no mock data)
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowLeftRight, Archive, Users, ScrollText, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Sidebar() {
  const { state, logout, toast } = useApp();
  const navigate = useNavigate();
  const { currentUser } = state;
  const isAdmin = currentUser?.role === 'admin';
  const initials = currentUser?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || 'U';

  const handleLogout = async () => {
    await logout();
    toast('Signed out successfully', 'info');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">C</div>
        <div>
          <div style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:13,lineHeight:1.2}}>Ceyntics</div>
          <div style={{fontSize:10,color:'var(--text-muted)',letterSpacing:'0.06em'}}>IMS v1.0</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>
        <NavLink to="/dashboard" className={({isActive})=>`nav-link ${isActive?'active':''}`}><LayoutDashboard size={16} className="nav-icon"/>Dashboard</NavLink>
        <NavLink to="/items"     className={({isActive})=>`nav-link ${isActive?'active':''}`}><Package size={16} className="nav-icon"/>Inventory</NavLink>
        <NavLink to="/borrowings" className={({isActive})=>`nav-link ${isActive?'active':''}`}><ArrowLeftRight size={16} className="nav-icon"/>Borrowings</NavLink>
        <div className="nav-section-label">Storage</div>
        <NavLink to="/storage" className={({isActive})=>`nav-link ${isActive?'active':''}`}><Archive size={16} className="nav-icon"/>Cupboards & Places</NavLink>
        {isAdmin&&(<>
          <div className="nav-section-label">Admin</div>
          <NavLink to="/users" className={({isActive})=>`nav-link ${isActive?'active':''}`}><Users size={16} className="nav-icon"/>Users</NavLink>
          <NavLink to="/logs"  className={({isActive})=>`nav-link ${isActive?'active':''}`}><ScrollText size={16} className="nav-icon"/>Audit Log</NavLink>
        </>)}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">{initials}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,lineHeight:1.2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{currentUser?.name}</div>
            <div style={{fontSize:11,color:'var(--text-muted)',textTransform:'capitalize'}}>{currentUser?.role}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="nav-link" style={{width:'100%',background:'none',border:'1px solid transparent',marginTop:4}}>
          <LogOut size={15} className="nav-icon"/><span style={{fontSize:13}}>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
