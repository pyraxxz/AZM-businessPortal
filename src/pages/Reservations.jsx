/**
 * Reservations — Booking management for restaurants, hotels, services, and transit.
 * View, confirm, cancel, and mark no-shows. Business-type-aware columns.
 *
 * Sentry-inspired: data-dense table with status badges, widget stats,
 * inline actions, placeholder loading states.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservations as resApi } from '@/lib/marketplaceApi';
import { Widget, WidgetStat } from '@/components/ui/Widget';
import { DataTable } from '@/components/ui/DataTable';
import { Button, Badge, Modal, Input, Select } from '@/components/ui';
import { fmtUSDC, fmt, formatDateTime, cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { getTypeConfig } from '@/lib/businessTypes';
import { toast } from 'sonner';
import {
  CalendarCheck, Clock, Users, DollarSign, CheckCircle2,
  XCircle, UserX, Eye, AlertCircle, Calendar,
} from 'lucide-react';

const RESERVATION_STATUS = {
  PENDING:   { label: 'Pending',   color: 'var(--sn-amber)' },
  CONFIRMED: { label: 'Confirmed', color: 'var(--sn-blue)' },
  CHECKED_IN:{ label: 'Checked In', color: 'var(--sn-purple)' },
  COMPLETED: { label: 'Completed', color: 'var(--sn-purple)' },
  CANCELLED: { label: 'Cancelled', color: 'var(--sn-red)' },
  NO_SHOW:   { label: 'No-Show',   color: 'var(--sn-red)' },
};

export default function Reservations() {
  const qc = useQueryClient();
  const { bizProfile } = useAuth();
  const typeConfig = getTypeConfig(bizProfile);
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancelFor, setCancelFor] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Counter-propose state
  const [showCounterModal, setShowCounterModal] = useState(null);
  const [proposedTime, setProposedTime] = useState('');
  const [counterNote, setCounterNote] = useState('');

  const { data: resData, isLoading } = useQuery({
    queryKey: ['reservations', statusFilter],
    queryFn: () => resApi.list({ status: statusFilter !== 'all' ? statusFilter : undefined }),
  });
  const reservations = resData?.reservations || [];

  const { data: statsData } = useQuery({
    queryKey: ['reservation-stats'],
    queryFn: () => resApi.stats(),
  });
  const stats = statsData?.stats || {};

  const confirmMut = useMutation({
    mutationFn: (id) => resApi.confirm(id),
    onSuccess: () => { toast.success('Reservation confirmed'); qc.invalidateQueries(['reservations']); },
    onError: (e) => toast.error(e.message),
  });

  const cancelMut = useMutation({
    mutationFn: ({ id, reason }) => resApi.cancel(id, reason),
    onSuccess: () => { toast.success('Reservation cancelled'); qc.invalidateQueries(['reservations']); setCancelFor(null); setCancelReason(''); },
    onError: (e) => toast.error(e.message),
  });

  const noShowMut = useMutation({
    mutationFn: (id) => resApi.markNoShow(id),
    onSuccess: () => { toast.success('Marked as no-show'); qc.invalidateQueries(['reservations']); },
    onError: (e) => toast.error(e.message),
  });

  const handleCancel = () => {
    if (cancelFor) cancelMut.mutate({ id: cancelFor.id, reason: cancelReason });
  };

  const columns = [
    {
      key: 'customer',
      label: 'Customer',
      sortable: true,
      sortValue: (r) => r.customerName || r.azamanId || '',
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[var(--sn-blue)] border border-[#4f8ef730] flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-[var(--sn-blue)]">{(r.customerName || r.azamanId || '?').charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[var(--sn-text)] truncate">{r.customerName || 'Unknown'}</p>
            <p className="text-[var(--sn-text-muted)] text-[10px] truncate">{r.azamanId}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'booking',
      label: typeConfig.type === 'TRANSIT' ? 'Trip / Seats' : 'Date / Party',
      render: (r) => (
        <div className="flex flex-col">
          {typeConfig.type === 'TRANSIT' ? (
            <>
              <span className="text-[var(--sn-text)] font-medium truncate max-w-[160px]">{r.tripRoute || r.reference}</span>
              <span className="text-[var(--sn-text-muted)] text-[10px]">{r.seatIds?.join(', ') || '—'}</span>
            </>
          ) : (
            <>
              <span className="text-[var(--sn-text)] font-medium">{formatDateTime(r.scheduledFor || r.createdAt)}</span>
              <span className="text-[var(--sn-text-muted)] text-[10px]">{r.partySize ? `${r.partySize} guests` : r.reference}</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      sortValue: (r) => Number(r.amountUsdc) || 0,
      render: (r) => <span className="text-[var(--sn-text)] font-bold az-mono">{r.amountUsdc ? fmtUSDC(r.amountUsdc) : '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      sortValue: (r) => r.status,
      render: (r) => {
        const meta = RESERVATION_STATUS[r.status] || RESERVATION_STATUS.PENDING;
        return <Badge color={meta.color}>{meta.label}</Badge>;
      },
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex items-center gap-1">
          {r.status === 'PENDING' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); confirmMut.mutate(r.id); }}
                disabled={confirmMut.isPending}
                className="p-1.5 rounded-lg hover:bg-[var(--sn-border)] text-[var(--sn-text-muted)] hover:text-[var(--sn-purple)] transition-colors"
                title="Confirm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowCounterModal(r.id); }}
                className="rounded-md bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 hover:bg-amber-500/20"
              >
                Counter-Propose
              </button>
            </>
          )}
          {r.status === 'CONFIRMED' && (
            <button
              onClick={(e) => { e.stopPropagation(); noShowMut.mutate(r.id); }}
              disabled={noShowMut.isPending}
              className="p-1.5 rounded-lg hover:bg-[var(--sn-border)] text-[var(--sn-text-muted)] hover:text-[var(--sn-red)] transition-colors"
              title="Mark no-show"
            >
              <UserX className="w-3.5 h-3.5" />
            </button>
          )}
          {['PENDING', 'CONFIRMED'].includes(r.status) && (
            <button
              onClick={(e) => { e.stopPropagation(); setCancelFor(r); }}
              className="p-1.5 rounded-lg hover:bg-[var(--sn-border)] text-[var(--sn-text-muted)] hover:text-[var(--sn-red)] transition-colors"
              title="Cancel"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--sn-text)] flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-[var(--sn-purple)]" />
          Reservations
        </h1>
        <p className="text-sm text-[var(--sn-text-muted)] mt-1">
          {typeConfig.type === 'TRANSIT' ? 'Manage trip bookings and passenger reservations.' : 'Manage bookings, confirm reservations, and track no-shows.'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Widget title="Total" icon={Calendar} iconColor="var(--sn-blue)" loading={isLoading}>
          <WidgetStat value={fmt(stats.total || reservations.length, 0)} label="All reservations" />
        </Widget>
        <Widget title="Pending" icon={Clock} iconColor="var(--sn-amber)" loading={isLoading}>
          <WidgetStat value={fmt(stats.pending || 0, 0)} label="Awaiting confirmation" color="var(--sn-amber)" />
        </Widget>
        <Widget title="Checked In" icon={CheckCircle2} iconColor="var(--sn-purple)" loading={isLoading}>
          <WidgetStat value={fmt(stats.checkedIn || 0, 0)} label="Today" color="var(--sn-purple)" />
        </Widget>
        <Widget title="No-Shows" icon={UserX} iconColor="var(--sn-red)" loading={isLoading}>
          <WidgetStat value={fmt(stats.noShows || 0, 0)} label="Penalties applied" color="var(--sn-red)" />
        </Widget>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              statusFilter === s
                ? 'bg-[var(--sn-purple-subtle)] text-[var(--sn-purple)] border border-[#00d97e30]'
                : 'text-[var(--sn-text-muted)] hover:bg-[var(--sn-card)] border border-transparent'
            )}
          >
            {s === 'all' ? 'All' : RESERVATION_STATUS[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Reservations table */}
      <Widget title="All Reservations" icon={CalendarCheck} iconColor="var(--sn-purple)" className="p-0">
        <DataTable
          columns={columns}
          data={reservations}
          loading={isLoading}
          emptyMessage="No reservations yet"
          emptyDescription="Confirmed bookings from customers will appear here."
          emptyIcon={CalendarCheck}
          pageSize={15}
        />
      </Widget>

      {/* Cancel modal */}
      <Modal open={cancelFor !== null} onClose={() => setCancelFor(null)} title="Cancel Reservation" className="max-w-md">
        <div className="space-y-4">
          {cancelFor && (
            <div className="p-3 rounded-xl bg-[var(--az-black)] border border-[var(--sn-border)]">
              <p className="text-sm text-[var(--sn-text)] font-semibold">{cancelFor.customerName || cancelFor.azamanId}</p>
              <p className="text-xs text-[var(--sn-text-muted)] mt-0.5">{cancelFor.reference || cancelFor.tripRoute}</p>
            </div>
          )}
          <Input
            label="Cancellation Reason"
            placeholder="e.g. Customer request, scheduling conflict..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f43f5e10] border border-[var(--sn-red)]">
            <AlertCircle className="w-4 h-4 text-[var(--sn-red)] flex-shrink-0" />
            <p className="text-xs text-[var(--sn-red)]">Escrow will be refunded to the customer. No-show penalties will not apply.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleCancel} loading={cancelMut.isPending} className="flex-1">
              Confirm Cancellation
            </Button>
            <Button variant="secondary" onClick={() => setCancelFor(null)}>Close</Button>
          </div>
        </div>
      </Modal>

      {/* Counter-Propose Modal */}
      {showCounterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-[400px] rounded-xl bg-white p-6 dark:bg-[var(--sn-card)] border border-[var(--sn-border)] shadow-2xl">
            <h2 className="mb-4 text-xl font-bold text-[var(--sn-text)]">Propose Alternative Time</h2>
            <label className="text-xs text-[var(--sn-text-muted)] font-semibold mb-1 block">New Date & Time</label>
            <input
              type="datetime-local"
              value={proposedTime}
              onChange={(e) => setProposedTime(e.target.value)}
              className="mb-4 w-full rounded-lg border border-[var(--sn-border)] bg-[var(--az-black)] p-2.5 text-[var(--sn-text)] focus:border-[var(--sn-purple)] outline-none"
            />
            <label className="text-xs text-[var(--sn-text-muted)] font-semibold mb-1 block">Note to customer (optional)</label>
            <textarea
              value={counterNote}
              onChange={(e) => setCounterNote(e.target.value)}
              className="mb-6 w-full rounded-lg border border-[var(--sn-border)] bg-[var(--az-black)] p-2.5 text-[var(--sn-text)] focus:border-[var(--sn-purple)] outline-none resize-none"
              rows={3}
              placeholder="e.g. We are fully booked at that time, but can accommodate you earlier."
            />
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  try {
                    await resApi.counterPropose(showCounterModal, {
                      proposedStartDatetime: new Date(proposedTime).toISOString(),
                      businessNotes: counterNote,
                    });
                    setShowCounterModal(null);
                    qc.invalidateQueries(['reservations']);
                    toast.success('Counter proposal sent!');
                  } catch (e) {
                    toast.error(e.message);
                  }
                }}
                className="flex-1 rounded-xl bg-[var(--sn-purple)] py-2.5 font-bold text-[var(--az-black)] hover:bg-[#00c572] transition-colors"
              >
                Send Proposal
              </button>
              <button
                onClick={() => setShowCounterModal(null)}
                className="flex-1 rounded-xl border border-[var(--sn-border)] bg-transparent py-2.5 font-bold text-[var(--sn-text)] hover:bg-[var(--sn-border)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
