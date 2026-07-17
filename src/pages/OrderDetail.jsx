import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orders as ordersApi, escrow as escrowApi } from '@/lib/api';
import { bookingOpsApi } from '@/lib/marketplaceApi';
import { Card, Badge, Button, Skeleton, Textarea, Modal, Empty } from '@/components/ui';
import { fmtUSDC, fmt, formatDateTime, relativeTime, ORDER_STATUS_META } from '@/lib/utils';
import { 
  ArrowLeft, Truck, Package, User, Clock, CheckCircle2, AlertCircle, 
  Lock, AlertTriangle, ShieldCheck, CornerUpLeft, Edit3, Calendar
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const STEPS = ['AWAITING_PAYMENT', 'PAID', 'DELIVERED', 'COMPLETED'];

function ProgressStep({ label, done, active, color, timestamp }) {
  return (
    <div className="flex items-start gap-4 relative pb-8 last:pb-0">
      {/* Line connecting steps */}
      <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-[var(--sn-border)] last:hidden" 
        style={done ? { background: color } : {}} 
      />
      
      {/* Step circle */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all z-10 bg-[var(--az-card)]"
        style={done || active
          ? { background: `${color}1a`, borderColor: color }
          : { background: 'transparent', borderColor: 'var(--sn-border)' }
        }
      >
        {done ? (
          <CheckCircle2 className="w-4 h-4" style={{ color }} />
        ) : (
          <div className="w-2 h-2 rounded-full" style={{ background: active ? color : 'var(--sn-border)' }} />
        )}
      </div>

      {/* Step details */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: done || active ? 'var(--sn-text)' : 'var(--sn-text-muted)' }}>
          {label}
        </p>
        {timestamp ? (
          <p className="text-[11px] text-[var(--sn-text-muted)] mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDateTime(timestamp)} ({relativeTime(timestamp)})
          </p>
        ) : done ? (
          <p className="text-[11px] text-[var(--sn-text-muted)] mt-1">Status reached</p>
        ) : active ? (
          <p className="text-[11px] text-[var(--sn-purple)] mt-1 font-semibold animate-pulse">Current Phase</p>
        ) : (
          <p className="text-[11px] text-[var(--sn-text-muted)]/40 mt-1">Pending action</p>
        )}
      </div>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [refundModal, setRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Get order detail
  const { data: order, isLoading, isError, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.get(id),
  });

  // Sync delivery notes from order data
  useEffect(() => {
    if (order?.deliveryNotes) {
      setDeliveryNotes(order.deliveryNotes);
    }
  }, [order?.deliveryNotes]);

  // Mark as delivered mutation
  const markDeliveredMutation = useMutation({
    mutationFn: (notes) => ordersApi.markDelivered(id, notes),
    onSuccess: () => {
      toast.success('Order marked as delivered successfully');
      qc.invalidateQueries(['order', id]);
      qc.invalidateQueries(['orders']);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update delivery status');
    }
  });

  // Refund mutation
  const refundMutation = useMutation({
    mutationFn: (reason) => bookingOpsApi.refundOrder(id, reason),
    onSuccess: () => {
      toast.success('Refund initiated successfully');
      qc.invalidateQueries(['order', id]);
      qc.invalidateQueries(['orders']);
      setRefundModal(false);
      setRefundReason('');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to initiate refund');
    }
  });

  // Save Delivery Notes mutation (custom save button handler)
  const saveNotesMutation = useMutation({
    mutationFn: (notes) => ordersApi.markDelivered(id, notes), // markDelivered updates deliveryNotes
    onSuccess: () => {
      toast.success('Delivery notes saved successfully');
      qc.invalidateQueries(['order', id]);
      setIsEditingNotes(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to save delivery notes');
    }
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 md:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Empty
          icon={AlertCircle}
          title="Order Not Found"
          description="The order you are looking for does not exist or you don't have permission to view it."
          action={
            <Button onClick={() => navigate('/orders')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Console
            </Button>
          }
        />
      </div>
    );
  }

  const currentStatus = order.status;
  const currentStepIndex = STEPS.indexOf(currentStatus);

  // Status mappings for style colors
  const statusMeta = ORDER_STATUS_META[currentStatus] || { label: currentStatus, color: 'var(--sn-purple)' };

  // Calculate timelines based on timestamps from backend
  const timestamps = {
    AWAITING_PAYMENT: order.created_date || order.createdAt,
    PAID: order.paidAt || order.paid_date,
    DELIVERED: order.deliveredAt || order.delivered_date,
    COMPLETED: order.completedAt || order.completed_date,
    CANCELLED: order.cancelledAt || order.cancelled_date,
  };

  // Escrow details
  const escrowState = order.escrowStatus || order.escrow?.status || 'UNKNOWN';
  const escrowAmount = order.escrowAmount || order.escrow?.amount || order.amount || 0;

  const escrowMeta = {
    PAID: { label: 'Paid & Locked', color: 'var(--sn-blue)', icon: Lock, desc: 'Funds secured in safety escrow wallet' },
    HELD: { label: 'Held on Hold', color: 'var(--sn-amber)', icon: Lock, desc: 'Funds temporarily frozen for dispute or check' },
    SATISFIED: { label: 'Satisfied & Released', color: 'var(--sn-green)', icon: ShieldCheck, desc: 'Fulfillment confirmed, payout distributed' },
    DISPUTED: { label: 'Disputed', color: 'var(--sn-red)', icon: AlertTriangle, desc: 'Buyer raised issue. Awaiting merchant reply' },
    REFUNDED: { label: 'Refunded', color: 'var(--sn-purple)', icon: CornerUpLeft, desc: 'Escrow amount returned to buyer wallet' },
    UNKNOWN: { label: 'No Active Escrow', color: 'var(--sn-text-muted)', icon: AlertCircle, desc: 'No escrow record found for this transaction' }
  }[escrowState] || { label: escrowState, color: 'var(--sn-purple)', icon: Lock, desc: 'Escrow status update pending' };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <Link to="/orders" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--sn-text-muted)] hover:text-[var(--sn-text)] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
        <div className="flex items-center gap-2">
          {currentStatus === 'AWAITING_PAYMENT' && (
            <Badge color="var(--sn-amber)">Unpaid Order</Badge>
          )}
          {currentStatus === 'CANCELLED' && (
            <Badge color="var(--sn-red)">Cancelled</Badge>
          )}
        </div>
      </div>

      {/* Main Order Header Block */}
      <Card className="p-6 border-[var(--sn-border)]">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-[var(--sn-text)] az-mono">
                {order.orderRef || `#${order.id}`}
              </h1>
              <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
            </div>
            <p className="text-xs text-[var(--sn-text-muted)]">
              Placed on {formatDateTime(order.created_date || order.createdAt)}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-1.5">
            <span className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase tracking-wider">Total Value</span>
            <span className="text-2xl font-bold text-[var(--sn-text)] az-mono">
              {fmtUSDC(order.amount)}
            </span>
          </div>
        </div>

        {/* Customer & Product Details split layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-[var(--sn-border)]/50">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--sn-purple)]/10 border border-[var(--sn-purple)]/20 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-[var(--sn-purple)]" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[var(--sn-text-muted)] uppercase tracking-wider">Buyer Customer Info</h3>
              <p className="text-sm font-bold text-[var(--sn-text)] mt-1">
                {order.customer?.name || order.customerName || 'Anonymous'}
              </p>
              <p className="text-xs text-[var(--sn-text-muted)] az-mono mt-0.5">
                AZM-ID: {order.customer?.azamanId || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--sn-blue)]/10 border border-[var(--sn-blue)]/20 flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-[var(--sn-blue)]" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[var(--sn-text-muted)] uppercase tracking-wider">Fulfillment Product</h3>
              <p className="text-sm font-bold text-[var(--sn-text)] mt-1 line-clamp-1">
                {order.product?.title || order.productTitle || 'N/A'}
              </p>
              <p className="text-xs text-[var(--sn-text-muted)] mt-0.5">
                ID: {order.productId || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Progression & Notes Column */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Status Timeline Card */}
          <Card className="p-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-[var(--sn-text)] mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--sn-purple)]" />
              Visual Tracking Timeline
            </h2>
            <div className="space-y-1">
              {STEPS.map((step, idx) => {
                const done = idx <= currentStepIndex;
                const active = idx === currentStepIndex;
                const timestamp = timestamps[step];
                const meta = ORDER_STATUS_META[step] || { label: step, color: 'var(--sn-purple)' };
                
                return (
                  <ProgressStep
                    key={step}
                    label={meta.label}
                    done={done && currentStatus !== 'CANCELLED'}
                    active={active && currentStatus !== 'CANCELLED'}
                    color={meta.color}
                    timestamp={timestamp}
                  />
                );
              })}

              {currentStatus === 'CANCELLED' && (
                <ProgressStep
                  label="CANCELLED"
                  done={true}
                  active={true}
                  color="var(--sn-red)"
                  timestamp={timestamps.CANCELLED}
                />
              )}
            </div>
          </Card>

          {/* Delivery Actions & Notes Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-[var(--sn-text)] flex items-center gap-2">
                <Truck className="w-4 h-4 text-[var(--sn-purple)]" />
                Delivery & Fulfillment Details
              </h2>
              {currentStatus === 'PAID' && (
                <Button 
                  size="sm"
                  variant="primary"
                  loading={markDeliveredMutation.isLoading}
                  onClick={() => markDeliveredMutation.mutate(deliveryNotes)}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as Delivered
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase tracking-wider">Fulfillment Dispatch Notes</label>
                  {!isEditingNotes ? (
                    <button 
                      onClick={() => setIsEditingNotes(true)} 
                      className="text-xs text-[var(--sn-purple)] hover:underline flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsEditingNotes(false)} 
                        className="text-xs text-[var(--sn-text-muted)] hover:underline"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => saveNotesMutation.mutate(deliveryNotes)} 
                        className="text-xs text-[var(--sn-purple)] hover:underline font-bold"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
                <Textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Enter courier, tracking link, dispatch timestamps, etc."
                  disabled={!isEditingNotes && currentStatus !== 'PAID'}
                  className={!isEditingNotes ? "bg-opacity-50 border-dashed" : ""}
                />
              </div>

              {currentStatus === 'DELIVERED' && (
                <div className="p-4 rounded-xl border border-[var(--sn-purple)]/20 bg-[var(--sn-purple)]/5 text-xs text-[var(--sn-purple)] flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Awaiting Customer Confirmation</span>
                    <p className="text-[var(--sn-text-muted)] mt-0.5">The order has been marked as delivered. Funds will unlock from escrow automatically once customer completes the booking, or when the platform release timer expires.</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Escrow Info & Actions */}
        <div className="space-y-6">
          {/* Escrow Status Panel */}
          <Card className="p-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-[var(--sn-text)] mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[var(--sn-blue)]" />
              Escrow Security Panel
            </h2>

            <div className="space-y-5">
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-[var(--sn-border)] bg-[var(--az-black)]">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${escrowMeta.color}1a` }}>
                  <escrowMeta.icon className="w-4 h-4" style={{ color: escrowMeta.color }} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: escrowMeta.color }}>{escrowMeta.label}</p>
                  <p className="text-[10px] text-[var(--sn-text-muted)] mt-0.5">{escrowMeta.desc}</p>
                </div>
              </div>

              <div className="space-y-2 pb-4 border-b border-[var(--sn-border)]/50">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--sn-text-muted)]">Escrow Amount</span>
                  <span className="font-bold az-mono text-[var(--sn-text)]">{fmtUSDC(escrowAmount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--sn-text-muted)]">Current Stage</span>
                  <span className="font-medium text-[var(--sn-text)] capitalize">{currentStatus.replace('_', ' ').toLowerCase()}</span>
                </div>
              </div>

              {/* Action: Initiate Refund */}
              {['PAID', 'DELIVERED', 'HELD', 'DISPUTED'].includes(currentStatus) && (
                <Button 
                  variant="danger" 
                  className="w-full justify-center bg-transparent text-[var(--sn-red)] border-[var(--sn-red)] hover:bg-[var(--sn-red)]/10"
                  onClick={() => setRefundModal(true)}
                >
                  <CornerUpLeft className="w-4 h-4" />
                  Initiate Refund
                </Button>
              )}
            </div>
          </Card>

          {/* Audit Information Panel */}
          <Card className="p-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-[var(--sn-text)] mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--sn-purple)]" />
              System Audit Metadata
            </h2>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center pb-2.5 border-b border-[var(--sn-border)]/30">
                <span className="text-[var(--sn-text-muted)]">Order ID</span>
                <span className="font-bold az-mono text-[var(--sn-text)]">{order.id}</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-[var(--sn-border)]/30">
                <span className="text-[var(--sn-text-muted)]">Created Date</span>
                <span className="text-[var(--sn-text)]">{formatDateTime(order.created_date || order.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-[var(--sn-border)]/30">
                <span className="text-[var(--sn-text-muted)]">Last Updated</span>
                <span className="text-[var(--sn-text)]">{formatDateTime(order.updated_date || order.updatedAt)}</span>
              </div>
              {timestamps.PAID && (
                <div className="flex justify-between items-center pb-2.5 border-b border-[var(--sn-border)]/30">
                  <span className="text-[var(--sn-text-muted)]">Settled (Paid)</span>
                  <span className="text-[var(--sn-text)]">{formatDateTime(timestamps.PAID)}</span>
                </div>
              )}
              {timestamps.DELIVERED && (
                <div className="flex justify-between items-center pb-2.5 border-b border-[var(--sn-border)]/30">
                  <span className="text-[var(--sn-text-muted)]">Dispatched At</span>
                  <span className="text-[var(--sn-text)]">{formatDateTime(timestamps.DELIVERED)}</span>
                </div>
              )}
              {timestamps.COMPLETED && (
                <div className="flex justify-between items-center pb-2.5 border-b border-[var(--sn-border)]/30">
                  <span className="text-[var(--sn-text-muted)]">Completed At</span>
                  <span className="text-[var(--sn-text)]">{formatDateTime(timestamps.COMPLETED)}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Refund Modal */}
      <Modal 
        open={refundModal} 
        onClose={() => setRefundModal(false)}
        title="Confirm Order Refund"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-[var(--sn-red)]/20 bg-[var(--sn-red)]/5 text-xs text-[var(--sn-red)] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold">Irreversible Action Warning</span>
              <p className="text-[var(--sn-text-muted)] mt-0.5">You are initiating a full refund of <strong className="text-[var(--sn-text)] az-mono">{fmtUSDC(escrowAmount)}</strong> back to the buyer's wallet. This will close the escrow contract and cannot be undone.</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase tracking-wider">Refund Reason / Auditable Note</label>
            <Textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="State why this order is being refunded (buyer request, service issues, stock outage)..."
              error={!refundReason.trim() ? "Reason is required to execute refund" : ""}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setRefundModal(false)}>Cancel</Button>
            <Button 
              variant="danger" 
              size="sm" 
              loading={refundMutation.isLoading}
              disabled={!refundReason.trim()}
              onClick={() => refundMutation.mutate(refundReason)}
            >
              Confirm & Return {fmtUSDC(escrowAmount)}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
