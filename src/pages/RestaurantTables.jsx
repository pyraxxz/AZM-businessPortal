import { useState, useEffect } from 'react';
import { restaurantApi } from '@/lib/marketplaceApi';
import { Card, Button, Badge, Skeleton, Empty, Avatar } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { Grid3x3, Clock, Users } from 'lucide-react';

const TABLE_STATUS = {
  OPEN: { label: 'Open', color: 'var(--sn-purple)' },
  SEATED: { label: 'Seated', color: 'var(--sn-blue)' },
  ORDERED: { label: 'Ordered', color: 'var(--sn-amber)' },
  EATING: { label: 'Eating', color: 'var(--sn-purple)' },
  BILLING: { label: 'Billing', color: 'var(--sn-red)' },
  CLEANING: { label: 'Cleaning', color: 'var(--sn-text-muted)' },
};

export default function RestaurantTables() {
  const { toast } = useToast();
  const [tables, setTables] = useState(null);

  const load = async () => {
    try { const res = await restaurantApi.tables(); setTables(res.data?.tables || []); }
    catch { toast.error('Failed to load tables'); }
  };
  useEffect(() => { load(); }, []);

  const cycleStatus = async (table) => {
    const order = ['OPEN', 'SEATED', 'ORDERED', 'EATING', 'BILLING', 'CLEANING'];
    const next = order[(order.indexOf(table.status) + 1) % order.length];
    try { await restaurantApi.updateTableStatus(table.id, next); toast.success(`Table ${table.tableNumber} → ${TABLE_STATUS[next].label}`); load(); }
    catch { toast.error('Failed to update table'); }
  };

  if (!tables) return <Skeleton className="h-96" />;

  const counts = tables.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--sn-text)]">Table Management</h1>
        <p className="text-sm text-[var(--sn-text-muted)] mt-0.5">Live floor plan — tap to cycle table status</p>
      </div>

      {/* Status summary */}
      <div className="flex gap-3">
        {Object.entries(TABLE_STATUS).map(([key, meta]) => (
          <Card key={key} className="flex-1 p-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
              <span className="text-xs text-[var(--sn-text-muted)]">{meta.label}</span>
            </div>
            <p className="text-xl font-bold text-[var(--sn-text)] mt-1">{counts[key] || 0}</p>
          </Card>
        ))}
      </div>

      {/* Table grid */}
      {tables.length === 0 ? (
        <Empty icon={Grid3x3} title="No tables registered" description="Add tables in the Locations page" />
      ) : (
        <div className="grid grid-cols-5 gap-4">
          {tables.map(table => {
            const meta = TABLE_STATUS[table.status] || TABLE_STATUS.OPEN;
            return (
              <button
                key={table.id}
                onClick={() => cycleStatus(table)}
                className="rounded-xl border p-4 text-center transition-all hover:scale-[1.02]"
                style={{ background: `${meta.color}0d`, borderColor: `${meta.color}30` }}
              >
                <p className="text-lg font-bold text-[var(--sn-text)]">T{table.tableNumber}</p>
                <p className="text-xs mt-0.5" style={{ color: meta.color }}>{meta.label}</p>
                <div className="flex items-center justify-center gap-1 text-xs text-[var(--sn-text-muted)] mt-1">
                  <Users className="w-3 h-3" /> {table.capacity}
                </div>
                {table.server && (
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <Avatar name={table.server.user?.fullName} size="xs" />
                  </div>
                )}
                {table.seatedAt && (
                  <p className="text-[10px] text-[var(--sn-text-muted)] mt-1">
                    <Clock className="w-2.5 h-2.5 inline" /> {Math.floor((Date.now() - new Date(table.seatedAt).getTime()) / 60000)}m
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
