import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { business as businessApi, locations as locApi } from '@/lib/api';
import { marketplaceApi } from '@/lib/marketplaceApi';
import { useAuth } from '@/lib/AuthContext';
import { Card, Button, Input, Textarea, Select, Badge } from '@/components/ui';
import { KYB_STATUS_META } from '@/lib/utils';
import { Building2, Save, CheckCircle2, Copy, Eye, BadgeCheck, QrCode } from 'lucide-react';
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

  const kybMeta = KYB_STATUS_META[bizProfile?.kybStatus || 'UNVERIFIED'];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-[#e8e8f0]">Business Settings</h1>
        <p className="text-sm text-[#7b7b9a] mt-1">Update your business profile and contact information.</p>
      </div>

      {/* Account info */}
      <Card className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#00d97e1a] border border-[#00d97e35] flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-[#00d97e]" />
          </div>
          <div>
            <p className="text-base font-bold text-[#e8e8f0]">{bizProfile?.businessName || 'Your Business'}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[#4a4a6a] az-mono">{bizProfile?.bizId}</span>
              <Badge color={kybMeta.color} bg={kybMeta.bg}>{kybMeta.label}</Badge>
            </div>
          </div>
        </div>
        <div className="pt-2 border-t border-[#1e1e2e]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#4a4a6a] mb-1">Signed in as</p>
              <p className="text-sm text-[#e8e8f0]">{user?.username}</p>
            </div>
            <div>
              <p className="text-xs text-[#4a4a6a] mb-1">Email</p>
              <p className="text-sm text-[#e8e8f0]">{user?.email}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Public profile preview */}
      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#e8e8f0]">Public Profile</p>
            <p className="text-xs text-[#7b7b9a] mt-1">This is how customers find you in the Azaman app.</p>
          </div>
          {bizProfile?.isVerified && (
            <span className="flex items-center gap-1 text-xs font-semibold text-[#00d97e]">
              <BadgeCheck className="w-4 h-4" /> Verified
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#0f0f17] border border-[#2a2a3e]">
          <div className="min-w-0">
            <p className="text-xs text-[#4a4a6a] mb-0.5">Your BIZ ID</p>
            <p className="text-sm font-bold text-[#e8e8f0] az-mono truncate">{bizProfile?.bizId || '—'}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={copyBizId} className="flex-shrink-0">
            <Copy className="w-3.5 h-3.5" /> Copy
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-[#0f0f17] border border-[#2a2a3e]">
            <p className="text-xs text-[#4a4a6a] mb-0.5">Category</p>
            <p className="text-sm text-[#e8e8f0]">{(bizProfile?.category || 'OTHER').replace(/_/g, ' ')}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#0f0f17] border border-[#2a2a3e]">
            <p className="text-xs text-[#4a4a6a] mb-0.5">Lifetime Orders</p>
            <p className="text-sm text-[#e8e8f0] az-mono">{bizProfile?.totalEscrows ?? 0}</p>
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
          <QrCode className="w-4 h-4 text-[#00d97e]" />
          <h3 className="text-sm font-bold text-[#e8e8f0]">QR Codes</h3>
        </div>
        <p className="text-xs text-[#7b7b9a]">
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
          <p className="text-xs text-[#4a4a6a]">Your BIZ ID is not ready yet. QR codes will appear here once available.</p>
        )}
      </Card>

      {/* Edit form */}
      <Card className="space-y-5">
        <p className="text-sm font-bold text-[#e8e8f0]">Business Information</p>

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

        <div className="flex items-center gap-3 pt-2">
          {saved && (
            <div className="flex items-center gap-2 text-xs text-[#00d97e]">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </div>
          )}
          <Button
            onClick={() => updateMutation.mutate(form)}
            loading={updateMutation.isPending}
            className="ml-auto"
          >
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <div>
            <h3 className="text-sm font-bold text-[#e8e8f0]">Penalty Policy</h3>
            <p className="text-xs text-[#7b7b9a] mt-1">
                Configure how no-shows are penalized for your business.
            </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label className="text-xs text-[#7b7b9a] font-semibold mb-1 block">Customer Penalty %</label>
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
                    className="w-full rounded-lg border border-[#252535] bg-[#0a0a0f] p-2 text-sm text-[#e8e8f0] focus:border-[#00d97e] outline-none"
                />
            </div>
            <div>
                <label className="text-xs text-[#7b7b9a] font-semibold mb-1 block">Business Penalty %</label>
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
                    className="w-full rounded-lg border border-[#252535] bg-[#0a0a0f] p-2 text-sm text-[#e8e8f0] focus:border-[#00d97e] outline-none"
                />
            </div>
            <div>
                <label className="text-xs text-[#7b7b9a] font-semibold mb-1 block">Grace Period (mins)</label>
                <input
                    type="number"
                    min="0"
                    step="5"
                    value={penaltyPolicy?.gracePeriodMins || 30}
                    onChange={(e) => setPenaltyPolicy({
                        ...penaltyPolicy,
                        gracePeriodMins: Number(e.target.value),
                    })}
                    className="w-full rounded-lg border border-[#252535] bg-[#0a0a0f] p-2 text-sm text-[#e8e8f0] focus:border-[#00d97e] outline-none"
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

      <PublicProfilePreview
        open={showPreview}
        onClose={() => setShowPreview(false)}
        bizId={bizProfile?.bizId}
      />
    </div>
  );
}
