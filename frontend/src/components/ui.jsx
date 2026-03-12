/**
 * components/ui.jsx
 * ─────────────────────────────────────────────────────────
 * Shared primitive UI components used across all pages.
 * Keeping them here avoids duplication and ensures visual consistency.
 * ─────────────────────────────────────────────────────────
 */

import { X, Loader2, PackageOpen } from 'lucide-react';

// ── StatusBadge ──────────────────────────────────────────
// Color-coded pill for item status and borrow status.
// Accepts any status string and maps it to a color.
export function StatusBadge({ status }) {
  // Map each status value to a Tailwind color pair
  const colors = {
    in_store:  'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
    borrowed:  'bg-amber-500/15 text-amber-400 ring-amber-500/30',
    damaged:   'bg-red-500/15 text-red-400 ring-red-500/30',
    missing:   'bg-purple-500/15 text-purple-400 ring-purple-500/30',
    active:    'bg-amber-500/15 text-amber-400 ring-amber-500/30',
    returned:  'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
    overdue:   'bg-red-500/15 text-red-400 ring-red-500/30',
    admin:     'bg-violet-500/15 text-violet-400 ring-violet-500/30',
    staff:     'bg-sky-500/15 text-sky-400 ring-sky-500/30',
  };

  // Format display text: "in_store" → "In Store"
  const label = status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${colors[status] || 'bg-zinc-500/15 text-zinc-400 ring-zinc-500/30'}`}>
      {label}
    </span>
  );
}

// ── Modal ────────────────────────────────────────────────
// Reusable modal overlay. Takes title, children, and onClose.
// Used for create/edit/borrow forms across the app.
export function Modal({ title, children, onClose, size = 'md' }) {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  // Close modal when clicking the dark backdrop behind it
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose} // Close on backdrop click
    >
      <div
        className={`relative w-full ${sizes[size]} rounded-2xl overflow-hidden`}
        style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()} // Prevent backdrop click from firing inside modal
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-lg font-semibold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
            <X size={16} />
          </button>
        </div>
        {/* Modal Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Spinner ──────────────────────────────────────────────
// Centered loading spinner for page-level and inline loading states.
export function Spinner({ size = 'md' }) {
  const sizes = { sm: 16, md: 24, lg: 40 };
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={sizes[size]} className="animate-spin text-cyan-400" />
    </div>
  );
}

// ── EmptyState ───────────────────────────────────────────
// Shown when a list has no data — better UX than a blank page.
export function EmptyState({ message = 'No data found', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <PackageOpen size={40} className="text-zinc-600 mb-3" />
      <p className="text-zinc-500 text-sm mb-4">{message}</p>
      {action}
    </div>
  );
}

// ── FormField ────────────────────────────────────────────
// Labeled input wrapper. Keeps form code DRY.
export function FormField({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ── Input ────────────────────────────────────────────────
// Styled input consistent with the dark theme.
export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-zinc-500 outline-none transition-all ${className}`}
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
      onFocus={e => { e.target.style.borderColor = 'rgba(34,211,238,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(34,211,238,0.1)'; }}
      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
      {...props}
    />
  );
}

// ── Select ───────────────────────────────────────────────
export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none transition-all ${className}`}
      style={{ background: '#1c2128', border: '1px solid rgba(255,255,255,0.1)' }}
      {...props}
    >
      {children}
    </select>
  );
}

// ── Textarea ─────────────────────────────────────────────
export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-zinc-500 outline-none transition-all resize-none ${className}`}
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      rows={3}
      {...props}
    />
  );
}

// ── Button ───────────────────────────────────────────────
// Primary and secondary variants.
export function Button({ variant = 'primary', children, className = '', loading, ...props }) {
  const variants = {
    primary:   'bg-cyan-500 hover:bg-cyan-400 text-black font-semibold',
    secondary: 'bg-white/8 hover:bg-white/12 text-white',
    danger:    'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30',
    ghost:     'text-zinc-400 hover:text-white hover:bg-white/8',
  };
  return (
    <button
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

// ── Card ─────────────────────────────────────────────────
export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`rounded-2xl p-6 ${className}`}
      style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.06)' }}
      {...props}
    >
      {children}
    </div>
  );
}
