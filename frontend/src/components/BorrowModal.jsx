/**
 * components/BorrowModal.jsx
 * ─────────────────────────────────────────────────────────
 * Modal for recording a new borrowing transaction.
 *
 * Used from: ItemsPage (lend button) and BorrowingsPage (new borrow).
 *
 * On submit:
 *  1. Sends POST /borrowings to backend
 *  2. Backend deducts stock and updates item status
 *  3. Audit log is created automatically via Observer
 * ─────────────────────────────────────────────────────────
 */

import { useState } from 'react';
import { borrowings as borrowingsApi, items as itemsApi } from '../api/services';
import { useFetch } from '../hooks/useFetch';
import { Modal, FormField, Input, Select, Button } from './ui';
import toast from 'react-hot-toast';

export default function BorrowModal({ item: preselectedItem, onClose, onSuccess }) {
  // If opened from ItemsPage, item is pre-selected
  const [form, setForm] = useState({
    item_id:              preselectedItem?.id || '',
    borrower_name:        '',
    borrower_contact:     '',
    borrow_date:          new Date().toISOString().split('T')[0], // today
    expected_return_date: '',
    quantity_borrowed:    1,
  });
  const [loading, setLoading] = useState(false);

  // Only fetch items list if no item is pre-selected
  const { data: itemsData } = useFetch(itemsApi.list, { status: 'in_store' });
  const itemsList = itemsData?.data || itemsData || [];

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await borrowingsApi.create(form);
      toast.success('Borrowing recorded successfully');
      onSuccess();
    } catch (err) {
      // Show specific error (e.g., "Insufficient stock")
      toast.error(err.response?.data?.message || 'Failed to record borrowing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Record Borrowing" onClose={onClose} size="md">
      {/* Show item info if pre-selected */}
      {preselectedItem && (
        <div className="mb-5 p-3 rounded-xl" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}>
          <p className="text-xs text-amber-400 font-medium">{preselectedItem.name}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Available qty: <span className="text-white font-medium">{preselectedItem.quantity}</span></p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Item selector — only shown if no item was pre-selected */}
        {!preselectedItem && (
          <FormField label="Item">
            <Select value={form.item_id} onChange={set('item_id')} required>
              <option value="">Select item to lend...</option>
              {itemsList.map(i => (
                <option key={i.id} value={i.id}>{i.name} ({i.code}) — qty: {i.quantity}</option>
              ))}
            </Select>
          </FormField>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Borrower Name">
            <Input value={form.borrower_name} onChange={set('borrower_name')} placeholder="John Silva" required />
          </FormField>
          <FormField label="Contact">
            <Input value={form.borrower_contact} onChange={set('borrower_contact')} placeholder="+94 71 234 5678" required />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Borrow Date">
            <Input type="date" value={form.borrow_date} onChange={set('borrow_date')} required />
          </FormField>
          <FormField label="Expected Return">
            <Input type="date" value={form.expected_return_date} onChange={set('expected_return_date')} required />
          </FormField>
        </div>

        <FormField label="Quantity">
          <Input type="number" min="1"
            max={preselectedItem?.quantity || undefined}
            value={form.quantity_borrowed}
            onChange={set('quantity_borrowed')} required />
        </FormField>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading} className="flex-1">Record Borrow</Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
