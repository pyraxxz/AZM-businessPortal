// src/components/storefront/PublishConfirmModal.jsx
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Rocket, AlertCircle } from 'lucide-react';

export default function PublishConfirmModal({ draft, published, onConfirm, onCancel }) {
  const tileCount = draft?.layoutJson?.tiles?.length ?? 0;
  const hasChanges = !published || JSON.stringify(draft?.layoutJson) !== JSON.stringify(published?.layoutJson);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <GlassPanel solid className="max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--az-accent-subtle)' }}>
            <Rocket className="w-5 h-5" style={{ color: 'var(--az-accent)' }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--az-text)' }}>Publish Storefront</h3>
            <p className="text-sm" style={{ color: 'var(--az-text-muted)' }}>Make your changes live for customers</p>
          </div>
        </div>
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--az-text-muted)' }}>Tiles</span>
            <span className="font-semibold" style={{ color: 'var(--az-text)' }}>{tileCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--az-text-muted)' }}>Status</span>
            <span className="font-semibold" style={{ color: 'var(--az-text)' }}>{hasChanges ? 'Changes ready' : 'No changes'}</span>
          </div>
        </div>
        {!hasChanges && (
          <div className="px-4 py-3 rounded-xl mb-4 flex items-center gap-2 text-sm"
            style={{ background: 'var(--az-warning-subtle)', color: 'var(--az-warning)' }}>
            <AlertCircle className="w-4 h-4" />No changes since last publish.
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ color: 'var(--az-text-muted)' }}>Cancel</button>
          <button onClick={onConfirm} disabled={!hasChanges}
            className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
            style={{ background: 'var(--az-accent)', color: '#fff' }}>
            <Rocket className="w-4 h-4" />Publish Now
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}
