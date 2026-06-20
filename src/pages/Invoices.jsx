import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoices as invoicesApi, locations as locApi } from '@/lib/api';
import { Card, Badge, Button, Input, Textarea, Select, Empty, Skeleton, Modal } from '@/components/ui';
import { fmtUSDC, fmt, formatDateTime, relativeTime } from '@/lib/utils';
import {
  Receipt, Plus, Search, X, Trash2, Eye, Send, Ban,
  User, MapPin, Star, AlertCircle, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Invoice status display config ───────────────────────────────────────────
const INVOICE_STATUS_META = {
  DRAFT:  { label: 'Draft',  color: '#7b7b9a', bg: '#7b7b9a1a' },
  SENT:   { label: 'Sent',   color: '#4f8ef7', bg: '#4f8ef71a' },
  PAID:   { label: 'Paid',   color: '#00d97e', bg: '#00d97e1a' },
  VOIDED: { label: 'Voided', color: '#f43f5e', bg: '#f43f5e1a' },
};
const TABS = ['ALL', 'DRAFT', 'SENT', 'PAID', 'VOIDED'];

const initials = (name) => (name || '?').trim().charAt(0).toUpperCase();

// ════════════════════════════════════════════════════════════════════════════
export default function Invoices() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [detailId, setDetailId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['biz-invoices'],
    queryFn:  () => invoicesApi.list({ limit: 50 }),
  });
  const all = data?.invoices || [];

  const counts = useMemo(() => ({
    DRAFT:  all.filter(i => i.status === 'DRAFT').length,
    SENT:   all.filter(i => i.status === 'SENT').length,
    PAID:   all.filter(i => i.status === 'PAID').length,
    VOIDED: all.filter(i => i.status === 'VOIDED').length,
  }), [all]);

  const filtered = tab === 'ALL' ? all : all.filter(i => i.status === tab);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['biz-invoices'] });
    qc.invalidateQueries({ queryKey: ['biz-invoice'] });
    qc.invalidateQueries({ queryKey: ['dashboard-invoices'] });
  };

  const sendMut = useMutation({
    mutationFn: (id) => invoicesApi.send(id),
    onSuccess: () => { toast.success('Invoice sent to customer'); invalidate(); },
    onError:   (e) => toast.error(e.message),
  });

  const voidMut = useMutation({
    mutationFn: (id) => invoicesApi.void(id),
    onSuccess: () => { toast.success('Invoice voided'); invalidate(); },
    onError:   (e) => toast.error(e.message),
  });

  const onVoid = (id) => {
    if (confirm('This will cancel the invoice. The customer will be notified.')) voidMut.mutate(id);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-[#e8e8f0]">Invoices</h1>
          <p className="text-sm text-[#7b7b9a] mt-1">Create and track bills sent to your customers.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> New Invoice</Button>
      </div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-2">
        {['SENT','PAID','DRAFT','VOIDED'].map(s => {
          const meta = INVOICE_STATUS_META[s];
          return (
            <div key={s} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#13131e] border border-[#1e1e2e]">
              <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
              <span className="text-xs font-bold text-[#e8e8f0] az-mono">{fmt(counts[s], 0)}</span>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 border-b border-[#1e1e2e]">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-[#00d97e] text-[#00d97e]' : 'border-transparent text-[#4a4a6a] hover:text-[#7b7b9a]'
            }`}
          >
            {t === 'ALL' ? 'All' : INVOICE_STATUS_META[t].label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <Empty
          icon={Receipt}
          title={tab === 'ALL' ? 'No invoices yet' : `No ${INVOICE_STATUS_META[tab]?.label.toLowerCase()} invoices`}
          description="Create your first invoice to bill a customer instantly."
          action={tab === 'ALL' ? <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> New Invoice</Button> : null}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-[#1e1e2e]">
            {filtered.map(inv => {
              const meta = INVOICE_STATUS_META[inv.status] || INVOICE_STATUS_META.DRAFT;
              return (
                <div key={inv.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#0f0f17] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#e8e8f0] az-mono truncate">{inv.invoiceRef}</p>
                      <Badge color={meta.color} bg={meta.bg}>{meta.label}</Badge>
                    </div>
                    <p className="text-xs text-[#4a4a6a] mt-0.5 truncate">
                      {inv.customer?.username || 'Customer'}
                      {inv.location?.label && ` · ${inv.location.label}`}
                      {inv.table?.label && ` · ${inv.table.label}`}
                      {' · '}
                      {inv.status === 'PAID' && inv.paidAt ? `Paid ${relativeTime(inv.paidAt)}`
                        : inv.status === 'SENT' && inv.sentAt ? `Sent ${relativeTime(inv.sentAt)}`
                        : `Created ${relativeTime(inv.createdAt)}`}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-[#e8e8f0] az-mono flex-shrink-0">{fmtUSDC(inv.billTotalUsdc)}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="secondary" size="sm" onClick={() => setDetailId(inv.id)}>
                      <Eye className="w-3.5 h-3.5" /> View
                    </Button>
                    {inv.status === 'DRAFT' && (
                      <Button size="sm" onClick={() => sendMut.mutate(inv.id)} loading={sendMut.isPending && sendMut.variables === inv.id}>
                        <Send className="w-3.5 h-3.5" /> Send
                      </Button>
                    )}
                    {(inv.status === 'DRAFT' || inv.status === 'SENT') && (
                      <Button variant="danger" size="sm" onClick={() => onVoid(inv.id)}>
                        <Ban className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateInvoiceModal
          onClose={() => setShowCreate(false)}
          onCreated={(invoice) => { setShowCreate(false); invalidate(); setDetailId(invoice.id); }}
        />
      )}

      {/* Detail modal */}
      {detailId && (
        <InvoiceDetailModal
          invoiceId={detailId}
          onClose={() => setDetailId(null)}
          onSend={(id) => sendMut.mutate(id)}
          onVoid={onVoid}
          sending={sendMut.isPending}
          voiding={voidMut.isPending}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Customer lookup widget
function CustomerLookup({ customer, onSelect, onClear }) {
  const [azamanId, setAzamanId] = useState('');

  const lookupMut = useMutation({
    mutationFn: (id) => invoicesApi.lookupCustomer(id),
    onSuccess: (res) => onSelect(res.customer),
    onError:   () => toast.error('No user found with that AZM ID'),
  });

  const submit = () => {
    const id = azamanId.trim();
    if (!id.toUpperCase().startsWith('AZM-')) { toast.error('Enter a valid AZM ID (e.g. AZM-00123456).'); return; }
    lookupMut.mutate(id);
  };

  if (customer) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0f0f17] border border-[#00d97e30]">
        {customer.profilePictureUrl ? (
          <img src={customer.profilePictureUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#4f8ef71a] border border-[#4f8ef730] flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-[#4f8ef7]">{initials(customer.username)}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#e8e8f0] truncate">{customer.username}</p>
          <p className="text-xs text-[#4a4a6a] az-mono truncate">{customer.azamanId}</p>
        </div>
        <button onClick={onClear} className="p-1.5 rounded-lg hover:bg-[#1e1e2e] text-[#4a4a6a] hover:text-[#e8e8f0] transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <Input
          placeholder="Customer AZM ID, e.g. AZM-00123456"
          value={azamanId}
          onChange={e => setAzamanId(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
        />
      </div>
      <Button onClick={submit} loading={lookupMut.isPending} className="flex-shrink-0">
        <Search className="w-4 h-4" /> Find
      </Button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Create invoice modal
const BLANK_LINE = { description: '', quantity: '1', unitPrice: '' };
const BLANK_TAX  = { name: '', type: 'PERCENTAGE', value: '' };

function CreateInvoiceModal({ onClose, onCreated }) {
  const [customer, setCustomer] = useState(null);
  const [lineItems, setLineItems] = useState([{ ...BLANK_LINE }]);
  const [taxLines, setTaxLines] = useState([]);
  const [locationId, setLocationId] = useState('');
  const [tableId, setTableId] = useState('');
  const [businessNote, setBusinessNote] = useState('');

  const { data: locsData } = useQuery({
    queryKey: ['biz-locations'],
    queryFn:  () => locApi.list(),
  });
  const activeLocs = (locsData?.locations || []).filter(l => l.isActive);
  const selectedLoc = activeLocs.find(l => l.id === locationId);
  const tablesForLoc = selectedLoc?.tables || [];

  const createMut = useMutation({
    mutationFn: (payload) => invoicesApi.create(payload),
    onSuccess: (res) => { toast.success('Invoice created as draft'); onCreated(res.invoice); },
    onError:   (e) => toast.error(e.message),
  });

  // ── line item helpers ──
  const setLine = (i, key, val) => setLineItems(rows => rows.map((r, j) => j === i ? { ...r, [key]: val } : r));
  const addLine = () => setLineItems(rows => [...rows, { ...BLANK_LINE }]);
  const removeLine = (i) => setLineItems(rows => rows.length > 1 ? rows.filter((_, j) => j !== i) : rows);

  // ── tax helpers ──
  const setTax = (i, key, val) => setTaxLines(rows => rows.map((r, j) => j === i ? { ...r, [key]: val } : r));
  const addTax = () => setTaxLines(rows => [...rows, { ...BLANK_TAX }]);
  const removeTax = (i) => setTaxLines(rows => rows.filter((_, j) => j !== i));

  // ── live computation ──
  const lineTotals = lineItems.map(it => {
    const qty = Math.max(1, parseInt(it.quantity, 10) || 0);
    const unit = parseFloat(it.unitPrice) || 0;
    return qty * unit;
  });
  const subtotal = lineTotals.reduce((s, n) => s + n, 0);
  const taxComputed = taxLines.map(t => {
    const v = parseFloat(t.value) || 0;
    return t.type === 'PERCENTAGE' ? subtotal * (v / 100) : v;
  });
  const taxTotal = taxComputed.reduce((s, n) => s + n, 0);
  const billTotal = subtotal + taxTotal;

  const submit = () => {
    if (!customer) { toast.error('Find a customer first.'); return; }
    const cleanLines = lineItems
      .map(it => ({ description: it.description.trim(), quantity: Math.max(1, parseInt(it.quantity, 10) || 1), unitPrice: parseFloat(it.unitPrice) }))
      .filter(it => it.description && !isNaN(it.unitPrice) && it.unitPrice >= 0);
    if (cleanLines.length === 0) { toast.error('Add at least one valid line item (description + price).'); return; }

    const cleanTaxes = [];
    for (const t of taxLines) {
      const name = t.name.trim();
      const value = parseFloat(t.value);
      if (!name && !t.value) continue; // skip fully-empty rows
      if (!name) { toast.error('Every tax line needs a name.'); return; }
      if (isNaN(value) || value < 0) { toast.error(`Invalid value for tax "${name}".`); return; }
      cleanTaxes.push({ name, type: t.type === 'FLAT' ? 'FLAT' : 'PERCENTAGE', value });
    }

    createMut.mutate({
      customerId: customer.id,
      locationId: locationId || undefined,
      tableId: tableId || undefined,
      lineItems: cleanLines,
      taxLines: cleanTaxes,
      businessNote: businessNote.trim() || undefined,
    });
  };

  return (
    <Modal open onClose={onClose} title="New Invoice" className="max-w-2xl">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {/* Step 1 — customer */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#7b7b9a] uppercase tracking-wide">Customer</p>
          <CustomerLookup customer={customer} onSelect={setCustomer} onClear={() => setCustomer(null)} />
        </div>

        {/* Step 2 — line items */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#7b7b9a] uppercase tracking-wide">Line Items</p>
          <div className="space-y-2">
            {lineItems.map((it, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <input
                    type="text" maxLength={200} placeholder="Description"
                    value={it.description} onChange={e => setLine(i, 'description', e.target.value)}
                    className="w-full bg-[#0a0a12] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-[#e8e8f0] placeholder:text-[#4a4a6a] outline-none focus:border-[#00d97e60]"
                  />
                </div>
                <input
                  type="number" min="1" step="1" placeholder="Qty"
                  value={it.quantity} onChange={e => setLine(i, 'quantity', e.target.value)}
                  className="w-16 bg-[#0a0a12] border border-[#2a2a3e] rounded-lg px-2 py-2 text-sm text-[#e8e8f0] text-center outline-none focus:border-[#00d97e60]"
                />
                <input
                  type="number" min="0" step="0.01" placeholder="Price"
                  value={it.unitPrice} onChange={e => setLine(i, 'unitPrice', e.target.value)}
                  className="w-24 bg-[#0a0a12] border border-[#2a2a3e] rounded-lg px-2 py-2 text-sm text-[#e8e8f0] text-right outline-none focus:border-[#00d97e60]"
                />
                <div className="w-24 text-right text-sm font-semibold text-[#e8e8f0] az-mono py-2">{fmtUSDC(lineTotals[i])}</div>
                <button
                  onClick={() => removeLine(i)} disabled={lineItems.length === 1}
                  className="p-2 rounded-lg text-[#4a4a6a] hover:text-[#f43f5e] disabled:opacity-30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <button onClick={addLine} className="flex items-center gap-1.5 text-xs font-semibold text-[#00d97e] hover:text-[#00b870] transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
            <span className="text-xs text-[#7b7b9a]">Subtotal: <span className="font-bold text-[#e8e8f0] az-mono">{fmtUSDC(subtotal)}</span></span>
          </div>
        </div>

        {/* Tax lines */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#7b7b9a] uppercase tracking-wide">Taxes &amp; Charges (optional)</p>
          {taxLines.map((t, i) => (
            <div key={i} className="flex items-end gap-2">
              <input
                type="text" maxLength={100} placeholder="e.g. VAT"
                value={t.name} onChange={e => setTax(i, 'name', e.target.value)}
                className="flex-1 bg-[#0a0a12] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-[#e8e8f0] placeholder:text-[#4a4a6a] outline-none focus:border-[#00d97e60]"
              />
              <select
                value={t.type} onChange={e => setTax(i, 'type', e.target.value)}
                className="bg-[#0a0a12] border border-[#2a2a3e] rounded-lg px-2 py-2 text-sm text-[#e8e8f0] outline-none focus:border-[#00d97e60] cursor-pointer"
              >
                <option value="PERCENTAGE" style={{ background: '#13131e' }}>%</option>
                <option value="FLAT" style={{ background: '#13131e' }}>Flat</option>
              </select>
              <input
                type="number" min="0" step="0.01" placeholder="Value"
                value={t.value} onChange={e => setTax(i, 'value', e.target.value)}
                className="w-24 bg-[#0a0a12] border border-[#2a2a3e] rounded-lg px-2 py-2 text-sm text-[#e8e8f0] text-right outline-none focus:border-[#00d97e60]"
              />
              <div className="w-24 text-right text-sm font-semibold text-[#e8e8f0] az-mono py-2">{fmtUSDC(taxComputed[i])}</div>
              <button onClick={() => removeTax(i)} className="p-2 rounded-lg text-[#4a4a6a] hover:text-[#f43f5e] transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <button onClick={addTax} className="flex items-center gap-1.5 text-xs font-semibold text-[#00d97e] hover:text-[#00b870] transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Tax Line
            </button>
            {taxTotal > 0 && <span className="text-xs text-[#7b7b9a]">Tax total: <span className="font-bold text-[#e8e8f0] az-mono">{fmtUSDC(taxTotal)}</span></span>}
          </div>
        </div>

        {/* Step 3 — location / table */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Location (optional)"
            value={locationId}
            onChange={e => { setLocationId(e.target.value); setTableId(''); }}
            options={[{ value: '', label: 'No location' }, ...activeLocs.map(l => ({ value: l.id, label: l.label }))]}
          />
          <Select
            label="Table (optional)"
            value={tableId}
            onChange={e => setTableId(e.target.value)}
            disabled={!selectedLoc || tablesForLoc.length === 0}
            options={[{ value: '', label: tablesForLoc.length ? 'No table' : '—' }, ...tablesForLoc.map(t => ({ value: t.id, label: t.label }))]}
          />
        </div>

        <Textarea
          label="Business Note (optional)"
          placeholder="A note shown to the customer on this invoice..."
          value={businessNote}
          onChange={e => setBusinessNote(e.target.value)}
        />

        {/* Summary preview */}
        <div className="p-4 rounded-xl bg-[#0a0a12] border border-[#1e1e2e] space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#7b7b9a]">Subtotal</span>
            <span className="text-[#e8e8f0] az-mono">{fmtUSDC(subtotal)}</span>
          </div>
          {taxLines.map((t, i) => (t.name || t.value) ? (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-[#7b7b9a]">{t.name || 'Tax'}{t.type === 'PERCENTAGE' && t.value ? ` (${t.value}%)` : ''}</span>
              <span className="text-[#e8e8f0] az-mono">{fmtUSDC(taxComputed[i])}</span>
            </div>
          ) : null)}
          <div className="flex justify-between pt-2 border-t border-[#1e1e2e]">
            <span className="text-sm font-bold text-[#e8e8f0]">Bill Total</span>
            <span className="text-sm font-bold text-[#00d97e] az-mono">{fmtUSDC(billTotal)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-4 pt-4 border-t border-[#1e1e2e]">
        <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button onClick={submit} loading={createMut.isPending} className="flex-1">Create Invoice</Button>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Invoice detail modal
function InvoiceDetailModal({ invoiceId, onClose, onSend, onVoid, sending, voiding }) {
  const { data, isLoading } = useQuery({
    queryKey: ['biz-invoice', invoiceId],
    queryFn:  () => invoicesApi.get(invoiceId),
    enabled:  !!invoiceId,
  });
  const inv = data?.invoice;
  const meta = inv ? (INVOICE_STATUS_META[inv.status] || INVOICE_STATUS_META.DRAFT) : INVOICE_STATUS_META.DRAFT;

  return (
    <Modal open onClose={onClose} title={inv ? inv.invoiceRef : 'Invoice'} className="max-w-2xl">
      {isLoading || !inv ? (
        <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-32" /></div>
      ) : (
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Badge color={meta.color} bg={meta.bg} className="text-sm px-3 py-1">{meta.label}</Badge>
            <div className="text-right text-xs text-[#4a4a6a]">
              {inv.paidAt && <p>Paid {formatDateTime(inv.paidAt)}</p>}
              {inv.sentAt && !inv.paidAt && <p>Sent {formatDateTime(inv.sentAt)}</p>}
              {inv.voidedAt && <p>Voided {formatDateTime(inv.voidedAt)}</p>}
              {!inv.sentAt && !inv.paidAt && !inv.voidedAt && <p>Created {formatDateTime(inv.createdAt)}</p>}
            </div>
          </div>

          {/* Customer + location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#0f0f17] border border-[#2a2a3e]">
              <p className="text-xs font-semibold text-[#4a4a6a] uppercase tracking-wider mb-2 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Customer</p>
              <div className="flex items-center gap-2.5">
                {inv.customer?.profilePictureUrl ? (
                  <img src={inv.customer.profilePictureUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#4f8ef71a] border border-[#4f8ef730] flex items-center justify-center">
                    <span className="text-xs font-bold text-[#4f8ef7]">{initials(inv.customer?.username)}</span>
                  </div>
                )}
                <p className="text-sm font-semibold text-[#e8e8f0] truncate">{inv.customer?.username || 'Customer'}</p>
              </div>
            </div>
            {(inv.location || inv.table) && (
              <div className="p-3 rounded-xl bg-[#0f0f17] border border-[#2a2a3e]">
                <p className="text-xs font-semibold text-[#4a4a6a] uppercase tracking-wider mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location</p>
                {inv.location && <p className="text-sm text-[#e8e8f0]">{inv.location.label}</p>}
                {inv.location?.address && <p className="text-xs text-[#4a4a6a] mt-0.5">{inv.location.address}</p>}
                {inv.table && <p className="text-xs text-[#7b7b9a] mt-1">Table: {inv.table.label}</p>}
              </div>
            )}
          </div>

          {/* Line items */}
          <div className="rounded-xl border border-[#1e1e2e] overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-[#0f0f17] text-xs font-semibold text-[#4a4a6a] uppercase tracking-wider">
              <span className="col-span-6">Item</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-2 text-right">Total</span>
            </div>
            <div className="divide-y divide-[#1e1e2e]">
              {(inv.lineItems || []).map(li => (
                <div key={li.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-sm">
                  <span className="col-span-6 text-[#e8e8f0] truncate">{li.description}</span>
                  <span className="col-span-2 text-center text-[#7b7b9a] az-mono">{li.quantity}</span>
                  <span className="col-span-2 text-right text-[#7b7b9a] az-mono">{fmtUSDC(li.unitPrice)}</span>
                  <span className="col-span-2 text-right text-[#e8e8f0] az-mono">{fmtUSDC(li.lineTotal)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#7b7b9a]">Subtotal</span>
              <span className="text-[#e8e8f0] az-mono">{fmtUSDC(inv.subtotalUsdc)}</span>
            </div>
            {(inv.taxLines || []).map(t => (
              <div key={t.id} className="flex justify-between text-sm">
                <span className="text-[#7b7b9a]">{t.name}{t.type === 'PERCENTAGE' ? ` (${fmt(t.value, 0)}%)` : ''}</span>
                <span className="text-[#e8e8f0] az-mono">{fmtUSDC(t.computedAmount)}</span>
              </div>
            ))}
            {inv.status === 'PAID' && Number(inv.tipUsdc) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#7b7b9a]">Tip</span>
                <span className="text-[#e8e8f0] az-mono">{fmtUSDC(inv.tipUsdc)}</span>
              </div>
            )}
            {inv.status === 'PAID' && Number(inv.feeUsdc) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#7b7b9a]">Platform fee</span>
                <span className="text-[#7b7b9a] az-mono">{fmtUSDC(inv.feeUsdc)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-[#1e1e2e]">
              <span className="text-sm font-bold text-[#e8e8f0]">{inv.status === 'PAID' ? 'Total Paid' : 'Bill Total'}</span>
              <span className="text-sm font-bold text-[#00d97e] az-mono">{fmtUSDC(inv.status === 'PAID' && inv.customerPaidUsdc != null ? inv.customerPaidUsdc : inv.billTotalUsdc)}</span>
            </div>
          </div>

          {/* Notes */}
          {inv.businessNote && (
            <div className="p-3 rounded-xl bg-[#0f0f17] border border-[#2a2a3e]">
              <p className="text-xs font-semibold text-[#4a4a6a] mb-1">Your note</p>
              <p className="text-sm text-[#7b7b9a]">{inv.businessNote}</p>
            </div>
          )}
          {inv.customerNote && (
            <div className="p-3 rounded-xl bg-[#0f0f17] border border-[#2a2a3e]">
              <p className="text-xs font-semibold text-[#4a4a6a] mb-1">Customer note</p>
              <p className="text-sm text-[#7b7b9a]">{inv.customerNote}</p>
            </div>
          )}

          {/* Review */}
          {inv.review && (
            <div className="p-3 rounded-xl bg-[#f59e0b0d] border border-[#f59e0b30]">
              <p className="text-xs font-semibold text-[#4a4a6a] mb-1.5">Customer review</p>
              <div className="flex items-center gap-1 mb-1">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} className="w-4 h-4" fill={n <= inv.review.rating ? '#f59e0b' : 'none'} style={{ color: n <= inv.review.rating ? '#f59e0b' : '#4a4a6a' }} />
                ))}
              </div>
              {inv.review.comment && <p className="text-sm text-[#7b7b9a]">{inv.review.comment}</p>}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 mt-4 pt-4 border-t border-[#1e1e2e]">
        <Button variant="secondary" onClick={onClose} className="flex-1">Back</Button>
        {inv?.status === 'DRAFT' && (
          <Button onClick={() => onSend(inv.id)} loading={sending} className="flex-1">
            <Send className="w-4 h-4" /> Send Invoice
          </Button>
        )}
        {(inv?.status === 'DRAFT' || inv?.status === 'SENT') && (
          <Button variant="danger" onClick={() => onVoid(inv.id)} loading={voiding}>
            <Ban className="w-4 h-4" /> Void
          </Button>
        )}
      </div>
    </Modal>
  );
}
