// src/pages/StorefrontEditor.jsx
import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useStorefront } from '@/hooks/useStorefront';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Badge } from '@/components/ui';
import WidgetPalette from '@/components/storefront/WidgetPalette';
import StorefrontCanvas from '@/components/storefront/StorefrontCanvas';
import TileConfigPanel from '@/components/storefront/TileConfigPanel';
import ThemePicker from '@/components/storefront/ThemePicker';
import StorefrontPhonePreview from '@/components/storefront/StorefrontPhonePreview';
import NitroUpsellBanner from '@/components/storefront/NitroUpsellBanner';
import PublishConfirmModal from '@/components/storefront/PublishConfirmModal';
import VersionHistorySidebar from '@/components/storefront/VersionHistorySidebar';
import { Eye, EyeOff, History, Save, Rocket, AlertCircle, X, Layout } from 'lucide-react';

export default function StorefrontEditor() {
  const { bizProfile } = useAuth();
  const businessId = bizProfile?.id;

  const {
    draft, published, themes, widgets, eligibility, loading, saving, error,
    saveDraft, publish, changeTheme, addTile, updateTile, removeTile, reorderTiles,
    applyTemplate, revertToVersion, setError,
  } = useStorefront(businessId);

  const [selectedTileId, setSelectedTileId]       = useState(null);
  const [showPublishModal, setShowPublishModal]     = useState(false);
  const [showHistory, setShowHistory]               = useState(false);
  const [showPreview, setShowPreview]               = useState(true);

  const selectedTile   = useMemo(() => draft?.layoutJson?.tiles?.find(t => t.id === selectedTileId) ?? null, [draft, selectedTileId]);
  const selectedWidget = useMemo(() => selectedTile ? widgets.find(w => w.widgetType === selectedTile.widgetType) : null, [selectedTile, widgets]);
  const theme          = useMemo(() => themes.find(t => t.id === draft?.themeId) ?? null, [draft?.themeId, themes]);

  const isTileLocked = useCallback((widgetType) => {
    if (!eligibility) return false;
    const widget = widgets.find(w => w.widgetType === widgetType);
    return widget && widget.minAzmStake > (eligibility.stakedBalance ?? 0);
  }, [eligibility, widgets]);

  if (!businessId) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <GlassPanel className="p-8 text-center">
        <Layout className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--az-text-muted)' }} />
        <p className="font-semibold" style={{ color: 'var(--az-text)' }}>No business profile found</p>
        <p className="text-sm mt-1" style={{ color: 'var(--az-text-muted)' }}>Connect a business profile to start editing your storefront.</p>
      </GlassPanel>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
          style={{ borderColor: 'var(--az-accent)', borderTopColor: 'transparent' }} />
        <p className="text-sm" style={{ color: 'var(--az-text-muted)' }}>Loading storefront editor…</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--az-bg)' }}>

      {/* ── Toolbar ── */}
      <GlassPanel className="flex items-center justify-between px-4 py-3 rounded-none border-x-0 border-t-0 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Layout className="w-5 h-5" style={{ color: 'var(--az-accent)' }} />
          <h1 className="text-base font-bold" style={{ color: 'var(--az-text)' }}>Storefront Editor</h1>
          {published && (
            <Badge variant="success">Published</Badge>
          )}
          {saving && (
            <span className="text-xs" style={{ color: 'var(--az-text-muted)' }}>Saving…</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPreview(p => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
            style={{ color: 'var(--az-text)', borderColor: 'var(--az-border)', background: showPreview ? 'var(--az-accent-subtle)' : 'transparent' }}>
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          <button onClick={() => setShowHistory(h => !h)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
            style={{ color: 'var(--az-text)', borderColor: 'var(--az-border)' }}>
            <History className="w-4 h-4" />History
          </button>
          <button onClick={() => saveDraft(draft?.layoutJson, draft?.themeId)} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all disabled:opacity-50"
            style={{ color: 'var(--az-text)', borderColor: 'var(--az-border)', background: 'var(--az-surface)' }}>
            <Save className="w-4 h-4" />Save Draft
          </button>
          <button onClick={() => setShowPublishModal(true)} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: 'var(--az-accent)', color: '#fff' }}>
            <Rocket className="w-4 h-4" />Publish
          </button>
        </div>
      </GlassPanel>

      {/* ── Error Banner ── */}
      {error && (
        <div className="mx-4 mt-3 px-4 py-3 rounded-xl flex items-center gap-2 text-sm"
          style={{ background: 'var(--az-danger-subtle)', color: 'var(--az-danger)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Main Layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Widget Palette */}
        <div className="w-64 flex-shrink-0 overflow-y-auto border-r" style={{ background: 'var(--az-bg-alt)', borderColor: 'var(--az-border)' }}>
          <WidgetPalette widgets={widgets} eligibility={eligibility} onAdd={addTile} isLocked={isTileLocked} />
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--az-bg)' }}>
          <StorefrontCanvas
            draft={draft}
            theme={theme}
            selectedTileId={selectedTileId}
            onSelectTile={setSelectedTileId}
            onUpdateTile={updateTile}
            onRemoveTile={removeTile}
            onReorderTiles={reorderTiles}
          />
        </div>

        {/* Right: Config + Preview */}
        <div className="w-80 flex-shrink-0 overflow-y-auto border-l" style={{ background: 'var(--az-bg-alt)', borderColor: 'var(--az-border)' }}>
          {selectedTile && selectedWidget ? (
            <TileConfigPanel
              tile={selectedTile}
              widget={selectedWidget}
              onUpdate={(props) => updateTile(selectedTileId, props)}
              onRemove={() => { removeTile(selectedTileId); setSelectedTileId(null); }}
            />
          ) : (
            <div className="p-4">
              <ThemePicker themes={themes} currentThemeId={draft?.themeId} eligibility={eligibility} onThemeChange={changeTheme} />
              <NitroUpsellBanner eligibility={eligibility} />
            </div>
          )}

          {/* Phone Preview inline in right panel */}
          {showPreview && (
            <div className="p-4 border-t" style={{ borderColor: 'var(--az-border)' }}>
              <StorefrontPhonePreview draft={draft} theme={theme} widgets={widgets} />
            </div>
          )}
        </div>
      </div>

      {/* ── Modals & Overlays ── */}
      {showHistory && (
        <VersionHistorySidebar businessId={businessId} onRevert={revertToVersion} onClose={() => setShowHistory(false)} />
      )}
      {showPublishModal && (
        <PublishConfirmModal
          draft={draft}
          published={published}
          onConfirm={async () => { await publish(); setShowPublishModal(false); }}
          onCancel={() => setShowPublishModal(false)}
        />
      )}
    </div>
  );
}
