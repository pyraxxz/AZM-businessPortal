import { useState, useEffect } from 'react';
import { transitOpsApi } from '@/lib/marketplaceApi';
import { Card, Button, Badge, Skeleton, Empty, Avatar, Select } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { Ticket, Users, DollarSign, QrCode, MapPin } from 'lucide-react';

export default function TransitManifests() {
  const { toast } = useToast();
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [manifest, setManifest] = useState(null);

  const loadTrips = async () => {
    try { const res = await transitOpsApi.routes(); setTrips(res.data?.trips || []); }
    catch { toast.error('Failed to load trips'); }
  };
  useEffect(() => { loadTrips(); }, []);

  const loadManifest = async (tripId) => {
    setSelectedTrip(tripId);
    try { const res = await transitOpsApi.liveManifest(tripId); setManifest(res.data); }
    catch { toast.error('Failed to load manifest'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--sn-text)]">Live Manifests</h1>
        <p className="text-sm text-[var(--sn-text-muted)] mt-0.5">Real-time passenger boarding status and revenue for each trip</p>
      </div>

      {/* Trip selector */}
      <div className="flex gap-3">
        {trips.map(trip => (
          <button
            key={trip.id}
            onClick={() => loadManifest(trip.id)}
            className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${selectedTrip === trip.id ? 'bg-[var(--sn-purple-subtle)] text-[var(--sn-purple)] border-[var(--sn-purple-border)]' : 'text-[var(--sn-text-muted)] border-[var(--sn-border)] hover:bg-[var(--sn-card-hover)]'}`}
          >
            <MapPin className="w-3.5 h-3.5 inline mr-1.5" />
            {trip.origin} → {trip.destination}
            <span className="ml-2 text-xs text-[var(--sn-text-muted)]">{new Date(trip.departureTime).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</span>
          </button>
        ))}
      </div>

      {!manifest ? (
        <Empty icon={Ticket} title="Select a trip" description="Choose a trip above to view its live manifest" />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {/* Manifest stats */}
          <Card>
            <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-[var(--sn-blue)]" /><span className="text-xs text-[var(--sn-text-muted)] uppercase">Passengers</span></div>
            <p className="text-3xl font-bold text-[var(--sn-text)]">{manifest.boardedCount}/{manifest.totalBooked}</p>
            <p className="text-xs text-[var(--sn-text-muted)] mt-1">{manifest.totalBooked - manifest.boardedCount} not yet boarded</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-[var(--sn-purple)]" /><span className="text-xs text-[var(--sn-text-muted)] uppercase">Revenue (Escrow)</span></div>
            <p className="text-3xl font-bold text-[var(--sn-text)]">{manifest.totalRevenueUsdc?.toFixed(2)}</p>
            <p className="text-xs text-[var(--sn-text-muted)] mt-1">USDC held in Smart Escrow</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-2"><QrCode className="w-4 h-4 text-[var(--sn-purple)]" /><span className="text-xs text-[var(--sn-text-muted)] uppercase">Boarding</span></div>
            <p className="text-3xl font-bold text-[var(--sn-text)]">{manifest.boardingProgress}%</p>
            <p className="text-xs text-[var(--sn-text-muted)] mt-1">Driver scans QR to board passengers</p>
          </Card>

          {/* Passenger list */}
          <Card className="col-span-3">
            <h3 className="text-sm font-bold text-[var(--sn-text)] mb-4">Passenger Manifest</h3>
            <div className="space-y-1">
              {manifest.passengers?.map(p => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-[var(--sn-border)] last:border-0">
                  <Avatar name={p.user?.fullName || p.name} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[var(--sn-text)]">{p.user?.fullName || p.name}</p>
                    <p className="text-xs text-[var(--sn-text-muted)]">Seat {p.seatNumber} • {p.ticketRef}</p>
                  </div>
                  <Badge color={p.boarded ? 'var(--sn-purple)' : 'var(--sn-text-muted)'}>
                    {p.boarded ? 'Boarded' : 'Waiting'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
