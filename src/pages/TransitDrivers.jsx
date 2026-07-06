import { useState, useEffect } from 'react';
import { transitOpsApi } from '@/lib/marketplaceApi';
import { Card, Button, Badge, Skeleton, Empty, Avatar } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { Users, Calendar, Bus, AlertCircle } from 'lucide-react';

export default function TransitDrivers() {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState(null);
  const [calendar, setCalendar] = useState(null);
  const [viewMonth] = useState(new Date().toISOString().slice(0, 7));

  const load = async () => {
    try {
      const [assignRes, calRes] = await Promise.all([
        transitOpsApi.drivers(),
        transitOpsApi.driverCalendar(viewMonth),
      ]);
      setAssignments(assignRes.data?.drivers || []);
      setCalendar(calRes.data?.days || []);
    } catch { toast.error('Failed to load driver data'); }
  };
  useEffect(() => { load(); }, []);

  if (!assignments) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--sn-text)]">Driver Rostering</h1>
        <p className="text-sm text-[var(--sn-text-muted)] mt-0.5">Assign drivers to trips and manage rotations</p>
      </div>

      {/* Calendar view */}
      {calendar?.length > 0 && (
        <Card>
          <h3 className="text-sm font-bold text-[var(--sn-text)] mb-3">This Month's Schedule</h3>
          <div className="grid grid-cols-7 gap-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <p key={d} className="text-[10px] text-center text-[var(--sn-text-muted)] font-bold uppercase pb-1">{d}</p>
            ))}
            {calendar.map(day => (
              <div key={day.date} className={`rounded-lg p-2 min-h-[60px] border ${day.hasAssignment ? 'border-[var(--sn-blue)]/30 bg-[var(--sn-blue)]/5' : 'border-[var(--sn-border)]'}`}>
                <p className="text-xs font-bold text-[var(--sn-text)]">{day.day}</p>
                {day.assignments?.map(a => (
                  <div key={a.id} className="mt-1 text-[10px] rounded px-1 py-0.5 bg-[var(--sn-blue)]/10 text-[var(--sn-blue)] truncate">
                    {a.driverName} → {a.route}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Driver list */}
      <div className="grid grid-cols-3 gap-4">
        {assignments.map(d => (
          <Card key={d.id}>
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={d.user?.fullName} size="md" online={d.onDuty} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[var(--sn-text)] truncate">{d.user?.fullName}</p>
                <p className="text-xs text-[var(--sn-text-muted)]">License: {d.licenseNumber || '—'}</p>
              </div>
              <Badge color={d.onDuty ? 'var(--sn-purple)' : 'var(--sn-text-muted)'}>{d.onDuty ? 'On Duty' : 'Off'}</Badge>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-[var(--sn-text-muted)]">Today's Route</span><span className="text-[var(--sn-text)] font-medium">{d.todayRoute || '—'}</span></div>
              <div className="flex justify-between"><span className="text-[var(--sn-text-muted)]">Vehicle</span><span className="text-[var(--sn-text)] font-medium">{d.vehicle?.licensePlate || '—'}</span></div>
              <div className="flex justify-between"><span className="text-[var(--sn-text-muted)]">Trips this week</span><span className="text-[var(--sn-text)] font-medium">{d.tripsThisWeek || 0}</span></div>
            </div>
          </Card>
        ))}
      </div>

      {assignments.length === 0 && <Empty icon={Users} title="No drivers assigned" description="Assign employees as drivers from the Employee page" />}
    </div>
  );
}
