import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button, Badge } from '@/components/ui';
import { History, RotateCcw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { storefrontApi } from '@/services/storefrontApi';

export default function VersionHistorySidebar({ onRevert, onClose }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await storefrontApi.getHistory(10);
        setVersions(Array.isArray(data) ? data : (data?.versions ?? []));
      } catch (e) {
        console.error(e);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.3)' }}>
      <div className="w-96 bg-az-bg-alt border-l border-az-border h-full overflow-y-auto p-6 animate-slide-in-right">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-az-accent" />
            <h3 className="text-lg font-bold text-az-text">Version History</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-az-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : versions.length === 0 ? (
          <GlassPanel className="p-6 text-center">
            <p className="text-sm text-az-text-muted">No published versions yet.</p>
          </GlassPanel>
        ) : (
          <div className="space-y-3">
            {versions.map(v => (
              <GlassPanel key={v.id} className="p-4" hover>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="primary">v{v.version}</Badge>
                  <span className="text-xs text-az-text-muted">
                    {v.publishedAt ? new Date(v.publishedAt).toLocaleDateString() : ''}
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => onRevert(v.id)}>
                  <RotateCcw className="w-3.5 h-3.5" />
                  Revert to this version
                </Button>
              </GlassPanel>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
