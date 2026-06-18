import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { products as productsApi } from '@/lib/api';
import { Card, Badge, Button, Input, Textarea, Select, Empty, Skeleton, Modal } from '@/components/ui';
import { fmtUSDC, fmt } from '@/lib/utils';
import { Package, Plus, Pencil, ToggleLeft, ToggleRight, AlertCircle, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadImageToCloudinary, isCloudinaryConfigured, validateImageFile } from '@/lib/cloudinary';

const CATEGORIES = [
  { value: '', label: 'Select category...' },
  { value: 'FREELANCE_SERVICES', label: 'Freelance Services' },
  { value: 'RETAIL',             label: 'Retail' },
  { value: 'FOOD_BEVERAGE',      label: 'Food & Beverage' },
  { value: 'TECHNOLOGY',         label: 'Technology' },
  { value: 'REAL_ESTATE',        label: 'Real Estate' },
  { value: 'EDUCATION',          label: 'Education' },
  { value: 'HEALTH_WELLNESS',    label: 'Health & Wellness' },
  { value: 'ENTERTAINMENT',      label: 'Entertainment' },
  { value: 'LOGISTICS',          label: 'Logistics' },
  { value: 'FINANCIAL_SERVICES', label: 'Financial Services' },
  { value: 'OTHER',              label: 'Other' },
];

const BLANK = { name: '', description: '', priceUsdc: '', category: '', imageUrls: [] };
const MAX_IMAGES = 5;

export default function Products() {
  const qc = useQueryClient();
  const [modal, setModal]   = useState(null); // null | 'create' | { ...product }
  const [form, setForm]     = useState(BLANK);
  const [formError, setFormError] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn:  () => productsApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (d) => productsApi.create(d),
    onSuccess: () => { toast.success('Product created'); qc.invalidateQueries(['products']); closeModal(); },
    onError: (e) => setFormError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }) => productsApi.update(id, d),
    onSuccess: () => { toast.success('Product updated'); qc.invalidateQueries(['products']); closeModal(); },
    onError: (e) => setFormError(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => productsApi.update(id, { isActive }),
    onSuccess: (_, { isActive }) => {
      toast.success(isActive ? 'Product activated' : 'Product deactivated');
      qc.invalidateQueries(['products']);
    },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => { setForm(BLANK); setFormError(''); setModal('create'); };
  const openEdit   = (p) => {
    setForm({
      name: p.name,
      description: p.description || '',
      priceUsdc: String(p.priceUsdc),
      category: p.category || '',
      imageUrls: Array.isArray(p.imageUrls) ? p.imageUrls : [],
    });
    setFormError('');
    setModal(p);
  };
  const closeModal = () => { setModal(null); setFormError(''); setUploading(false); };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    const invalid = validateImageFile(file);
    if (invalid) return toast.error(invalid);
    setUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setForm(f => ({ ...f, imageUrls: [...f.imageUrls, url] }));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) =>
    setForm(f => ({ ...f, imageUrls: f.imageUrls.filter((_, i) => i !== idx) }));

  const handleSubmit = () => {
    setFormError('');
    if (!form.name.trim())   return setFormError('Product name is required.');
    if (!form.priceUsdc)     return setFormError('Price is required.');
    const price = Number(form.priceUsdc);
    if (isNaN(price) || price <= 0) return setFormError('Price must be a positive number.');

    const urls = (form.imageUrls || []).map(u => u.trim()).filter(Boolean);
    const payload = {
      name:        form.name.trim(),
      description: form.description.trim() || null,
      priceUsdc:   price,
      category:    form.category || null,
      imageUrls:   urls.length ? urls : null,
    };

    if (modal === 'create') {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate({ id: modal.id, data: payload });
    }
  };

  const productList = data?.products || [];
  const active   = productList.filter(p => p.isActive);
  const inactive = productList.filter(p => !p.isActive);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#e8e8f0]">Products</h1>
          <p className="text-sm text-[#7b7b9a] mt-1">Manage your product catalogue.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : productList.length === 0 ? (
        <Empty
          icon={Package}
          title="No products yet"
          description="Add your first product so customers can find and order from you."
          action={<Button onClick={openCreate}><Plus className="w-4 h-4" /> Add Product</Button>}
        />
      ) : (
        <>
          {active.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-[#4a4a6a] uppercase tracking-wider mb-3">
                Active — {active.length}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {active.map(p => <ProductCard key={p.id} product={p} onEdit={openEdit} onToggle={toggleMutation} />)}
              </div>
            </section>
          )}
          {inactive.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-[#4a4a6a] uppercase tracking-wider mb-3">
                Inactive — {inactive.length}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                {inactive.map(p => <ProductCard key={p.id} product={p} onEdit={openEdit} onToggle={toggleMutation} />)}
              </div>
            </section>
          )}
        </>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={!!modal}
        onClose={closeModal}
        title={modal === 'create' ? 'Add New Product' : 'Edit Product'}
        className="max-w-lg"
      >
        <div className="space-y-4">
          <Input
            label="Product Name"
            placeholder="e.g. Logo Design, 1kg Tomatoes, Web Consultation..."
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <Textarea
            label="Description (optional)"
            placeholder="What does this product or service include?"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <Input
            label="Price (USDC)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.priceUsdc}
            onChange={e => setForm(f => ({ ...f, priceUsdc: e.target.value }))}
          />
          <Select
            label="Category"
            options={CATEGORIES}
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          />
          {/* Product images */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#7b7b9a] uppercase tracking-wider">Product Images</p>
            <div className="grid grid-cols-3 gap-2">
              {form.imageUrls.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-[#0a0a12] border border-[#2a2a3e] group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#00d97e] text-[#0a0a0f]">COVER</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-[#f43f5e] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {form.imageUrls.length < MAX_IMAGES && (
                <label className={`aspect-square rounded-xl border-2 border-dashed border-[#2a2a3e] flex flex-col items-center justify-center transition-colors ${uploading ? 'opacity-60' : 'cursor-pointer hover:border-[#00d97e40]'}`}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  {uploading
                    ? <Loader2 className="w-5 h-5 text-[#00d97e] animate-spin" />
                    : <><Plus className="w-5 h-5 text-[#4a4a6a]" /><span className="text-xs text-[#4a4a6a] mt-1">Add Image</span></>
                  }
                </label>
              )}
            </div>
            <p className="text-xs text-[#4a4a6a]">
              {isCloudinaryConfigured()
                ? 'Up to 5 images, 5MB each (JPEG/PNG/WebP). The first image is the cover.'
                : 'Image upload is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to enable uploads.'}
            </p>
          </div>

          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f43f5e1a] border border-[#f43f5e30]">
              <AlertCircle className="w-4 h-4 text-[#f43f5e] flex-shrink-0" />
              <p className="text-xs text-[#f43f5e]">{formError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={closeModal} className="flex-1">Cancel</Button>
            <Button
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
              className="flex-1"
            >
              {modal === 'create' ? 'Create Product' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ProductCard({ product: p, onEdit, onToggle }) {
  return (
    <Card className="flex flex-col gap-3">
      {/* Image or placeholder */}
      {Array.isArray(p.imageUrls) && p.imageUrls[0] ? (
        <div className="w-full h-32 rounded-xl overflow-hidden">
          <img src={p.imageUrls[0]} alt={p.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full h-24 rounded-xl bg-[#0f0f17] border border-[#2a2a3e] flex items-center justify-center">
          <Package className="w-8 h-8 text-[#2a2a3e]" />
        </div>
      )}

      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-[#e8e8f0] leading-snug">{p.name}</p>
          <span className="text-sm font-bold text-[#00d97e] az-mono flex-shrink-0">{fmtUSDC(p.priceUsdc)}</span>
        </div>
        {p.description && (
          <p className="text-xs text-[#4a4a6a] mt-1 line-clamp-2">{p.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          {p.category && <Badge color="#a78bfa" bg="#a78bfa1a">{p.category.replace(/_/g, ' ')}</Badge>}
          <span className="text-xs text-[#4a4a6a]">{fmt(p.totalOrders, 0)} orders</span>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="secondary" size="sm" onClick={() => onEdit(p)} className="flex-1">
          <Pencil className="w-3.5 h-3.5" /> Edit
        </Button>
        <button
          onClick={() => onToggle.mutate({ id: p.id, isActive: !p.isActive })}
          title={p.isActive ? 'Deactivate' : 'Activate'}
          className="p-2 rounded-xl border border-[#2a2a3e] hover:bg-[#1e1e2e] transition-colors"
        >
          {p.isActive
            ? <ToggleRight className="w-4 h-4 text-[#00d97e]" />
            : <ToggleLeft className="w-4 h-4 text-[#4a4a6a]" />
          }
        </button>
      </div>
    </Card>
  );
}
