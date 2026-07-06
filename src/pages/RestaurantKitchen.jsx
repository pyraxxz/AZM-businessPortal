import { useState, useEffect } from 'react';
import { restaurantApi } from '@/lib/marketplaceApi';
import { Card, Button, Badge, Skeleton, Empty } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { ChefHat, Clock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

const STATIONS = ['GRILL', 'FRY', 'SAUTE', 'COLD', 'BAR', 'EXPEDITE'];
const STATION_COLORS = { GRILL: 'var(--sn-red)', FRY: 'var(--sn-amber)', SAUTE: 'var(--sn-blue)', COLD: 'var(--sn-purple)', BAR: 'var(--sn-purple)', EXPEDITE: 'var(--sn-text-secondary)' };

export default function RestaurantKitchen() {
  const { toast } = useToast();
  const [orders, setOrders] = useState(null);
  const [station, setStation] = useState('ALL');

  const load = async () => {
    try { const res = await restaurantApi.kitchenOrders({ status: 'ACTIVE' }); setOrders(res.data?.orders || []); }
    catch { toast.error('Failed to load kitchen orders'); }
  };
  useEffect(() => { load(); }, []);

  const bumpOrder = async (id) => {
    try { await restaurantApi.bumpKitchenOrder(id); toast.success('Order bumped'); load(); }
    catch { toast.error('Failed to bump order'); }
  };

  if (!orders) return <Skeleton className="h-96" />;

  const filtered = station === 'ALL' ? orders : orders.filter(o => o.station === station);
  const elapsed = (startTime) => {
    const mins = Math.floor((Date.now() - new Date(startTime).getTime()) / 60000);
    return mins;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--sn-text)]">Kitchen Display</h1>
          <p className="text-sm text-[var(--sn-text-muted)] mt-0.5">Live order tickets with station routing and prep timing</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setStation('ALL')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${station === 'ALL' ? 'bg-[var(--sn-purple-subtle)] text-[var(--sn-purple)]' : 'text-[var(--sn-text-muted)]'}`}>All</button>
          {STATIONS.map(s => (
            <button key={s} onClick={() => setStation(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${station === s ? 'text-[var(--sn-text)]' : 'text-[var(--sn-text-muted)]'}`} style={station === s ? { background: `${STATION_COLORS[s]}1a` } : {}}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty icon={ChefHat} title="No active orders" description="New orders will appear here automatically" />
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {filtered.map(order => {
            const mins = elapsed(order.createdAt);
            const isUrgent = mins > 15;
            const isWarning = mins > 8 && mins <= 15;
            return (
              <Card key={order.id} className={`p-4 border-l-4 ${isUrgent ? 'animate-pulse' : ''}`} >
                <div className="flex items-center justify-between mb-3" style={{ borderLeftColor: STATION_COLORS[order.station] }}>
                  <div>
                    <p className="text-sm font-bold text-[var(--sn-text)]">Table {order.tableNumber}</p>
                    <p className="text-xs text-[var(--sn-text-muted)]">Order #{order.orderNumber}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold" style={{ color: isUrgent ? 'var(--sn-red)' : isWarning ? 'var(--sn-amber)' : 'var(--sn-purple)' }}>
                    <Clock className="w-3.5 h-3.5" />
                    {mins}m
                  </div>
                </div>

                {order.items?.map((item, i) => (
                  <div key={i} className="py-1.5 border-b border-[var(--sn-border)] last:border-0">
                    <div className="flex items-start justify-between">
                      <span className="text-sm text-[var(--sn-text)] font-medium">{item.quantity}× {item.name}</span>
                      <Badge color={STATION_COLORS[item.station] || 'var(--sn-text-muted)'} className="text-[10px]">{item.station}</Badge>
                    </div>
                    {item.allergies?.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-[var(--sn-red)]">
                        <AlertTriangle className="w-3 h-3" /> {item.allergies.join(', ')}
                      </div>
                    )}
                    {item.modifiers && <p className="text-xs text-[var(--sn-text-muted)] mt-0.5">{item.modifiers}</p>}
                  </div>
                ))}

                <Button size="sm" className="w-full mt-3" onClick={() => bumpOrder(order.id)}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Bump
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
