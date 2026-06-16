import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orders as ordersApi } from '@/lib/api';
import { Card, Badge, Button, Skeleton, Textarea, Modal } from '@/components/ui';
import { fmtUSDC, formatDateTime, ORDER_STATUS_META } from '@/lib/utils';
import { ArrowLeft, Truck, Package, User, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
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
          : { background: 'transparent', borderColor: '#2a2a3e' }
        }
      >
        {done
          ? <CheckCircle2 className="w-4 h-4" style={{ color }} />
          : <div className={`w-2 h-2 rounded-full`} style={{ background: active ? color : '#2a2a3e' }} />
        }
      </div>
      <span className="text-xs font-medium" style={{ color: done || active ? '#e8e8f0' : '#4a4a6a' }}>{label}</span>
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
    <div className="p-6 text-center text-[#7b7b9a]">Order not found.</div>
  );

  const meta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.AWAITING_PAYMENT;
  const currentStep = STEPS.indexOf(order.status);
  const showDeliverBtn = order.status === 'PAID';

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back + header */}
      <div>
        <Link to="/orders" className="flex items-center gap-2 text-xs text-[#4a4a6a] hover:text-[#00d97e] transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#e8e8f0]">{order.title}</h1>
            <p className="text-sm text-[#4a4a6a] mt-1 az-mono">{order.orderRef}</p>
          </div>
          <Badge color={meta.color} bg={meta.bg} className="text-sm px-3 py-1">{meta.label}</Badge>
        </div>
      </div>

      {/* Progress tracker */}
      {!['DISPUTED','REFUNDED','CANCELLED'].includes(order.status) && (
        <Card>
          <p className="text-xs font-semibold text-[#4a4a6a] uppercase tracking-wider mb-5">Order Progress</p>
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
                    color={active ? meta.color : '#00d97e'}
                  />
                  {i < STEPS.length - 1 && (
                    <div
                      className="flex-1 h-0.5 mx-2"
                      style={{ background: done ? '#00d97e40' : '#1e1e2e' }}
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
          <p className="text-xs font-semibold text-[#4a4a6a] uppercase tracking-wider">Order Details</p>
          <div className="space-y-3">
            <Row label="Amount" value={<span className="az-mono font-bold text-[#00d97e]">{fmtUSDC(order.amountUsdc)}</span>} />
            {order.escrow && (
              <>
                <Row label="Escrow Fee"     value={<span className="az-mono">{fmtUSDC(order.escrow.feeUsdc)}</span>} />
                <Row label="Escrow Status"  value={<Badge color="#4f8ef7" bg="#4f8ef71a">{order.escrow.status}</Badge>} />
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
          <p className="text-xs font-semibold text-[#4a4a6a] uppercase tracking-wider">Customer</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4f8ef71a] border border-[#4f8ef730] flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-[#4f8ef7]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#e8e8f0]">{order.customer?.username || 'Unknown'}</p>
              {order.customer?.azamanId && (
                <p className="text-xs text-[#4a4a6a] az-mono mt-0.5">@{order.customer.azamanId}</p>
              )}
            </div>
          </div>
          {order.customerNotes && (
            <div className="p-3 rounded-xl bg-[#0f0f17] border border-[#2a2a3e]">
              <p className="text-xs font-semibold text-[#4a4a6a] mb-1">Customer notes</p>
              <p className="text-sm text-[#7b7b9a]">{order.customerNotes}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Product */}
      {order.product && (
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#a78bfa1a] border border-[#a78bfa30] flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-[#a78bfa]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#4a4a6a] uppercase tracking-wider mb-0.5">Product</p>
            <p className="text-sm font-semibold text-[#e8e8f0]">{order.product.name}</p>
          </div>
        </Card>
      )}

      {/* Delivery notes (if delivered) */}
      {order.deliveryNotes && (
        <Card>
          <p className="text-xs font-semibold text-[#4a4a6a] uppercase tracking-wider mb-2">Your Delivery Notes</p>
          <p className="text-sm text-[#7b7b9a]">{order.deliveryNotes}</p>
        </Card>
      )}

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
          <p className="text-sm text-[#7b7b9a]">
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
      <span className="text-xs text-[#4a4a6a] flex-shrink-0">{label}</span>
      <span className="text-sm text-[#e8e8f0] text-right">{value}</span>
    </div>
  );
}
