import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button, Badge } from '@/components/ui';
import { Trash2, Settings } from 'lucide-react';

export default function TileConfigPanel({ tile, widget, onUpdate, onRemove }) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-az-text-muted" />
          <h3 className="text-sm font-bold text-az-text">Configure</h3>
        </div>
        <Badge variant="primary">{widget.displayName}</Badge>
      </div>

      <GlassPanel solid className="p-4">
        {widget.configSchema ? (
          <ConfigForm schema={widget.configSchema} formData={tile.props} onChange={onUpdate} />
        ) : (
          <p className="text-sm text-az-text-muted">No configuration options for this widget.</p>
        )}
      </GlassPanel>

      <Button variant="danger" size="sm" onClick={onRemove} className="w-full">
        <Trash2 className="w-4 h-4" />
        Remove Tile
      </Button>
    </div>
  );
}

function ConfigForm({ schema, formData, onChange }) {
  // Simple inline form renderer — avoids heavy RJSF dependency at runtime
  const properties = schema?.properties || {};
  const keys = Object.keys(properties);

  const handleChange = (key, value) => {
    onChange({ [key]: value });
  };

  return (
    <div className="space-y-3">
      {keys.map(key => {
        const prop = properties[key];
        const val = formData?.[key] ?? prop.default ?? '';
        const type = prop.type || 'string';

        if (type === 'boolean') {
          return (
            <label key={key} className="flex items-center justify-between text-sm text-az-text">
              <span>{prop.title || key}</span>
              <input
                type="checkbox"
                checked={!!val}
                onChange={e => handleChange(key, e.target.checked)}
                className="accent-[var(--az-accent)]"
              />
            </label>
          );
        }

        if (type === 'number' || type === 'integer') {
          return (
            <label key={key} className="block">
              <span className="text-sm text-az-text-muted block mb-1">{prop.title || key}</span>
              <input
                type="number"
                value={val}
                onChange={e => handleChange(key, Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-az-border bg-az-surface text-az-text text-sm"
              />
            </label>
          );
        }

        if (prop.enum) {
          return (
            <label key={key} className="block">
              <span className="text-sm text-az-text-muted block mb-1">{prop.title || key}</span>
              <select
                value={val}
                onChange={e => handleChange(key, e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-az-border bg-az-surface text-az-text text-sm"
              >
                {prop.enum.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>
          );
        }

        if ((prop.maxLength ?? 999) > 100) {
          return (
            <label key={key} className="block">
              <span className="text-sm text-az-text-muted block mb-1">{prop.title || key}</span>
              <textarea
                value={val}
                onChange={e => handleChange(key, e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-az-border bg-az-surface text-az-text text-sm"
              />
            </label>
          );
        }

        return (
          <label key={key} className="block">
            <span className="text-sm text-az-text-muted block mb-1">{prop.title || key}</span>
            <input
              type="text"
              value={val}
              onChange={e => handleChange(key, e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-az-border bg-az-surface text-az-text text-sm"
            />
          </label>
        );
      })}
    </div>
  );
}
