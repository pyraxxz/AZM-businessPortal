import { useState, useEffect } from 'react';
import { hotelOpsApi as hotelApi } from '@/lib/marketplaceApi';
import { Card, Button, Badge, Skeleton, Empty, Avatar, Tabs } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { LogIn, LogOut, BedDouble, Calendar } from 'lucide-react';

export default function HotelFrontDesk() {
  const { toast } = useToast();
  const [tab, setTab] = useState(0);
  const [arrivals, setArrivals] = useState(null);
  const [departures, setDepartures] = useState(null);
  const [inHouse, setInHouse] = useState(null);
  const today = new Date().toISOString().split('T')[0];

  const load = async () => {
    try {
      const [arrRes, depRes, inRes] = await Promise.all([
        hotelApi.arrivals(today), hotelApi.departures(today), hotelApi.inHouse(),
      ]);
      setArrivals(arrRes.data?.reservations || []);
      setDepartures(depRes.data?.reservations || []);
      setInHouse(inRes.data?.guests || []);
    } catch { toast.error('Failed to load front desk data'); }
  };
  useEffect(() => { load(); }, []);

  const tabs = [
    { label: 'Arrivals', icon: LogIn, count: arrivals?.length, content: <GuestList guests={arrivals} type="arrival" loading={!arrivals} /> },
    { label: 'In-House', icon: BedDouble, count: inHouse?.length, content: <GuestList guests={inHouse} type="inhouse" loading={!inHouse} /> },
    { label: 'Departures', icon: LogOut, count: departures?.length, content: <GuestList guests={departures} type="departure" loading={!departures} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--sn-text)]">Front Desk</h1>
        <p className="text-sm text-[var(--sn-text-muted)] mt-0.5">Today's arrivals, in-house guests, and departures</p>
      </div>
      <Tabs tabs={tabs} defaultIndex={0} onChange={setTab} />
    </div>
  );
}

function GuestList({ guests, type, loading }) {
  if (loading) return <Skeleton className="h-48" />;
  if (!guests?.length) return <Empty icon={Calendar} title={`No ${type} guests today`} />;
  return (
    <div className="space-y-2">
      {guests.map(g => (
        <Card key={g.id} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={g.customer?.fullName || g.customerName} size="sm" />
            <div>
              <p className="text-sm font-semibold text-[var(--sn-text)]">{g.customer?.fullName || g.customerName || 'Guest'}</p>
              <p className="text-xs text-[var(--sn-text-muted)]">
                {type === 'arrival' && `Check-in: ${new Date(g.startDatetime).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}`}
                {type === 'departure' && `Check-out: ${new Date(g.endDatetime).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}`}
                {type === 'inhouse' && `Room ${g.room?.roomNumber || '—'} • Since ${new Date(g.startDatetime).toLocaleDateString('en', { day: 'numeric', month: 'short' })}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge color="var(--sn-purple)">{g.amountUsdc?.toFixed(2)} USDC</Badge>
            {type === 'arrival' && <Button size="sm">Check In</Button>}
            {type === 'departure' && <Button size="sm">Check Out</Button>}
            {type === 'inhouse' && <Badge color="var(--sn-blue)">In House</Badge>}
          </div>
        </Card>
      ))}
    </div>
  );
}
