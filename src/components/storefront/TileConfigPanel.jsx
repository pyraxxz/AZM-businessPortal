// src/components/storefront/TileConfigPanel.jsx
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Badge } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { Trash2, Settings, Type, AlignLeft, Link, Image, Upload, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { storefrontApi } from '@/services/storefrontApi';

const FIELD_TYPES = {
  title: { icon: Type, label: 'Title', type: 'text' },
  subtitle: { icon: AlignLeft, label: 'Subtitle', type: 'text' },
  body: { icon: AlignLeft, label: 'Body', type: 'textarea' },
  url: { icon: Link, label: 'URL', type: 'url' },
  imageUrl: { icon: Image, label: 'Image URL', type: 'url', uploadable: true },
  mediaUrl: { icon: Image, label: 'Media URL', type: 'url', uploadable: true },
  videoUrl: { icon: Image, label: 'Video URL', type: 'url', uploadable: true },
  ctaText: { icon: Type, label: 'Button Text', type: 'text' },
  ctaUrl: { icon: Link, label: 'Button URL', type: 'url' },
  customInfo: { icon: Type, label: 'Custom Info', type: 'text' },
};

function ConfigField({ fieldKey, value, onChange }) {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const fieldDef = FIELD_TYPES[fieldKey] || { label: fieldKey, type: 'text' };
  const Icon = fieldDef.icon || Type;

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await storefrontApi.uploadMedia(formData);
      onChange({ [fieldKey]: result.url });
      toast({ title: 'Upload complete', description: 'Media uploaded successfully.' });
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold mb-1.5 uppercase tracking-wider"
        style={{ color: 'var(--az-text-secondary)' }}>
        <Icon className="w-3 h-3" />{fieldDef.label}
      </label>
      <div className="flex gap-2">
        {fieldDef.type === 'textarea' ? (
          <textarea value={value || ''} onChange={e => onChange({ [fieldKey]: e.target.value })}
            rows={3} className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
            style={{ background: 'var(--az-bg-alt)', border: '1.5px solid var(--az-border)', color: 'var(--az-text)' }}
            onFocus={e => e.target.style.borderColor='var(--az-accent)'}
            onBlur={e => e.target.style.borderColor='var(--az-border)'} />
        ) : (
          <input type={fieldDef.type} value={value || ''} onChange={e => onChange({ [fieldKey]: e.target.value })}
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'var(--az-bg-alt)', border: '1.5px solid var(--az-border)', color: 'var(--az-text)' }}
            onFocus={e => e.target.style.borderColor='var(--az-accent)'}
            onBlur={e => e.target.style.borderColor='var(--az-border)'} />
        )}
        {fieldDef.uploadable && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-shrink-0 px-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            style={{ background: 'var(--az-accent-subtle)', color: 'var(--az-accent)', border: '1.5px solid var(--az-border)' }}
            title="Upload file"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          </button>
        )}
      </div>
      {fieldDef.uploadable && (
        <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*" onChange={handleUpload} />
      )}
      {fieldDef.uploadable && value && (
        <div className="mt-1.5 rounded-lg overflow-hidden" style={{ maxHeight: 80 }}>
          {value.match(/\.(mp4|mov|avi|webm)$/i) ? (
            <video src={value} className="w-full h-20 object-cover" controls />
          ) : (
            <img src={value} alt="" className="w-full h-20 object-cover" />
          )}
        </div>
      )}
    </div>
  );
}

export default function TileConfigPanel({ tile, widget, onUpdate, onRemove }) {
  const props = tile?.props || {};
  const schema = widget?.configSchema?.properties || {};
  const editableKeys = Object.keys(schema).length
    ? Object.keys(schema)
    : Object.keys(props).filter(k => typeof props[k] === 'string' || typeof props[k] === 'number' || typeof props[k] === 'boolean');

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4" style={{ color: 'var(--az-text-muted)' }} />
          <h3 className="text-sm font-bold" style={{ color: 'var(--az-text)' }}>Configure</h3>
        </div>
        <Badge variant="primary">{widget?.displayName || tile?.widgetType}</Badge>
      </div>
      <GlassPanel className="p-4 space-y-3">
        {editableKeys.length === 0 ? (
          <p className="text-xs text-center" style={{ color: 'var(--az-text-muted)' }}>
            No configurable properties for this widget.
          </p>
        ) : (
          editableKeys.map(key => (
            <ConfigField key={key} fieldKey={key} value={props[key]} onChange={onUpdate} />
          ))
        )}
      </GlassPanel>
      <button onClick={onRemove}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
        style={{ background: 'var(--az-danger-subtle)', color: 'var(--az-danger)', border: '1px solid rgba(225,83,97,0.2)' }}>
        <Trash2 className="w-4 h-4" />Remove Widget
      </button>
    </div>
  );
}
