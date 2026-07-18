import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/components/ui/Toast';
import { request } from '@/lib/api';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { PhonePreview } from '@/components/PhonePreview';
import { Card, Button, Badge, Skeleton, Empty, Input, Tabs } from '@/components/ui';
import {
  Image as ImageIcon,
  Smartphone,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  AlertTriangle,
  Award,
  Pin,
  RefreshCw,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';

export default function Showcase() {
  const { hasPermission } = usePermission();
  const { bizProfile } = useAuth();
  const { toast } = useToast();

  const businessId = bizProfile?.id;

  // View & Publish Gates
  const canView = hasPermission('marketing.view');
  const canPublish = hasPermission('marketing.publish');

  // Page States
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showPhonePreview, setShowPhonePreview] = useState(true);

  // Form curation states
  const [curatedItems, setCuratedItems] = useState([]);
  const [pinItemForm, setPinItemForm] = useState({ name: '', price: '', category: 'Product' });
  const [highlights, setHighlights] = useState([]);
  const [highlightForm, setHighlightForm] = useState({ title: '', badge: 'Award' });

  // Load all showcase configurations
  useEffect(() => {
    if (businessId && canView) {
      loadShowcaseData();
    }
  }, [businessId, canView]);

  const loadShowcaseData = async () => {
    setLoading(true);
    try {
      // 1. Fetch main gallery slides
      const res = await request(`/api/showcases/${businessId}`);
      setSlides(res || []);

      // 2. Mock featured and highlights structures if not fully present
      setCuratedItems([
        { id: '1', name: 'VIP Oceanside Suite', price: '450', category: 'Room', pinned: true },
        { id: '2', name: 'Premium Chef Tasting Menu', price: '120', category: 'Product', pinned: true }
      ]);
      setHighlights([
        { id: '1', title: '5-Star Michelin Recommendation', badge: 'Award' },
        { id: '2', title: 'Eco-Friendly Luxury Certified', badge: 'Certificate' }
      ]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load showcase data');
    } finally {
      setLoading(false);
    }
  };

  // --- GALLERY ACTION HANDLERS ---
  const handleUploadSlide = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!canPublish) {
      toast.error('You do not have permission to publish changes');
      return;
    }

    setUploading(true);
    try {
      const url = await uploadImageToCloudinary(file, 'showcase');
      const payload = { businessProfileId: businessId, mediaUrl: url, caption: 'New Storefront Slide' };

      await request('/api/showcases', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      toast.success('Photo added to showcase gallery');
      loadShowcaseData();
    } catch (err) {
      toast.error(err.message || 'Gallery upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveSlide = async (slideId) => {
    if (!canPublish) return;
    if (!confirm('Are you sure you want to remove this photo?')) return;
    try {
      await request(`/api/showcases/${slideId}`, {
        method: 'DELETE'
      });
      toast.success('Slide removed successfully');
      setSlides(prev => prev.filter(s => s.id !== slideId));
    } catch (err) {
      toast.error('Failed to delete showcase slide');
    }
  };

  const handleMoveSlide = async (idx, direction) => {
    if (!canPublish) return;
    const target = idx + direction;
    if (target < 0 || target >= slides.length) return;

    const updatedSlides = [...slides];
    [updatedSlides[idx], updatedSlides[target]] = [updatedSlides[target], updatedSlides[idx]];
    setSlides(updatedSlides);

    try {
      await request('/api/showcases/reorder', {
        method: 'POST',
        body: JSON.stringify({
          slides: updatedSlides.map((s, i) => ({ id: s.id, sortOrder: i }))
        })
      });
      toast.success('Showcase layout reordered');
    } catch (err) {
      toast.error('Failed to save reorder position');
      loadShowcaseData();
    }
  };

  // --- CURATED ITEMS ACTION HANDLERS ---
  const handleAddPinItem = (e) => {
    e.preventDefault();
    if (!pinItemForm.name || !pinItemForm.price) return;
    const newItem = {
      id: Math.random().toString(36).substring(2),
      ...pinItemForm,
      pinned: true
    };
    setCuratedItems(prev => [...prev, newItem]);
    setPinItemForm({ name: '', price: '', category: 'Product' });
    toast.success('Pinned item curated');
  };

  const handleRemovePinItem = (id) => {
    setCuratedItems(prev => prev.filter(item => item.id !== id));
    toast.success('Pinned item uncurated');
  };

  // --- HIGHLIGHTS ACTION HANDLERS ---
  const handleAddHighlight = (e) => {
    e.preventDefault();
    if (!highlightForm.title) return;
    const newHighlight = {
      id: Math.random().toString(36).substring(2),
      ...highlightForm
    };
    setHighlights(prev => [...prev, newHighlight]);
    setHighlightForm({ title: '', badge: 'Award' });
    toast.success('Highlight curated successfully');
  };

  const handleRemoveHighlight = (id) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
    toast.success('Highlight removed');
  };

  // View gate
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-6">
        <AlertTriangle className="w-12 h-12 text-[var(--az-danger)] mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-[var(--az-text)] mb-2">Access Denied</h2>
        <p className="text-sm text-[var(--az-text-muted)] max-w-md">
          You do not have permission to view the Showcase Editor. Please consult your administrator.
        </p>
      </div>
    );
  }

  // Construct a mocked business profile object with current live adjustments
  // to feed directly to PhonePreview live rendering.
  const previewBusinessObject = {
    ...bizProfile,
    slides: slides.length > 0 ? slides : [
      { mediaUrl: 'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?w=800' }
    ],
    curatedItems,
    highlights,
    businessName: bizProfile?.businessName || 'Azaman Showcase Partner',
    category: bizProfile?.category || 'Luxury Services'
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in text-[var(--az-text)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-3">
            <Smartphone className="w-6 h-6 text-[var(--az-accent)]" />
            Digital Storefront Editor
          </h1>
          <p className="text-sm text-[var(--az-text-muted)] mt-1">
            Build high-conversion landing pages for the Azaman customer app. Upload slides, pin signature products, and highlight certificates.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowPhonePreview(!showPhonePreview)}
          className={`gap-1.5 ${showPhonePreview ? 'bg-[var(--az-accent-subtle)] text-[var(--az-accent)]' : ''}`}
        >
          <Smartphone className="w-4 h-4" />
          {showPhonePreview ? 'Hide Phone Mockup' : 'Show Live Phone Preview'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Settings Column */}
        <div className={showPhonePreview ? 'lg:col-span-7 space-y-6' : 'lg:col-span-12 space-y-6'}>
          {/* Section 1: Hero slideshow */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[var(--az-accent)]" /> Full-Bleed Profile Slideshow
                </h3>
                <p className="text-xs text-[var(--az-text-muted)] mt-0.5">High-definition cover slides shown as full bleed on your profile.</p>
              </div>
              <Badge color="var(--az-accent)">{slides.length} Photos</Badge>
            </div>

            {/* Drag & drop upload area */}
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--az-border)] rounded-2xl py-8 px-4 hover:border-[var(--az-accent)] cursor-pointer transition-all bg-[var(--az-surface)]">
              <Upload className="w-8 h-8 text-[var(--az-text-muted)] mb-2" />
              <span className="text-sm font-bold text-[var(--az-accent)]">
                {uploading ? 'Processing & uploading slide...' : 'Upload Showcase Slide Image'}
              </span>
              <p className="text-[10px] text-[var(--az-text-muted)] mt-1">Accepts high-resolution JPG, PNG, WebP up to 5MB.</p>
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadSlide} disabled={!canPublish} />
            </label>

            {/* Slides list */}
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : slides.length === 0 ? (
              <Empty
                icon={ImageIcon}
                title="Your slideshow is empty"
                description="Upload images above to create a powerful hero slideshow carousel."
              />
            ) : (
              <div className="space-y-2">
                {slides.map((slide, idx) => (
                  <div key={slide.id || idx} className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--az-border)] bg-[var(--az-surface)] hover:bg-[var(--az-bg-alt)] transition-all">
                    <img src={slide.mediaUrl} className="w-16 h-12 object-cover rounded-lg" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold">Slide {idx + 1}</p>
                      <p className="text-[10px] text-[var(--az-text-muted)] truncate">{slide.mediaUrl}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveSlide(idx, -1)}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg text-[var(--az-text-muted)] hover:text-white disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveSlide(idx, 1)}
                        disabled={idx === slides.length - 1}
                        className="p-1.5 rounded-lg text-[var(--az-text-muted)] hover:text-white disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      {canPublish && (
                        <button
                          onClick={() => handleRemoveSlide(slide.id)}
                          className="p-1.5 rounded-lg text-[var(--az-danger)] hover:bg-[var(--az-danger)]/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Section 2: Pinned & Curated Items */}
          <Card className="space-y-4">
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <Pin className="w-5 h-5 text-[var(--az-info)]" /> Signature Curated Items
              </h3>
              <p className="text-xs text-[var(--az-text-muted)] mt-0.5">Pin exclusive rooms, hot menu options, or freight cargo routes to the storefront top-shelf.</p>
            </div>

            {/* Quick Add Curated Form */}
            <form onSubmit={handleAddPinItem} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                placeholder="Product/Service Title"
                value={pinItemForm.name}
                onChange={(e) => setPinItemForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
              <Input
                type="number"
                placeholder="Price (USD/USDC)"
                value={pinItemForm.price}
                onChange={(e) => setPinItemForm(prev => ({ ...prev, price: e.target.value }))}
                required
              />
              <select
                value={pinItemForm.category}
                onChange={(e) => setPinItemForm(prev => ({ ...prev, category: e.target.value }))}
                className="px-3 py-2 rounded-xl bg-[var(--az-black)] border border-[var(--az-border)] text-sm text-white"
              >
                <option value="Product">Product SKU</option>
                <option value="Room">Luxury Room</option>
                <option value="Service">Booking Service</option>
              </select>
              <Button type="submit" disabled={!canPublish} size="sm">
                Add Curated SKU
              </Button>
            </form>

            {/* Curated list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {curatedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--az-border)] bg-[var(--az-surface)]">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black">{item.name}</span>
                      <Badge color="var(--az-info)" className="text-[9px] px-1 py-0">{item.category}</Badge>
                    </div>
                    <p className="text-xs text-[var(--az-text-muted)] mt-0.5">${item.price} USDC</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[var(--az-danger)] p-1" onClick={() => handleRemovePinItem(item.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Section 3: Brand Highlights Editor */}
          <Card className="space-y-4">
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <Award className="w-5 h-5 text-[var(--az-warning)]" /> Certifications & Trust Highlights
              </h3>
              <p className="text-xs text-[var(--az-text-muted)] mt-0.5">Exhibit Michelin badges, sustainable credentials, or verified transit safety awards.</p>
            </div>

            {/* Add Highlight */}
            <form onSubmit={handleAddHighlight} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Highlight Label, e.g. Michelin 2025"
                value={highlightForm.title}
                onChange={(e) => setHighlightForm(prev => ({ ...prev, title: e.target.value }))}
                required
              />
              <select
                value={highlightForm.badge}
                onChange={(e) => setHighlightForm(prev => ({ ...prev, badge: e.target.value }))}
                className="px-3 py-2 rounded-xl bg-[var(--az-black)] border border-[var(--az-border)] text-sm text-white"
              >
                <option value="Award">Trust Award</option>
                <option value="Certificate">Certificate</option>
                <option value="Specialty">Specialty Badge</option>
              </select>
              <Button type="submit" disabled={!canPublish} size="sm">
                Add Trust Highlight
              </Button>
            </form>

            {/* Highlights List */}
            <div className="flex flex-wrap gap-2 mt-4">
              {highlights.map((h) => (
                <div key={h.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--az-border)] bg-[var(--az-surface)]">
                  <Award className="w-3.5 h-3.5 text-[var(--az-warning)]" />
                  <span className="text-xs font-bold">{h.title}</span>
                  <Badge color="var(--az-warning)" className="text-[9px] px-1 py-0">{h.badge}</Badge>
                  <button onClick={() => handleRemoveHighlight(h.id)} className="text-[var(--az-danger)] hover:opacity-80 text-xs font-bold pl-1 border-l border-[var(--az-border)]">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Live Phone Preview Column */}
        {showPhonePreview && (
          <div className="lg:col-span-5 relative min-h-[600px] flex items-start justify-center">
            <div className="sticky top-6 w-full max-w-sm">
              <PhonePreview
                business={previewBusinessObject}
                onClose={() => setShowPhonePreview(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
