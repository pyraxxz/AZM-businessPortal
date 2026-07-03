import { useAuth } from '@/lib/AuthContext';
// src/pages/Finance.jsx
import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { marketplaceApi } from '../lib/marketplaceApi';

export default function Finance() {
  const { bizProfile, isAdmin, selectedBusinessId } = useAuth();
  const businessId = bizProfile?.id;

  if (!businessId) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        {isAdmin ? "Select a business from the sidebar dropdown to view." : "No business profile found."}
      </div>
    );
  }

  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        marketplaceApi.getFinanceStats(businessId),
        marketplaceApi.getFinanceTransactions(businessId),
      ]);
      setStats(s.data); setTransactions(t.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Finance</h1>
        <p className="text-sm text-muted-foreground mt-1">Escrow, penalties, and payouts</p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">In Escrow</span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">
            {stats?.inEscrowUsdc?.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-muted-foreground">USDC</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Settled</span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">
            {stats?.settledUsdc?.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-muted-foreground">USDC</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span className="text-xs text-muted-foreground">Refunded</span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">
            {stats?.refundedUsdc?.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-muted-foreground">USDC</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Penalty Rev.</span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">
            {stats?.penaltyRevenueUsdc?.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-muted-foreground">USDC</p>
        </div>
      </div>

      {/* Transaction history */}
      <div className="rounded-lg border bg-card">
        <div className="px-4 py-3 border-b">
          <h3 className="font-medium text-foreground">Transaction History</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No transactions yet</div>
        ) : (
          <div className="divide-y">
            {transactions.map(tx => (
              <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {tx.type} · {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-sm font-medium ${
                  tx.direction === 'IN' ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {tx.direction === 'IN' ? '+' : '-'}{parseFloat(tx.amountUsdc).toFixed(2)} USDC
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


