import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { request } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hotel, ShoppingBag, Bus, Utensils, Building2,
  ArrowRight, ArrowLeft, CheckCircle2, MapPin,
  Globe, Phone, FileText, Store, ChevronRight
} from 'lucide-react';

const BUSINESS_TYPES = [
  { value: 'hotel', label: 'Hotel & Accommodation', icon: Hotel, desc: 'Rooms, bookings, front desk & housekeeping', color: '#6C4FD1' },
  { value: 'restaurant', label: 'Restaurant & Food', icon: Utensils, desc: 'Tables, kitchen, dine-in & delivery', color: '#E2A33D' },
  { value: 'transit', label: 'Transport & Transit', icon: Bus, desc: 'Fleet, trips, drivers & cargo', color: '#3D74DB' },
  { value: 'retail', label: 'Retail & Commerce', icon: ShoppingBag, desc: 'Products, orders, inventory & invoices', color: '#1FA37A' },
  { value: 'general', label: 'General Business', icon: Building2, desc: 'Services, bookings & customer management', color: '#E15361' },
];

const STEPS = ['Business Type', 'Basic Info', 'Location', 'Review'];

export default function Onboarding() {
  const { refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    businessType: '',
    businessName: '',
    tagline: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    region: '',
    country: 'Ghana',
    description: '',
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await request('POST', '/api/business/onboard', form);
      await refreshProfile?.();
      toast({ type: 'success', title: 'Business created!', message: 'Welcome to the portal.' });
      navigate('/');
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: err.message || 'Failed to create business.' });
    } finally {
      setLoading(false);
    }
  };

  const canNext = () => {
    if (step === 0) return !!form.businessType;
    if (step === 1) return form.businessName.trim().length >= 2;
    if (step === 2) return form.city.trim().length >= 2;
    return true;
  };

  const selectedType = BUSINESS_TYPES.find(t => t.value === form.businessType);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--az-bg)' }}>
      <div className="w-full max-w-[560px]">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'var(--az-accent-subtle)', color: 'var(--az-accent)', border: '1px solid var(--az-accent-border)' }}>
            <Store className="w-3.5 h-3.5" /> Setting up your business
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--az-text)' }}>
            Let's get you set up
          </h1>
          <p className="text-sm" style={{ color: 'var(--az-text-secondary)' }}>
            Takes about 2 minutes. You can always update this later.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: i < step ? 'var(--az-success)' : i === step ? 'var(--az-accent)' : 'var(--az-border)',
                    color: i <= step ? '#fff' : 'var(--az-text-muted)'
                  }}>
                  {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                </div>
                {i === step && (
                  <span className="text-xs font-semibold hidden sm:block" style={{ color: 'var(--az-text)' }}>{s}</span>
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-8 h-px" style={{ background: i < step ? 'var(--az-success)' : 'var(--az-border)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="rounded-2xl p-8"
          style={{ background: 'var(--az-surface-solid)', border: '1px solid var(--az-border)' }}>
          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}>

              {/* Step 0: Business Type */}
              {step === 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--az-text)' }}>What type of business do you run?</h2>
                  <p className="text-sm mb-6" style={{ color: 'var(--az-text-secondary)' }}>
                    This helps us show the most relevant tools for your business.
                  </p>
                  <div className="space-y-3">
                    {BUSINESS_TYPES.map(type => (
                      <button key={type.value} onClick={() => set('businessType', type.value)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all"
                        style={{
                          background: form.businessType === type.value ? `${type.color}12` : 'var(--az-bg-alt)',
                          border: `1.5px solid ${form.businessType === type.value ? type.color + '50' : 'var(--az-border)'}`,
                        }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${type.color}18` }}>
                          <type.icon className="w-5 h-5" style={{ color: type.color }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold" style={{ color: 'var(--az-text)' }}>{type.label}</p>
                          <p className="text-xs" style={{ color: 'var(--az-text-muted)' }}>{type.desc}</p>
                        </div>
                        {form.businessType === type.value && (
                          <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: type.color }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div>
                  <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--az-text)' }}>Business details</h2>
                  <p className="text-sm mb-6" style={{ color: 'var(--az-text-secondary)' }}>
                    How should customers know your business?
                  </p>
                  <div className="space-y-4">
                    {[
                      { key: 'businessName', label: 'Business Name *', placeholder: 'e.g. Accra Grand Hotel', type: 'text' },
                      { key: 'tagline', label: 'Tagline', placeholder: 'A short memorable phrase', type: 'text' },
                      { key: 'phone', label: 'Phone Number', placeholder: '+233 XX XXX XXXX', type: 'tel' },
                      { key: 'website', label: 'Website', placeholder: 'https://yourbusiness.com', type: 'url' },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                          style={{ color: 'var(--az-text-secondary)' }}>{field.label}</label>
                        <input type={field.type} value={form[field.key]}
                          onChange={e => set(field.key, e.target.value)} placeholder={field.placeholder}
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                          style={{ background: 'var(--az-bg-alt)', border: '1.5px solid var(--az-border)', color: 'var(--az-text)' }}
                          onFocus={e => e.target.style.borderColor = 'var(--az-accent)'}
                          onBlur={e => e.target.style.borderColor = 'var(--az-border)'} />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                        style={{ color: 'var(--az-text-secondary)' }}>Business Description</label>
                      <textarea value={form.description} onChange={e => set('description', e.target.value)}
                        placeholder="Tell customers what makes you special..." rows={3}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
                        style={{ background: 'var(--az-bg-alt)', border: '1.5px solid var(--az-border)', color: 'var(--az-text)' }}
                        onFocus={e => e.target.style.borderColor = 'var(--az-accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--az-border)'} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Location */}
              {step === 2 && (
                <div>
                  <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--az-text)' }}>Where are you located?</h2>
                  <p className="text-sm mb-6" style={{ color: 'var(--az-text-secondary)' }}>
                    Customers will use this to find you on the marketplace.
                  </p>
                  <div className="space-y-4">
                    {[
                      { key: 'address', label: 'Street Address', placeholder: '12 Independence Ave', icon: MapPin },
                      { key: 'city', label: 'City *', placeholder: 'Accra', icon: Building2 },
                      { key: 'region', label: 'Region', placeholder: 'Greater Accra', icon: Globe },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                          style={{ color: 'var(--az-text-secondary)' }}>{field.label}</label>
                        <div className="relative">
                          <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--az-text-muted)' }} />
                          <input type="text" value={form[field.key]}
                            onChange={e => set(field.key, e.target.value)} placeholder={field.placeholder}
                            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                            style={{ background: 'var(--az-bg-alt)', border: '1.5px solid var(--az-border)', color: 'var(--az-text)' }}
                            onFocus={e => e.target.style.borderColor = 'var(--az-accent)'}
                            onBlur={e => e.target.style.borderColor = 'var(--az-border)'} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <div>
                  <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--az-text)' }}>Ready to launch?</h2>
                  <p className="text-sm mb-6" style={{ color: 'var(--az-text-secondary)' }}>Review your business details before going live.</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Business Type', value: selectedType?.label, icon: selectedType?.icon },
                      { label: 'Business Name', value: form.businessName },
                      { label: 'Tagline', value: form.tagline || '—' },
                      { label: 'Phone', value: form.phone || '—' },
                      { label: 'Location', value: [form.address, form.city, form.region].filter(Boolean).join(', ') || '—' },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: 'var(--az-bg-alt)' }}>
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--az-text-muted)' }}>{label}</span>
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className="w-3.5 h-3.5" style={{ color: 'var(--az-text-secondary)' }} />}
                          <span className="text-sm font-medium" style={{ color: 'var(--az-text)' }}>{value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
            style={{ background: 'var(--az-surface-solid)', border: '1px solid var(--az-border)', color: 'var(--az-text)' }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
              style={{ background: 'var(--az-accent)', color: '#fff' }}>
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'var(--az-success)', color: '#fff' }}>
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</> : <>Launch Business <ArrowRight className="w-4 h-4" /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
