import { GlassPanel } from '@/components/ui/GlassPanel';
import { Responsive } from 'react-grid-layout';
import { Trash2, GripVertical, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';


export default function StorefrontCanvas({
  draft, theme, selectedTileId, onSelectTile, onUpdateTile, onRemoveTile, onReorderTiles,
}) {
  if (!draft?.layoutJson?.tiles?.length) {
    return (
      <GlassPanel className="p-12 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--az-accent-subtle)' }}>
          <Plus className="w-8 h-8 text-az-accent" />
        </div>
        <h3 className="text-lg font-bold text-az-text">Start Building</h3>
        <p className="text-sm text-az-text-muted mt-1">Add widgets from the left panel to build your storefront layout.</p>
      </GlassPanel>
    );
  }

  const tiles = draft.layoutJson.tiles;

  const layouts = {
    lg: tiles.map((tile) => ({
      i: tile.id,
      x: tile.position.col,
      y: tile.position.row,
      w: tile.position.colSpan,
      h: tile.position.rowSpan,
      minW: 1, maxW: 4, minH: 1, maxH: 6,
    })),
  };

  const handleLayoutChange = (newLayout) => {
    const newTiles = tiles.map((tile, i) => ({
      ...tile,
      position: {
        row: newLayout[i].y,
        col: newLayout[i].x,
        rowSpan: newLayout[i].h,
        colSpan: newLayout[i].w,
      },
    }));
    onReorderTiles(newTiles);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-2xl p-4 min-h-[500px] border border-az-border" style={{ background: 'var(--az-bg-alt)' }}>
        <ResponsiveReactGridLayout
          className="layout"
          layouts={layouts}
          cols={{ lg: 4, md: 4, sm: 4, xs: 4, xxs: 4 }}
          rowHeight={60}
          margin={[8, 8]}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".drag-handle"
          compactType="vertical"
        >
          {tiles.map(tile => (
            <div
              key={tile.id}
              onClick={() => onSelectTile(tile.id)}
              className={cn(
                'rounded-xl border-2 transition-all cursor-pointer overflow-hidden relative',
                selectedTileId === tile.id
                  ? 'border-az-accent shadow-az-card'
                  : 'border-az-border bg-az-surface'
              )}
              style={{ background: 'var(--az-surface)' }}
            >
              <div className="drag-handle absolute top-1 left-1 z-10 cursor-move p-1 rounded-lg opacity-50 hover:opacity-100">
                <GripVertical className="w-3 h-3 text-az-text-muted" />
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveTile(tile.id); }}
                className="absolute top-1 right-1 z-10 p-1 rounded-lg opacity-50 hover:opacity-100 transition-opacity"
                style={{ background: 'var(--az-danger-subtle)' }}
              >
                <Trash2 className="w-3 h-3 text-az-danger" />
              </button>
              <div className="w-full h-full flex items-center justify-center p-3">
                <p className="text-xs font-semibold text-az-text-muted text-center">
                  {tile.widgetType.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          ))}
        </ResponsiveReactGridLayout>
      </div>
    </div>
  );
}
