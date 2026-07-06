import { useState, useEffect } from 'react';
import { hotelOpsApi as hotelApi } from '@/lib/marketplaceApi';
import { Card, Button, Badge, Skeleton, Empty } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { BedDouble, Bath, Wrench, CheckCircle2, AlertCircle } from 'lucide-react';

const STATUS_META = {
  AVAILABLE: { label: 'Available', color: 'var(--sn-purple)', icon: CheckCircle2 },
  OCCUPIED: { label: 'Occupied', color: 'var(--sn-blue)', icon: BedDouble },
  DIRTY: { label: 'Dirty', color: 'var(--sn-amber)', icon: AlertCircle },
  MAINTENANCE: { label: 'Maintenance', color: 'var(--sn-red)', icon: Wrench },
  RESERVED: { label: 'Reserved', color: 'var(--sn-purple)', icon: BedDouble },
};

export default function HotelRooms() {
  const { toast } = useToast();
  const [rooms, setRooms] = useState(null);

  const load = async () => {
    try { const res = await hotelApi.rooms(); setRooms(res.data?.rooms || []); }
    catch { toast.error('Failed to load rooms'); }
  };
  useEffect(() => { load(); }, []);

  const cycleStatus = async (room) => {
    const order = ['AVAILABLE', 'OCCUPIED', 'DIRTY', 'MAINTENANCE'];
    const next = order[(order.indexOf(room.status) + 1) % order.length];
    try { await hotelApi.updateRoomStatus(room.id, next); toast.success(`Room ${room.roomNumber} → ${STATUS_META[next].label}`); load(); }
    catch { toast.error('Failed to update room status'); }
  };

  const statusCounts = rooms?.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {}) || {};

  if (!rooms) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--sn-text)]">Room Management</h1>
        <p className="text-sm text-[var(--sn-text-muted)] mt-0.5">Tap any room to cycle its status</p>
      </div>

      {/* Status summary bar */}
      <div className="flex gap-4">
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <Card key={key} className="flex-1 p-4">
            <div className="flex items-center gap-2 mb-1">
              <meta.icon className="w-4 h-4" style={{ color: meta.color }} />
              <span className="text-xs text-[var(--sn-text-muted)] uppercase">{meta.label}</span>
            </div>
            <p className="text-2xl font-bold text-[var(--sn-text)]">{statusCounts[key] || 0}</p>
          </Card>
        ))}
      </div>

      {/* Room grid */}
      {rooms.length === 0 ? (
        <Empty icon={BedDouble} title="No rooms registered" description="Add room types in the Products page with category HOSPITALITY" />
      ) : (
        <div className="grid grid-cols-6 gap-3">
          {rooms.map(room => {
            const meta = STATUS_META[room.status] || STATUS_META.AVAILABLE;
            return (
              <button
                key={room.id}
                onClick={() => cycleStatus(room)}
                className="rounded-xl border p-4 text-center transition-all hover:scale-[1.02]"
                style={{ background: `${meta.color}0d`, borderColor: `${meta.color}30` }}
              >
                <meta.icon className="w-6 h-6 mx-auto mb-2" style={{ color: meta.color }} />
                <p className="text-sm font-bold text-[var(--sn-text)]">{room.roomNumber}</p>
                <p className="text-xs mt-0.5" style={{ color: meta.color }}>{meta.label}</p>
                {room.roomType && <p className="text-[10px] text-[var(--sn-text-muted)] mt-0.5 truncate">{room.roomType}</p>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
