// ItemsPage.jsx — Real API: GET/POST/PUT/DELETE /api/items
import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import { itemsAPI, placesAPI } from '../services/api';

const STATUS_CONFIG = {
  in_store: { label: 'In Store',  badge: 'badge-green' },
  borrowed: { label: 'Borrowed',  badge: 'badge-blue' },
  damaged:  { label: 'Damaged',   badge: 'badge-red' },
  missing:  { label: 'Missing',   badge: 'badge-orange' },
};

function ItemForm({ initial, places, onSave, onClose, loading }) {
  const [form, setForm] = useState(initial || { name:'',code:'',quantity:0,serialNumber:'',description:'',placeId:places[0]?.id||'',status:'in_store' });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <>
      <div className="form-row">
        <div className="form-group"><label className="label">Item Name *</label><input className="input" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Arduino Uno R3"/></div>
        <div className="form-group"><label className="label">Item Code *</label><input className="input" value={form.code} onChange={e=>set('code',e.target.value)} placeholder="e.g. EL-001"/></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="label">Quantity</label><input className="input" type="number" min="0" value={form.quantity} onChange={e=>set('quantity',parseInt(e.target.value)||0)}/></div>
        <div className="form-group"><label className="label">Status</label><select className="input" value={form.status} onChange={e=>set('status',e.target.value)}><option value="in_store">In Store</option><option value="borrowed">Borrowed</option><option value="damaged">Damaged</option><option value="missing">Missing</option></select></div>
      </div>
      <div className="form-group"><label className="label">Storage Place</label><select className="input" value={form.placeId} onChange={e=>set('placeId',e.target.value)}>{places.map(p=><option key={p.id} value={p.id}>{p.cupboard_name} → {p.name}</option>)}</select></div>
      <div className="form-group"><label className="label">Serial Number (optional)</label><input className="input" value={form.serialNumber||''} onChange={e=>set('serialNumber',e.target.value)} placeholder="e.g. RPI-2024-0042"/></div>
      <div className="form-group" style={{marginBottom:0}}><label className="label">Description</label><textarea className="input" rows={3} value={form.description||''} onChange={e=>set('description',e.target.value)} placeholder="Brief description..." style={{resize:'vertical'}}/></div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}>
        <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
        <button className="btn btn-primary" disabled={loading} onClick={()=>onSave(form)}>{loading?'Saving...':initial?'Save Changes':'Add Item'}</button>
      </div>
    </>
  );
}

export default function ItemsPage() {
  const { toast } = useApp();
  const [items, setItems]     = useState([]);
  const [places, setPlaces]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [showAdd, setShowAdd]     = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      const [itemsRes, placesRes] = await Promise.all([itemsAPI.list(params), placesAPI.list()]);
      setItems(itemsRes.data || []);
      setPlaces(placesRes.data || []);
    } catch(e){ toast(e.message,'error'); }
    finally { setLoading(false); }
  };

  useEffect(()=>{fetchItems();},[search, statusFilter]);

  const handleAdd = async (form) => {
    setSaving(true);
    try {
      const body = { name:form.name, code:form.code, quantity:form.quantity, status:form.status, place_id:form.placeId, serial_number:form.serialNumber||null, description:form.description||null };
      await itemsAPI.create(Object.assign(new FormData(), Object.entries(body).filter(([,v])=>v!=null).reduce((fd,[k,v])=>{fd.append(k,v);return fd;},new FormData())));
      toast('Item added successfully','success'); setShowAdd(false); fetchItems();
    } catch(e){ toast(e.message,'error'); } finally { setSaving(false); }
  };

  const handleEdit = async (form) => {
    setSaving(true);
    try {
      await itemsAPI.update(editItem.id, { name:form.name, code:form.code, quantity:form.quantity, status:form.status, place_id:form.placeId, serial_number:form.serialNumber||null, description:form.description||null });
      toast('Item updated','success'); setEditItem(null); fetchItems();
    } catch(e){ toast(e.message,'error'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await itemsAPI.delete(deleteItem.id); toast('Item deleted','info'); setDeleteItem(null); fetchItems(); }
    catch(e){ toast(e.message,'error'); }
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div><h1 className="page-title">Inventory Items</h1><p className="page-subtitle">{items.length} items</p></div>
          <div style={{display:'flex',gap:8}}><button className="btn btn-ghost btn-sm" onClick={fetchItems}><RefreshCw size={14}/></button><button className="btn btn-primary" onClick={()=>setShowAdd(true)}><Plus size={16}/> Add Item</button></div>
        </div>
      </div>
      <div className="content-area">
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
          <div style={{position:'relative',display:'flex',alignItems:'center',flex:1,minWidth:220}}>
            <Search size={14} style={{position:'absolute',left:12,color:'var(--text-muted)',pointerEvents:'none'}}/>
            <input className="input" style={{paddingLeft:36}} placeholder="Search by name or code..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          {['all','in_store','borrowed','damaged','missing'].map(s=>(
            <button key={s} className={`chip ${statusFilter===s?'active':''}`} onClick={()=>setStatus(s)}>{s==='all'?'All':STATUS_CONFIG[s]?.label}</button>
          ))}
        </div>
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          {loading ? <div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Loading items...</div> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Item Name</th><th>Code</th><th>Location</th><th>Qty</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {items.length===0?<tr><td colSpan={6}><div className="empty-state"><Package size={32}/><p style={{marginTop:8}}>No items found</p></div></td></tr>
                  :items.map(item=>{
                    const cfg=STATUS_CONFIG[item.status]||{label:item.status,badge:'badge-gray'};
                    return (
                      <tr key={item.id}>
                        <td><div style={{fontWeight:600}}>{item.name}</div>{item.description&&<div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{item.description.slice(0,40)}...</div>}</td>
                        <td><code style={{fontSize:12,background:'var(--bg-hover)',padding:'2px 7px',borderRadius:4,color:'var(--accent)'}}>{item.code}</code></td>
                        <td><div style={{fontSize:13}}>{item.place_name}</div><div style={{fontSize:11,color:'var(--text-muted)'}}>{item.cupboard_name}</div></td>
                        <td><span style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:16,color:item.quantity===0?'var(--red)':item.quantity<3?'var(--orange)':'var(--text-primary)'}}>{item.quantity}</span></td>
                        <td><span className={`badge ${cfg.badge}`}>● {cfg.label}</span></td>
                        <td><div style={{display:'flex',gap:6}}><button className="btn btn-ghost btn-sm" onClick={()=>setEditItem({...item,placeId:item.place_id})}><Edit2 size={13}/></button><button className="btn btn-danger btn-sm" onClick={()=>setDeleteItem(item)}><Trash2 size={13}/></button></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAdd&&<Modal title="Add New Item" onClose={()=>setShowAdd(false)}><ItemForm places={places} onSave={handleAdd} onClose={()=>setShowAdd(false)} loading={saving}/></Modal>}
      {editItem&&<Modal title="Edit Item" onClose={()=>setEditItem(null)}><ItemForm initial={editItem} places={places} onSave={handleEdit} onClose={()=>setEditItem(null)} loading={saving}/></Modal>}
      {deleteItem&&<Modal title="Delete Item" onClose={()=>setDeleteItem(null)}>
        <p style={{color:'var(--text-secondary)',marginBottom:20}}>Delete <strong style={{color:'var(--text-primary)'}}>{deleteItem.name}</strong>? This cannot be undone.</p>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}><button className="btn btn-ghost" onClick={()=>setDeleteItem(null)}>Cancel</button><button className="btn btn-danger" onClick={handleDelete}>Delete</button></div>
      </Modal>}
    </div>
  );
}
