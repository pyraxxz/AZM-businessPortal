// src/components/storefront/StorefrontCanvas.jsx
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Trash2, GripVertical, Plus, ArrowUp, ArrowDown, Image, Info, ShoppingBag, Star, Phone, MapPin, MousePointerClick, Video, BadgePercent, Instagram, BarChart, Hash, Code, Sparkles, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';


const WIDGET_ICONS = {
  hero_header: Image,
  quick_info_bar: Info,
  product_grid: ShoppingBag,
  showcase_gallery: Layers,
  review_carousel: Star,
  contact_card: Phone,
  location_map: MapPin,
  action_buttons: MousePointerClick,
  video_player: Video,
  promo_banner: BadgePercent,
  social_feed: Instagram,
  live_stats: BarChart,
  animated_counter: Hash,
  custom_html: Code,
  gradient_hero: Sparkles,
};


// Drag-free reorder canvas — fully functional without react-grid-layout ESM issues
// Uses manual up/down reorder buttons + future DnD via @dnd-kit

export default function StorefrontCanvas({
  draft, theme, selectedTileId, onSelectTile, onUpdateTile, onRemoveTile, onReorderTiles,
}) {
  const tiles = draft?.layoutJson?.tiles ?? [];

  const moveTile = (index, direction) => {
    const newTiles = [...tiles];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newTiles.length) return;
    [newTiles[index], newTiles[targetIndex]] = [newTiles[targetIndex], newTiles[index]];
    onReorderTiles(newTiles);
  };

  if (!tiles.length) {
    return (
      <GlassPanel className="p-12 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'var(--az-accent-subtle)' }}>
          <Plus className="w-8 h-8" style={{ color: 'var(--az-accent)' }} />
        </div>
        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--az-text)' }}>Start Building</h3>
        <p className="text-sm" style={{ color: 'var(--az-text-muted)' }}>
          Add widgets from the left panel to build your storefront layout.
        </p>
      </GlassPanel>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-2">
      <p className="text-xs font-medium mb-3" style={{ color: 'var(--az-text-muted)' }}>
        {tiles.length} tile{tiles.length !== 1 ? 's' : ''} — click to configure, use arrows to reorder
      </p>
      {tiles.map((tile, index) => (
        <div
          key={tile.id}
          onClick={() => onSelectTile(tile.id)}
          className="rounded-xl border-2 transition-all cursor-pointer overflow-hidden relative group"
          style={{
            background: 'var(--az-surface)',
            borderColor: selectedTileId === tile.id ? 'var(--az-accent)' : 'var(--az-border)',
            boxShadow: selectedTileId === tile.id ? '0 0 0 3px var(--az-accent-subtle)' : 'none',
          }}
        >
          <div className="flex items-center gap-3 p-4">
            {/* Reorder controls */}
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                onClick={e => { e.stopPropagation(); moveTile(index, -1); }}
                disabled={index === 0}
                className="p-1 rounded-md transition-all disabled:opacity-20"
                style={{ color: 'var(--az-text-muted)' }}
                title="Move up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); moveTile(index, 1); }}
                disabled={index === tiles.length - 1}
                className="p-1 rounded-md transition-all disabled:opacity-20"
                style={{ color: 'var(--az-text-muted)' }}
                title="Move down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Drag handle icon (visual) */}
            <GripVertical className="w-4 h-4 flex-shrink-0 opacity-30" style={{ color: 'var(--az-text-muted)' }} />

            {/* Widget icon */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: selectedTileId === tile.id ? 'var(--az-accent-subtle)' : 'var(--az-bg-alt)' }}>
              {(() => {
              const Icon = WIDGET_ICONS[tile.widgetType] || Layers;
              return <Icon className="w-4 h-4" style={{ color: selectedTileId === tile.id ? 'var(--az-accent)' : 'var(--az-text-muted)' }} />;
            })()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--az-text)' }}>
                {(tile.widgetType || '').replace(/_/g, ' ')}
              </p>
              {tile.props?.title && (
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--az-text-muted)' }}>
                  {tile.props.title}
                </p>
              )}
              <p className="text-xs mt-0.5" style={{ color: 'var(--az-text-muted)' }}>
                {tile.position?.colSpan ?? 4} cols × {tile.position?.rowSpan ?? 2} rows
              </p>
            </div>

            {/* Remove */}
            <button
              onClick={e => { e.stopPropagation(); onRemoveTile(tile.id); }}
              className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              style={{ background: 'var(--az-danger-subtle)', color: 'var(--az-danger)' }}
              title="Remove tile"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Selected indicator bar */}
          {selectedTileId === tile.id && (
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: 'var(--az-accent)' }} />
          )}
        </div>
      ))}
    </div>
  );
}
