// StoragePage.jsx — Real API: /api/cupboards and /api/places
import { useState, useEffect } from 'react';
import { Plus, Trash2, Archive, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import { cupboardsAPI, placesAPI } from '../services/api';

export default function StoragePage() {
  const { toast } = useApp();
  const [cupboards, setCupboards] = useState([]);
  const [places, setPlaces]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [showAddCupboard, setShowAddCupboard] = useState(false);
  const [showAddPlace, setShowAddPlace]       = useState(false);
  const [newCupboard, setNewCupboard] = useState({name:'',description:''});
  const [newPlace, setNewPlace]       = useState({name:'',description:''});

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([cupboardsAPI.list(), placesAPI.list()]);
      const cbds = cRes.data || [];
      setCupboards(cbds);
      setPlaces(pRes.data || []);
      if (!selectedId && cbds.length > 0) setSelectedId(cbds[0].id);
    } catch(e){ toast(e.message,'error'); }
    finally { setLoading(false); }
  };
  useEffect(()=>{ fetchAll(); },[]);

  const filteredPlaces = places.filter(p=>p.cupboard_id===selectedId);
  const selectedCbd = cupboards.find(c=>c.id===selectedId);

  const handleAddCupboard = async () => {
    if(!newCupboard.name){toast('Name required','error');return;}
    try { await cupboardsAPI.create(newCupboard); toast('Cupboard added','success'); setNewCupboard({name:'',description:''}); setShowAddCupboard(false); fetchAll(); }
    catch(e){toast(e.message,'error');}
  };

  const handleAddPlace = async () => {
    if(!newPlace.name||!selectedId){toast('Name required','error');return;}
    try { await placesAPI.create({...newPlace,cupboard_id:selectedId}); toast('Place added','success'); setNewPlace({name:'',description:''}); setShowAddPlace(false); fetchAll(); }
    catch(e){toast(e.message,'error');}
  };

  const handleDeleteCupboard = async (c) => {
    try { await cupboardsAPI.delete(c.id); toast('Cupboard deleted','info'); if(selectedId===c.id) setSelectedId(null); fetchAll(); }
    catch(e){toast(e.message,'error');}
  };

  const handleDeletePlace = async (p) => {
    try { await placesAPI.delete(p.id); toast('Place deleted','info'); fetchAll(); }
    catch(e){toast(e.message,'error');}
  };

  return (
    <div className="page-enter">
      <div className="page-header"><h1 className="page-title">Storage Structure</h1><p className="page-subtitle">Manage cupboards and sub-locations</p></div>
      <div className="content-area">
        {loading?<div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Loading...</div>:(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
            <div className="card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}><Archive size={16} color="var(--accent)"/><span style={{fontFamily:'var(--font-display)',fontWeight:700}}>Cupboards</span><span style={{fontSize:12,background:'var(--bg-hover)',padding:'2px 8px',borderRadius:99,color:'var(--text-muted)'}}>{cupboards.length}</span></div>
                <button className="btn btn-ghost btn-sm" onClick={()=>setShowAddCupboard(true)}><Plus size={13}/> Add</button>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {cupboards.map(c=>{
                  const pc=places.filter(p=>p.cupboard_id===c.id).length, sel=selectedId===c.id;
                  return (
                    <div key={c.id} onClick={()=>setSelectedId(c.id)} style={{padding:'12px 14px',borderRadius:'var(--radius-md)',border:`1px solid ${sel?'var(--border-accent)':'var(--border)'}`,background:sel?'var(--accent-subtle)':'var(--bg-elevated)',cursor:'pointer',display:'flex',alignItems:'center',gap:10,transition:'all 0.14s'}}>
                      <Archive size={15} color={sel?'var(--accent)':'var(--text-muted)'} style={{flexShrink:0}}/>
                      <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14,color:sel?'var(--accent)':'var(--text-primary)'}}>{c.name}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>{pc} place{pc!==1?'s':''}</div></div>
                      <button className="btn btn-danger btn-sm" style={{padding:'4px 8px'}} onClick={e=>{e.stopPropagation();handleDeleteCupboard(c);}}><Trash2 size={12}/></button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}><MapPin size={16} color="var(--accent)"/><span style={{fontFamily:'var(--font-display)',fontWeight:700}}>{selectedCbd?`${selectedCbd.name} — Places`:'Places'}</span><span style={{fontSize:12,background:'var(--bg-hover)',padding:'2px 8px',borderRadius:99,color:'var(--text-muted)'}}>{filteredPlaces.length}</span></div>
                <button className="btn btn-ghost btn-sm" onClick={()=>setShowAddPlace(true)} disabled={!selectedId}><Plus size={13}/> Add</button>
              </div>
              {filteredPlaces.length===0?<div className="empty-state"><MapPin size={28}/><p style={{marginTop:8,fontSize:14}}>No places here yet</p></div>:(
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {filteredPlaces.map(p=>(
                    <div key={p.id} style={{padding:'12px 14px',borderRadius:'var(--radius-md)',border:'1px solid var(--border)',background:'var(--bg-elevated)',display:'flex',alignItems:'center',gap:10}}>
                      <MapPin size={14} color="var(--text-muted)" style={{flexShrink:0}}/>
                      <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14}}>{p.name}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>{p.items_count} item{p.items_count!==1?'s':''} stored{p.description&&` · ${p.description}`}</div></div>
                      <button className="btn btn-danger btn-sm" style={{padding:'4px 8px'}} onClick={()=>handleDeletePlace(p)}><Trash2 size={12}/></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showAddCupboard&&<Modal title="Add Cupboard" onClose={()=>setShowAddCupboard(false)}>
        <div className="form-group"><label className="label">Name *</label><input className="input" value={newCupboard.name} onChange={e=>setNewCupboard(f=>({...f,name:e.target.value}))} placeholder="e.g. Cabinet A"/></div>
        <div className="form-group" style={{marginBottom:0}}><label className="label">Description</label><input className="input" value={newCupboard.description} onChange={e=>setNewCupboard(f=>({...f,description:e.target.value}))} placeholder="What is stored here?"/></div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}><button className="btn btn-ghost" onClick={()=>setShowAddCupboard(false)}>Cancel</button><button className="btn btn-primary" onClick={handleAddCupboard}>Add Cupboard</button></div>
      </Modal>}

      {showAddPlace&&<Modal title={`Add Place in ${selectedCbd?.name}`} onClose={()=>setShowAddPlace(false)}>
        <div className="form-group"><label className="label">Name *</label><input className="input" value={newPlace.name} onChange={e=>setNewPlace(f=>({...f,name:e.target.value}))} placeholder="e.g. Shelf 1 – Top Row"/></div>
        <div className="form-group" style={{marginBottom:0}}><label className="label">Description</label><input className="input" value={newPlace.description} onChange={e=>setNewPlace(f=>({...f,description:e.target.value}))} placeholder="What is stored here?"/></div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}><button className="btn btn-ghost" onClick={()=>setShowAddPlace(false)}>Cancel</button><button className="btn btn-primary" onClick={handleAddPlace}>Add Place</button></div>
      </Modal>}
    </div>
  );
}
