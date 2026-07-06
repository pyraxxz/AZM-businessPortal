import { useState, useEffect } from 'react';
import { financeApi, employeeApi } from '@/lib/marketplaceApi';
import { Card, Button, Badge, Input, Select, Modal, Empty, Skeleton, Tabs } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { KpiCard, AreaChartCard, BarChartCard, DonutChartCard } from '@/components/charts';
import { Wallet, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight, DollarSign, Receipt, Users, Wrench } from 'lucide-react';

const ENTRY_TYPES = [
  { value: 'INCOME', label: 'Income' }, { value: 'EXPENSE', label: 'Expense' },
  { value: 'PAYROLL', label: 'Payroll' }, { value: 'TAX', label: 'Tax' },
  { value: 'REFUND', label: 'Refund' }, { value: 'PENALTY', label: 'Penalty' },
  { value: 'AD_SPEND', label: 'Ad Spend' }, { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'SUPPLIES', label: 'Supplies' },
];

const ENTRY_ICONS = { INCOME: TrendingUp, EXPENSE: TrendingDown, PAYROLL: Users, TAX: Receipt, REFUND: ArrowDownRight, PENALTY: DollarSign, AD_SPEND: DollarSign, MAINTENANCE: Wrench, SUPPLIES: Wrench };
const ENTRY_COLORS = { INCOME: 'var(--sn-purple)', EXPENSE: 'var(--sn-red)', PAYROLL: 'var(--sn-blue)', TAX: 'var(--sn-amber)', REFUND: 'var(--sn-red)', PENALTY: 'var(--sn-purple)', AD_SPEND: 'var(--sn-purple)', MAINTENANCE: 'var(--sn-amber)', SUPPLIES: 'var(--sn-blue)' };

export default function FinanceV2() {
  const { toast } = useToast();
  const [summary, setSummary] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [pnl, setPnl] = useState(null);
  const [cashflow, setCashflow] = useState(null);
  const [expenseBreakdown, setExpenseBreakdown] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ type: 'EXPENSE', amountUsdc: '', description: '', category: '', method: 'AZAMAN_BALANCE' });
  const [range, setRange] = useState('30d');

  const load = async () => {
    try {
      const [sumRes, ledRes, pnlRes, cfRes, expRes] = await Promise.all([
        financeApi.summary({ range }),
        financeApi.ledger({ range, limit: 50 }),
        financeApi.pnl({ range }),
        financeApi.cashflow({ range }),
        financeApi.expenseBreakdown({ range }),
      ]);
      setSummary(sumRes.data);
      setLedger(ledRes.data?.entries || []);
      setPnl(pnlRes.data);
      setCashflow(cfRes.data?.daily || []);
      setExpenseBreakdown(expRes.data?.breakdown || []);
    } catch (err) {
      toast.error('Failed to load financial data');
    }
  };

  useEffect(() => { load(); }, [range]);

  const handleAddEntry = async () => {
    try {
      await financeApi.createEntry(form);
      toast.success('Ledger entry created');
      setAddOpen(false);
      setForm({ type: 'EXPENSE', amountUsdc: '', description: '', category: '', method: 'AZAMAN_BALANCE' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create entry');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--sn-text)]">Finance & Cash Flow</h1>
          <p className="text-sm text-[var(--sn-text-muted)] mt-0.5">Every financial event in your business, in one ledger</p>
        </div>
        <div className="flex gap-3">
          <Select value={range} onChange={e => setRange(e.target.value)} options={[{ value: '7d', label: '7 Days' }, { value: '30d', label: '30 Days' }, { value: '90d', label: '90 Days' }, { value: 'ytd', label: 'Year to Date' }]} className="w-40" />
          <Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4" /> Add Entry</Button>
        </div>
      </div>

      {/* KPI Row */}
      {summary ? (
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label="Total Revenue" value={`${summary.totalRevenue?.toFixed(2)} USDC`} delta={summary.revenueDelta} deltaType="positive" icon={TrendingUp} color="var(--sn-purple)" />
          <KpiCard label="Total Expenses" value={`${summary.totalExpenses?.toFixed(2)} USDC`} delta={summary.expenseDelta} deltaType="negative" icon={TrendingDown} color="var(--sn-red)" />
          <KpiCard label="Net Profit" value={`${summary.netProfit?.toFixed(2)} USDC`} delta={summary.profitDelta} deltaType={summary.profitDelta?.startsWith('-') ? 'negative' : 'positive'} icon={DollarSign} color="var(--sn-blue)" />
          <KpiCard label="Payroll (This Period)" value={`${summary.payrollThisPeriod?.toFixed(2)} USDC`} icon={Users} color="var(--sn-purple)" />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        {cashflow?.length > 0 && (
          <AreaChartCard title="Cash Flow" data={cashflow} xKey="date" yKey="net" color="var(--sn-purple)" formatY={v => `${v.toFixed(0)}`} />
        )}
        {expenseBreakdown?.length > 0 && (
          <DonutChartCard title="Expense Breakdown" data={expenseBreakdown.map(e => ({ name: e.category, value: e.amount }))} />
        )}
        {pnl?.daily?.length > 0 && (
          <BarChartCard title="Revenue vs Expenses" data={pnl.daily} xKey="date"
            bars={[{ key: 'revenue', label: 'Revenue', color: 'var(--sn-purple)' }, { key: 'expenses', label: 'Expenses', color: 'var(--sn-red)' }]}
          />
        )}
        {pnl?.daily?.length > 0 && (
          <AreaChartCard title="Cumulative Profit" data={pnl.cumulative} xKey="date" yKey="profit" color="var(--sn-blue)" />
        )}
      </div>

      {/* Ledger Table */}
      <Card>
        <h3 className="text-sm font-bold text-[var(--sn-text)] mb-4">Recent Ledger Entries</h3>
        {!ledger ? <Skeleton className="h-40" /> : ledger.length === 0 ? <Empty icon={Receipt} title="No entries yet" /> : (
          <div className="space-y-1">
            {ledger.map(entry => {
              const Icon = ENTRY_ICONS[entry.type] || Receipt;
              const color = ENTRY_COLORS[entry.type] || 'var(--sn-text-muted)';
              const isIncome = ['INCOME', 'PENALTY'].includes(entry.type);
              return (
                <div key={entry.id} className="flex items-center gap-3 py-3 border-b border-[var(--sn-border)] last:border-0">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}1a`, border: `1px solid ${color}30` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--sn-text)] truncate">{entry.description}</p>
                    <p className="text-xs text-[var(--sn-text-muted)]">{entry.type} • {new Date(entry.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className="text-sm font-bold sn-mono" style={{ color: isIncome ? 'var(--sn-purple)' : 'var(--sn-red)' }}>
                    {isIncome ? '+' : '-'}{entry.amountUsdc} USDC
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Add Entry Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Ledger Entry">
        <div className="space-y-4">
          <Select label="Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} options={ENTRY_TYPES} />
          <Input label="Amount (USDC)" type="number" placeholder="e.g. 150.00" value={form.amountUsdc} onChange={e => setForm({ ...form, amountUsdc: e.target.value })} />
          <Input label="Description" placeholder="e.g. Diesel for generator" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <Input label="Category" placeholder="e.g. Utilities" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
          <Select label="Payment Method" value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}
            options={[{ value: 'AZAMAN_BALANCE', label: 'Azaman Balance' }, { value: 'CASH', label: 'Cash' }, { value: 'BANK', label: 'Bank Transfer' }, { value: 'MOMO', label: 'Mobile Money' }]} />
          <Button onClick={handleAddEntry} className="w-full">Create Entry</Button>
        </div>
      </Modal>
    </div>
  );
}
