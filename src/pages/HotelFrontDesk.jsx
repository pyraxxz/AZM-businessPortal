import { useState, useEffect } from 'react';
import { hotelOpsApi as hotelApi } from '@/lib/marketplaceApi';
import { reservations as resApi } from '@/lib/marketplaceApi';
import { Card, Button, Badge, Skeleton, Empty, Avatar, Tabs } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { LogIn, LogOut, BedDouble, Calendar } from 'lucide-react';

export default function HotelFrontDesk() {
  const { toast } = useToast();
  const [tab, setTab] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  const load = async () => {
    setLoading(true);
    try {
      const res = await hotelApi.getFrontDesk({ date: today });
      const overview = res.data?.overview || res.data || {};
      setData(overview);
    } catch (e) {
      toast.error('Failed to load front desk data');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCheckIn = async (reservationId) => {
    try {
      await resApi.checkIn(reservationId);
      toast.success('Guest checked in successfully');
      load();
    } catch (e) {
      toast.error(e.message || 'Failed to check in guest');
    }
  };

  const handleCheckOut = async (reservationId) => {
    try {
      await resApi.checkOut(reservationId);
      toast.success('Guest checked out successfully');
      load();
    } catch (e) {
      toast.error(e.message || 'Failed to check out guest');
    }
  };

  if (loading) return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--sn-text)]">Front Desk</h1>
        <p className="text-sm text-[var(--sn-text-muted)] mt-0.5">Today's arrivals, in-house guests, and departures</p>
      </div>
      <Skeleton className="h-48" />
    </div>
  );

  const arrivals = data?.arrivalList || [];
  const departures = data?.departureList || [];
  const inHouse = data?.inHouseList || [];

  const tabs = [
    {
      label: 'Arrivals',
      icon: LogIn,
      count: arrivals.length,
      content: (
        <GuestList
          guests={arrivals}
          type="arrival"
          actionLabel="Check In"
          onAction={handleCheckIn}
        />
      ),
    },
    {
      label: 'In-House',
      icon: BedDouble,
      count: inHouse.length,
      content: (
        <GuestList
          guests={inHouse}
          type="inhouse"
        />
      ),
    },
    {
      label: 'Departures',
      icon: LogOut,
      count: departures.length,
      content: (
        <GuestList
          guests={departures}
          type="departure"
          actionLabel="Check Out"
          onAction={handleCheckOut}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--sn-text)]">Front Desk</h1>
        <p className="text-sm text-[var(--sn-text-muted)] mt-0.5">Today's arrivals, in-house guests, and departures</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <p className="text-xs text-[var(--sn-text-muted)] uppercase">Arrivals</p>
          <p className="text-2xl font-bold text-[var(--sn-purple)]">{arrivals.length}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-[var(--sn-text-muted)] uppercase">In-House</p>
          <p className="text-2xl font-bold text-[var(--sn-blue)]">{inHouse.length}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-[var(--sn-text-muted)] uppercase">Departures</p>
          <p className="text-2xl font-bold text-[var(--sn-amber)]">{departures.length}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xs text-[var(--sn-text-muted)] uppercase">Available</p>
          <p className="text-2xl font-bold text-[var(--sn-text-secondary)]">{data?.availableRooms ?? '—'}</p>
        </Card>
      </div>

      <Tabs tabs={tabs} defaultIndex={0} onChange={setTab} />
    </div>
  );
}

function GuestList({ guests, type, actionLabel, onAction }) {
  if (!guests?.length) return <Empty icon={Calendar} title={`No ${type} guests today`} description="New reservations will appear here automatically" />;

  return (
    <div className="space-y-2">
      {guests.map(g => (
        <Card key={g.id} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={g.customer?.username || g.customerName} size="sm" />
            <div>
              <p className="text-sm font-semibold text-[var(--sn-text)]">{g.customer?.username || g.customerName || 'Guest'}</p>
              <p className="text-xs text-[var(--sn-text-muted)]">
                {type === 'arrival' && `Check-in: ${new Date(g.startDatetime).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}`}
                {type === 'departure' && `Check-out: ${new Date(g.endDatetime).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}`}
                {type === 'inhouse' && `Room ${g.room?.roomNumber || '—'} • Since ${new Date(g.startDatetime).toLocaleDateString('en', { day: 'numeric', month: 'short' })}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge color="var(--sn-purple)">{g.amountUsdc ? `${Number(g.amountUsdc).toFixed(2)} USDC` : '—'}</Badge>
            {actionLabel && onAction && (
              <Button size="sm" onClick={() => onAction(g.id)}>{actionLabel}</Button>
            )}
            {type === 'inhouse' && <Badge color="var(--sn-blue)">In House</Badge>}
          </div>
        </Card>
      ))}
    </div>
  );
}
