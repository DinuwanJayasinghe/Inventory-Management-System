// BorrowingsPage.jsx — Real API: /api/borrowings
import { useState, useEffect } from 'react';
import { Plus, RotateCcw, ArrowLeftRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import { borrowingsAPI, itemsAPI } from '../services/api';

const BORROW_STATUS_CONFIG = { active:{label:'Active',badge:'badge-blue'}, returned:{label:'Returned',badge:'badge-green'}, overdue:{label:'Overdue',badge:'badge-red'} };

export default function BorrowingsPage() {
  const { toast } = useApp();
  const [borrowings, setBorrowings] = useState([]);
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [statusFilter, setStatus]   = useState('all');
  const [showBorrow, setShowBorrow] = useState(false);
  const [returnTarget, setReturnTarget] = useState(null);
  const [form, setForm] = useState({ itemId:'', borrowerName:'', borrowerContact:'', borrowDate:new Date().toISOString().split('T')[0], expectedReturnDate:'', quantityBorrowed:1 });
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const [bRes, iRes] = await Promise.all([borrowingsAPI.list(params), itemsAPI.list({status:'in_store'})]);
      setBorrowings(bRes.data || []);
      setItems((iRes.data||[]).filter(i=>i.quantity>0));
    } catch(e) { toast(e.message,'error'); }
    finally { setLoading(false); }
  };
  useEffect(()=>{ fetchData(); },[statusFilter]);

  const selectedItem = items.find(i=>i.id===form.itemId);

  const handleBorrow = async () => {
    setSaving(true);
    try {
      await borrowingsAPI.create({ item_id:form.itemId, borrower_name:form.borrowerName, borrower_contact:form.borrowerContact, borrow_date:form.borrowDate, expected_return_date:form.expectedReturnDate, quantity_borrowed:parseInt(form.quantityBorrowed) });
      toast('Borrow recorded successfully','success'); setShowBorrow(false); fetchData();
    } catch(e){ toast(e.message,'error'); } finally { setSaving(false); }
  };

  const handleReturn = async () => {
    try {
      await borrowingsAPI.returnItem(returnTarget.id);
      toast('Return processed successfully','success'); setReturnTarget(null); fetchData();
    } catch(e) { toast(e.message,'error'); }
  };

  const filtered = statusFilter==='all'?borrowings:borrowings.filter(b=>b.status===statusFilter);
  const counts = { all:borrowings.length, active:borrowings.filter(b=>b.status==='active').length, overdue:borrowings.filter(b=>b.status==='overdue').length, returned:borrowings.filter(b=>b.status==='returned').length };

  return (
    <div className="page-enter">
      <div className="page-header">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div><h1 className="page-title">Borrowings</h1><p className="page-subtitle">Track items lent to third parties</p></div>
          <div style={{display:'flex',gap:8}}><button className="btn btn-ghost btn-sm" onClick={fetchData}><RefreshCw size={14}/></button><button className="btn btn-primary" onClick={()=>setShowBorrow(true)}><Plus size={16}/> New Borrow</button></div>
        </div>
      </div>
      <div className="content-area">
        {counts.overdue>0&&<div style={{background:'var(--red-bg)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'var(--radius-md)',padding:'12px 18px',marginBottom:20,display:'flex',gap:10,alignItems:'center'}}><AlertTriangle size={16} color="var(--red)"/><span style={{fontSize:14,color:'var(--red)'}}><strong>{counts.overdue} borrowing(s)</strong> are overdue.</span></div>}
        <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
          {['all','active','overdue','returned'].map(s=>(
            <button key={s} className={`chip ${statusFilter===s?'active':''}`} onClick={()=>setStatus(s)}>{s.charAt(0).toUpperCase()+s.slice(1)} ({counts[s]||0})</button>
          ))}
        </div>
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          {loading?<div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Loading...</div>:(
            <div className="table-wrap">
              <table>
                <thead><tr><th>Item</th><th>Borrower</th><th>Contact</th><th>Borrow Date</th><th>Expected Return</th><th>Qty</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {filtered.length===0?<tr><td colSpan={8}><div className="empty-state"><ArrowLeftRight size={32}/><p style={{marginTop:8}}>No borrowings found</p></div></td></tr>
                  :filtered.map(b=>{
                    const cfg=BORROW_STATUS_CONFIG[b.status]||{label:b.status,badge:'badge-gray'};
                    const isOverdue=b.status==='overdue';
                    return (
                      <tr key={b.id} style={isOverdue?{background:'rgba(239,68,68,0.04)'}:{}}>
                        <td><div>{b.item?.name}</div><code style={{fontSize:11,color:'var(--accent)',background:'var(--accent-subtle)',padding:'1px 6px',borderRadius:3}}>{b.item?.code}</code></td>
                        <td style={{fontWeight:600}}>{b.borrower_name}</td>
                        <td style={{fontSize:13}}>{b.borrower_contact}</td>
                        <td style={{fontSize:13}}>{b.borrow_date}</td>
                        <td style={{fontSize:13,color:isOverdue?'var(--red)':'inherit',fontWeight:isOverdue?700:400}}>{isOverdue&&'⚠ '}{b.expected_return_date}</td>
                        <td style={{fontWeight:700}}>{b.quantity_borrowed}</td>
                        <td><span className={`badge ${cfg.badge}`}>{cfg.label}</span></td>
                        <td>{b.status!=='returned'?<button className="btn btn-ghost btn-sm" onClick={()=>setReturnTarget(b)}><RotateCcw size={13}/> Return</button>:<span style={{fontSize:12,color:'var(--text-muted)'}}>{b.actual_return_date}</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showBorrow&&(
        <Modal title="Record New Borrow" onClose={()=>setShowBorrow(false)}>
          <div className="form-group"><label className="label">Item *</label>
            <select className="input" value={form.itemId} onChange={e=>setF('itemId',e.target.value)}>
              <option value="">-- Select item --</option>
              {items.map(i=><option key={i.id} value={i.id}>{i.name} ({i.code}) — {i.quantity} available</option>)}
            </select>
            {selectedItem&&<p style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>Available: <strong style={{color:'var(--accent)'}}>{selectedItem.quantity}</strong></p>}
          </div>
          <div className="form-row">
            <div className="form-group"><label className="label">Borrower Name *</label><input className="input" value={form.borrowerName} onChange={e=>setF('borrowerName',e.target.value)} placeholder="Full name"/></div>
            <div className="form-group"><label className="label">Contact *</label><input className="input" value={form.borrowerContact} onChange={e=>setF('borrowerContact',e.target.value)} placeholder="07X-XXXXXXX"/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="label">Borrow Date</label><input className="input" type="date" value={form.borrowDate} onChange={e=>setF('borrowDate',e.target.value)}/></div>
            <div className="form-group"><label className="label">Expected Return *</label><input className="input" type="date" value={form.expectedReturnDate} onChange={e=>setF('expectedReturnDate',e.target.value)}/></div>
          </div>
          <div className="form-group" style={{marginBottom:0}}><label className="label">Quantity *</label><input className="input" type="number" min="1" max={selectedItem?.quantity||99} value={form.quantityBorrowed} onChange={e=>setF('quantityBorrowed',e.target.value)}/></div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:20}}>
            <button className="btn btn-ghost" onClick={()=>setShowBorrow(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={saving} onClick={handleBorrow}>{saving?'Recording...':'Record Borrow'}</button>
          </div>
        </Modal>
      )}
      {returnTarget&&(
        <Modal title="Process Return" onClose={()=>setReturnTarget(null)}>
          <div style={{marginBottom:20}}>
            <p style={{color:'var(--text-secondary)',marginBottom:12}}>Confirm return of:</p>
            <div style={{background:'var(--bg-surface)',borderRadius:'var(--radius-md)',padding:'14px 16px'}}>
              <div style={{fontWeight:700,marginBottom:4}}>{returnTarget.item?.name}</div>
              <div style={{fontSize:13,color:'var(--text-muted)'}}>Borrower: {returnTarget.borrower_name} · Qty: {returnTarget.quantity_borrowed}</div>
            </div>
            <p style={{fontSize:13,color:'var(--green)',marginTop:12}}>✓ This will restore {returnTarget.quantity_borrowed} unit(s) back to inventory.</p>
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <button className="btn btn-ghost" onClick={()=>setReturnTarget(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleReturn}><RotateCcw size={14}/> Confirm Return</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
