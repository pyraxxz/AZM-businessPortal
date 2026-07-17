/**
 * Marketing → Web Ordering — Section 5, Phase 2
 * Toggle public web ordering, preview storefront, download QR codes.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { request } from '@/lib/apiCore';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { GlassPanel } from '@/components/ui/GlassPanel';
import {
  Globe, QrCode, Eye, Download, ExternalLink, CheckCircle2,
  Copy, Check, Zap, Info, Image as ImageIcon, RefreshCw
} from 'lucide-react';

const PUBLIC_ORDER_BASE = 'https://order.azaman.app';

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded-lg transition-colors flex-shrink-0"
      style={{ color: copied ? 'var(--az-success)' : 'var(--az-text-muted)' }}>
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function QRPlaceholder({ value, size = 100, color = '#6C4FD1' }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <rect width="100" height="100" fill="white" />
      <rect x={1} y={1} width={28} height={28} rx={3} fill={color} />
      <rect x={4} y={4} width={22} height={22} rx={2} fill="white" />
      <rect x={7} y={7} width={16} height={16} rx={1} fill={color} />
      <rect x={71} y={1} width={28} height={28} rx={3} fill={color} />
      <rect x={74} y={4} width={22} height={22} rx={2} fill="white" />
      <rect x={77} y={7} width={16} height={16} rx={1} fill={color} />
      <rect x={1} y={71} width={28} height={28} rx={3} fill={color} />
      <rect x={4} y={74} width={22} height={22} rx={2} fill="white" />
      <rect x={7} y={77} width={16} height={16} rx={1} fill={color} />
      {[20,35,50,65,80].map(x => [20,35,50,65,80].map(y =>
        (x < 30 && y < 30) || (x > 70 && y < 30) || (x < 30 && y > 70) ? null : (
          <rect key={`${x}-${y}`} x={x} y={y} width={8} height={8} rx={1} fill={color} opacity={0.6} />
        )
      ))}
    </svg>
  );
}

export default function WebOrdering() {
  const { bizProfile } = useAuth();
  const bizId = bizProfile?.id || bizProfile?._id || 'demo';
  const [enabled, setEnabled] = useState(false);
  const [accentColor, setAccentColor] = useState(bizProfile?.adAccentColor || '#6C4FD1');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('setup');

  const publicUrl = `${PUBLIC_ORDER_BASE}/${bizId}`;

  const isBizType = (types) => types.includes((bizProfile?.businessType || '').toUpperCase());
  const mockItems = isBizType(['RESTAURANT', 'DINE_IN', 'CAFE'])
    ? Array.from({ length: 8 }, (_, i) => ({ id: `t${i+1}`, label: `Table ${i+1}`, url: `${publicUrl}?table=${i+1}` }))
    : isBizType(['HOTEL'])
    ? Array.from({ length: 6 }, (_, i) => ({ id: `r${i+1}`, label: `Room 10${i+1}`, url: `${publicUrl}?room=10${i+1}` }))
    : isBizType(['TRANSIT', 'BUS'])
    ? Array.from({ length: 4 }, (_, i) => ({ id: `v${i+1}`, label: `Route ${i+1}`, url: `${publicUrl}?route=${i+1}` }))
    : Array.from({ length: 4 }, (_, i) => ({ id: `s${i+1}`, label: `Section ${i+1}`, url: publicUrl }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await request('/api/business/profile', { method: 'PATCH', body: JSON.stringify({ webOrderingEnabled: enabled, adAccentColor: accentColor }) });
      toast.success('Settings saved');
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const TABS = ['setup', 'qr', 'preview'];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--az-text)' }}>Web Ordering</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--az-text-muted)' }}>
          A public page for customers to order without the Azaman app — just share the link or a QR code.
        </p>
      </div>

      <GlassPanel className="p-4 flex items-center gap-3">
        <Globe className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--az-accent)' }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--az-text-muted)' }}>Public URL</p>
          <p className="text-sm font-mono truncate" style={{ color: 'var(--az-text)' }}>{publicUrl}</p>
        </div>
        <CopyBtn text={publicUrl} />
        <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg" style={{ color: 'var(--az-text-muted)' }}>
          <ExternalLink className="w-4 h-4" />
        </a>
      </GlassPanel>

      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'var(--az-bg)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className="px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
            style={activeTab === t ? { background: 'var(--az-accent)', color: '#fff' } : { color: 'var(--az-text-muted)' }}>
            {t === 'qr' ? 'QR Codes' : t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            <GlassPanel className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: enabled ? 'var(--az-success-subtle)' : 'var(--az-bg)' }}>
                    <Zap className="w-5 h-5" style={{ color: enabled ? 'var(--az-success)' : 'var(--az-text-muted)' }} />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--az-text)' }}>Enable Web Ordering</p>
                    <p className="text-xs" style={{ color: 'var(--az-text-muted)' }}>Makes your public page live for customers</p>
                  </div>
                </div>
                <button onClick={() => setEnabled(v => !v)}
                  className="relative w-12 h-6 rounded-full transition-colors"
                  style={{ background: enabled ? 'var(--az-success)' : 'var(--az-border-strong)' }}>
                  <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                    style={{ transform: enabled ? 'translateX(24px)' : 'translateX(0)' }} />
                </button>
              </div>
            </GlassPanel>

            <GlassPanel className="p-5 space-y-4">
              <h3 className="font-bold" style={{ color: 'var(--az-text)' }}>Page Branding</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--az-text-muted)' }}>Accent Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                      className="w-12 h-12 rounded-xl border cursor-pointer" style={{ borderColor: 'var(--az-border)' }} />
                    <div>
                      <p className="text-sm font-mono font-semibold" style={{ color: 'var(--az-text)' }}>{accentColor}</p>
                      <p className="text-xs" style={{ color: 'var(--az-text-muted)' }}>Buttons and highlights</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--az-text-muted)' }}>Logo</label>
                  <div className="flex items-center gap-3">
                    {bizProfile?.logoUrl
                      ? <img src={bizProfile.logoUrl} alt="Logo" className="w-12 h-12 rounded-xl object-cover border" style={{ borderColor: 'var(--az-border)' }} />
                      : <div className="w-12 h-12 rounded-xl border flex items-center justify-center" style={{ borderColor: 'var(--az-border)', background: 'var(--az-bg)' }}>
                          <ImageIcon className="w-5 h-5" style={{ color: 'var(--az-text-muted)' }} />
                        </div>
                    }
                    <p className="text-xs" style={{ color: 'var(--az-text-muted)' }}>Set in Settings → Business Info</p>
                  </div>
                </div>
              </div>
            </GlassPanel>

            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--az-accent)' }}>
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Save Settings
            </button>
          </motion.div>
        )}

        {activeTab === 'qr' && (
          <motion.div key="qr" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            <GlassPanel className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold" style={{ color: 'var(--az-text)' }}>QR Codes</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--az-text-muted)' }}>Print and place at each table, room, or vehicle</p>
                </div>
                <button onClick={() => toast.success('Preparing PDF…')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white"
                  style={{ background: 'var(--az-accent)' }}>
                  <Download className="w-3.5 h-3.5" /> Download All
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {mockItems.map(item => (
                  <div key={item.id} className="flex flex-col items-center gap-2 p-4 rounded-2xl border group transition-all hover:shadow-md"
                    style={{ borderColor: 'var(--az-border)', background: 'white' }}>
                    <div className="rounded-xl overflow-hidden border-4 border-white shadow">
                      <QRPlaceholder value={item.url} size={80} color={accentColor} />
                    </div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--az-text)' }}>{item.label}</p>
                    <button onClick={() => toast.success(`QR for ${item.label} ready`)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'var(--az-accent-subtle)', color: 'var(--az-accent)' }}>
                      <Download className="w-3 h-3" /> Download
                    </button>
                  </div>
                ))}
              </div>
            </GlassPanel>

            <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: 'rgba(61,116,219,0.06)', borderColor: 'rgba(61,116,219,0.2)' }}>
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--az-info)' }} />
              <p className="text-xs" style={{ color: 'var(--az-text-secondary)' }}>
                Customers scan these QR codes to open your branded ordering page directly — no app download, no account required for browsing.
                Account creation (phone + OTP) is only prompted at checkout.
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'preview' && (
          <motion.div key="preview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <GlassPanel className="p-5 space-y-4">
              <h3 className="font-bold" style={{ color: 'var(--az-text)' }}>Mobile Preview</h3>
              <div className="flex justify-center">
                <div className="rounded-[36px] border-8 overflow-hidden shadow-2xl" style={{ borderColor: '#111', width: 280 }}>
                  <div className="bg-white" style={{ minHeight: 500 }}>
                    <div className="h-28 flex items-end pb-4 px-4 text-white"
                      style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)` }}>
                      {bizProfile?.logoUrl
                        ? <img src={bizProfile.logoUrl} alt="" className="w-10 h-10 rounded-xl mr-3 border-2 border-white/40 object-cover" />
                        : <div className="w-10 h-10 rounded-xl mr-3 bg-white/20 flex items-center justify-center text-white font-bold">{(bizProfile?.businessName || 'B').charAt(0)}</div>
                      }
                      <div>
                        <p className="font-bold leading-tight">{bizProfile?.businessName || 'Your Business'}</p>
                        <p className="text-white/70 text-xs">Order online</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9A96A3' }}>Popular</p>
                      {['Grilled Chicken — GHS 18', 'Jollof Rice — GHS 12', 'Kelewele — GHS 8'].map((name, i) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border" style={{ borderColor: '#e0e0e0' }}>
                          <div className="w-11 h-11 rounded-xl flex-shrink-0" style={{ background: accentColor + '20' }} />
                          <p className="text-xs font-semibold flex-1" style={{ color: '#15141A' }}>{name}</p>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-base font-bold" style={{ background: accentColor }}>+</div>
                        </div>
                      ))}
                      <button className="w-full py-3 rounded-xl text-xs font-bold text-white mt-2" style={{ background: accentColor }}>
                        View Full Menu →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-center" style={{ color: 'var(--az-text-muted)' }}>
                Accent color updates live above. Save your settings to publish changes.
              </p>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
