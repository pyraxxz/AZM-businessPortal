import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orders as ordersApi, escrow as escrowApi } from '@/lib/api';
import { Card, Badge, Button, Skeleton, Textarea, Modal } from '@/components/ui';
import { fmtUSDC, fmt, formatDateTime, ORDER_STATUS_META } from '@/lib/utils';
import { ArrowLeft, Truck, Package, User, Clock, CheckCircle2, AlertCircle, Lock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const STEPS = ['AWAITING_PAYMENT', 'PAID', 'DELIVERED', 'COMPLETED'];

function ProgressStep({ label, done, active, color }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all"
        style={done || active
          ? { background: `${color}1a`, borderColor: color }
          : { background: 'transparent', borderColor: 'var(--sn-border)' }
        }
      >
        {done
          ? <CheckCircle2 className="w-4 h-4" style={{ color }} />
          : <div className={`w-2 h-2 rounded-full`} style={{ background: active ? color : 'var(--sn-border)' }} />
        }
      </div>
      <span className="text-xs font-medium" style={{ color: done || active ? 'var(--sn-text)' : 'var(--sn-text-muted)' }}>{label}</span>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [deliverModal, setDeliverModal] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn:  () => ordersApi.get(id),
  });

  const markDelivered = useMutation({
    mutationFn: ({ notes }) => ordersApi.markDelivered(id, notes),
    onSuccess: () => {
      toast.success('Order marked as delivered');
      qc.invalidateQueries(['order', id]);
      qc.invalidateQueries(['orders']);
      setDeliverModal(false);
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  );

  const order = data?.order;
  if (!order) return (
    <div className="p-6 text-center text-[var(--sn-text-muted)]">Order not found.</div>
  );

  const meta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.AWAITING_PAYMENT;
  const currentStep = STEPS.indexOf(order.status);
  const showDeliverBtn = order.status === 'PAID';

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back + header */}
      <div>
        <Link to="/orders" className="flex items-center gap-2 text-xs text-[var(--sn-text-muted)] hover:text-[var(--sn-purple)] transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--sn-text)]">{order.title}</h1>
            <p className="text-sm text-[var(--sn-text-muted)] mt-1 az-mono">{order.orderRef}</p>
          </div>
          <Badge color={meta.color} bg={meta.bg} className="text-sm px-3 py-1">{meta.label}</Badge>
        </div>
      </div>

      {/* Progress tracker */}
      {!['DISPUTED','REFUNDED','CANCELLED'].includes(order.status) && (
        <Card>
          <p className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase tracking-wider mb-5">Order Progress</p>
          <div className="flex items-center">
            {STEPS.map((step, i) => {
              const stepMeta = ORDER_STATUS_META[step];
              const done   = currentStep > i;
              const active = currentStep === i;
              return (
                <div key={step} className="flex items-center flex-1">
                  <ProgressStep
                    label={stepMeta.label}
                    done={done}
                    active={active}
                    color={active ? meta.color : 'var(--sn-purple)'}
                  />
                  {i < STEPS.length - 1 && (
                    <div
                      className="flex-1 h-0.5 mx-2"
                      style={{ background: done ? 'var(--sn-purple)' : 'var(--sn-border)' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Disputed / Refunded banner */}
      {['DISPUTED','REFUNDED','CANCELLED'].includes(order.status) && (
        <div
          className="flex items-center gap-3 p-4 rounded-2xl border"
          style={{ background: meta.bg, borderColor: `${meta.color}40` }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: meta.color }} />
          <p className="text-sm font-medium" style={{ color: meta.color }}>
            This order is {meta.label.toLowerCase()}. No further action needed from your side.
          </p>
        </div>
      )}

      {/* Main info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Order details */}
        <Card className="space-y-4">
          <p className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase tracking-wider">Order Details</p>
          <div className="space-y-3">
            <Row label="Amount" value={<span className="az-mono font-bold text-[var(--sn-purple)]">{fmtUSDC(order.amountUsdc)}</span>} />
            {order.escrow && (
              <>
                <Row label="Escrow Fee"     value={<span className="az-mono">{fmtUSDC(order.escrow.feeUsdc)}</span>} />
                <Row label="Escrow Status"  value={<Badge color="var(--sn-blue)" bg="var(--sn-blue)">{order.escrow.status}</Badge>} />
                {order.escrow.fundedAt  && <Row label="Funded"    value={formatDateTime(order.escrow.fundedAt)} />}
                {order.escrow.settledAt && <Row label="Settled"   value={formatDateTime(order.escrow.settledAt)} />}
              </>
            )}
            {order.deliveredAt  && <Row label="Delivered"  value={formatDateTime(order.deliveredAt)} />}
            {order.completedAt  && <Row label="Completed"  value={formatDateTime(order.completedAt)} />}
            <Row label="Created"    value={formatDateTime(order.createdAt)} />
          </div>
        </Card>

        {/* Customer */}
        <Card className="space-y-4">
          <p className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase tracking-wider">Customer</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--sn-blue)] border border-[#4f8ef730] flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-[var(--sn-blue)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--sn-text)]">{order.customer?.username || 'Unknown'}</p>
              {order.customer?.azamanId && (
                <p className="text-xs text-[var(--sn-text-muted)] az-mono mt-0.5">@{order.customer.azamanId}</p>
              )}
            </div>
          </div>
          {order.customerNotes && (
            <div className="p-3 rounded-xl bg-[var(--az-black)] border border-[var(--sn-border)]">
              <p className="text-xs font-semibold text-[var(--sn-text-muted)] mb-1">Customer notes</p>
              <p className="text-sm text-[var(--sn-text-muted)]">{order.customerNotes}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Product */}
      {order.product && (
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--sn-purple-subtle)] border border-[var(--sn-purple)] flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-[var(--sn-purple)]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase tracking-wider mb-0.5">Product</p>
            <p className="text-sm font-semibold text-[var(--sn-text)]">{order.product.name}</p>
          </div>
        </Card>
      )}

      {/* Delivery notes (if delivered) */}
      {order.deliveryNotes && (
        <Card>
          <p className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase tracking-wider mb-2">Your Delivery Notes</p>
          <p className="text-sm text-[var(--sn-text-muted)]">{order.deliveryNotes}</p>
        </Card>
      )}

      {/* Smart Escrow — full status + actions (only when the order has a ticket) */}
      {order.ticketId && <EscrowPanel ticketId={order.ticketId} orderId={id} />}

      {/* Action */}
      {showDeliverBtn && (
        <div className="flex justify-end">
          <Button onClick={() => { setDeliverModal(true); setDeliveryNotes(''); }}>
            <Truck className="w-4 h-4" /> Mark as Delivered
          </Button>
        </div>
      )}

      {/* Deliver modal */}
      <Modal open={deliverModal} onClose={() => setDeliverModal(false)} title="Confirm Delivery">
        <div className="space-y-4">
          <p className="text-sm text-[var(--sn-text-muted)]">
            Confirming delivery will notify the customer to release the escrow payment to you.
          </p>
          <Textarea
            label="Delivery notes (optional)"
            placeholder="Tracking number, delivery method, or any message to the customer..."
            value={deliveryNotes}
            onChange={e => setDeliveryNotes(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setDeliverModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={() => markDelivered.mutate({ notes: deliveryNotes })} loading={markDelivered.isPending} className="flex-1">
              <Truck className="w-4 h-4" /> Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-[var(--sn-text-muted)] flex-shrink-0">{label}</span>
      <span className="text-sm text-[var(--sn-text)] text-right">{value}</span>
    </div>
  );
}

// Escrow status → display config. Covers every EscrowStatus the backend emits.
const ESCROW_STATUS_CONFIG = {
  DRAFT:              { color: 'var(--sn-amber)', label: 'Awaiting Payment',     icon: Clock },
  FUNDED:             { color: 'var(--sn-blue)', label: 'Funded — In Escrow',   icon: Lock },
  IN_PROGRESS:        { color: 'var(--sn-blue)', label: 'In Progress',          icon: Lock },
  PENDING_SETTLEMENT: { color: 'var(--sn-purple)', label: 'Pending Confirmation', icon: Clock },
  SETTLED:            { color: 'var(--sn-purple)', label: 'Settled',              icon: CheckCircle2 },
  DISPUTED:           { color: 'var(--sn-red)', label: 'Disputed',             icon: AlertTriangle },
  ADMIN_REVIEW:       { color: 'var(--sn-amber)', label: 'Under Admin Review',   icon: AlertTriangle },
  RELEASED:           { color: 'var(--sn-purple)', label: 'Released to You',      icon: CheckCircle2 },
  REFUNDED:           { color: 'var(--sn-text-muted)', label: 'Refunded to Buyer',    icon: CheckCircle2 },
  EXPIRED:            { color: 'var(--sn-text-muted)', label: 'Expired',              icon: Clock },
};

/**
 * Live escrow view for an order. Fetches the full escrow (with dispute +
 * delivery terms) via the ticket. The business owner is the escrow payee, so
 * "Mark as Delivered" sets payeeSatisfied; settlement happens once the customer
 * also confirms. Renders nothing if the ticket has no escrow (graceful 404).
 */
function EscrowPanel({ ticketId, orderId }) {
  const qc = useQueryClient();
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeInput, setShowDisputeInput] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['order-escrow', ticketId],
    queryFn: () => escrowApi.getForTicket(ticketId),
    enabled: !!ticketId,
    retry: false, // a 404 (no escrow) is a normal, expected outcome
  });
  const esc = data?.escrow;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['order-escrow', ticketId] });
    qc.invalidateQueries({ queryKey: ['order', orderId] });
    qc.invalidateQueries({ queryKey: ['orders'] });
    qc.invalidateQueries({ queryKey: ['biz-stats'] });
  };

  const satisfyMutation = useMutation({
    mutationFn: () => escrowApi.satisfy(esc.id),
    onSuccess: (res) => {
      invalidate();
      if (res?.settled) toast.success('Escrow settled — funds released to your wallet.');
      else toast.success('Marked as delivered. Waiting for the customer to confirm.');
    },
    onError: (e) => toast.error(e.message || 'Action failed'),
  });

  const disputeMutation = useMutation({
    mutationFn: (reason) => escrowApi.dispute(esc.id, reason),
    onSuccess: () => {
      invalidate();
      toast.success('Dispute raised. An Azaman admin will review it.');
      setShowDisputeInput(false);
      setDisputeReason('');
    },
    onError: (e) => toast.error(e.message || 'Could not raise dispute'),
  });

  if (isLoading) {
    return (
      <div className="bg-[var(--sn-card)] border border-[var(--sn-border)] rounded-2xl p-5">
        <Skeleton className="h-24" />
      </div>
    );
  }
  // No escrow for this ticket, or the read failed — hide the panel gracefully.
  if (isError || !esc) return null;

  const cfg = ESCROW_STATUS_CONFIG[esc.status] || ESCROW_STATUS_CONFIG.FUNDED;
  const StatusIcon = cfg.icon;
  const locked = Number(esc.amountUsdc) + Number(esc.feeUsdc);
  const canAct = ['FUNDED', 'IN_PROGRESS', 'PENDING_SETTLEMENT'].includes(esc.status);

  return (
    <div className="bg-[var(--sn-card)] border rounded-2xl p-5 space-y-4" style={{ borderColor: `${cfg.color}40` }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4" style={{ color: cfg.color }} />
          <span className="text-sm font-bold text-[var(--sn-text)]">Smart Escrow</span>
        </div>
        <span
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium"
          style={{ color: cfg.color, borderColor: `${cfg.color}40`, background: `${cfg.color}15` }}
        >
          <StatusIcon className="w-3 h-3" /> {cfg.label}
        </span>
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Amount', value: fmtUSDC(esc.amountUsdc) },
          { label: 'Fee',    value: `$${fmt(esc.feeUsdc, 4)}` },
          { label: 'Locked', value: fmtUSDC(locked) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[var(--az-black)] rounded-xl p-3 text-center">
            <p className="text-xs text-[var(--sn-text-muted)] mb-1">{label}</p>
            <p className="text-sm font-bold text-[var(--sn-text)] az-mono">{value}</p>
          </div>
        ))}
      </div>

      {/* Satisfaction status */}
      <div className="flex gap-4 text-xs">
        <span style={{ color: esc.payeeSatisfied ? 'var(--sn-purple)' : 'var(--sn-text-muted)' }}>
          {esc.payeeSatisfied ? '✓' : '○'} You confirmed delivery
        </span>
        <span style={{ color: esc.payerSatisfied ? 'var(--sn-purple)' : 'var(--sn-text-muted)' }}>
          {esc.payerSatisfied ? '✓' : '○'} Customer confirmed receipt
        </span>
      </div>

      {/* Delivery terms */}
      {esc.deliveryTerms && (
        <div className="bg-[var(--az-black)] rounded-xl p-3 text-xs text-[var(--sn-text-muted)]">
          <span className="text-[var(--sn-text-muted)] font-semibold">Delivery Terms: </span>
          {esc.deliveryTerms}
        </div>
      )}

      {/* Actions */}
      {canAct && (
        <div className="space-y-2">
          {!esc.payeeSatisfied && (
            <button
              onClick={() => satisfyMutation.mutate()}
              disabled={satisfyMutation.isPending}
              className="w-full py-2.5 rounded-xl bg-[var(--sn-purple-subtle)] border border-[var(--sn-purple)] text-[var(--sn-purple)] font-semibold text-sm hover:bg-[#00d97e25] transition-colors disabled:opacity-50"
            >
              {satisfyMutation.isPending ? 'Processing…' : '✓ Mark as Delivered'}
            </button>
          )}
          {!showDisputeInput ? (
            <button
              onClick={() => setShowDisputeInput(true)}
              className="w-full py-2 rounded-xl border border-[var(--sn-red)] text-[var(--sn-red)] text-sm hover:bg-[#f43f5e10] transition-colors"
            >
              Raise Dispute
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                placeholder="Describe the issue in detail (min 20 characters)…"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full bg-[var(--az-black)] border border-[var(--sn-border)] rounded-xl p-3 text-[var(--sn-text)] text-sm resize-none h-24 outline-none focus:border-[var(--sn-red)]"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDisputeInput(false); setDisputeReason(''); }}
                  className="flex-1 py-2 rounded-xl border border-[var(--sn-border)] text-[var(--sn-text-muted)] text-sm hover:bg-[var(--sn-border)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => disputeMutation.mutate(disputeReason.trim())}
                  disabled={disputeReason.trim().length < 20 || disputeMutation.isPending}
                  className="flex-1 py-2 rounded-xl bg-[var(--sn-red)] border border-[var(--sn-red)] text-[var(--sn-red)] text-sm font-semibold hover:bg-[var(--sn-red)] transition-colors disabled:opacity-50"
                >
                  {disputeMutation.isPending ? 'Submitting…' : 'Confirm Dispute'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active dispute summary */}
      {esc.dispute && (
        <div className="bg-[#f43f5e0d] border border-[var(--sn-red)] rounded-xl p-3 space-y-1">
          <p className="text-xs font-semibold text-[var(--sn-red)]">Dispute Active</p>
          {esc.dispute.reason && <p className="text-xs text-[var(--sn-text-muted)]">Reason: {esc.dispute.reason}</p>}
          {esc.dispute.status && <p className="text-xs text-[var(--sn-text-muted)]">Status: {esc.dispute.status}</p>}
          {esc.dispute.ruling && <p className="text-xs text-[var(--sn-purple)] font-medium">Ruling: {esc.dispute.ruling}</p>}
        </div>
      )}
    </div>
  );
}
