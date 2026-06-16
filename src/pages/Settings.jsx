import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { business as businessApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { Card, Button, Input, Textarea, Select, Badge } from '@/components/ui';
import { KYB_STATUS_META } from '@/lib/utils';
import { Building2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
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
    </div>
  );
}
