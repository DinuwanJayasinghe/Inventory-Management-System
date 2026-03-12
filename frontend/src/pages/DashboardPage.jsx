// DashboardPage.jsx — Real API: GET /api/dashboard
import React, { useState, useEffect } from 'react';
import { Package, ArrowLeftRight, AlertTriangle, Users, TrendingUp, Clock, RefreshCw } from 'lucide-react';
import { dashboardAPI } from '../services/api';

function BarChartSVG({ data }) {
  const [tip, setTip] = React.useState(null);
  if (!data?.length) return <div style={{textAlign:'center',padding:40,color:'var(--text-muted)',fontSize:13}}>No chart data yet</div>;
  const W=480,H=180,PL=28,PT=10,PB=32,PR=10;
  const cW=W-PL-PR, cH=H-PT-PB;
  const maxVal=Math.max(...data.flatMap(d=>[Number(d.borrowed),Number(d.returned)]),1);
  const gW=cW/data.length, bW=gW*0.35, gap=gW*0.06;
  const toY=v=>cH-(v/maxVal)*cH;
  const ticks=[0,Math.round(maxVal/2),maxVal];
  return (
    <div style={{position:'relative',width:'100%'}}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto',overflow:'visible'}}>
        <g transform={`translate(${PL},${PT})`}>
          {ticks.map(v=>(
            <g key={v}>
              <line x1={0} y1={toY(v)} x2={cW} y2={toY(v)} stroke="var(--border)" strokeDasharray="4 3"/>
              <text x={-6} y={toY(v)+4} textAnchor="end" fontSize={10} fill="var(--text-muted)">{v}</text>
            </g>
          ))}
          {data.map((d,i)=>{
            const gx=i*gW+gW*0.1, bv=Number(d.borrowed), rv=Number(d.returned);
            return (
              <g key={d.month}>
                <rect x={gx} y={toY(bv)} width={bW} height={(bv/maxVal)*cH} rx={3} fill="var(--blue)" opacity={0.85} style={{cursor:'pointer'}} onMouseEnter={()=>setTip({x:gx+bW/2,y:toY(bv)-8,label:d.month,borrowed:bv,returned:rv})} onMouseLeave={()=>setTip(null)}/>
                <rect x={gx+bW+gap} y={toY(rv)} width={bW} height={(rv/maxVal)*cH} rx={3} fill="var(--green)" opacity={0.85} style={{cursor:'pointer'}} onMouseEnter={()=>setTip({x:gx+bW+gap+bW/2,y:toY(rv)-8,label:d.month,borrowed:bv,returned:rv})} onMouseLeave={()=>setTip(null)}/>
                <text x={gx+bW+gap/2} y={cH+18} textAnchor="middle" fontSize={11} fill="var(--text-muted)">{d.month}</text>
              </g>
            );
          })}
          {tip&&<g transform={`translate(${tip.x-48},${tip.y-48})`}><rect x={0} y={0} width={96} height={46} rx={6} fill="var(--bg-elevated)" stroke="var(--border-strong)" strokeWidth={1}/><text x={8} y={16} fontSize={11} fill="var(--text-muted)">{tip.label}</text><text x={8} y={30} fontSize={11} fill="var(--blue)">Borrowed: {tip.borrowed}</text><text x={8} y={42} fontSize={11} fill="var(--green)">Returned: {tip.returned}</text></g>}
        </g>
      </svg>
      <div style={{display:'flex',gap:16,marginTop:4}}>
        <span style={{fontSize:12,color:'var(--text-muted)',display:'flex',alignItems:'center',gap:5}}><span style={{width:10,height:10,background:'var(--blue)',borderRadius:2,display:'inline-block'}}/> Borrowed</span>
        <span style={{fontSize:12,color:'var(--text-muted)',display:'flex',alignItems:'center',gap:5}}><span style={{width:10,height:10,background:'var(--green)',borderRadius:2,display:'inline-block'}}/> Returned</span>
      </div>
    </div>
  );
}

const getLogColor = a => a?.includes('created')?'var(--green)':a?.includes('borrowed')?'var(--blue)':a?.includes('returned')?'var(--accent)':a?.includes('status')?'var(--orange)':'var(--text-muted)';

export default function DashboardPage() {
  const [data,setData]=useState(null), [loading,setLoading]=useState(true), [error,setError]=useState('');
  const fetchData = async () => { setLoading(true); setError(''); try { const r = await dashboardAPI.get(); setData(r); } catch(e){ setError(e.message); } finally { setLoading(false); } };
  useEffect(()=>{fetchData();},[]);
  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',flexDirection:'column',gap:12}}><div style={{width:32,height:32,border:'3px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/><span style={{color:'var(--text-muted)',fontSize:14}}>Loading...</span><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
  if(error) return <div style={{padding:40,textAlign:'center'}}><p style={{color:'var(--red)',marginBottom:16}}>{error}</p><button className="btn btn-ghost" onClick={fetchData}>Retry</button></div>;
  const {stats,chart_data,recent_logs}=data||{};
  return (
    <div className="page-enter">
      <div className="page-header">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div><h1 className="page-title">Dashboard</h1><p className="page-subtitle">Live inventory overview — Ceyntics Systems (Pvt) Ltd</p></div>
          <button className="btn btn-ghost btn-sm" onClick={fetchData}><RefreshCw size={14}/> Refresh</button>
        </div>
      </div>
      <div className="content-area">
        {stats?.overdue>0&&<div style={{background:'var(--red-bg)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:'var(--radius-md)',padding:'12px 18px',marginBottom:24,display:'flex',alignItems:'center',gap:10}}><AlertTriangle size={16} color="var(--red)"/><span style={{fontSize:14,color:'var(--red)'}}><strong>{stats.overdue} borrowing(s)</strong> overdue</span></div>}
        <div className="stats-grid" style={{marginBottom:24}}>
          <div className="stat-card"><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}><div><div className="stat-value">{stats?.total_items??0}</div><div className="stat-label">Total Items</div></div><div className="stat-icon" style={{background:'var(--accent-subtle)'}}><Package size={18} color="var(--accent)"/></div></div><div style={{marginTop:16,display:'flex',gap:12,fontSize:12}}><span style={{color:'var(--green)'}}>● {stats?.in_store??0} in store</span><span style={{color:'var(--blue)'}}>● {stats?.borrowed??0} borrowed</span></div></div>
          <div className="stat-card"><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}><div><div className="stat-value" style={{color:stats?.overdue>0?'var(--red)':'var(--text-primary)'}}>{stats?.active_borrows??0}</div><div className="stat-label">Active Borrows</div></div><div className="stat-icon" style={{background:'var(--blue-bg)'}}><ArrowLeftRight size={18} color="var(--blue)"/></div></div><div style={{marginTop:16,fontSize:12,color:stats?.overdue>0?'var(--red)':'var(--green)'}}>{stats?.overdue>0?`⚠ ${stats.overdue} overdue`:'✓ No overdue'}</div></div>
          <div className="stat-card"><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}><div><div className="stat-value" style={{color:(stats?.damaged+stats?.missing)>0?'var(--orange)':'var(--text-primary)'}}>{(stats?.damaged??0)+(stats?.missing??0)}</div><div className="stat-label">Issues</div></div><div className="stat-icon" style={{background:'var(--orange-bg)'}}><AlertTriangle size={18} color="var(--orange)"/></div></div><div style={{marginTop:16,display:'flex',gap:12,fontSize:12}}><span style={{color:'var(--red)'}}>● {stats?.damaged??0} damaged</span><span style={{color:'var(--orange)'}}>● {stats?.missing??0} missing</span></div></div>
          <div className="stat-card"><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}><div><div className="stat-value">{stats?.total_users??0}</div><div className="stat-label">System Users</div></div><div className="stat-icon" style={{background:'var(--green-bg)'}}><Users size={18} color="var(--green)"/></div></div></div>
        </div>
        <div className="two-col">
          <div className="card"><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20}}><TrendingUp size={16} color="var(--accent)"/><span style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:15}}>Borrow / Return Trend</span><span style={{marginLeft:'auto',fontSize:12,color:'var(--text-muted)'}}>Last 6 months</span></div><BarChartSVG data={chart_data}/></div>
          <div className="card"><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20}}><Clock size={16} color="var(--accent)"/><span style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:15}}>Recent Activity</span></div><div style={{display:'flex',flexDirection:'column',gap:14}}>{!recent_logs?.length&&<p style={{color:'var(--text-muted)',fontSize:13}}>No activity yet</p>}{recent_logs?.map(log=>(<div key={log.id} style={{display:'flex',gap:12,alignItems:'flex-start'}}><div style={{width:7,height:7,borderRadius:'50%',background:getLogColor(log.action),marginTop:6,flexShrink:0}}/><div><div style={{fontSize:13,fontWeight:500}}>{log.desc}</div><div style={{fontSize:11,color:'var(--text-muted)'}}>{log.user} · {log.ts}</div></div></div>))}</div></div>
        </div>
      </div>
    </div>
  );
}
