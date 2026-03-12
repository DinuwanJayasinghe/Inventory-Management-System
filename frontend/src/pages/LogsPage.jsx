// LogsPage.jsx — Real API: GET /api/logs (admin only)
import { useState, useEffect } from 'react';
import { ScrollText, Search, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { logsAPI } from '../services/api';

function ActionBadge({ action }) {
  const map = { item_created:{label:'Created',cls:'badge-green'}, item_updated:{label:'Updated',cls:'badge-blue'}, item_deleted:{label:'Deleted',cls:'badge-red'}, quantity_changed:{label:'Qty Changed',cls:'badge-blue'}, status_changed:{label:'Status',cls:'badge-orange'}, borrowed:{label:'Borrowed',cls:'badge-amber'}, returned:{label:'Returned',cls:'badge-green'}, user_created:{label:'User Created',cls:'badge-blue'} };
  const cfg=map[action]||{label:action,cls:'badge-gray'};
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

export default function LogsPage() {
  const { toast } = useApp();
  const [logs, setLogs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [actionFilter, setAction] = useState('all');
  const [currentPage, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage };
      if (search) params.search = search;
      if (actionFilter !== 'all') params.action = actionFilter;
      const res = await logsAPI.list(params);
      setLogs(res.data || []);
      setMeta(res.meta || null);
    } catch(e){toast(e.message,'error');} finally{setLoading(false);}
  };
  useEffect(()=>{fetchLogs();},[search,actionFilter,currentPage]);

  const actions = ['all','item_created','item_updated','quantity_changed','status_changed','borrowed','returned','user_created'];

  return (
    <div className="page-enter">
      <div className="page-header">
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
          <div><h1 className="page-title">Audit Log</h1><p className="page-subtitle">Complete system activity trail</p></div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:'var(--radius-md)',padding:'8px 14px'}}><ScrollText size={14} color="var(--accent)"/><span style={{fontSize:13,fontWeight:600}}>{meta?.total||logs.length} entries</span></div>
            <button className="btn btn-ghost btn-sm" onClick={fetchLogs}><RefreshCw size={14}/></button>
          </div>
        </div>
      </div>
      <div className="content-area">
        <div style={{position:'relative',display:'flex',alignItems:'center',marginBottom:16}}>
          <Search size={14} style={{position:'absolute',left:12,color:'var(--text-muted)',pointerEvents:'none'}}/>
          <input className="input" style={{paddingLeft:36}} placeholder="Search by user..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
          {actions.map(a=><button key={a} className={`chip ${actionFilter===a?'active':''}`} onClick={()=>setAction(a)}>{a==='all'?'All Events':a.replace(/_/g,' ')}</button>)}
        </div>
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          {loading?<div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Loading...</div>:(
            <div className="table-wrap">
              <table>
                <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Description</th><th>Before</th><th>After</th></tr></thead>
                <tbody>
                  {logs.length===0?<tr><td colSpan={6}><div className="empty-state"><ScrollText size={28}/><p style={{marginTop:8}}>No log entries found</p></div></td></tr>
                  :logs.map(log=>(
                    <tr key={log.id}>
                      <td style={{fontSize:12,fontFamily:'monospace',color:'var(--text-muted)',whiteSpace:'nowrap'}}>{log.ts}</td>
                      <td><div style={{display:'flex',alignItems:'center',gap:7}}><div style={{width:22,height:22,borderRadius:'50%',background:'var(--bg-hover)',display:'grid',placeItems:'center',fontSize:9,fontWeight:800,color:'var(--text-muted)',fontFamily:'var(--font-display)',flexShrink:0}}>{log.user?.split(' ').map(n=>n[0]).join('').slice(0,2)}</div><span style={{fontSize:13,whiteSpace:'nowrap'}}>{log.user}</span></div></td>
                      <td><ActionBadge action={log.action}/></td>
                      <td style={{maxWidth:260}}><div style={{fontSize:13}}>{log.action?.replace(/_/g,' ')} — {log.model_type}</div><div style={{fontSize:11,color:'var(--text-muted)'}}>{log.model_id?.slice(0,8)}</div></td>
                      <td style={{fontSize:12,fontFamily:'monospace',color:'var(--red)'}}>{log.old_values?JSON.stringify(log.old_values).slice(0,40):<span style={{color:'var(--text-muted)'}}>—</span>}</td>
                      <td style={{fontSize:12,fontFamily:'monospace',color:'var(--green)'}}>{log.new_values?JSON.stringify(log.new_values).slice(0,40):<span style={{color:'var(--text-muted)'}}>—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {meta&&meta.last_page>1&&(
          <div style={{display:'flex',justifyContent:'center',gap:8,marginTop:16}}>
            <button className="btn btn-ghost btn-sm" disabled={currentPage===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
            <span style={{padding:'7px 14px',fontSize:13,color:'var(--text-muted)'}}>Page {currentPage} of {meta.last_page}</span>
            <button className="btn btn-ghost btn-sm" disabled={currentPage===meta.last_page} onClick={()=>setPage(p=>p+1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
