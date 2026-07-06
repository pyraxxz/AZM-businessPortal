import { useState, useEffect } from 'react';
import { transitOpsApi } from '@/lib/marketplaceApi';
import { Card, Button, Badge, Skeleton, Empty, Modal, Input, Select } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { Bus, Plus, Wrench, Gauge, Calendar, CheckCircle2 } from 'lucide-react';

export default function TransitFleet() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ make: '', model: '', year: '', licensePlate: '', capacity: '', type: 'BUS' });

  const load = async () => {
    try {
      const [vehRes, maintRes] = await Promise.all([
        transitOpsApi.fleet(),
        transitOpsApi.maintenance({ status: 'SCHEDULED' }),
      ]);
      setVehicles(vehRes.data?.vehicles || []);
      setMaintenance(maintRes.data?.records || []);
    } catch { toast.error('Failed to load fleet data'); }
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    try { await transitOpsApi.createVehicle(form); toast.success('Vehicle added'); setAddOpen(false); load(); }
    catch { toast.error('Failed to add vehicle'); }
  };

  if (!vehicles) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--sn-text)]">Fleet Management</h1>
          <p className="text-sm text-[var(--sn-text-muted)] mt-0.5">Vehicles, maintenance schedules, and driver assignments</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4" /> Add Vehicle</Button>
      </div>

      {/* Maintenance alerts */}
      {maintenance?.length > 0 && (
        <Card className="border-[var(--sn-amber)]/30 bg-[var(--sn-amber)]/5">
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="w-4 h-4 text-[var(--sn-amber)]" />
            <span className="text-sm font-bold text-[var(--sn-text)]">Scheduled Maintenance ({maintenance.length})</span>
          </div>
          <div className="space-y-2">
            {maintenance.map(m => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Bus className="w-4 h-4 text-[var(--sn-text-muted)]" />
                  <span className="text-[var(--sn-text)]">{m.vehicle?.licensePlate}</span>
                  <span className="text-[var(--sn-text-muted)]">— {m.type} ({m.description})</span>
                </div>
                <Badge color="var(--sn-amber)">{new Date(m.scheduledDate).toLocaleDateString('en', { day: 'numeric', month: 'short' })}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Vehicle grid */}
      <div className="grid grid-cols-3 gap-4">
        {vehicles.map(v => (
          <Card key={v.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--sn-blue)]/10 border border-[var(--sn-blue)]/30 flex items-center justify-center">
                  <Bus className="w-5 h-5 text-[var(--sn-blue)]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--sn-text)]">{v.make} {v.model}</p>
                  <p className="text-xs text-[var(--sn-text-muted)]">{v.licensePlate || 'No plate'}</p>
                </div>
              </div>
              <Badge color={v.isActive ? 'var(--sn-purple)' : 'var(--sn-text-muted)'}>{v.isActive ? 'Active' : 'Inactive'}</Badge>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-[var(--sn-text-muted)]">Type</span><span className="text-[var(--sn-text)] font-medium">{v.type}</span></div>
              <div className="flex justify-between"><span className="text-[var(--sn-text-muted)]">Capacity</span><span className="text-[var(--sn-text)] font-medium">{v.capacity} seats</span></div>
              <div className="flex justify-between"><span className="text-[var(--sn-text-muted)]">Driver</span><span className="text-[var(--sn-text)] font-medium">{v.driverName || 'Unassigned'}</span></div>
              {v.odometer && <div className="flex justify-between"><span className="text-[var(--sn-text-muted)]">Odometer</span><span className="text-[var(--sn-text)] font-medium">{v.odometer.toLocaleString()} km</span></div>}
            </div>
          </Card>
        ))}
      </div>

      {vehicles.length === 0 && <Empty icon={Bus} title="No vehicles registered" />}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Vehicle">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Make" placeholder="Toyota" value={form.make} onChange={e => setForm({ ...form, make: e.target.value })} />
            <Input label="Model" placeholder="Coaster" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Year" type="number" placeholder="2024" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
            <Input label="License Plate" placeholder="GR-1234-24" value={form.licensePlate} onChange={e => setForm({ ...form, licensePlate: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              options={[{ value: 'BUS', label: 'Bus' }, { value: 'VAN', label: 'Van' }, { value: 'CAR', label: 'Car' }, { value: 'TRUCK', label: 'Truck' }]} />
            <Input label="Capacity" type="number" placeholder="30" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
          </div>
          <Button onClick={handleAdd} className="w-full">Add Vehicle</Button>
        </div>
      </Modal>
    </div>
  );
}
