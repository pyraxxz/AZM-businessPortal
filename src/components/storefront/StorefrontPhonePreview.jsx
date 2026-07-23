// src/components/storefront/StorefrontPhonePreview.jsx
// Real, per-widget preview that mirrors how Flutter renders each tile.
// Every widget type has its own mini renderer that uses the tile's actual props.
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Smartphone, Star, MapPin, Phone, MessageCircle, ShoppingBag, Image, Users, Clock, ChevronRight, Play, ExternalLink } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Individual mini-widget renderers (mirror Flutter widget layout)
// ─────────────────────────────────────────────────────────────

function HeroHeader({ props, business, tokens }) {
  const bg = props.mediaUrl
    ? `url(${props.mediaUrl}) center/cover no-repeat`
    : tokens.accent || '#6C4FD1';
  const overlayAlpha = Math.round((props.overlayOpacity ?? 0.3) * 255).toString(16).padStart(2, '0');
  const overlayColor = `#000000${overlayAlpha}`;
  const heightPx = props.height === 'tall' ? 100 : props.height === 'short' ? 60 : 80;

  return (
    <div style={{ height: heightPx, background: bg, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: overlayColor }} />
      {/* Fallback to business coverPhoto */}
      {!props.mediaUrl && business?.coverPhotoUrl && (
        <img src={business.coverPhotoUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      <div style={{ position: 'relative', zIndex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
        {props.title && (
          <p style={{ color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1.3, marginBottom: 2 }}>{props.title}</p>
        )}
        {props.subtitle && (
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 9 }}>{props.subtitle}</p>
        )}
      </div>
    </div>
  );
}

function QuickInfoBar({ props, business, tokens }) {
  const accent = tokens.accent || '#6C4FD1';
  const textColor = tokens.textSecondary || '#888';
  return (
    <div style={{ padding: '6px 10px', display: 'flex', gap: 8, alignItems: 'center', borderBottom: `1px solid ${tokens.border || '#eee'}`, flexWrap: 'wrap' }}>
      {props.showRating && business?.averageRating && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Star size={8} fill={accent} color={accent} />
          <span style={{ fontSize: 9, color: accent, fontWeight: 700 }}>{Number(business.averageRating).toFixed(1)}</span>
        </div>
      )}
      {props.showCategory && business?.category && (
        <span style={{ fontSize: 8, color: textColor, textTransform: 'capitalize' }}>{business.category.toLowerCase()}</span>
      )}
      {props.showHours && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Clock size={7} color={textColor} />
          <span style={{ fontSize: 8, color: textColor }}>Open Now</span>
        </div>
      )}
      {props.customInfo && (
        <span style={{ fontSize: 8, color: textColor }}>{props.customInfo}</span>
      )}
    </div>
  );
}

function ProductGrid({ props, tokens }) {
  const accent = tokens.accent || '#6C4FD1';
  const surface = tokens.surface || '#f8f8f8';
  const cols = props.columns || 2;
  const count = Math.min(props.maxItems || 4, 4); // cap at 4 for preview
  const items = Array.from({ length: count });
  return (
    <div style={{ padding: '8px 8px 4px' }}>
      {props.title && (
        <p style={{ fontSize: 9, fontWeight: 700, color: tokens.textPrimary || '#111', marginBottom: 6 }}>{props.title}</p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 4 }}>
        {items.map((_, i) => (
          <div key={i} style={{ borderRadius: 6, overflow: 'hidden', background: surface }}>
            <div style={{ height: 40, background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={14} color={accent} />
            </div>
            <div style={{ padding: '3px 4px' }}>
              <div style={{ height: 5, background: `${accent}30`, borderRadius: 2, marginBottom: 2 }} />
              {props.showPrice && <div style={{ height: 4, width: '60%', background: `${accent}50`, borderRadius: 2 }} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewCarousel({ props, tokens }) {
  const accent = tokens.accent || '#6C4FD1';
  const surface = tokens.surface || '#f8f8f8';
  return (
    <div style={{ padding: '8px 8px 6px' }}>
      {props.title && (
        <p style={{ fontSize: 9, fontWeight: 700, color: tokens.textPrimary || '#111', marginBottom: 5 }}>{props.title}</p>
      )}
      {[5, 4].map((stars, i) => (
        <div key={i} style={{ background: surface, borderRadius: 6, padding: '5px 7px', marginBottom: 4 }}>
          <div style={{ display: 'flex', gap: 1, marginBottom: 2 }}>
            {Array.from({ length: stars }).map((_, j) => <Star key={j} size={7} fill={accent} color={accent} />)}
          </div>
          <div style={{ height: 4, background: '#ddd', borderRadius: 2, marginBottom: 2 }} />
          <div style={{ height: 4, width: '70%', background: '#ddd', borderRadius: 2 }} />
          <p style={{ fontSize: 7, color: tokens.textSecondary || '#aaa', marginTop: 2 }}>— Customer</p>
        </div>
      ))}
    </div>
  );
}

function ContactCard({ props, business, tokens }) {
  const accent = tokens.accent || '#6C4FD1';
  const phone = business?.phoneNumber || null;
  const actions = [];
  if (props.showPhone && phone) actions.push({ icon: Phone, label: 'Call', color: accent });
  if (props.showWhatsApp && phone) actions.push({ icon: MessageCircle, label: 'WhatsApp', color: '#25D366' });
  if (props.showEmail) actions.push({ icon: ExternalLink, label: 'Email', color: '#EA4335' });
  if (actions.length === 0) {
    actions.push({ icon: Phone, label: 'Call', color: accent });
    actions.push({ icon: MessageCircle, label: 'WhatsApp', color: '#25D366' });
  }
  return (
    <div style={{ padding: '8px 8px 6px', display: 'flex', gap: 6, justifyContent: 'center' }}>
      {actions.map(({ icon: Icon, label, color }, i) => (
        <div key={i} style={{ flex: 1, borderRadius: 8, border: `1px solid ${color}40`, padding: '6px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={11} color={color} />
          </div>
          <span style={{ fontSize: 7, color, fontWeight: 600 }}>{label}</span>
          {label === 'Call' && phone && (
            <span style={{ fontSize: 6, color: tokens.textSecondary || '#aaa' }}>{phone.substring(0, 10)}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function ShowcaseGallery({ props, tokens }) {
  const accent = tokens.accent || '#6C4FD1';
  const surface = tokens.surface || '#f8f8f8';
  return (
    <div style={{ padding: '8px 8px 6px' }}>
      {props.title && (
        <p style={{ fontSize: 9, fontWeight: 700, color: tokens.textPrimary || '#111', marginBottom: 5 }}>{props.title}</p>
      )}
      <div style={{ display: 'flex', gap: 4 }}>
        <div style={{ flex: 2, height: 55, borderRadius: 6, background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Image size={18} color={accent} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[1, 2].map(i => (
            <div key={i} style={{ flex: 1, borderRadius: 6, background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image size={10} color={accent} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LocationMap({ props, tokens }) {
  const accent = tokens.accent || '#6C4FD1';
  return (
    <div style={{ padding: '8px 8px 6px' }}>
      {props.title && (
        <p style={{ fontSize: 9, fontWeight: 700, color: tokens.textPrimary || '#111', marginBottom: 5 }}>{props.title}</p>
      )}
      <div style={{ height: 60, borderRadius: 8, background: '#e8f0e8', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Fake map grid */}
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
          {[10,20,30,40,50].map(y => <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#888" strokeWidth="0.5" />)}
          {[20,40,60,80].map(x => <line key={x} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="#888" strokeWidth="0.5" />)}
        </svg>
        <div style={{ zIndex: 1, width: 24, height: 24, borderRadius: '50% 50% 50% 0', background: accent, transform: 'rotate(-45deg)', boxShadow: `0 2px 8px ${accent}80` }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
        <MapPin size={9} color={accent} />
        <span style={{ fontSize: 8, color: tokens.textSecondary || '#888' }}>View on Maps</span>
      </div>
    </div>
  );
}

function ActionButtons({ props, tokens }) {
  const accent = tokens.accent || '#6C4FD1';
  const btns = [];
  if (props.showOrder)  btns.push({ label: 'Order Now', bg: accent, color: '#fff' });
  if (props.showBook)   btns.push({ label: 'Book', bg: accent, color: '#fff' });
  if (props.showFollow) btns.push({ label: 'Follow', bg: `${accent}20`, color: accent });
  if (props.showShare)  btns.push({ label: 'Share', bg: '#f0f0f0', color: '#555' });
  if (btns.length === 0) btns.push({ label: 'Order Now', bg: accent, color: '#fff' });
  return (
    <div style={{ padding: '8px 8px 6px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {btns.map(({ label, bg, color }, i) => (
        <div key={i} style={{ flex: 1, minWidth: 40, borderRadius: 6, padding: '5px 6px', background: bg, textAlign: 'center' }}>
          <span style={{ fontSize: 8, color, fontWeight: 700 }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function AnnouncementBanner({ props, tokens }) {
  const accent = tokens.accent || '#6C4FD1';
  return (
    <div style={{ margin: '0 8px 4px', borderRadius: 8, background: `${accent}15`, border: `1px solid ${accent}30`, padding: '6px 8px' }}>
      {props.title && <p style={{ fontSize: 9, fontWeight: 700, color: accent, marginBottom: 2 }}>{props.title}</p>}
      {props.body && <p style={{ fontSize: 8, color: tokens.textSecondary || '#666', lineHeight: 1.3 }}>{props.body}</p>}
    </div>
  );
}

function SocialLinks({ props, tokens }) {
  const accent = tokens.accent || '#6C4FD1';
  const platforms = [];
  if (props.instagram) platforms.push('IG');
  if (props.facebook)  platforms.push('FB');
  if (props.twitter)   platforms.push('TW');
  if (props.tiktok)    platforms.push('TK');
  if (platforms.length === 0) platforms.push('IG', 'FB');
  return (
    <div style={{ padding: '6px 8px', display: 'flex', gap: 6, justifyContent: 'center' }}>
      {platforms.map(p => (
        <div key={p} style={{ width: 28, height: 28, borderRadius: '50%', background: `${accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 7, fontWeight: 800, color: accent }}>{p}</span>
        </div>
      ))}
    </div>
  );
}

function StaffHighlight({ props, tokens }) {
  const accent = tokens.accent || '#6C4FD1';
  const count = Math.min(props.maxStaff || 3, 3);
  return (
    <div style={{ padding: '8px 8px 6px' }}>
      {props.title && <p style={{ fontSize: 9, fontWeight: 700, color: tokens.textPrimary || '#111', marginBottom: 5 }}>{props.title}</p>}
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${accent}20`, margin: '0 auto 3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={14} color={accent} />
            </div>
            <div style={{ height: 4, background: '#ddd', borderRadius: 2, margin: '0 4px 2px' }} />
            <div style={{ height: 4, width: '60%', background: '#eee', borderRadius: 2, margin: '0 auto' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function VideoBlock({ props, tokens }) {
  const accent = tokens.accent || '#6C4FD1';
  return (
    <div style={{ margin: '0 8px 4px', borderRadius: 8, height: 70, background: `${accent}15`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {props.thumbnailUrl && (
        <img src={props.thumbnailUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      <div style={{ position: 'relative', zIndex: 1, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Play size={12} color="#fff" fill="#fff" />
      </div>
    </div>
  );
}

function PromoCountdown({ props, tokens }) {
  const accent = tokens.accent || '#6C4FD1';
  return (
    <div style={{ margin: '0 8px 4px', borderRadius: 8, background: accent, padding: '8px 10px' }}>
      {props.title && <p style={{ fontSize: 9, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{props.title}</p>}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        {['00', '12', '30'].map((n, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: '3px 6px', textAlign: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', display: 'block' }}>{n}</span>
            <span style={{ fontSize: 6, color: 'rgba(255,255,255,0.7)' }}>{['HRS','MIN','SEC'][i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoyaltyWidget({ props, tokens }) {
  const accent = tokens.accent || '#6C4FD1';
  return (
    <div style={{ margin: '0 8px 4px', borderRadius: 8, border: `1.5px dashed ${accent}`, padding: '8px 10px' }}>
      {props.title && <p style={{ fontSize: 9, fontWeight: 700, color: accent, marginBottom: 4 }}>{props.title}</p>}
      <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
        {Array.from({ length: props.maxStamps || 5 }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 14, borderRadius: 4, background: i < 2 ? accent : `${accent}20`, border: `1px solid ${accent}` }} />
        ))}
      </div>
      <p style={{ fontSize: 7, color: tokens.textSecondary || '#888' }}>2 / {props.maxStamps || 5} stamps collected</p>
    </div>
  );
}

function RichTextBlock({ props, tokens }) {
  return (
    <div style={{ padding: '6px 10px' }}>
      {props.title && <p style={{ fontSize: 9, fontWeight: 700, color: tokens.textPrimary || '#111', marginBottom: 3 }}>{props.title}</p>}
      {props.body
        ? <p style={{ fontSize: 8, color: tokens.textSecondary || '#666', lineHeight: 1.5 }}>{props.body.substring(0, 120)}{props.body.length > 120 ? '…' : ''}</p>
        : <>
            <div style={{ height: 4, background: '#ddd', borderRadius: 2, marginBottom: 3 }} />
            <div style={{ height: 4, background: '#ddd', borderRadius: 2, marginBottom: 3 }} />
            <div style={{ height: 4, width: '70%', background: '#eee', borderRadius: 2 }} />
          </>
      }
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Widget registry (maps widgetType -> mini-renderer component)
// ─────────────────────────────────────────────────────────────

const WIDGET_RENDERERS = {
  hero_header:         HeroHeader,
  quick_info_bar:      QuickInfoBar,
  product_grid:        ProductGrid,
  review_carousel:     ReviewCarousel,
  contact_card:        ContactCard,
  showcase_gallery:    ShowcaseGallery,
  location_map:        LocationMap,
  action_buttons:      ActionButtons,
  announcement_banner: AnnouncementBanner,
  social_links:        SocialLinks,
  staff_highlight:     StaffHighlight,
  video_block:         VideoBlock,
  promo_countdown:     PromoCountdown,
  loyalty_widget:      LoyaltyWidget,
  rich_text_block:     RichTextBlock,
};

function FallbackTile({ tile, tokens }) {
  const accent = tokens.accent || '#6C4FD1';
  return (
    <div style={{ margin: '4px 8px', borderRadius: 8, border: `1px dashed ${accent}40`, padding: '8px 10px', opacity: 0.7 }}>
      <p style={{ fontSize: 9, fontWeight: 600, color: accent, textTransform: 'capitalize' }}>
        {(tile.widgetType || '').replace(/_/g, ' ')}
      </p>
      {tile.props?.title && (
        <p style={{ fontSize: 8, color: tokens.textSecondary || '#888', marginTop: 2 }}>{tile.props.title}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export default function StorefrontPhonePreview({ draft, theme, widgets, business }) {
  const tokens  = theme?.tokenSet || {};
  const accent  = tokens.accent    || 'var(--az-accent)';
  const bg      = tokens.background || '#ffffff';
  const surface = tokens.surface    || '#f8f8f8';
  const textPrimary = tokens.textPrimary || '#111111';
  const tiles   = draft?.layoutJson?.tiles || [];

  // Sort tiles by row position so they appear in layout order
  const sortedTiles = [...tiles].sort((a, b) => (a.position?.row ?? 0) - (b.position?.row ?? 0));

  // Business info for widgets that need it (falls back to placeholders)
  const businessInfo = business || {
    name: draft?.businessName || 'Your Business',
    logoUrl: null,
    coverPhotoUrl: null,
    averageRating: null,
    phoneNumber: null,
    category: null,
  };

  return (
    <GlassPanel solid className="p-3">
      {/* Panel header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-3 h-3" style={{ color: 'var(--az-text-muted)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--az-text-muted)' }}>Live Preview</span>
        </div>
        {theme && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'var(--az-accent-subtle)', color: 'var(--az-accent)' }}>
            {theme.name}
          </span>
        )}
      </div>

      {/* Phone frame */}
      <div
        className="rounded-[28px] border-4 overflow-hidden shadow-2xl mx-auto"
        style={{ borderColor: 'var(--az-surface-solid)', width: 220, background: bg }}
      >
        {/* Status bar */}
        <div className="flex justify-between items-center px-4 py-1.5 text-[10px]"
          style={{ background: accent, color: '#fff' }}>
          <span className="font-semibold">9:41</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <span>●●●</span><span>WiFi</span><span>100%</span>
          </div>
        </div>

        {/* Business identity strip */}
        <div style={{ padding: '10px 12px 8px', textAlign: 'center', background: surface, borderBottom: `1px solid ${tokens.border || '#eee'}` }}>
          {businessInfo.logoUrl ? (
            <img src={businessInfo.logoUrl} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 6px' }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: accent, margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>
                {(businessInfo.name || 'B').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <p style={{ fontSize: 10, fontWeight: 700, color: textPrimary }}>{businessInfo.name || 'Your Business'}</p>
          <p style={{ fontSize: 8, color: tokens.textSecondary || '#888', marginTop: 1 }}>Tap to follow</p>
        </div>

        {/* Widget tiles */}
        <div style={{ minHeight: 280, overflowY: 'auto', background: bg }}>
          {sortedTiles.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
              <p style={{ fontSize: 9, color: tokens.textSecondary || '#aaa', textAlign: 'center' }}>
                Add widgets from the left panel
              </p>
            </div>
          ) : (
            sortedTiles.map(tile => {
              const Renderer = WIDGET_RENDERERS[tile.widgetType];
              if (!Renderer) return <FallbackTile key={tile.id} tile={tile} tokens={tokens} />;
              return (
                <div key={tile.id} style={{ borderBottom: `1px solid ${tokens.border || '#f0f0f0'}` }}>
                  <Renderer props={tile.props || {}} business={businessInfo} tokens={tokens} />
                </div>
              );
            })
          )}
        </div>

        {/* Nav bar */}
        <div style={{ height: 32, background: surface, borderTop: `1px solid ${tokens.border || '#eee'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 16px' }}>
          {['Home', 'Menu', 'Orders', 'Profile'].map(tab => (
            <div key={tab} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: tab === 'Home' ? accent : `${accent}20` }} />
              <span style={{ fontSize: 5, color: tab === 'Home' ? accent : tokens.textSecondary || '#aaa', fontWeight: tab === 'Home' ? 700 : 400 }}>{tab}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassPanel>
  );
}
