// ToastContainer.jsx — Floating notification stack
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
const ICONS = {
  success: <CheckCircle size={16} color="var(--green)" />,
  error:   <XCircle    size={16} color="var(--red)" />,
  info:    <Info       size={16} color="var(--blue)" />,
};
export default function ToastContainer() {
  const { state } = useApp();
  if (!state.toasts.length) return null;
  return (
    <div className="toast-container">
      {state.toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {ICONS[t.type]}
          <span style={{fontSize:14}}>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
