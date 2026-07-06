import { useState, useEffect } from 'react';
import { hotelApi } from '@/lib/marketplaceApi';
import { Card, Button, Badge, Skeleton, Empty, Avatar } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { Sparkles, Bath, CheckCircle2, Search, Camera } from 'lucide-react';

const COLUMNS = [
  { key: 'PENDING', label: 'Pending', color: 'var(--sn-text-muted)', icon: Sparkles },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'var(--sn-amber)', icon: Bath },
  { key: 'COMPLETED', label: 'Completed', color: 'var(--sn-blue)', icon: CheckCircle2 },
  { key: 'INSPECTED', label: 'Inspected', color: 'var(--sn-purple)', icon: Search },
];

export default function HotelHousekeeping() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState(null);

  const load = async () => {
    try { const res = await hotelApi.housekeeping({ date: new Date().toISOString().split('T')[0] }); setTasks(res.data?.tasks || []); }
    catch { toast.error('Failed to load housekeeping tasks'); }
  };
  useEffect(() => { load(); }, []);

  const advance = async (task) => {
    const order = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'INSPECTED'];
    const next = order[(order.indexOf(task.status) + 1) % order.length];
    try { await hotelApi.updateHousekeepingStatus(task.id, next); toast.success(`Task → ${next}`); load(); }
    catch { toast.error('Failed to update task'); }
  };

  if (!tasks) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--sn-text)]">Housekeeping Board</h1>
        <p className="text-sm text-[var(--sn-text-muted)] mt-0.5">Kanban-style task management for your housekeeping team</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div key={col.key} className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b-2" style={{ borderColor: col.color }}>
                <col.icon className="w-4 h-4" style={{ color: col.color }} />
                <span className="text-sm font-bold text-[var(--sn-text)]">{col.label}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${col.color}1a`, color: col.color }}>{colTasks.length}</span>
              </div>
              {colTasks.map(task => (
                <Card key={task.id} className="p-3 cursor-pointer" hover onClick={() => advance(task)}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-[var(--sn-text)]">Room {task.room?.roomNumber}</span>
                    <Badge color={col.color} className="ml-auto text-[10px]">{task.priority || 'Normal'}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--sn-text-muted)]">
                    <Avatar name={task.assignedTo?.user?.fullName} size="xs" />
                    <span>{task.assignedTo?.user?.fullName || 'Unassigned'}</span>
                  </div>
                  {task.photoProofUrl && <div className="mt-2 flex items-center gap-1 text-xs text-[var(--sn-purple)]"><Camera className="w-3 h-3" /> Photo verified</div>}
                </Card>
              ))}
              {colTasks.length === 0 && <p className="text-xs text-[var(--sn-text-muted)] text-center py-8">No tasks</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
