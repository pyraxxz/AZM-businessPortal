import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { request } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle2, Clock, AlertTriangle, Upload,
  FileText, Building2, User, CreditCard, ArrowRight,
  ChevronRight, Lock, Eye, BadgeCheck, XCircle
} from 'lucide-react';
import { KYB_STATUS_META, cn } from '@/lib/utils';

const STATUS_CONFIGS = {
  UNVERIFIED: {
    icon: AlertTriangle, color: '#E2A33D', bg: 'rgba(226,163,61,0.1)',
    title: 'Verification Required',
    message: "Your business hasn't been verified yet. Complete KYB to unlock all features."
  },
  PENDING: {
    icon: Clock, color: '#3D74DB', bg: 'rgba(61,116,219,0.1)',
    title: 'Verification In Progress',
    message: "We're reviewing your documents. This typically takes 1-2 business days."
  },
  VERIFIED: {
    icon: BadgeCheck, color: '#1FA37A', bg: 'rgba(31,163,122,0.1)',
    title: 'Business Verified',
    message: 'Your business is fully verified. All features are unlocked.'
  },
  REJECTED: {
    icon: XCircle, color: '#E15361', bg: 'rgba(225,83,97,0.1)',
    title: 'Verification Rejected',
    message: 'Your documents were not accepted. Please re-submit with the correct documents.'
  },
};

const STEPS = ['Business Info', 'ID Documents', 'Business Proof', 'Submit'];
const REQUIRED_DOCS = [
  { key: 'businessRegDoc', label: 'Business Registration Certificate', desc: 'Official certificate of incorporation or registration', icon: FileText },
  { key: 'taxDoc', label: 'Tax Identification Document', desc: 'TIN certificate or equivalent', icon: CreditCard },
  { key: 'ownerIdDoc', label: "Owner's National ID", desc: "Ghana Card, Passport or Driver's License", icon: User },
  { key: 'addressProof', label: 'Proof of Business Address', desc: 'Utility bill or bank statement (not older than 3 months)', icon: Building2 },
];

export default function KYB() {
  const { bizProfile } = useAuth();
  const { toast } = useToast();

  const kybStatus = bizProfile?.kybStatus || 'UNVERIFIED';
  const statusConfig = STATUS_CONFIGS[kybStatus] || STATUS_CONFIGS.UNVERIFIED;
  const StatusIcon = statusConfig.icon;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploads, setUploads] = useState({});
  const [uploading, setUploading] = useState({});
  const [form, setForm] = useState({
    legalBusinessName: bizProfile?.businessName || '',
    registrationNumber: '',
    taxId: '',
    ownerName: '',
    ownerDob: '',
    ownerNationality: 'Ghanaian',
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleUpload = async (key, file) => {
    if (!file) return;
    setUploading(prev => ({ ...prev, [key]: true }));
    try {
      const url = await uploadImageToCloudinary(file);
      setUploads(prev => ({ ...prev, [key]: url }));
      toast({ type: 'success', title: 'Uploaded', message: `${key} uploaded successfully.` });
    } catch {
      toast({ type: 'error', title: 'Upload failed', message: 'Please try again.' });
    } finally {
      setUploading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await request('POST', '/api/business/kyb/submit', { ...form, documents: uploads });
      toast({ type: 'success', title: 'Submitted!', message: 'Your KYB is under review.' });
    } catch (err) {
      toast({ type: 'error', title: 'Error', message: err.message || 'Submission failed.' });
    } finally {
      setLoading(false);
    }
  };

  if (kybStatus === 'VERIFIED') {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-10 text-center"
          style={{ background: 'var(--az-surface-solid)', border: '1px solid var(--az-border)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'var(--az-success-subtle)' }}>
            <BadgeCheck className="w-10 h-10" style={{ color: 'var(--az-success)' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--az-text)' }}>Business Verified</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--az-text-secondary)' }}>
            Your business has been fully verified. You have access to all features including payments, promotions, and marketplace listing.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {['Payments', 'Marketplace', 'Promotions'].map(f => (
              <div key={f} className="p-3 rounded-xl text-center"
                style={{ background: 'var(--az-success-subtle)' }}>
                <CheckCircle2 className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--az-success)' }} />
                <p className="text-xs font-medium" style={{ color: 'var(--az-success)' }}>{f}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (kybStatus === 'PENDING') {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-10 text-center"
          style={{ background: 'var(--az-surface-solid)', border: '1px solid var(--az-border)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(61,116,219,0.1)' }}>
            <Clock className="w-10 h-10" style={{ color: '#3D74DB' }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--az-text)' }}>Under Review</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--az-text-secondary)' }}>
            Your documents are being reviewed by our team. This typically takes 1-2 business days. You'll be notified once the review is complete.
          </p>
          <div className="p-4 rounded-xl text-left" style={{ background: 'rgba(61,116,219,0.08)', border: '1px solid rgba(61,116,219,0.2)' }}>
            <p className="text-xs font-semibold" style={{ color: '#3D74DB' }}>What happens next?</p>
            <ul className="mt-2 space-y-1">
              {['Our compliance team reviews your documents', 'You receive a notification with the decision', 'If approved, all features unlock instantly'].map(s => (
                <li key={s} className="flex items-start gap-2 text-xs" style={{ color: 'var(--az-text-secondary)' }}>
                  <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#3D74DB' }} />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Status Banner */}
      {kybStatus === 'REJECTED' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-start gap-3 p-4 rounded-xl mb-8"
          style={{ background: 'var(--az-danger-subtle)', border: '1px solid rgba(225,83,97,0.2)' }}>
          <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--az-danger)' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--az-danger)' }}>Previous submission rejected</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--az-text-secondary)' }}>
              Please re-submit your documents. Ensure they are clear, valid, and not expired.
            </p>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--az-accent-subtle)', border: '1px solid var(--az-accent-border)' }}>
            <Shield className="w-5 h-5" style={{ color: 'var(--az-accent)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--az-text)' }}>Business Verification</h1>
            <p className="text-sm" style={{ color: 'var(--az-text-secondary)' }}>KYB — Know Your Business</p>
          </div>
        </div>
        <p className="text-sm" style={{ color: 'var(--az-text-secondary)' }}>
          Verification unlocks payments, marketplace listing, and all premium features. Your information is encrypted and secure.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: i < step ? 'var(--az-success)' : i === step ? 'var(--az-accent)' : 'var(--az-border)',
                  color: i <= step ? '#fff' : 'var(--az-text-muted)'
                }}>
                {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={cn('text-xs font-medium', i === step ? 'text-az-text' : 'text-az-text-muted')}>
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="w-6 h-px" style={{ background: 'var(--az-border)' }} />}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-2xl p-8"
        style={{ background: 'var(--az-surface-solid)', border: '1px solid var(--az-border)' }}>
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}>

            {step === 0 && (
              <div>
                <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--az-text)' }}>Business Information</h3>
                <p className="text-sm mb-6" style={{ color: 'var(--az-text-secondary)' }}>Provide your official business registration details.</p>
                <div className="space-y-4">
                  {[
                    { key: 'legalBusinessName', label: 'Legal Business Name *', placeholder: 'As on registration certificate' },
                    { key: 'registrationNumber', label: 'Business Registration Number *', placeholder: 'e.g. CS-12345' },
                    { key: 'taxId', label: 'Tax Identification Number (TIN)', placeholder: 'e.g. C0000000000' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                        style={{ color: 'var(--az-text-secondary)' }}>{f.label}</label>
                      <input value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                        placeholder={f.placeholder} className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                        style={{ background: 'var(--az-bg-alt)', border: '1.5px solid var(--az-border)', color: 'var(--az-text)' }}
                        onFocus={e => e.target.style.borderColor = 'var(--az-accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--az-border)'} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--az-text)' }}>Owner Identity</h3>
                <p className="text-sm mb-6" style={{ color: 'var(--az-text-secondary)' }}>Information about the primary business owner.</p>
                <div className="space-y-4">
                  {[
                    { key: 'ownerName', label: "Owner's Full Name *", placeholder: 'As on national ID' },
                    { key: 'ownerDob', label: 'Date of Birth', type: 'date' },
                    { key: 'ownerNationality', label: 'Nationality', placeholder: 'Ghanaian' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                        style={{ color: 'var(--az-text-secondary)' }}>{f.label}</label>
                      <input type={f.type || 'text'} value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                        placeholder={f.placeholder} className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                        style={{ background: 'var(--az-bg-alt)', border: '1.5px solid var(--az-border)', color: 'var(--az-text)' }}
                        onFocus={e => e.target.style.borderColor = 'var(--az-accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--az-border)'} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--az-text)' }}>Document Upload</h3>
                <p className="text-sm mb-6" style={{ color: 'var(--az-text-secondary)' }}>
                  Upload clear photos or scans. Accepted formats: JPG, PNG, PDF.
                </p>
                <div className="space-y-4">
                  {REQUIRED_DOCS.map(doc => (
                    <div key={doc.key} className="p-4 rounded-xl"
                      style={{ background: 'var(--az-bg-alt)', border: '1px solid var(--az-border)' }}>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'var(--az-accent-subtle)' }}>
                          <doc.icon className="w-4.5 h-4.5" style={{ color: 'var(--az-accent)' }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--az-text)' }}>{doc.label}</p>
                          <p className="text-xs mb-3" style={{ color: 'var(--az-text-muted)' }}>{doc.desc}</p>
                          {uploads[doc.key] ? (
                            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--az-success)' }}>
                              <CheckCircle2 className="w-4 h-4" />
                              Uploaded successfully
                              <button onClick={() => setUploads(prev => { const n = { ...prev }; delete n[doc.key]; return n; })}
                                className="ml-auto text-xs px-2 py-1 rounded"
                                style={{ color: 'var(--az-danger)', background: 'var(--az-danger-subtle)' }}>
                                Remove
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center gap-2 cursor-pointer text-xs px-3 py-2 rounded-lg w-fit transition-all"
                              style={{ background: 'var(--az-accent-subtle)', color: 'var(--az-accent)', border: '1px solid var(--az-accent-border)' }}>
                              {uploading[doc.key] ? (
                                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              {uploading[doc.key] ? 'Uploading...' : 'Upload Document'}
                              <input type="file" className="hidden" accept="image/*,.pdf"
                                onChange={e => handleUpload(doc.key, e.target.files[0])} />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--az-text)' }}>Ready to Submit</h3>
                <p className="text-sm mb-6" style={{ color: 'var(--az-text-secondary)' }}>
                  Please review your information before submitting for verification.
                </p>
                <div className="space-y-3 mb-6">
                  {[
                    ['Legal Name', form.legalBusinessName],
                    ['Reg. Number', form.registrationNumber],
                    ['TIN', form.taxId || '—'],
                    ['Owner', form.ownerName],
                    ['Documents', `${Object.keys(uploads).length} / ${REQUIRED_DOCS.length} uploaded`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: 'var(--az-bg-alt)' }}>
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--az-text-muted)' }}>{label}</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--az-text)' }}>{value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: 'var(--az-accent-subtle)', border: '1px solid var(--az-accent-border)' }}>
                  <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--az-accent)' }} />
                  <p className="text-xs" style={{ color: 'var(--az-text-secondary)' }}>
                    Your documents are encrypted and only accessible to our compliance team. We never share your personal data with third parties.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
          style={{ background: 'var(--az-surface-solid)', border: '1px solid var(--az-border)', color: 'var(--az-text)' }}>
          Back
        </button>
        {step < 3 ? (
          <button onClick={() => setStep(s => s + 1)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--az-accent)', color: '#fff' }}>
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--az-accent)', color: '#fff' }}>
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</> : <>Submit for Review <ArrowRight className="w-4 h-4" /></>}
          </button>
        )}
      </div>
    </div>
  );
}
