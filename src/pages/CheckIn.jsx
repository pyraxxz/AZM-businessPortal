/**
 * CheckIn — Business-facing check-in dashboard.
 * Dual mode: QR token verification + AZM-ID manual search.
 * Shows today's check-in stats and recent activity.
 *
 * Sentry-inspired: widget-based layout, data-dense activity feed,
 * clean modal interactions, tactile buttons.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkIn as checkInApi } from '@/lib/marketplaceApi';
import { Widget, WidgetStat, WidgetRow } from '@/components/ui/Widget';
import { Button, Badge, Input, Modal, Skeleton } from '@/components/ui';
import { fmt, formatDateTime, relativeTime, cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  QrCode, Search, CheckCircle2, Users, Clock,
  UserCheck, ArrowRight, X, AlertCircle, Zap,
} from 'lucide-react';

export default function CheckIn() {
  const qc = useQueryClient();
  const [mode, setMode] = useState('scan'); // 'scan' | 'search'
  const [token, setToken] = useState('');
  const [azamanId, setAzamanId] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [checkInResult, setCheckInResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['checkin-stats'],
    queryFn: () => checkInApi.todayStats(),
    refetchInterval: 30_000,
  });
  const stats = statsData?.stats || {};

  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['checkin-recent'],
    queryFn: () => checkInApi.recentCheckIns({ limit: 10 }),
    refetchInterval: 30_000,
  });
  const recent = recentData?.checkIns || [];

  const verifyMut = useMutation({
    mutationFn: (t) => checkInApi.verifyToken(t),
    onSuccess: (data) => {
      setCheckInResult(data);
      toast.success('Check-in successful!');
      qc.invalidateQueries(['checkin-stats']);
      qc.invalidateQueries(['checkin-recent']);
      setToken('');
    },
    onError: (e) => toast.error(e.message),
  });

  const searchMut = useMutation({
    mutationFn: (id) => checkInApi.searchByAzamanId(id),
    onSuccess: (data) => setSearchResults(data),
    onError: (e) => toast.error(e.message),
  });

  const directCheckInMut = useMutation({
    mutationFn: (reservationId) => checkInApi.directCheckIn(reservationId),
    onSuccess: (data) => {
      setCheckInResult(data);
      toast.success('Check-in successful!');
      qc.invalidateQueries(['checkin-stats']);
      qc.invalidateQueries(['checkin-recent']);
      setSearchResults(null);
      setAzamanId('');
    },
    onError: (e) => toast.error(e.message),
  });

  const handleVerify = () => {
    if (!token.trim()) return;
    verifyMut.mutate(token.trim());
  };

  const handleSearch = () => {
    if (!azamanId.trim()) return;
    searchMut.mutate(azamanId.trim());
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--sn-text)] flex items-center gap-2">
          <QrCode className="w-5 h-5 text-[var(--sn-purple)]" />
          Check-In Dashboard
        </h1>
        <p className="text-sm text-[var(--sn-text-muted)] mt-1">Verify customer QR codes or search by AZM-ID to check in reservations.</p>
      </div>

      {/* Today's stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Widget title="Checked In Today" icon={UserCheck} iconColor="var(--sn-purple)" loading={statsLoading}>
          <WidgetStat value={fmt(stats.todayCount || 0, 0)} label="Guests" color="var(--sn-purple)" />
        </Widget>
        <Widget title="Pending" icon={Clock} iconColor="var(--sn-amber)" loading={statsLoading}>
          <WidgetStat value={fmt(stats.pending || 0, 0)} label="Awaiting check-in" color="var(--sn-amber)" />
        </Widget>
        <Widget title="No-Shows" icon={AlertCircle} iconColor="var(--sn-red)" loading={statsLoading}>
          <WidgetStat value={fmt(stats.noShows || 0, 0)} label="Today" color="var(--sn-red)" />
        </Widget>
        <Widget title="Total Guests" icon={Users} iconColor="var(--sn-blue)" loading={statsLoading}>
          <WidgetStat value={fmt(stats.totalGuests || 0, 0)} label="All time" color="var(--sn-blue)" />
        </Widget>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Check-in panel */}
        <Widget title="Check In" icon={Zap} iconColor="var(--sn-purple)" height="300px">
          <div className="space-y-4">
            {/* Mode toggle */}
            <div className="flex gap-2 p-1 rounded-xl bg-[var(--az-black)] border border-[var(--sn-border)]">
              <button
                onClick={() => setMode('scan')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all',
                  mode === 'scan' ? 'bg-[var(--sn-purple-subtle)] text-[var(--sn-purple)]' : 'text-[var(--sn-text-muted)] hover:text-[var(--sn-text-muted)]'
                )}
              >
                <QrCode className="w-3.5 h-3.5" /> QR Token
              </button>
              <button
                onClick={() => setMode('search')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all',
                  mode === 'search' ? 'bg-[var(--sn-purple-subtle)] text-[var(--sn-purple)]' : 'text-[var(--sn-text-muted)] hover:text-[var(--sn-text-muted)]'
                )}
              >
                <Search className="w-3.5 h-3.5" /> AZM-ID
              </button>
            </div>

            {/* Scan mode */}
            {mode === 'scan' && (
              <div className="space-y-3">
                <Input
                  label="QR Token"
                  placeholder="Paste or scan QR token..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                />
                <Button onClick={handleVerify} loading={verifyMut.isPending} className="w-full">
                  <CheckCircle2 className="w-4 h-4" /> Verify & Check In
                </Button>
                <p className="text-[11px] text-[var(--sn-text-muted)] text-center">
                  Ask the customer to show their QR code in the app, then enter the token above.
                </p>
              </div>
            )}

            {/* Search mode */}
            {mode === 'search' && (
              <div className="space-y-3">
                <Input
                  label="Customer AZM-ID"
                  placeholder="e.g. AZM-1234..."
                  value={azamanId}
                  onChange={(e) => setAzamanId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} loading={searchMut.isPending} className="w-full">
                  <Search className="w-4 h-4" /> Search Customer
                </Button>
                <p className="text-[11px] text-[var(--sn-text-muted)] text-center">
                  Search by AZM-ID to find the customer and their active reservations.
                </p>
              </div>
            )}
          </div>
        </Widget>

        {/* Recent check-ins */}
        <Widget title="Recent Check-Ins" icon={Clock} iconColor="var(--sn-blue)" height="300px">
          {recentLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[120px] text-center">
              <Clock className="w-8 h-8 text-[var(--sn-text-muted)] mb-2" />
              <p className="text-xs text-[var(--sn-text-muted)]">No check-ins yet today.</p>
            </div>
          ) : (
            <div className="space-y-0 max-h-[220px] overflow-y-auto">
              {recent.map((ci) => (
                <WidgetRow
                  key={ci.id}
                  label={ci.customerName || ci.azamanId}
                  value={relativeTime(ci.checkedInAt)}
                  badge={<Badge color="var(--sn-purple)">{ci.reference}</Badge>}
                />
              ))}
            </div>
          )}
        </Widget>
      </div>

      {/* Search results modal */}
      <Modal open={searchResults !== null} onClose={() => setSearchResults(null)} title="Customer Found" className="max-w-lg">
        {searchResults && (
          <div className="space-y-4">
            {/* Customer info */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--az-black)] border border-[var(--sn-border)]">
              <div className="w-12 h-12 rounded-full bg-[var(--sn-blue)] border border-[#4f8ef730] flex items-center justify-center">
                <span className="text-sm font-bold text-[var(--sn-blue)]">
                  {(searchResults.customerName || searchResults.azamanId || '?').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--sn-text)]">{searchResults.customerName || 'Unknown'}</p>
                <p className="text-xs text-[var(--sn-text-muted)]">{searchResults.azamanId} · {searchResults.email || ''}</p>
              </div>
            </div>

            {/* Active reservations */}
            <div>
              <p className="text-xs font-bold text-[var(--sn-text-muted)] uppercase tracking-wider mb-2">Active Reservations</p>
              {(searchResults.reservations || []).length === 0 ? (
                <p className="text-sm text-[var(--sn-text-muted)] py-4 text-center">No active reservations found.</p>
              ) : (
                <div className="space-y-2">
                  {searchResults.reservations.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--az-black)] border border-[var(--sn-border)]">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--sn-text)] truncate">{r.reference || r.tripRoute || 'Reservation'}</p>
                        <p className="text-[11px] text-[var(--sn-text-muted)]">{formatDateTime(r.scheduledFor || r.createdAt)}</p>
                      </div>
                      {r.status === 'CONFIRMED' ? (
                        <Button
                          size="sm"
                          onClick={() => directCheckInMut.mutate(r.id)}
                          loading={directCheckInMut.isPending}
                        >
                          Check In <ArrowRight className="w-3 h-3" />
                        </Button>
                      ) : (
                        <Badge color={r.status === 'CHECKED_IN' ? 'var(--sn-purple)' : 'var(--sn-red)'}>
                          {r.status === 'CHECKED_IN' ? 'Checked In' : r.status}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Check-in success modal */}
      <Modal open={checkInResult !== null} onClose={() => setCheckInResult(null)} title="Check-In Successful" className="max-w-md">
        {checkInResult && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--sn-purple-subtle)] border border-[var(--sn-purple)] flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-[var(--sn-purple)]" />
            </div>
            <p className="text-lg font-bold text-[var(--sn-text)]">{checkInResult.customerName || checkInResult.azamanId}</p>
            <p className="text-sm text-[var(--sn-text-muted)] mt-1">{checkInResult.azamanId}</p>
            <div className="mt-4 px-4 py-2 rounded-xl bg-[var(--az-black)] border border-[var(--sn-border)]">
              <p className="text-xs text-[var(--sn-text-muted)]">Reservation</p>
              <p className="text-sm font-bold text-[var(--sn-text)] az-mono">{checkInResult.reservationRef || checkInResult.reference}</p>
            </div>
            <Button onClick={() => setCheckInResult(null)} className="mt-6 w-full">
              Done
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
