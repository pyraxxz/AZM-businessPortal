import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kyb as kybApi } from '@/lib/api';
import { Card, Badge, Button, Input, Empty } from '@/components/ui';
import { KYB_STATUS_META } from '@/lib/utils';
import { FileCheck, Upload, CheckCircle2, Clock, XCircle, AlertCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadImageToCloudinary, isCloudinaryConfigured, validateImageFile } from '@/lib/cloudinary';

const DOC_TYPES = [
  { value: 'BUSINESS_REGISTRATION_CERT', label: 'Business Registration Certificate', desc: 'Official certificate from the Registrar General\'s Department' },
  { value: 'DIRECTOR_ID_FRONT',          label: 'Director\'s ID — Front',            desc: 'Ghana Card, Passport, or Driver\'s License (front side)' },
  { value: 'DIRECTOR_ID_BACK',           label: 'Director\'s ID — Back',             desc: 'Back of the same ID document' },
  { value: 'TAX_IDENTIFICATION',         label: 'Tax Identification Number (TIN)',   desc: 'GRA Tax certificate or TIN document' },
  { value: 'PROOF_OF_ADDRESS',           label: 'Proof of Address',                  desc: 'Utility bill or bank statement (last 3 months)' },
  { value: 'SELFIE_WITH_ID',             label: 'Selfie with ID',                    desc: 'A clear photo of the director holding their ID' },
];

function statusIcon(status) {
  if (status === 'APPROVED') return <CheckCircle2 className="w-4 h-4 text-[#00d97e]" />;
  if (status === 'REJECTED') return <XCircle className="w-4 h-4 text-[#f43f5e]" />;
  return <Clock className="w-4 h-4 text-[#f59e0b]" />;
}

export default function KYB() {
  const qc = useQueryClient();
  const [urls, setUrls] = useState({}); // { [docType]: url }
  const [expanded, setExpanded] = useState(null);
  const [uploadingType, setUploadingType] = useState(null);

  const handleFileUpload = async (documentType, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const invalid = validateImageFile(file);
    if (invalid) return toast.error(invalid);
    setUploadingType(documentType);
    try {
      const url = await uploadImageToCloudinary(file, 'azaman-kyb');
      setUrls(u => ({ ...u, [documentType]: url }));
      toast.success('Document uploaded — submit to send for review');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingType(null);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['kyb-status'],
    queryFn:  () => kybApi.status(),
  });

  const submitMutation = useMutation({
    mutationFn: (documents) => kybApi.submit(documents),
    onSuccess: (res) => {
      toast.success(`${res.documents?.length || 0} document${res.documents?.length !== 1 ? 's' : ''} submitted for review`);
      qc.invalidateQueries(['kyb-status']);
      setUrls({});
    },
    onError: (e) => toast.error(e.message),
  });

  const kybStatus   = data?.kybStatus || 'UNVERIFIED';
  const docs        = data?.documents || [];
  const kybMeta     = KYB_STATUS_META[kybStatus];

  // Map existing docs by type
  const docMap = {};
  docs.forEach(d => { docMap[d.documentType] = d; });

  const handleSubmit = () => {
    const toSubmit = Object.entries(urls)
      .filter(([, url]) => url.trim())
      .map(([documentType, documentUrl]) => ({ documentType, documentUrl: documentUrl.trim() }));

    if (toSubmit.length === 0) {
      toast.error('Please enter at least one document URL to submit.');
      return;
    }
    submitMutation.mutate(toSubmit);
  };

  const anyNew = Object.values(urls).some(u => u.trim());

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#e8e8f0]">Business Verification</h1>
        <p className="text-sm text-[#7b7b9a] mt-1">Upload your documents to verify your business and unlock full access.</p>
      </div>

      {/* Status card */}
      <Card>
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: kybMeta.bg, border: `1px solid ${kybMeta.color}40` }}
          >
            <FileCheck className="w-6 h-6" style={{ color: kybMeta.color }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <p className="text-base font-bold text-[#e8e8f0]">Verification Status</p>
              <Badge color={kybMeta.color} bg={kybMeta.bg}>{kybMeta.label}</Badge>
            </div>
            <p className="text-sm text-[#7b7b9a]">
              {kybStatus === 'UNVERIFIED' && 'Submit your documents below to start the verification process.'}
              {kybStatus === 'PENDING'    && 'Your documents are being reviewed. This usually takes 24–48 hours.'}
              {kybStatus === 'VERIFIED'   && 'Your business is verified. You can now receive orders publicly.'}
              {kybStatus === 'REJECTED'   && 'Some documents were rejected. Review the feedback below and resubmit.'}
            </p>
          </div>
        </div>
      </Card>

      {/* Verified — full green state */}
      {kybStatus === 'VERIFIED' && (
        <Card className="flex flex-col items-center py-10 gap-4">
          <div className="w-16 h-16 rounded-full bg-[#00d97e1a] border border-[#00d97e40] flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-[#00d97e]" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[#00d97e]">Business Verified</p>
            <p className="text-sm text-[#7b7b9a] mt-1 max-w-xs">
              All your documents have been approved. Your business listing is publicly visible.
            </p>
          </div>
        </Card>
      )}

      {/* Document list + upload */}
      {kybStatus !== 'VERIFIED' && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#4a4a6a] uppercase tracking-wider">Required Documents</p>

          {DOC_TYPES.map(({ value, label, desc }) => {
            const existing = docMap[value];
            const isExpanded = expanded === value;

            return (
              <Card key={value} className="p-0 overflow-hidden">
                {/* Row header */}
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#0f0f17] transition-colors text-left"
                  onClick={() => setExpanded(isExpanded ? null : value)}
                >
                  <div className="flex-shrink-0">
                    {existing ? statusIcon(existing.status) : (
                      <div className="w-4 h-4 rounded-full border-2 border-[#2a2a3e]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#e8e8f0]">{label}</p>
                    <p className="text-xs text-[#4a4a6a] mt-0.5">{desc}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {existing && (
                      <Badge
                        color={existing.status === 'APPROVED' ? '#00d97e' : existing.status === 'REJECTED' ? '#f43f5e' : '#f59e0b'}
                        bg={existing.status === 'APPROVED' ? '#00d97e1a' : existing.status === 'REJECTED' ? '#f43f5e1a' : '#f59e0b1a'}
                      >
                        {existing.status}
                      </Badge>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[#4a4a6a]" /> : <ChevronDown className="w-4 h-4 text-[#4a4a6a]" />}
                  </div>
                </button>

                {/* Expanded — URL input */}
                {isExpanded && (
                  <div className="px-5 pb-4 border-t border-[#1e1e2e]">
                    <div className="pt-4 space-y-3">
                      {existing?.status === 'APPROVED' ? (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-[#00d97e1a] border border-[#00d97e30]">
                          <CheckCircle2 className="w-4 h-4 text-[#00d97e]" />
                          <p className="text-xs text-[#00d97e]">This document has been approved and cannot be replaced.</p>
                        </div>
                      ) : (
                        <>
                          {existing?.status === 'REJECTED' && existing.reviewNotes && (
                            <div className="flex items-start gap-2 p-3 rounded-xl bg-[#f43f5e1a] border border-[#f43f5e30]">
                              <AlertCircle className="w-4 h-4 text-[#f43f5e] flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold text-[#f43f5e]">Rejection reason:</p>
                                <p className="text-xs text-[#f43f5e] mt-0.5">{existing.reviewNotes}</p>
                              </div>
                            </div>
                          )}
                          {isCloudinaryConfigured() && (
                            <div className="flex items-center gap-3">
                              <label className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${uploadingType === value ? 'opacity-60 border-[#2a2a3e] text-[#4a4a6a]' : 'cursor-pointer border-[#00d97e40] text-[#00d97e] hover:bg-[#00d97e10]'}`}>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  onChange={(e) => handleFileUpload(value, e)}
                                  disabled={uploadingType === value}
                                  className="hidden"
                                />
                                {uploadingType === value
                                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
                                  : <><Upload className="w-3.5 h-3.5" /> Upload File</>
                                }
                              </label>
                              {urls[value] && uploadingType !== value && (
                                <span className="flex items-center gap-1 text-xs text-[#00d97e]">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready to submit
                                </span>
                              )}
                            </div>
                          )}
                          <Input
                            label="Cloudinary Document URL"
                            placeholder="https://res.cloudinary.com/your-cloud/image/upload/..."
                            value={urls[value] || ''}
                            onChange={e => setUrls(u => ({ ...u, [value]: e.target.value }))}
                          />
                          <p className="text-xs text-[#4a4a6a]">
                            {isCloudinaryConfigured()
                              ? 'Upload an image directly, or paste a Cloudinary URL (e.g. for PDFs).'
                              : 'Upload your document to Cloudinary first, then paste the URL here.'}
                          </p>
                          {existing?.status === 'REJECTED' && (urls[value] || '').trim() && (
                            <Button
                              size="sm"
                              onClick={() => submitMutation.mutate([{ documentType: value, documentUrl: urls[value].trim() }])}
                              loading={submitMutation.isPending}
                            >
                              <Upload className="w-3.5 h-3.5" /> Re-submit this document
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          {/* Submit */}
          {anyNew && (
            <div className="flex justify-end pt-2">
              <Button onClick={handleSubmit} loading={submitMutation.isPending}>
                <Upload className="w-4 h-4" /> Submit Documents
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
