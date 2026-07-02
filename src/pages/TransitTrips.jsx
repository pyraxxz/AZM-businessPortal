/**
 * TransitTrips — Trip management for transit/transport businesses.
 * Create, edit, and manage scheduled trips. Includes a visual seat map editor.
 *
 * Sentry-inspired design: data-dense table, widget stats, clean modal forms,
 * tactile interactions, placeholder loading states.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transit as transitApi } from '@/lib/marketplaceApi';
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
  SCHEDULED: { label: 'Scheduled', color: '#4f8ef7' },
  BOARDING: { label: 'Boarding', color: '#f59e0b' },
  DEPARTED: { label: 'Departed', color: '#a78bfa' },
  COMPLETED: { label: 'Completed', color: '#00d97e' },
  CANCELLED: { label: 'Cancelled', color: '#f43f5e' },
};

const BLANK_TRIP = {
  routeName: '',
  origin: '',
  destination: '',
  departureTime: '',
  vehiclePlate: '',
  vehicleType: 'BUS',
  totalSeats: 30,
  seatLayout: '2-2',
  fareUsdc: '',
  status: 'SCHEDULED',
};

const VEHICLE_TYPES = [
  { value: 'BUS', label: 'Bus' },
  { value: 'MINIVAN', label: 'Minivan' },
  { value: 'COACH', label: 'Coach' },
  { value: 'TAXI', label: 'Taxi' },
];

const SEAT_LAYOUTS = [
  { value: '2-2', label: '2-2 (4 per row)', seats: 40 },
  { value: '2-1', label: '2-1 (3 per row)', seats: 30 },
  { value: '3-2', label: '3-2 (5 per row)', seats: 45 },
  { value: '1-1', label: '1-1 (2 per row)', seats: 20 },
];

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

  const { data: statsData } = useQuery({
    queryKey: ['transit-stats'],
    queryFn: () => transitApi.list({ stats: true }),
  });

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
      departureTime: t.departureTime ? t.departureTime.slice(0, 16) : '',
      vehiclePlate: t.vehiclePlate || '',
      vehicleType: t.vehicleType || 'BUS',
      totalSeats: t.totalSeats || 30,
      seatLayout: t.seatLayout || '2-2',
      fareUsdc: String(t.fareUsdc || ''),
      status: t.status || 'SCHEDULED',
    });
    setFormError('');
    setModal(t);
  };
  const closeModal = () => { setModal(null); setFormError(''); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.routeName || !form.origin || !form.destination || !form.departureTime || !form.fareUsdc) {
      setFormError('Please fill in all required fields');
      return;
    }
    const payload = {
      ...form,
      fareUsdc: Number(form.fareUsdc),
      totalSeats: Number(form.totalSeats),
      departureTime: new Date(form.departureTime).toISOString(),
    };
    if (modal === 'create') createMut.mutate(payload);
    else updateMut.mutate({ id: modal.id, data: payload });
  };

  // Stats
  const totalTrips = trips.length;
  const activeTrips = trips.filter(t => ['SCHEDULED', 'BOARDING'].includes(t.status)).length;
  const totalBookings = trips.reduce((sum, t) => sum + (t.bookedSeats || 0), 0);
  const totalRevenue = trips.reduce((sum, t) => sum + (t.bookedSeats || 0) * (Number(t.fareUsdc) || 0), 0);

  const columns = [
    {
      key: 'route',
      label: 'Route',
      sortable: true,
      sortValue: (r) => r.routeName,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#4f8ef71a] border border-[#4f8ef730] flex items-center justify-center flex-shrink-0">
            <Route className="w-3.5 h-3.5 text-[#4f8ef7]" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[#e8e8f0] truncate">{r.routeName}</p>
            <p className="text-[#4a4a6a] text-[10px] truncate">{r.origin} → {r.destination}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'departure',
      label: 'Departure',
      sortable: true,
      sortValue: (r) => new Date(r.departureTime).getTime(),
      render: (r) => (
        <div className="flex flex-col">
          <span className="text-[#e8e8f0] font-medium">{formatDateTime(r.departureTime)}</span>
          <span className="text-[#4a4a6a] text-[10px]">{r.vehiclePlate} · {r.vehicleType}</span>
        </div>
      ),
    },
    {
      key: 'seats',
      label: 'Seats',
      sortable: true,
      sortValue: (r) => r.bookedSeats || 0,
      render: (r) => {
        const booked = r.bookedSeats || 0;
        const total = r.totalSeats || 0;
        const pct = total > 0 ? (booked / total) * 100 : 0;
        return (
          <div className="flex flex-col gap-1">
            <span className="text-[#e8e8f0] font-bold az-mono">{booked}/{total}</span>
            <div className="w-20 h-1.5 rounded-full bg-[#1e1e2e] overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct > 80 ? '#f59e0b' : '#00d97e' }} />
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
      render: (r) => <span className="text-[#e8e8f0] font-bold az-mono">{fmtUSDC(r.fareUsdc)}</span>,
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
            className="p-1.5 rounded-lg hover:bg-[#1e1e2e] text-[#4a4a6a] hover:text-[#4f8ef7] transition-colors"
            title="Edit seat map"
          >
            <Grid3x3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(r); }}
            className="p-1.5 rounded-lg hover:bg-[#1e1e2e] text-[#4a4a6a] hover:text-[#00d97e] transition-colors"
            title="Edit trip"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete trip "${r.routeName}"? This cannot be undone.`)) deleteMut.mutate(r.id);
            }}
            className="p-1.5 rounded-lg hover:bg-[#1e1e2e] text-[#4a4a6a] hover:text-[#f43f5e] transition-colors"
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
          <h1 className="text-xl font-bold text-[#e8e8f0] flex items-center gap-2">
            <Bus className="w-5 h-5 text-[#4f8ef7]" />
            Transit Trips
          </h1>
          <p className="text-sm text-[#7b7b9a] mt-1">Create and manage scheduled trips, seat maps, and bookings.</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4" /> New Trip
        </Button>
      </div>

      {/* Stats widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Widget title="Total Trips" icon={Bus} iconColor="#4f8ef7" loading={isLoading}>
          <WidgetStat value={fmt(totalTrips, 0)} label="All trips" />
        </Widget>
        <Widget title="Active" icon={Clock} iconColor="#f59e0b" loading={isLoading}>
          <WidgetStat value={fmt(activeTrips, 0)} label="Scheduled + boarding" color="#f59e0b" />
        </Widget>
        <Widget title="Bookings" icon={Users} iconColor="#a78bfa" loading={isLoading}>
          <WidgetStat value={fmt(totalBookings, 0)} label="Seats sold" color="#a78bfa" />
        </Widget>
        <Widget title="Revenue" icon={DollarSign} iconColor="#00d97e" loading={isLoading}>
          <WidgetStat value={fmtUSDC(totalRevenue)} label="From sold seats" color="#00d97e" />
        </Widget>
      </div>

      {/* Trips table */}
      <Widget title="All Trips" icon={Route} iconColor="#4f8ef7" className="p-0">
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
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f43f5e1a] border border-[#f43f5e40]">
              <AlertCircle className="w-4 h-4 text-[#f43f5e] flex-shrink-0" />
              <p className="text-xs text-[#f43f5e]">{formError}</p>
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
              value={form.departureTime}
              onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
            />
            <Input
              label="Fare (USDC) *"
              type="number"
              step="0.01"
              placeholder="25.00"
              value={form.fareUsdc}
              onChange={(e) => setForm({ ...form, fareUsdc: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Vehicle Plate"
              placeholder="e.g. GT-1234-22"
              value={form.vehiclePlate}
              onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })}
            />
            <Select
              label="Vehicle Type"
              value={form.vehicleType}
              onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
              options={VEHICLE_TYPES}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Seat Layout"
              value={form.seatLayout}
              onChange={(e) => {
                const layout = SEAT_LAYOUTS.find(l => l.value === e.target.value);
                setForm({ ...form, seatLayout: e.target.value, totalSeats: layout?.seats || 30 });
              }}
              options={SEAT_LAYOUTS}
            />
            <Input
              label="Total Seats"
              type="number"
              value={form.totalSeats}
              onChange={(e) => setForm({ ...form, totalSeats: e.target.value })}
            />
          </div>

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
function SeatMapEditor({ trip, onClose }) {
  const qc = useQueryClient();
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load seat map
  useQuery({
    queryKey: ['seat-map', trip.id],
    queryFn: async () => {
      try {
        const data = await transitApi.getSeatMap(trip.id);
        setSeats(data.seats || generateDefaultSeats(trip));
      } catch {
        setSeats(generateDefaultSeats(trip));
      }
      setLoading(false);
      return true;
    },
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await transitApi.updateSeatMap(trip.id, seats);
      toast.success('Seat map saved');
      qc.invalidateQueries(['transit-trips']);
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
            <div className="w-5 h-5 rounded-lg bg-[#00d97e1a] border border-[#00d97e40]" />
            <span className="text-xs text-[#7b7b9a]">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-lg bg-[#f59e0b1a] border border-[#f59e0b40]" />
            <span className="text-xs text-[#7b7b9a]">Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-lg bg-[#f43f5e1a] border border-[#f43f5e40]" />
            <span className="text-xs text-[#7b7b9a]">Blocked</span>
          </div>
        </div>

        {/* Bus outline */}
        <div className="rounded-2xl border-2 border-[#2a2a3e] p-4 mx-auto max-w-sm" style={{ background: '#0a0a0f' }}>
          {/* Driver */}
          <div className="flex justify-center mb-3">
            <div className="w-10 h-6 rounded-lg bg-[#1e1e2e] flex items-center justify-center text-[10px] text-[#4a4a6a] font-bold">
              DRIVER
            </div>
          </div>
          {/* Seats grid */}
          <div className="space-y-2">
            {renderSeatGrid(seats, trip.seatLayout, setSeats)}
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
        status: 'AVAILABLE',
      });
      if (num++ >= (trip.totalSeats || 30)) break;
    }
  }
  return seats;
}

function renderSeatGrid(seats, layout, setSeats) {
  const [left, right] = (layout || '2-2').split('-').map(Number);
  const perRow = left + right;
  const rows = Math.ceil(seats.length / perRow);

  const grid = [];
  for (let r = 0; r < rows; r++) {
    const rowSeats = seats.slice(r * perRow, (r + 1) * perRow);
    grid.push(
      <div key={r} className="flex items-center justify-center gap-1.5">
        {rowSeats.slice(0, left).map((s, i) => (
          <SeatButton key={`${r}-${i}`} seat={s} onClick={() => toggleSeat(s, seats, setSeats)} />
        ))}
        <div className="w-3" /> {/* Aisle */}
        {rowSeats.slice(left).map((s, i) => (
          <SeatButton key={`${r}-${i + left}`} seat={s} onClick={() => toggleSeat(s, seats, setSeats)} />
        ))}
      </div>
    );
  }
  return grid;
}

function toggleSeat(seat, seats, setSeats) {
  const next = seats.map(s => {
    if (s.seatId === seat.seatId) {
      const status = s.status === 'AVAILABLE' ? 'BLOCKED' : 'AVAILABLE';
      return { ...s, status };
    }
    return s;
  });
  setSeats(next);
}

function SeatButton({ seat, onClick }) {
  const colors = {
    AVAILABLE: { bg: '#00d97e1a', border: '#00d97e40', text: '#00d97e' },
    OCCUPIED: { bg: '#f59e0b1a', border: '#f59e0b40', text: '#f59e0b' },
    BLOCKED: { bg: '#f43f5e1a', border: '#f43f5e40', text: '#f43f5e' },
  };
  const c = colors[seat.status] || colors.AVAILABLE;
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all hover:scale-110"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
      title={`${seat.seatId} — ${seat.status}`}
    >
      {seat.seatId}
    </button>
  );
}
