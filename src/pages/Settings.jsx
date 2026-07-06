import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { business as businessApi, locations as locApi } from '@/lib/api';
import { marketplaceApi } from '@/lib/marketplaceApi';
import { useAuth } from '@/lib/AuthContext';
import { Card, Button, Input, Textarea, Select, Badge, Switch } from '@/components/ui';
import { KYB_STATUS_META } from '@/lib/utils';
import { Building2, Save, CheckCircle2, Copy, Eye, BadgeCheck, QrCode, Wallet, ImagePlus, Palette, RotateCcw } from 'lucide-react';
import { uploadImageToCloudinary, isCloudinaryConfigured, validateImageFile } from '@/lib/cloudinary';
import { toast } from 'sonner';
import PublicProfilePreview from '@/components/PublicProfilePreview';
import QrCodePanel from '@/components/QrCodePanel';

const CATEGORIES = [
  // ── Primary: Transit, Restaurants, Hotels ──────────────────────────────
  { value: 'LOGISTICS',          label: 'Transit & Transport' },
  { value: 'FOOD_BEVERAGE',      label: 'Restaurants' },
  { value: 'REAL_ESTATE',        label: 'Hotels & Stays' },
  // ── Secondary ───────────────────────────────────────────────────────────
  { value: 'RETAIL',             label: 'Retail' },
  { value: 'HEALTH_WELLNESS',    label: 'Health & Wellness' },
  { value: 'EDUCATION',          label: 'Education' },
  { value: 'ENTERTAINMENT',      label: 'Entertainment' },
  { value: 'FREELANCE_SERVICES', label: 'Services' },
  { value: 'TECHNOLOGY',         label: 'Technology' },
  { value: 'FINANCIAL_SERVICES', label: 'Financial Services' },
  { value: 'OTHER',              label: 'Other' },
];

export default function Settings() {
  const { bizProfile, user, refreshProfile } = useAuth();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    businessName: '',
    description:  '',
    website:      '',
    phoneNumber:  '',
    contactEmail: '',
    address:      '',
    country:      '',
    category:     '',
    logoUrl:      '',
    coverPhotoUrl: '',
    adAccentColor: '',
  });
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [penaltyPolicy, setPenaltyPolicy] = useState(null);
  const [penaltyLoading, setPenaltyLoading] = useState(false);

  useEffect(() => {
      if (bizProfile?.id) {
          marketplaceApi.getPenaltyPolicy(bizProfile.id)
              .then(data => setPenaltyPolicy(data.policy))
              .catch(() => {});
      }
  }, [bizProfile?.id]);

  const { data: locsData } = useQuery({
    queryKey: ['biz-locations'],
    queryFn:  () => locApi.list(),
    enabled:  !!bizProfile,
  });
  const locs = locsData?.locations || [];

  const copyBizId = async () => {
    if (!bizProfile?.bizId) return;
    try {
      await navigator.clipboard.writeText(bizProfile.bizId);
      toast.success('BIZ ID copied to clipboard');
    } catch {
      toast.error('Could not copy. Please copy it manually.');
    }
  };

  useEffect(() => {
    if (bizProfile) {
      setForm({
        businessName: bizProfile.businessName || '',
        description:  bizProfile.description  || '',
        website:      bizProfile.website       || '',
        phoneNumber:  bizProfile.phoneNumber   || '',
        contactEmail: bizProfile.contactEmail  || '',
        address:      bizProfile.address       || '',
        country:      bizProfile.country       || '',
        category:     bizProfile.category      || '',
        logoUrl:      bizProfile.logoUrl        || '',
        coverPhotoUrl: bizProfile.coverPhotoUrl   || '',
        adAccentColor: bizProfile.adAccentColor   || '',
      });
    }
  }, [bizProfile]);

  const updateMutation = useMutation({
    mutationFn: (data) => businessApi.update(data),
    onSuccess: () => {
      toast.success('Business profile updated');
      refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (e) => toast.error(e.message),
  });

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
  const isValidHex = (v) => v === '' || HEX_RE.test(v);

  const kybMeta = KYB_STATUS_META[bizProfile?.kybStatus || 'UNVERIFIED'];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-[var(--sn-text)]">Business Settings</h1>
        <p className="text-sm text-[var(--sn-text-muted)] mt-1">Update your business profile and contact information.</p>
      </div>

      {/* Account info */}
      <Card className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--sn-purple-subtle)] border border-[var(--sn-purple)] flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-[var(--sn-purple)]" />
          </div>
          <div>
            <p className="text-base font-bold text-[var(--sn-text)]">{bizProfile?.businessName || 'Your Business'}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[var(--sn-text-muted)] az-mono">{bizProfile?.bizId}</span>
              <Badge color={kybMeta.color} bg={kybMeta.bg}>{kybMeta.label}</Badge>
            </div>
          </div>
        </div>
        <div className="pt-2 border-t border-[var(--sn-border)]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[var(--sn-text-muted)] mb-1">Signed in as</p>
              <p className="text-sm text-[var(--sn-text)]">{user?.username}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--sn-text-muted)] mb-1">Email</p>
              <p className="text-sm text-[var(--sn-text)]">{user?.email}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Public profile preview */}
      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[var(--sn-text)]">Public Profile</p>
            <p className="text-xs text-[var(--sn-text-muted)] mt-1">This is how customers find you in the Azaman app.</p>
          </div>
          {bizProfile?.isVerified && (
            <span className="flex items-center gap-1 text-xs font-semibold text-[var(--sn-purple)]">
              <BadgeCheck className="w-4 h-4" /> Verified
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--az-black)] border border-[var(--sn-border)]">
          <div className="min-w-0">
            <p className="text-xs text-[var(--sn-text-muted)] mb-0.5">Your BIZ ID</p>
            <p className="text-sm font-bold text-[var(--sn-text)] az-mono truncate">{bizProfile?.bizId || '—'}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={copyBizId} className="flex-shrink-0">
            <Copy className="w-3.5 h-3.5" /> Copy
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-[var(--az-black)] border border-[var(--sn-border)]">
            <p className="text-xs text-[var(--sn-text-muted)] mb-0.5">Category</p>
            <p className="text-sm text-[var(--sn-text)]">{(bizProfile?.category || 'OTHER').replace(/_/g, ' ')}</p>
          </div>
          <div className="p-3 rounded-xl bg-[var(--az-black)] border border-[var(--sn-border)]">
            <p className="text-xs text-[var(--sn-text-muted)] mb-0.5">Lifetime Orders</p>
            <p className="text-sm text-[var(--sn-text)] az-mono">{bizProfile?.totalEscrows ?? 0}</p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => setShowPreview(true)}
          disabled={!bizProfile?.bizId}
          className="w-full"
        >
          <Eye className="w-4 h-4" /> View Public Profile
        </Button>
      </Card>

      {/* QR Codes */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <QrCode className="w-4 h-4 text-[var(--sn-purple)]" />
          <h3 className="text-sm font-bold text-[var(--sn-text)]">QR Codes</h3>
        </div>
        <p className="text-xs text-[var(--sn-text-muted)]">
          Let customers scan to open your business instantly in the Azaman app — no search needed.
        </p>

        {bizProfile?.bizId ? (
          <div className="space-y-3">
            {/* Business-level QR */}
            <QrCodePanel
              label={`${bizProfile?.businessName || 'Business'} — Main`}
              url={`azaman://business/${bizProfile.bizId}`}
            />

            {/* Per-location QRs */}
            {locs.filter(l => l.isActive).map(loc => (
              <QrCodePanel
                key={loc.id}
                label={`${loc.label} — Branch QR`}
                url={`azaman://business/${bizProfile.bizId}/location/${loc.id}`}
              />
            ))}

            {/* Per-table QRs */}
            {locs.filter(l => l.isActive).map(loc =>
              (loc.tables || []).filter(t => t.isActive).map(tbl => (
                <QrCodePanel
                  key={tbl.id}
                  label={`${loc.label} — ${tbl.label}`}
                  url={`azaman://business/${bizProfile.bizId}/table/${tbl.id}`}
                />
              ))
            )}
          </div>
        ) : (
          <p className="text-xs text-[var(--sn-text-muted)]">Your BIZ ID is not ready yet. QR codes will appear here once available.</p>
        )}
      </Card>

      {/* Edit form */}
      <Card className="space-y-5">
        <p className="text-sm font-bold text-[var(--sn-text)]">Business Information</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Business Name"
            value={form.businessName}
            onChange={set('businessName')}
            placeholder="Acme Ltd."
          />
          <Select
            label="Category"
            value={form.category}
            onChange={set('category')}
            options={CATEGORIES}
          />
        </div>

        <Textarea
          label="Description"
          value={form.description}
          onChange={set('description')}
          placeholder="Briefly describe what your business offers..."
          rows={3}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Website"       value={form.website}      onChange={set('website')}      placeholder="https://yoursite.com" />
          <Input label="Phone Number"  value={form.phoneNumber}   onChange={set('phoneNumber')}  placeholder="+233 20 000 0000" />
          <Input label="Contact Email" value={form.contactEmail}  onChange={set('contactEmail')} placeholder="contact@business.com" type="email" />
          <Input label="Country Code"  value={form.country}       onChange={set('country')}      placeholder="GH" maxLength={2} />
        </div>

        <Input label="Address" value={form.address} onChange={set('address')} placeholder="Business address" />
        <Input label="Logo URL (Cloudinary)" value={form.logoUrl} onChange={set('logoUrl')} placeholder="https://res.cloudinary.com/..." />

            {/* Cover Photo */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--sn-text-muted)]">Cover Photo</label>
              {form.coverPhotoUrl && (
                <img src={form.coverPhotoUrl} alt="Cover" className="w-full h-32 object-cover rounded-lg border border-[var(--sn-border)]" />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!validateImageFile(file)) return;
                    try {
                      const url = await uploadImageToCloudinary(file);
                      set({ coverPhotoUrl: url });
                    } catch (err) {
                      alert('Upload failed: ' + err.message);
                    }
                  };
                  input.click();
                }}
              >
                <ImagePlus className="w-4 h-4 mr-2" /> Upload Cover
              </Button>
              <Input label="" value={form.coverPhotoUrl} onChange={set('coverPhotoUrl')} placeholder="https://res.cloudinary.com/..." />
            </div>

            {/* Ad Appearance */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--sn-text-muted)] flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Ad Appearance
              </label>
              <p className="text-xs text-[var(--sn-text-muted)] -mt-1">
                Pick an accent color for your collapsed marketplace card. Leave blank to use the default color for your category.
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg border border-[var(--sn-border)] flex-shrink-0 overflow-hidden relative"
                  style={{ background: isValidHex(form.adAccentColor) && form.adAccentColor ? form.adAccentColor : 'var(--az-black)' }}
                >
                  <input
                    type="color"
                    value={isValidHex(form.adAccentColor) && form.adAccentColor ? form.adAccentColor : '#6C4CE0'}
                    onChange={(e) => setForm(f => ({ ...f, adAccentColor: e.target.value.toUpperCase() }))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Pick ad accent color"
                  />
                </div>
                <Input
                  label=""
                  value={form.adAccentColor}
                  onChange={(e) => setForm(f => ({ ...f, adAccentColor: e.target.value }))}
                  placeholder="#FFAA00"
                  maxLength={7}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setForm(f => ({ ...f, adAccentColor: '' }))}
                  disabled={!form.adAccentColor}
                  className="flex-shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </Button>
              </div>
              {!isValidHex(form.adAccentColor) && (
                <p className="text-xs text-[var(--sn-destructive,#e05555)]">
                  Enter a 6-digit hex color like #FFAA00, or leave it blank.
                </p>
              )}
            </div>

        <div className="flex items-center gap-3 pt-2">
          {saved && (
            <div className="flex items-center gap-2 text-xs text-[var(--sn-purple)]">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </div>
          )}
          <Button
            onClick={() => updateMutation.mutate(form)}
            loading={updateMutation.isPending}
            disabled={!isValidHex(form.adAccentColor)}
            className="ml-auto"
          >
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <div>
            <h3 className="text-sm font-bold text-[var(--sn-text)]">Penalty Policy</h3>
            <p className="text-xs text-[var(--sn-text-muted)] mt-1">
                Configure how no-shows are penalized for your business.
            </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label className="text-xs text-[var(--sn-text-muted)] font-semibold mb-1 block">Customer Penalty %</label>
                <input
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    value={penaltyPolicy?.customerPenaltyPct ? Number(penaltyPolicy.customerPenaltyPct) * 100 : 10}
                    onChange={(e) => setPenaltyPolicy({
                        ...penaltyPolicy,
                        customerPenaltyPct: Number(e.target.value) / 100,
                    })}
                    className="w-full rounded-lg border border-[var(--sn-border)] bg-[var(--az-black)] p-2 text-sm text-[var(--sn-text)] focus:border-[var(--sn-purple)] outline-none"
                />
            </div>
            <div>
                <label className="text-xs text-[var(--sn-text-muted)] font-semibold mb-1 block">Business Penalty %</label>
                <input
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    value={penaltyPolicy?.businessPenaltyPct ? Number(penaltyPolicy.businessPenaltyPct) * 100 : 10}
                    onChange={(e) => setPenaltyPolicy({
                        ...penaltyPolicy,
                        businessPenaltyPct: Number(e.target.value) / 100,
                    })}
                    className="w-full rounded-lg border border-[var(--sn-border)] bg-[var(--az-black)] p-2 text-sm text-[var(--sn-text)] focus:border-[var(--sn-purple)] outline-none"
                />
            </div>
            <div>
                <label className="text-xs text-[var(--sn-text-muted)] font-semibold mb-1 block">Grace Period (mins)</label>
                <input
                    type="number"
                    min="0"
                    step="5"
                    value={penaltyPolicy?.gracePeriodMins || 30}
                    onChange={(e) => setPenaltyPolicy({
                        ...penaltyPolicy,
                        gracePeriodMins: Number(e.target.value),
                    })}
                    className="w-full rounded-lg border border-[var(--sn-border)] bg-[var(--az-black)] p-2 text-sm text-[var(--sn-text)] focus:border-[var(--sn-purple)] outline-none"
                />
            </div>
        </div>
        <Button
            onClick={async () => {
                setPenaltyLoading(true);
                try {
                    await marketplaceApi.updatePenaltyPolicy(bizProfile.id, penaltyPolicy);
                    toast.success('Penalty policy updated.');
                } catch (e) {
                    toast.error(e.message);
                } finally {
                    setPenaltyLoading(false);
                }
            }}
            loading={penaltyLoading}
            variant="outline"
        >
            Save Penalty Policy
        </Button>
      </Card>

      <Card className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--sn-text)] flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[var(--sn-purple)]" />
            Payroll & Smart Routing
          </h3>
          <p className="text-xs text-[var(--sn-text-muted)] mt-1">
            Configure how payroll is disbursed to employees. Smart Routing allows employees to auto-split their salaries into USDC savings.
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--az-black)] border border-[var(--sn-border)]">
            <div>
              <p className="text-sm font-semibold text-[var(--sn-text)]">Allow Employee Smart Routing</p>
              <p className="text-xs text-[var(--sn-text-muted)]">Employees can define percentage splits (e.g. 80% checking, 20% savings)</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--az-black)] border border-[var(--sn-border)]">
            <div>
              <p className="text-sm font-semibold text-[var(--sn-text)]">Auto-Approve Time Off</p>
              <p className="text-xs text-[var(--sn-text-muted)]">Automatically approve requests &lt; 2 days</p>
            </div>
            <Switch />
          </div>
        </div>
      </Card>

      <PublicProfilePreview
        open={showPreview}
        onClose={() => setShowPreview(false)}
        bizId={bizProfile?.bizId}
      />
    </div>
  );
}
