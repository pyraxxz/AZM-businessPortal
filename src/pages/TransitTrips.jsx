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
  Calendar, Route, Eye, Grid3x3, AlertCircle, CheckCircle2, XCircle, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';

const TRIP_STATUS = {
  SCHEDULED: { label: 'Scheduled', color: 'var(--sn-blue)' },
  BOARDING: { label: 'Boarding', color: 'var(--sn-amber)' },
  DEPARTED: { label: 'Departed', color: 'var(--sn-purple)' },
  COMPLETED: { label: 'Completed', color: 'var(--sn-purple)' },
  CANCELLED: { label: 'Cancelled', color: 'var(--sn-red)' },
  DELAYED: { label: 'Delayed', color: 'var(--sn-red)' }
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

  // Module 05: Route Templates & Cancellation Preview states
  const [templatesExpanded, setTemplatesExpanded] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [generateTripsOpen, setGenerateTripsOpen] = useState(false);
  const [cancelPreviewOpen, setCancelPreviewOpen] = useState(false);
  const [selectedTripToCancel, setSelectedTripToCancel] = useState(null);
  const [cancellationPreviewData, setCancellationPreviewData] = useState(null);
  
  // Delay / ETA state
  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [selectedTripForDelay, setSelectedTripForDelay] = useState(null);
  const [delayForm, setFormDelay] = useState({ delayMins: '', eta: '' });

  // Route template form
  const [templateForm, setTemplateForm] = useState({
    name: '',
    origin: '',
    destination: '',
    typicalFareUsdc: '',
    durationMins: '',
    departureTimes: '',
    vehicleId: ''
  });

  // Trip Generation Form
  const [genForm, setGenForm] = useState({
    templateId: '',
    startDate: '',
    daysAhead: '7'
  });

  // Fetch trips
  const { data: tripsData, isLoading } = useQuery({
    queryKey: ['transit-trips'],
    queryFn: () => transitApi.list(),
  });
  const trips = tripsData?.trips || [];

  // Fetch Fleet
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

  // Fetch Route Templates
  const { data: templatesData, refetch: refetchTemplates } = useQuery({
    queryKey: ['route-templates'],
    queryFn: () => transitOpsApi.routeTemplates(),
  });
  const templates = templatesData?.templates || [];

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
      createMut.mutate({ ...payload, vehicleId: form.vehicleId });
    } else {
      updateMut.mutate({ id: modal.id, data: payload });
    }
  };

  // Route Templates Submissions
  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...templateForm,
        typicalFareUsdc: Number(templateForm.typicalFareUsdc),
        durationMins: Number(templateForm.durationMins)
      };
      await transitOpsApi.createRouteTemplate(payload);
      toast.success('Route template created successfully');
      setTemplateModalOpen(false);
      setTemplateForm({ name: '', origin: '', destination: '', typicalFareUsdc: '', durationMins: '', departureTimes: '', vehicleId: '' });
      refetchTemplates();
    } catch (err) {
      toast.error('Failed to create route template');
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Are you sure you want to delete this route template?')) return;
    try {
      await transitOpsApi.deleteRouteTemplate(id);
      toast.success('Route template deleted');
      refetchTemplates();
    } catch (err) {
      toast.error('Failed to delete template');
    }
  };

  const handleGenerateTrips = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        templateId: genForm.templateId,
        startDate: new Date(genForm.startDate).toISOString(),
        daysAhead: Number(genForm.daysAhead)
      };
      await transitOpsApi.generateTrips(payload);
      toast.success('Trips generated successfully');
      setGenerateTripsOpen(false);
      qc.invalidateQueries(['transit-trips']);
    } catch (err) {
      toast.error('Failed to generate trips');
    }
  };

  // Trip Cancellation & Refund Preview
  const handleRequestCancel = async (trip) => {
    setSelectedTripToCancel(trip);
    try {
      // Direct call to simulate / get cancellations count or fetch affected bookings
      // In real backend, cancelTrip returns { success, cancelledBookings: Array, bookings: Array }
      const res = await transitOpsApi.cancelTrip(trip.id);
      setCancellationPreviewData(res);
      setCancelPreviewOpen(true);
    } catch (err) {
      toast.error('Failed to pre-check trip cancellation');
    }
  };

  const confirmTripCancellation = async () => {
    if (!selectedTripToCancel) return;
    try {
      await transitOpsApi.cancelTrip(selectedTripToCancel.id);
      toast.success('Trip cancelled and refunds processed');
      setCancelPreviewOpen(false);
      setSelectedTripToCancel(null);
      qc.invalidateQueries(['transit-trips']);
    } catch (err) {
      toast.error('Failed to complete trip cancellation');
    }
  };

  // Delay Mark with New ETA
  const openDelayModal = (trip) => {
    setSelectedTripForDelay(trip);
    setFormDelay({
      delayMins: '30',
      eta: trip.arrivalAt ? new Date(new Date(trip.arrivalAt).getTime() + 30 * 60000).toISOString().slice(0, 16) : ''
    });
    setDelayModalOpen(true);
  };

  const handleMarkDelayed = async (e) => {
    e.preventDefault();
    if (!selectedTripForDelay) return;
    try {
      const newArrival = delayForm.eta ? new Date(delayForm.eta).toISOString() : undefined;
      await transitApi.update(selectedTripForDelay.id, {
        status: 'DELAYED',
        arrivalAt: newArrival,
        routeName: `${selectedTripForDelay.routeName} (Delayed ${delayForm.delayMins}m)`
      });
      toast.success('Trip marked as DELAYED with updated ETA');
      setDelayModalOpen(false);
      qc.invalidateQueries(['transit-trips']);
    } catch (err) {
      toast.error('Failed to update trip delay info');
    }
  };

  // Stats
  const totalTrips = trips.length;
  const activeTrips = trips.filter(t => ['SCHEDULED', 'BOARDING', 'DELAYED'].includes(t.status)).length;
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
      label: 'Departure & ETA',
      sortable: true,
      sortValue: (r) => new Date(r.departureAt).getTime(),
      render: (r) => (
        <div className="flex flex-col">
          <span className="text-[var(--sn-text)] font-medium">{formatDateTime(r.departureAt)}</span>
          {r.arrivalAt && (
            <span className="text-[var(--sn-text-muted)] text-[10px]">
              ETA: {formatDateTime(r.arrivalAt)}
            </span>
          )}
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
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); setSeatEditorFor(r); }}
            className="p-1.5 rounded-lg hover:bg-[var(--sn-border)] text-[var(--sn-text-muted)] hover:text-[var(--sn-blue)] transition-colors"
            title="Edit seat map"
          >
            <Grid3x3 className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); openDelayModal(r); }}
            className="p-1.5 rounded-lg hover:bg-[var(--sn-border)] text-[var(--sn-text-muted)] hover:text-[var(--sn-amber)] transition-colors"
            title="Mark Delay / ETA"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); openEdit(r); }}
            className="p-1.5 rounded-lg hover:bg-[var(--sn-border)] text-[var(--sn-text-muted)] hover:text-[var(--sn-purple)] transition-colors"
            title="Edit trip"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); handleRequestCancel(r); }}
            className="p-1.5 rounded-lg hover:bg-[var(--sn-border)] text-[var(--sn-text-muted)] hover:text-[var(--sn-red)] transition-colors"
            title="Cancel Trip & Refunds"
          >
            <XCircle className="w-3.5 h-3.5" />
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
      <div className="flex items-start justify-between border-b border-[var(--sn-border)] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sn-text)] flex items-center gap-2">
            <Bus className="w-5 h-5 text-[var(--sn-blue)]" />
            Transit Trips Console
          </h1>
          <p className="text-sm text-[var(--sn-text-muted)] mt-1">Schedule and status-track commercial runs, templates, cancellations, and visual layouts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setTemplatesExpanded(!templatesExpanded)} variant="secondary" size="sm">
            Route Templates {templatesExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </Button>
          <Button onClick={openCreate} size="sm">
            <Plus className="w-4 h-4 mr-1" /> New Trip
          </Button>
        </div>
      </div>

      {/* Collapsible Route Templates Section */}
      {templatesExpanded && (
        <Card className="border-[var(--sn-purple)]/20 bg-black/20 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--sn-border)] pb-3">
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-[var(--sn-purple)]" />
              <h2 className="text-sm font-bold text-[var(--sn-text)]">Recurring Route Templates</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setGenerateTripsOpen(true)}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Batch-Generate Trips
              </Button>
              <Button size="sm" onClick={() => setTemplateModalOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Create Template
              </Button>
            </div>
          </div>

          {templates.length === 0 ? (
            <p className="text-xs text-[var(--sn-text-muted)] py-4 text-center">No route templates found. Create template patterns to batch schedule recurring schedules.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(t => (
                <div key={t.id} className="p-3.5 rounded-xl bg-[var(--sn-card)] border border-[var(--sn-border)] relative group">
                  <button onClick={() => handleDeleteTemplate(t.id)} className="absolute top-3.5 right-3.5 p-1 rounded hover:bg-red-500/10 text-[var(--sn-text-muted)] hover:text-[var(--sn-red)] transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <p className="font-bold text-xs text-[var(--sn-text)]">{t.name}</p>
                  <p className="text-[10px] text-[var(--sn-text-muted)] mt-0.5">{t.origin} → {t.destination}</p>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-[var(--sn-text-muted)]">
                    <span>Est: {t.durationMins} mins</span>
                    <span className="text-[var(--sn-green)] font-bold">${t.typicalFareUsdc} USDC</span>
                  </div>
                  <div className="mt-2 text-[10px] text-[var(--sn-text-muted)]">
                    <span className="font-bold block text-[8px] uppercase tracking-wider text-purple-400">Scheduled times:</span>
                    <span className="font-mono">{t.departureTimes || '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Stats widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Widget title="Total Trips" icon={Bus} iconColor="var(--sn-blue)" loading={isLoading}>
          <WidgetStat value={fmt(totalTrips, 0)} label="All trips" />
        </Widget>
        <Widget title="Active" icon={Clock} iconColor="var(--sn-amber)" loading={isLoading}>
          <WidgetStat value={fmt(activeTrips, 0)} label="Scheduled + Delayed" color="var(--sn-amber)" />
        </Widget>
        <Widget title="Bookings" icon={Users} iconColor="var(--sn-purple)" loading={isLoading}>
          <WidgetStat value={fmt(totalBookings, 0)} label="Assigned seats" color="var(--sn-purple)" />
        </Widget>
        <Widget title="Estimated Revenue" icon={DollarSign} iconColor="var(--sn-green)" loading={isLoading}>
          <WidgetStat value={fmtUSDC(totalRevenue)} label="Based on booked seats" color="var(--sn-green)" />
        </Widget>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <Skeleton className="h-96" />
      ) : trips.length === 0 ? (
        <Empty icon={Bus} title="No trips scheduled" description="Use Route Templates or create custom schedules to get started." />
      ) : (
        <Card className="p-0 overflow-hidden">
          <DataTable columns={columns} data={trips} />
        </Card>
      )}

      {/* Modal - Create/Edit Trip */}
      <Modal open={!!modal} onClose={closeModal} title={modal === 'create' ? 'Schedule New Run' : 'Edit Scheduled Run'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-[var(--sn-red)] text-xs text-[var(--sn-red)]">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <Input
            label="Route / Identifier *"
            placeholder="Express Accra to Kumasi"
            value={form.routeName}
            onChange={(e) => setForm({ ...form, routeName: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Origin *"
              placeholder="Accra Terminal"
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
            />
            <Input
              label="Destination *"
              placeholder="Kumasi Central"
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Departure *"
              type="datetime-local"
              value={form.departureAt}
              onChange={(e) => setForm({ ...form, departureAt: e.target.value })}
            />
            <Input
              label="Arrival ETA"
              type="datetime-local"
              value={form.arrivalAt}
              onChange={(e) => setForm({ ...form, arrivalAt: e.target.value })}
            />
          </div>

          <Input
            label="Fare (USDC) *"
            type="number"
            min="0"
            step="0.01"
            placeholder="15.00"
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
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--sn-amber)]/10 border border-[var(--sn-amber)]">
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

      {/* Modal - Route Template Creation */}
      <Modal open={templateModalOpen} onClose={() => setTemplateModalOpen(false)} title="Create Route Pattern Template">
        <form onSubmit={handleCreateTemplate} className="space-y-4">
          <Input label="Template Name *" placeholder="Accra-Kumasi Daily" value={templateForm.name} onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Origin *" placeholder="Accra" value={templateForm.origin} onChange={e => setTemplateForm({ ...templateForm, origin: e.target.value })} />
            <Input label="Destination *" placeholder="Kumasi" value={templateForm.destination} onChange={e => setTemplateForm({ ...templateForm, destination: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fare (USDC) *" type="number" placeholder="25" value={templateForm.typicalFareUsdc} onChange={e => setTemplateForm({ ...templateForm, typicalFareUsdc: e.target.value })} />
            <Input label="Duration (Mins) *" type="number" placeholder="240" value={templateForm.durationMins} onChange={e => setTemplateForm({ ...templateForm, durationMins: e.target.value })} />
          </div>
          <Input label="Departure Times (comma separated) *" placeholder="08:00, 14:00, 19:30" value={templateForm.departureTimes} onChange={e => setTemplateForm({ ...templateForm, departureTimes: e.target.value })} />
          <Select label="Template Vehicle" value={templateForm.vehicleId} onChange={e => setTemplateForm({ ...templateForm, vehicleId: e.target.value })}
            options={[{ value: '', label: 'Unassigned template vehicle' }, ...vehicleOptions.map(v => ({ value: v.value, label: v.label }))]} />
          
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setTemplateModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Template</Button>
          </div>
        </form>
      </Modal>

      {/* Modal - Batch Generate Trips */}
      <Modal open={generateTripsOpen} onClose={() => setGenerateTripsOpen(false)} title="Batch-Generate Runs From Templates">
        <form onSubmit={handleGenerateTrips} className="space-y-4">
          <Select label="Select Route Pattern *" value={genForm.templateId} onChange={e => setGenForm({ ...genForm, templateId: e.target.value })}
            options={[{ value: '', label: 'Select templates...' }, ...templates.map(t => ({ value: t.id, label: t.name }))]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date *" type="date" value={genForm.startDate} onChange={e => setGenForm({ ...genForm, startDate: e.target.value })} />
            <Input label="Days Ahead *" type="number" value={genForm.daysAhead} onChange={e => setGenForm({ ...genForm, daysAhead: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setGenerateTripsOpen(false)}>Cancel</Button>
            <Button type="submit">Generate Schedules</Button>
          </div>
        </form>
      </Modal>

      {/* Modal - Cancellation Refund Preview & Confirmation */}
      <Modal open={cancelPreviewOpen} onClose={() => setCancelPreviewOpen(false)} title="Confirm Trip Cancellation & Refunds">
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Irreversible Action Warning</p>
              <p className="mt-0.5">Cancelling trip "{selectedTripToCancel?.routeName}" will auto-void all seat bookings, generate passenger notifications, and process platform refund payouts.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--sn-border)] bg-black/20 space-y-3">
            <p className="font-semibold text-xs border-b border-[var(--sn-border)] pb-2 uppercase tracking-wide">Cancellation Impact Breakdown</p>
            <div className="flex justify-between">
              <span>Affected Bookings Count</span>
              <span className="font-bold text-[var(--sn-text)]">{cancellationPreviewData?.cancelledBookings || cancellationPreviewData?.bookings?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Expected Cash Refund (USDC)</span>
              <span className="font-bold text-[var(--sn-red)]">
                {fmtUSDC((cancellationPreviewData?.bookings?.length || 0) * (Number(selectedTripToCancel?.fareUsdc) || 0))}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setCancelPreviewOpen(false); setSelectedTripToCancel(null); }}>Keep Trip Active</Button>
            <Button variant="danger" className="bg-[var(--sn-red)] text-white hover:bg-red-700" onClick={confirmTripCancellation}>Confirm Cancellation</Button>
          </div>
        </div>
      </Modal>

      {/* Modal - Mark Trip Delayed */}
      <Modal open={delayModalOpen} onClose={() => setDelayModalOpen(false)} title="Mark Trip as Delayed">
        <form onSubmit={handleMarkDelayed} className="space-y-4 text-xs">
          <p className="text-[var(--sn-text-muted)]">Input total minutes delayed. An updated arrival ETA estimate is pushed to booking alerts.</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Delay (Minutes) *" type="number" value={delayForm.delayMins} onChange={e => setFormDelay({ ...delayForm, delayMins: e.target.value })} />
            <Input label="New Estimated Arrival Time (ETA)" type="datetime-local" value={delayForm.eta} onChange={e => setFormDelay({ ...delayForm, eta: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setDelayModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-[var(--sn-amber)] text-black">Update Route Delay</Button>
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
  ECONOMY:  { bg: 'var(--sn-purple-subtle, rgba(147,51,234,0.12))', border: 'var(--sn-purple)', text: 'var(--sn-purple)' },
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

  // Load seat map
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
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-lg bg-[var(--sn-amber)] border border-[var(--sn-amber)]" />
            <span className="text-[var(--sn-text-muted)]">Occupied (locked)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-lg bg-[var(--sn-red)] border border-[var(--sn-red)]" />
            <span className="text-[var(--sn-text-muted)]">Blocked</span>
          </div>
          <span className="text-[var(--sn-text-muted)] ml-auto">Click a seat to cycle its tier · click legend below to block/unblock</span>
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
  const totalSeats = trip.vehicle?.capacity || trip.totalSeats || 30;
  const [left, right] = (trip.seatLayout || '2-2').split('-').map(Number);
  const perRow = left + right;
  const rows = Math.ceil(totalSeats / perRow);
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
      if (num++ >= totalSeats) break;
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
    : TIER_COLORS[seat.tier || 'ECONOMY'];

  return (
    <button
      disabled={isOccupied}
      onClick={onClick}
      className={cn(
        "w-8 h-8 rounded-lg border flex flex-col items-center justify-center text-[10px] font-bold transition-all relative",
        isOccupied && "cursor-not-allowed opacity-80"
      )}
      style={{
        background: c.bg,
        borderColor: c.border,
        color: isOccupied || isBlocked ? '#000000' : 'var(--sn-text)'
      }}
    >
      <span>{seat.seatId}</span>
    </button>
  );
}
