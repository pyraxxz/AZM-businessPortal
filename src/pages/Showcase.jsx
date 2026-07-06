import { useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { marketplaceApi } from '@/lib/marketplaceApi';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Card, Button, Skeleton, Empty } from '@/components/ui';

export default function Showcase() {
  const { toast } = useToast();
  const { bizProfile } = useAuth();
  const businessId = bizProfile?.id || bizProfile?.bizId;
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (businessId) load(); }, [businessId]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await marketplaceApi.getShowcase(businessId);
      setSlides(res.data || []);
    } catch (e) {
      toast.error('Failed to load showcase');
    }
    setLoading(false);
  };

  const upload = async (file) => {
    setUploading(true);
    try {
      const url = await uploadImageToCloudinary(file, 'showcase');
      await marketplaceApi.addShowcaseSlide(businessId, { mediaUrl: url });
      toast.success('Photo added to showcase');
      load();
    } catch (e) {
      toast.error('Upload failed');
    }
    setUploading(false);
  };

  const remove = async (slideId) => {
    try {
      await marketplaceApi.removeShowcaseSlide(businessId, slideId);
      setSlides(prev => prev.filter(s => s.id !== slideId));
      toast.success('Photo removed');
    } catch (e) {
      toast.error('Failed to remove photo');
    }
  };

  const move = async (idx, dir) => {
    const newSlides = [...slides];
    const target = idx + dir;
    if (target < 0 || target >= newSlides.length) return;
    [newSlides[idx], newSlides[target]] = [newSlides[target], newSlides[idx]];
    setSlides(newSlides);
    try {
      await marketplaceApi.reorderShowcase(businessId,
        newSlides.map((s, i) => ({ id: s.id, sortOrder: i })));
    } catch (e) {
      toast.error('Failed to reorder');
      load();
    }
  };

  if (loading) return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--sn-text)]">Showcase</h1>
        <p className="text-sm text-[var(--sn-text-muted)] mt-0.5">Photos shown as a full-bleed slideshow on your profile</p>
      </div>
      <Skeleton className="h-48" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--sn-text)]">Showcase</h1>
        <p className="text-sm text-[var(--sn-text-muted)] mt-0.5">Photos shown as a full-bleed slideshow on your profile</p>
      </div>

      {/* Upload */}
      <div className="rounded-xl border-2 border-dashed border-[var(--sn-border)] p-8 text-center hover:border-[var(--sn-purple)] transition-colors">
        <ImageIcon className="w-8 h-8 text-[var(--sn-text-muted)] mx-auto mb-2" />
        <label className="cursor-pointer">
          <span className="text-sm text-[var(--sn-purple)] font-medium">
            {uploading ? 'Uploading...' : 'Click to upload photo'}
          </span>
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files[0] && upload(e.target.files[0])} />
        </label>
      </div>

      {/* Slides */}
      <div className="space-y-3">
        {slides.map((slide, idx) => (
          <Card key={slide.id} className="overflow-hidden flex flex-row p-0">
            <img src={slide.mediaUrl} alt="" className="w-32 h-24 object-cover flex-shrink-0" />
            <div className="flex-1 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--sn-text)]">Slide {idx + 1}</p>
                <p className="text-xs text-[var(--sn-text-muted)]">{slide.caption || 'No caption'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => move(idx, -1)} disabled={idx === 0}
                  className="h-8 w-8 rounded-md hover:bg-[var(--sn-hover)] disabled:opacity-30 flex items-center justify-center transition-colors">
                  <ArrowUp className="w-4 h-4 text-[var(--sn-text-muted)]" />
                </button>
                <button onClick={() => move(idx, 1)} disabled={idx === slides.length - 1}
                  className="h-8 w-8 rounded-md hover:bg-[var(--sn-hover)] disabled:opacity-30 flex items-center justify-center transition-colors">
                  <ArrowDown className="w-4 h-4 text-[var(--sn-text-muted)]" />
                </button>
                <button onClick={() => remove(slide.id)}
                  className="h-8 w-8 rounded-md hover:bg-[var(--sn-red)]/10 flex items-center justify-center transition-colors">
                  <Trash2 className="w-4 h-4 text-[var(--sn-red)]" />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {slides.length === 0 && (
          <Empty icon={ImageIcon} title="No showcase photos yet" description="Upload your first photo above to display on your profile" />
        )}
      </div>
    </div>
  );
}
