/**
 * TransitTrips — Trip management for transit/transport businesses.
 * Create, edit, and manage scheduled trips. Includes a visual seat map editor.
 *
 * Sentry-inspired design: data-dense table, widget stats, clean modal forms,
 * tactile interactions, placeholder loading states.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transit as transitApi, transitOpsApi } from '@/lib/marketplaceApi';
import { Widget, WidgetStat, WidgetRow } from '@/components/ui/Widget';
import { DataTable } from '@/components/ui/DataTable';
import { Button, Badge, Input, Select, Modal, Empty, Skeleton } from '@/components/ui';
import { fmtUSDC, fmt, formatDateTime, cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Bus, Plus, Pencil, Trash2, Clock, MapPin, Users, DollarSign,
  Calendar, Route, Eye, Grid3x3, AlertCircle, CheckCircle2, XCircle,
} from 'lucide-react';

const TRIP_STATUS = {
  SCHEDULED: { label: 'Scheduled', color: 'var(--sn-blue)' },
  BOARDING: { label: 'Boarding', color: 'var(--sn-amber)' },
  DEPARTED: { label: 'Departed', color: 'var(--sn-purple)' },
  COMPLETED: { label: 'Completed', color: 'var(--sn-purple)' },
  CANCELLED: { label: 'Cancelled', color: 'var(--sn-red)' },
};

const BLANK_TRIP = {
  routeName: '',
  origin: '',
  destination: '',
  departureAt: '',
  arrivalAt: '',
  vehicleId: '',
  fareUsdc: '',
  status: 'SCHEDULED',
};

export default function TransitTrips() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // null | 'create' | { ...trip }
  const [form, setForm] = useState(BLANK_TRIP);
  const [formError, setFormError] = useState('');
  const [seatEditorFor, setSeatEditorFor] = useState(null);

  const { data: tripsData, isLoading } = useQuery({
    queryKey: ['transit-trips'],
    queryFn: () => transitApi.list(),
  });
  const trips = tripsData?.trips || [];

  // Backend: GET /api/business-os/transit/fleet -> { success, fleet: [...] }
  const { data: fleetData } = useQuery({
    queryKey: ['fleet-vehicles'],
    queryFn: () => transitOpsApi.fleet(),
  });
  const vehicles = fleetData?.fleet || [];
  const vehicleOptions = vehicles.map(v => ({
    value: v.id,
    label: `${v.make || ''} ${v.model || ''}`.trim() || v.type,
    sub: `${v.licensePlate || 'No plate'} · ${v.capacity} seats`,
  }));

  const createMut = useMutation({
    mutationFn: (d) => transitApi.create(d),
    onSuccess: () => { toast.success('Trip created'); qc.invalidateQueries(['transit-trips']); closeModal(); },
    onError: (e) => setFormError(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => transitApi.update(id, data),
    onSuccess: () => { toast.success('Trip updated'); qc.invalidateQueries(['transit-trips']); closeModal(); },
    onError: (e) => setFormError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => transitApi.remove(id),
    onSuccess: () => { toast.success('Trip deleted'); qc.invalidateQueries(['transit-trips']); },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => { setForm(BLANK_TRIP); setFormError(''); setModal('create'); };
  const openEdit = (t) => {
    setForm({
      routeName: t.routeName || '',
      origin: t.origin || '',
      destination: t.destination || '',
      departureAt: t.departureAt ? t.departureAt.slice(0, 16) : '',
      arrivalAt: t.arrivalAt ? t.arrivalAt.slice(0, 16) : '',
      vehicleId: t.vehicleId || t.vehicle?.id || '',
      fareUsdc: String(t.fareUsdc || ''),
      status: t.status || 'SCHEDULED',
    });
    setFormError('');
    setModal(t);
  };
  const closeModal = () => { setModal(null); setFormError(''); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.routeName || !form.origin || !form.destination || !form.departureAt || !form.fareUsdc) {
      setFormError('Please fill in all required fields');
      return;
    }
    if (modal === 'create' && !form.vehicleId) {
      setFormError('Please select a vehicle');
      return;
    }
    const payload = {
      routeName: form.routeName,
      origin: form.origin,
      destination: form.destination,
      departureAt: new Date(form.departureAt).toISOString(),
      arrivalAt: form.arrivalAt ? new Date(form.arrivalAt).toISOString() : null,
      fareUsdc: Number(form.fareUsdc),
      status: form.status,
    };
    if (modal === 'create') {
      // vehicleId is only accepted on create — it's immutable afterwards
      // (the seat map + any bookings are keyed to the original vehicle).
      createMut.mutate({ ...payload, vehicleId: form.vehicleId });
    } else {
      updateMut.mutate({ id: modal.id, data: payload });
    }
  };

  // Stats
  const totalTrips = trips.length;
  const activeTrips = trips.filter(t => ['SCHEDULED', 'BOARDING'].includes(t.status)).length;
  const totalBookings = trips.reduce((sum, t) => sum + (t._count?.seats || 0), 0);
  const totalRevenue = trips.reduce((sum, t) => sum + (t._count?.seats || 0) * (Number(t.fareUsdc) || 0), 0);

  const columns = [
    {
      key: 'route',
      label: 'Route',
      sortable: true,
      sortValue: (r) => r.routeName,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--sn-blue)] border border-[#4f8ef730] flex items-center justify-center flex-shrink-0">
            <Route className="w-3.5 h-3.5 text-[var(--sn-blue)]" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[var(--sn-text)] truncate">{r.routeName}</p>
            <p className="text-[var(--sn-text-muted)] text-[10px] truncate">{r.origin} → {r.destination}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'departure',
      label: 'Departure',
      sortable: true,
      sortValue: (r) => new Date(r.departureAt).getTime(),
      render: (r) => (
        <div className="flex flex-col">
          <span className="text-[var(--sn-text)] font-medium">{formatDateTime(r.departureAt)}</span>
          <span className="text-[var(--sn-text-muted)] text-[10px]">{r.vehicle?.licensePlate || 'No plate'} · {r.vehicle?.type || '—'}</span>
        </div>
      ),
    },
    {
      key: 'seats',
      label: 'Seats',
      sortable: true,
      sortValue: (r) => r._count?.seats || 0,
      render: (r) => {
        const booked = r._count?.seats || 0;
        const total = r.vehicle?.capacity || 0;
        const pct = total > 0 ? (booked / total) * 100 : 0;
        return (
          <div className="flex flex-col gap-1">
            <span className="text-[var(--sn-text)] font-bold az-mono">{booked}/{total}</span>
            <div className="w-20 h-1.5 rounded-full bg-[var(--sn-border)] overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct > 80 ? 'var(--sn-amber)' : 'var(--sn-purple)' }} />
            </div>
          </div>
        );
      },
    },
    {
      key: 'fare',
      label: 'Fare',
      sortable: true,
      sortValue: (r) => Number(r.fareUsdc) || 0,
      render: (r) => <span className="text-[var(--sn-text)] font-bold az-mono">{fmtUSDC(r.fareUsdc)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      sortValue: (r) => r.status,
      render: (r) => {
        const meta = TRIP_STATUS[r.status] || TRIP_STATUS.SCHEDULED;
        return <Badge color={meta.color}>{meta.label}</Badge>;
      },
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setSeatEditorFor(r); }}
            className="p-1.5 rounded-lg hover:bg-[var(--sn-border)] text-[var(--sn-text-muted)] hover:text-[var(--sn-blue)] transition-colors"
            title="Edit seat map"
          >
            <Grid3x3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(r); }}
            className="p-1.5 rounded-lg hover:bg-[var(--sn-border)] text-[var(--sn-text-muted)] hover:text-[var(--sn-purple)] transition-colors"
            title="Edit trip"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete trip "${r.routeName}"? This cannot be undone.`)) deleteMut.mutate(r.id);
            }}
            className="p-1.5 rounded-lg hover:bg-[var(--sn-border)] text-[var(--sn-text-muted)] hover:text-[var(--sn-red)] transition-colors"
            title="Delete trip"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--sn-text)] flex items-center gap-2">
            <Bus className="w-5 h-5 text-[var(--sn-blue)]" />
            Transit Trips
          </h1>
          <p className="text-sm text-[var(--sn-text-muted)] mt-1">Create and manage scheduled trips, seat maps, and bookings.</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4" /> New Trip
        </Button>
      </div>

      {/* Stats widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Widget title="Total Trips" icon={Bus} iconColor="var(--sn-blue)" loading={isLoading}>
          <WidgetStat value={fmt(totalTrips, 0)} label="All trips" />
        </Widget>
        <Widget title="Active" icon={Clock} iconColor="var(--sn-amber)" loading={isLoading}>
          <WidgetStat value={fmt(activeTrips, 0)} label="Scheduled + boarding" color="var(--sn-amber)" />
        </Widget>
        <Widget title="Bookings" icon={Users} iconColor="var(--sn-purple)" loading={isLoading}>
          <WidgetStat value={fmt(totalBookings, 0)} label="Seats sold" color="var(--sn-purple)" />
        </Widget>
        <Widget title="Revenue" icon={DollarSign} iconColor="var(--sn-purple)" loading={isLoading}>
          <WidgetStat value={fmtUSDC(totalRevenue)} label="From sold seats" color="var(--sn-purple)" />
        </Widget>
      </div>

      {/* Trips table */}
      <Widget title="All Trips" icon={Route} iconColor="var(--sn-blue)" className="p-0">
        <div className="p-0">
          <DataTable
            columns={columns}
            data={trips}
            loading={isLoading}
            emptyMessage="No trips created yet"
            emptyDescription="Create your first trip to start accepting bookings."
            emptyIcon={Bus}
            pageSize={10}
          />
        </div>
      </Widget>

      {/* Create/Edit modal */}
      <Modal open={modal !== null} onClose={closeModal} title={modal === 'create' ? 'Create New Trip' : 'Edit Trip'} className="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--sn-red)] border border-[var(--sn-red)]">
              <AlertCircle className="w-4 h-4 text-[var(--sn-red)] flex-shrink-0" />
              <p className="text-xs text-[var(--sn-red)]">{formError}</p>
            </div>
          )}

          <Input
            label="Route Name *"
            placeholder="e.g. Accra - Kumasi Express"
            value={form.routeName}
            onChange={(e) => setForm({ ...form, routeName: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Origin *"
              placeholder="e.g. Accra Central"
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
            />
            <Input
              label="Destination *"
              placeholder="e.g. Kumasi"
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Departure Time *"
              type="datetime-local"
              value={form.departureAt}
              onChange={(e) => setForm({ ...form, departureAt: e.target.value })}
            />
            <Input
              label="Arrival Time"
              type="datetime-local"
              value={form.arrivalAt}
              onChange={(e) => setForm({ ...form, arrivalAt: e.target.value })}
            />
          </div>

          <Input
            label="Fare (USDC) *"
            type="number"
            step="0.01"
            placeholder="25.00"
            value={form.fareUsdc}
            onChange={(e) => setForm({ ...form, fareUsdc: e.target.value })}
          />

          {modal === 'create' ? (
            vehicles.length > 0 ? (
              <Select
                label="Vehicle *"
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                options={[{ value: '', label: 'Select a vehicle...' }, ...vehicleOptions.map(v => ({ value: v.value, label: `${v.label} — ${v.sub}` }))]}
              />
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--sn-amber-subtle,rgba(245,158,11,0.12))] border border-[var(--sn-amber)]">
                <AlertCircle className="w-4 h-4 text-[var(--sn-amber)] flex-shrink-0" />
                <p className="text-xs text-[var(--sn-amber)]">Add a vehicle in Fleet Management first — a trip needs one.</p>
              </div>
            )
          ) : (
            <div className="p-3 rounded-xl bg-[var(--sn-border)]">
              <p className="text-xs text-[var(--sn-text-muted)]">Vehicle (fixed after creation)</p>
              <p className="text-sm text-[var(--sn-text)] font-medium mt-0.5">
                {modal?.vehicle ? `${modal.vehicle.make || ''} ${modal.vehicle.model || ''} — ${modal.vehicle.licensePlate || 'No plate'}`.trim() : '—'}
              </p>
            </div>
          )}

          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={Object.entries(TRIP_STATUS).map(([v, m]) => ({ value: v, label: m.label }))}
          />

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={createMut.isPending || updateMut.isPending} className="flex-1">
              {modal === 'create' ? 'Create Trip' : 'Save Changes'}
            </Button>
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Seat Map Editor */}
      {seatEditorFor && (
        <SeatMapEditor trip={seatEditorFor} onClose={() => setSeatEditorFor(null)} />
      )}
    </div>
  );
}

// ── Seat Map Editor ──────────────────────────────────────────────────────────
const SEAT_TIERS = ['ECONOMY', 'STANDARD', 'VIP'];
const TIER_COLORS = {
  ECONOMY:  { bg: 'var(--sn-purple-subtle)', border: 'var(--sn-purple)', text: 'var(--sn-purple)' },
  STANDARD: { bg: 'var(--sn-blue-subtle, rgba(59,130,246,0.15))', border: 'var(--sn-blue, #3b82f6)', text: 'var(--sn-blue, #3b82f6)' },
  VIP:      { bg: 'var(--sn-amber-subtle, rgba(245,158,11,0.15))', border: 'var(--sn-amber)', text: 'var(--sn-amber)' },
};

function SeatMapEditor({ trip, onClose }) {
  const qc = useQueryClient();
  const [seats, setSeats] = useState([]);
  const [tierFares, setTierFares] = useState({});
  const [flatFareUsdc, setFlatFareUsdc] = useState(trip.fareUsdc ?? 0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load seat map — real response shape is { seatMap, bookedSeats, rows, cols, tierFares, fareUsdc }
  useQuery({
    queryKey: ['seat-map', trip.id],
    queryFn: async () => {
      try {
        const data = await transitApi.getSeatMap(trip.id);
        const layout = data.seatMap?.layout;
        const bookedIds = new Set((data.bookedSeats || []).map(b => b.seatId));
        if (Array.isArray(layout) && layout.length) {
          setSeats(layout.map(s => ({
            ...s,
            status: bookedIds.has(s.seatId) ? 'OCCUPIED' : (s.status === 'BLOCKED' ? 'BLOCKED' : 'AVAILABLE'),
          })));
        } else {
          setSeats(generateDefaultSeats(trip));
        }
        setTierFares(data.tierFares || {});
        if (data.fareUsdc != null) setFlatFareUsdc(data.fareUsdc);
      } catch {
        setSeats(generateDefaultSeats(trip));
      }
      setLoading(false);
      return true;
    },
  });

  // Click cycle: ECONOMY -> STANDARD -> VIP -> BLOCKED -> ECONOMY. Occupied seats are locked.
  const cycleTier = (seatId) => {
    setSeats(prev => prev.map(s => {
      if (s.seatId !== seatId || s.status === 'OCCUPIED') return s;
      if (s.status === 'BLOCKED') {
        return { ...s, status: 'AVAILABLE', tier: 'ECONOMY' };
      }
      const cur = SEAT_TIERS.indexOf(s.tier || 'ECONOMY');
      if (cur === SEAT_TIERS.length - 1) {
        return { ...s, status: 'BLOCKED' };
      }
      return { ...s, status: 'AVAILABLE', tier: SEAT_TIERS[cur + 1] };
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const rows = Math.max(...seats.map(s => s.row || 1), 1);
      const cols = Math.max(...seats.map(s => s.col || 1), 1);
      // Backend expects { layout, rows, cols, tierFares } — layout is the seat array itself.
      await transitApi.updateSeatMap(trip.id, { layout: seats, rows, cols, tierFares });
      toast.success('Seat map saved');
      qc.invalidateQueries(['transit-trips']);
      qc.invalidateQueries(['seat-map', trip.id]);
      onClose();
    } catch (e) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  if (loading) return <Modal open onClose={onClose} title="Seat Map Editor"><Skeleton className="h-64" /></Modal>;

  return (
    <Modal open onClose={onClose} title={`Seat Map — ${trip.routeName}`} className="max-w-2xl">
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-lg bg-[var(--sn-amber)] border border-[var(--sn-amber)]" />
            <span className="text-xs text-[var(--sn-text-muted)]">Occupied (locked)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-lg bg-[var(--sn-red)] border border-[var(--sn-red)]" />
            <span className="text-xs text-[var(--sn-text-muted)]">Blocked</span>
          </div>
          <span className="text-xs text-[var(--sn-text-muted)] ml-auto">Click a seat to cycle its tier · click legend below to block/unblock</span>
        </div>

        {/* Tier legend / fare inputs */}
        <div className="rounded-lg border bg-card p-3 flex flex-wrap items-center gap-4">
          {SEAT_TIERS.map(tier => (
            <div key={tier} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg" style={{ background: TIER_COLORS[tier].bg, border: `1px solid ${TIER_COLORS[tier].border}` }} />
              <span className="text-xs font-medium text-foreground">{tier}</span>
              <input
                type="number" min="0" step="0.01"
                placeholder={String(flatFareUsdc)}
                value={tierFares[tier] ?? ''}
                onChange={(e) => setTierFares(prev => ({ ...prev, [tier]: e.target.value === '' ? undefined : parseFloat(e.target.value) }))}
                className="w-20 px-2 py-1 rounded border border-input text-xs"
              />
              <span className="text-[10px] text-muted-foreground">USDC</span>
            </div>
          ))}
        </div>

        {/* Bus outline */}
        <div className="rounded-2xl border-2 border-[var(--sn-border)] p-4 mx-auto max-w-sm" style={{ background: 'var(--az-black)' }}>
          {/* Driver */}
          <div className="flex justify-center mb-3">
            <div className="w-10 h-6 rounded-lg bg-[var(--sn-border)] flex items-center justify-center text-[10px] text-[var(--sn-text-muted)] font-bold">
              DRIVER
            </div>
          </div>
          {/* Seats grid */}
          <div className="space-y-2">
            {renderSeatGrid(seats, trip.seatLayout, setSeats, cycleTier)}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSave} loading={saving} className="flex-1">Save Seat Map</Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

function generateDefaultSeats(trip) {
  const [left, right] = (trip.seatLayout || '2-2').split('-').map(Number);
  const perRow = left + right;
  const rows = Math.ceil((trip.totalSeats || 30) / perRow);
  const seats = [];
  let num = 1;
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= perRow; c++) {
      seats.push({
        seatId: `${r}${String.fromCharCode(64 + c)}`,
        row: r,
        col: c,
        type: c <= left ? 'WINDOW' : 'AISLE',
        tier: 'ECONOMY',
        status: 'AVAILABLE',
      });
      if (num++ >= (trip.totalSeats || 30)) break;
    }
  }
  return seats;
}

function renderSeatGrid(seats, layout, setSeats, cycleTier) {
  const [left, right] = (layout || '2-2').split('-').map(Number);
  const perRow = left + right;
  const rows = Math.ceil(seats.length / perRow);

  const grid = [];
  for (let r = 0; r < rows; r++) {
    const rowSeats = seats.slice(r * perRow, (r + 1) * perRow);
    grid.push(
      <div key={r} className="flex items-center justify-center gap-1.5">
        {rowSeats.slice(0, left).map((s, i) => (
          <SeatButton key={`${r}-${i}`} seat={s} onClick={() => cycleTier(s.seatId)} />
        ))}
        <div className="w-3" /> {/* Aisle */}
        {rowSeats.slice(left).map((s, i) => (
          <SeatButton key={`${r}-${i + left}`} seat={s} onClick={() => cycleTier(s.seatId)} />
        ))}
      </div>
    );
  }
  return grid;
}

function SeatButton({ seat, onClick }) {
  const isOccupied = seat.status === 'OCCUPIED';
  const isBlocked = seat.status === 'BLOCKED';
  const c = isOccupied
    ? { bg: 'var(--sn-amber)', border: 'var(--sn-amber)', text: 'var(--sn-amber)' }
    : isBlocked
      ? { bg: 'var(--sn-red)', border: 'var(--sn-red)', text: 'var(--sn-red)' }
      : (TIER_COLORS[seat.tier || 'ECONOMY'] || TIER_COLORS.ECONOMY);
  return (
    <button
      onClick={onClick}
      disabled={isOccupied}
      className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${isOccupied ? 'cursor-not-allowed opacity-80' : 'hover:scale-110'}`}
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
      title={`${seat.seatId} — ${isOccupied ? 'Occupied' : isBlocked ? 'Blocked' : (seat.tier || 'ECONOMY')} (click to cycle tier: Economy → Standard → VIP → Blocked)`}
    >
      {seat.seatId}
    </button>
  );
}
