import { useState, useMemo, useCallback } from 'react';
import { useStorefront } from '@/hooks/useStorefront';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button, Badge } from '@/components/ui';
import WidgetPalette from '@/components/storefront/WidgetPalette';
import StorefrontCanvas from '@/components/storefront/StorefrontCanvas';
import TileConfigPanel from '@/components/storefront/TileConfigPanel';
import ThemePicker from '@/components/storefront/ThemePicker';
import StorefrontPhonePreview from '@/components/storefront/StorefrontPhonePreview';
import NitroUpsellBanner from '@/components/storefront/NitroUpsellBanner';
import PublishConfirmModal from '@/components/storefront/PublishConfirmModal';
import VersionHistorySidebar from '@/components/storefront/VersionHistorySidebar';
import KeyboardTileManager from '@/components/storefront/KeyboardTileManager';
import { Eye, EyeOff, History, Save, Rocket, AlertCircle, X, Layout } from 'lucide-react';

export default function StorefrontEditor() {
  const {
    draft, published, themes, widgets, eligibility, loading, saving, error,
    saveDraft, publish, changeTheme, addTile, updateTile, removeTile, reorderTiles,
    applyTemplate, revertToVersion, setError,
  } = useStorefront();

  const [selectedTileId, setSelectedTileId] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const selectedTile = useMemo(
    () => draft?.layoutJson?.tiles?.find(t => t.id === selectedTileId) ?? null,
    [draft, selectedTileId]
  );

  const selectedWidget = useMemo(
    () => selectedTile ? widgets.find(w => w.widgetType === selectedTile.widgetType) : null,
    [selectedTile, widgets]
  );

  const theme = useMemo(
    () => themes.find(t => t.id === draft?.themeId) ?? null,
    [draft?.themeId, themes]
  );

  const isTileLocked = useCallback((widgetType) => {
    if (!eligibility) return false;
    const widget = widgets.find(w => w.widgetType === widgetType);
    return widget && widget.minAzmStake > (eligibility.stakedBalance ?? 0);
  }, [eligibility, widgets]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-az-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Toolbar */}
      <GlassPanel solid className="px-4 py-3 rounded-none border-x-0 border-t-0 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-az-text">Storefront Editor</h1>
          {theme && <Badge variant="primary">{theme.name}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)}>
            <History className="w-4 h-4" />
            History
          </Button>
          <Button variant="secondary" size="sm" loading={saving} onClick={() => saveDraft(draft.layoutJson, draft.themeId)}>
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
          <Button variant="primary" size="sm" loading={saving} onClick={() => setShowPublishModal(true)}>
            <Rocket className="w-4 h-4" />
            Publish
          </Button>
        </div>
      </GlassPanel>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-3 px-4 py-3 rounded-xl flex items-center gap-2 text-sm"
          style={{ background: 'var(--az-danger-subtle)', color: 'var(--az-danger)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="p-1 rounded-lg hover:bg-az-bg-alt transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Widget Palette */}
        <div className="w-64 flex-shrink-0 overflow-y-auto border-r border-az-border bg-az-bg-alt">
          <WidgetPalette
            widgets={widgets}
            eligibility={eligibility}
            onAdd={addTile}
            isLocked={isTileLocked}
          />
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 overflow-y-auto p-6 bg-az-bg">
          <KeyboardTileManager
            tiles={draft?.layoutJson?.tiles ?? []}
            selectedTileId={selectedTileId}
            onSelectTile={setSelectedTileId}
            onUpdateTile={updateTile}
            onRemoveTile={removeTile}
            onReorderTiles={reorderTiles}
            onOpenConfig={() => {}}
          >
            <StorefrontCanvas
              draft={draft}
              theme={theme}
              selectedTileId={selectedTileId}
              onSelectTile={setSelectedTileId}
              onUpdateTile={updateTile}
              onRemoveTile={removeTile}
              onReorderTiles={reorderTiles}
            />
          </KeyboardTileManager>
        </div>

        {/* Right: Config Panel + Preview */}
        <div className="w-80 flex-shrink-0 overflow-y-auto border-l border-az-border bg-az-bg-alt">
          {selectedTile && selectedWidget ? (
            <TileConfigPanel
              tile={selectedTile}
              widget={selectedWidget}
              onUpdate={(props) => updateTile(selectedTileId, props)}
              onRemove={() => { removeTile(selectedTileId); setSelectedTileId(null); }}
            />
          ) : (
            <div className="p-6">
              <ThemePicker
                themes={themes}
                currentThemeId={draft?.themeId}
                eligibility={eligibility}
                onThemeChange={changeTheme}
              />
              <NitroUpsellBanner eligibility={eligibility} />
            </div>
          )}
        </div>
      </div>

      {/* Floating Phone Preview */}
      {showPreview && draft && (
        <div className="fixed bottom-6 right-6 z-50">
          <StorefrontPhonePreview draft={draft} theme={theme} widgets={widgets} />
        </div>
      )}

      {/* History Sidebar */}
      {showHistory && (
        <VersionHistorySidebar
          onRevert={revertToVersion}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Publish Modal */}
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
