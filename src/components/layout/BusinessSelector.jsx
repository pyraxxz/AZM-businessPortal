import { useAuth } from '@/lib/AuthContext';
import { getTypeConfig } from '@/lib/businessTypes';

export function BusinessSelector() {
  const { adminBusinesses, selectedBusinessId, selectBusiness, bizProfile } = useAuth();

  const handleChange = (e) => {
    const val = e.target.value;
    localStorage.setItem('admin_selected_biz', val);
    selectBusiness(val);
  };

  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--sn-text-muted)] mb-1.5 block">
        Viewing as
      </label>
      <select
        value={selectedBusinessId || ''}
        onChange={handleChange}
        className="w-full rounded-md px-2.5 py-2 text-xs border focus:outline-none focus:ring-2 focus:ring-[var(--sn-purple)]/40"
        style={{ background: 'var(--sn-card)', borderColor: 'var(--sn-border)', color: 'var(--sn-text)' }}
      >
        <option value="">— Select a business —</option>
        {(adminBusinesses || []).map(b => (
          <option key={b.id} value={b.id}>{b.businessName} ({b.category})</option>
        ))}
      </select>
      {selectedBusinessId && bizProfile && (
        <div className="mt-2 text-[11px] text-[var(--sn-text-muted)]">
          Type: {getTypeConfig(bizProfile).label} · KYB: {bizProfile.kybStatus}
        </div>
      )}
    </div>
  );
}
