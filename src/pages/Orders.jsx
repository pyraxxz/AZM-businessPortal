import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orders as ordersApi } from '@/lib/api';
import { Card, Badge, Button, Empty, Skeleton, Modal, Textarea } from '@/components/ui';
import { fmtUSDC, relativeTime, formatDateTime, ORDER_STATUS_META } from '@/lib/utils';
import { ShoppingBag, Search, ChevronRight, Truck, X } from 'lucide-react';
import { toast } from 'sonner';

const STATUSES = [
  { value: '', label: 'All Orders' },
  { value: 'AWAITING_PAYMENT', label: 'Awaiting Payment' },
  { value: 'PAID',             label: 'Paid' },
  { value: 'DELIVERED',        label: 'Delivered' },
  { value: 'COMPLETED',        label: 'Completed' },
  { value: 'DISPUTED',         label: 'Disputed' },
  { value: 'REFUNDED',         label: 'Refunded' },
];

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const statusFilter = searchParams.get('status') || '';
  const [deliverModal, setDeliverModal] = useState(null); // { orderId, title }
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn:  () => ordersApi.list({ ...(statusFilter ? { status: statusFilter } : {}), limit: 50 }),
    refetchInterval: 30_000,
  });

  const markDelivered = useMutation({
    mutationFn: ({ id, notes }) => ordersApi.markDelivered(id, notes),
    onSuccess: () => {
      toast.success('Order marked as delivered');
      qc.invalidateQueries(['orders']);
      qc.invalidateQueries(['biz-stats']);
      setDeliverModal(null);
      setDeliveryNotes('');
    },
    onError: (err) => toast.error(err.message),
  });

  const ordersList = data?.orders || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-[#e8e8f0]">Orders</h1>
        <p className="text-sm text-[#7b7b9a] mt-1">Track and manage all incoming business orders.</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(({ value, label }) => {
          const meta = value ? ORDER_STATUS_META[value] : null;
          const active = statusFilter === value;
          return (
            <button
              key={value}
              onClick={() => setSearchParams(value ? { status: value } : {})}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
              style={active
                ? { background: meta ? meta.bg : '#00d97e1a', color: meta ? meta.color : '#00d97e', border: `1px solid ${meta ? meta.color : '#00d97e'}40` }
                : { background: '#13131e', color: '#4a4a6a', border: '1px solid #1e1e2e' }
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : ordersList.length === 0 ? (
          <Empty
            icon={ShoppingBag}
            title={statusFilter ? `No ${ORDER_STATUS_META[statusFilter]?.label || ''} orders` : 'No orders yet'}
            description="Orders from your customers will appear here."
          />
        ) : (
          <div className="divide-y divide-[#1e1e2e]">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_140px_120px_100px_48px] gap-4 px-5 py-3">
              {['Order', 'Customer', 'Amount', 'Status', ''].map(h => (
                <span key={h} className="text-xs font-semibold text-[#4a4a6a] uppercase tracking-wider">{h}</span>
              ))}
            </div>

            {ordersList.map(order => {
              const meta = ORDER_STATUS_META[order.status] || ORDER_STATUS_META.AWAITING_PAYMENT;
              return (
                <div
                  key={order.id}
                  className="grid grid-cols-[1fr_140px_120px_100px_48px] gap-4 items-center px-5 py-4 hover:bg-[#0f0f17] transition-colors"
                >
                  {/* Order info */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#e8e8f0] truncate">{order.title}</p>
                    <p className="text-xs text-[#4a4a6a] mt-0.5">
                      <span className="az-mono text-[#7b7b9a]">{order.orderRef}</span>
                      {' · '}{relativeTime(order.createdAt)}
                    </p>
                  </div>

                  {/* Customer */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-[#4f8ef71a] border border-[#4f8ef730] flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-[#4f8ef7] font-bold">
                        {(order.customer?.username || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-[#7b7b9a] truncate">{order.customer?.username || 'Unknown'}</span>
                  </div>

                  {/* Amount */}
                  <span className="text-sm font-bold text-[#e8e8f0] az-mono">{fmtUSDC(order.amountUsdc)}</span>

                  {/* Status */}
                  <Badge color={meta.color} bg={meta.bg}>{meta.label}</Badge>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 justify-end">
                    {order.status === 'PAID' && (
                      <button
                        title="Mark as delivered"
                        onClick={() => { setDeliverModal({ id: order.id, title: order.title }); setDeliveryNotes(''); }}
                        className="p-1.5 rounded-lg bg-[#00d97e1a] border border-[#00d97e30] text-[#00d97e] hover:bg-[#00d97e25] transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="p-1.5 rounded-lg hover:bg-[#1e1e2e] text-[#4a4a6a] hover:text-[#e8e8f0] transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Mark delivered modal */}
      <Modal
        open={!!deliverModal}
        onClose={() => setDeliverModal(null)}
        title="Mark Order as Delivered"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#7b7b9a]">
            You're confirming that <span className="text-[#e8e8f0] font-semibold">"{deliverModal?.title}"</span> has been delivered to the customer.
          </p>
          <p className="text-xs text-[#4a4a6a] bg-[#0f0f17] border border-[#2a2a3e] rounded-xl p-3">
            The customer will be notified and can confirm receipt to release the escrow payment to you.
          </p>
          <Textarea
            label="Delivery notes (optional)"
            placeholder="e.g. Delivered via WhatsApp, tracking number, or any notes for the customer..."
            value={deliveryNotes}
            onChange={e => setDeliveryNotes(e.target.value)}
            rows={3}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeliverModal(null)} className="flex-1">Cancel</Button>
            <Button
              onClick={() => markDelivered.mutate({ id: deliverModal.id, notes: deliveryNotes })}
              loading={markDelivered.isPending}
              className="flex-1"
            >
              <Truck className="w-4 h-4" /> Confirm Delivery
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
