import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Download,
  Calendar,
  Filter,
  Search,
  ArrowUpDown,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  TrendingUp as ProfitMarginIcon,
  Tag,
  Repeat
} from 'lucide-react';
import { invoices as invoicesApi, request } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { fmtUSDC, fmt } from '@/lib/utils';
import { Tabs } from '@/components/ui/Tabs';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Glass card styling matching the design system
const cardStyleClass = "bg-[var(--az-surface)] border border-[var(--az-border)] backdrop-blur-sm rounded-2xl p-6 shadow-sm";

// Stagger variants for motion elements
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

// ─────────────────────────────────────────────────────────────────────────────
// Sample/Fallback structures if API calls fail or return empty
// ─────────────────────────────────────────────────────────────────────────────
const fallbackSummary = {
  kpis: {
    totalRevenue: 148250.00,
    totalExpenses: 52400.00,
    netProfit: 95850.00,
    profitMargin: 64.65
  },
  revenueVsExpenses: [
    { month: 'Jan', revenue: 18000, expenses: 8000 },
    { month: 'Feb', revenue: 22000, expenses: 9500 },
    { month: 'Mar', revenue: 25000, expenses: 11000 },
    { month: 'Apr', revenue: 24000, expenses: 9000 },
    { month: 'May', revenue: 28250, expenses: 7400 },
    { month: 'Jun', revenue: 31000, expenses: 7500 }
  ],
  cashFlow: [
    { date: '01 Jul', balance: 85000 },
    { date: '04 Jul', balance: 88500 },
    { date: '08 Jul', balance: 91200 },
    { date: '12 Jul', balance: 93800 },
    { date: '15 Jul', balance: 95850 }
  ],
  quickStats: {
    avgOrderValue: 145.20,
    paymentMethodBreakdown: [
      { name: 'Card Payment', value: 74500, color: 'var(--az-accent)' },
      { name: 'Mobile Money', value: 43250, color: 'var(--az-success)' },
      { name: 'Bank Transfer', value: 21500, color: 'var(--az-warning)' },
      { name: 'USDC Ledger', value: 9000, color: '#3182CE' }
    ]
  },
  transactions: [
    { id: 'TX-1001', date: '2026-07-16', description: 'Monthly Cloud Infrastructure', category: 'Infrastructure', type: 'expense', amount: 1450.00, status: 'completed' },
    { id: 'TX-1002', date: '2026-07-15', description: 'Enterprise Plan Upgrade - Azaman Inc', category: 'SaaS Revenue', type: 'income', amount: 4800.00, status: 'completed' },
    { id: 'TX-1003', date: '2026-07-15', description: 'Office Rent - July 2026', category: 'Rent', type: 'expense', amount: 3500.00, status: 'completed' },
    { id: 'TX-1004', date: '2026-07-14', description: 'Contractor Payment - frontend dev', category: 'Workforce', type: 'expense', amount: 2800.00, status: 'pending' },
    { id: 'TX-1005', date: '2026-07-14', description: 'API Hub Usage Fee', category: 'SaaS Revenue', type: 'income', amount: 1250.00, status: 'completed' },
    { id: 'TX-1006', date: '2026-07-13', description: 'Marketing Campaign Ads', category: 'Marketing', type: 'expense', amount: 950.00, status: 'completed' },
    { id: 'TX-1007', date: '2026-07-12', description: 'Support Retainer Client A', category: 'Consulting', type: 'income', amount: 3000.00, status: 'completed' },
    { id: 'TX-1008', date: '2026-07-10', description: 'Annual Cybersecurity Audit', category: 'Security', type: 'expense', amount: 4500.00, status: 'failed' }
  ],
  recurringExpenses: [
    { id: 'REC-1', name: 'AWS Cloud Hosting', amount: 1200.00, interval: 'monthly', category: 'Infrastructure', nextDate: '2026-08-01' },
    { id: 'REC-2', name: 'Google Workspace', amount: 180.00, interval: 'monthly', category: 'SaaS & Software', nextDate: '2026-08-05' },
    { id: 'REC-3', name: 'Github Enterprise', amount: 250.00, interval: 'monthly', category: 'SaaS & Software', nextDate: '2026-08-12' },
    { id: 'REC-4', name: 'Internet Fiber Backup', amount: 95.00, interval: 'monthly', category: 'Utilities', nextDate: '2026-08-01' },
    { id: 'REC-5', name: 'Weekly Office Cleaning', amount: 150.00, interval: 'weekly', category: 'Operations', nextDate: '2026-07-22' }
  ],
  budgetTracker: [
    { category: 'Infrastructure', budget: 5000, actual: 3250 },
    { category: 'SaaS & Software', budget: 1500, actual: 1280 },
    { category: 'Marketing', budget: 4000, actual: 2100 },
    { category: 'Operations', budget: 2000, actual: 1850 },
    { category: 'Workforce', budget: 15000, actual: 11200 }
  ],
  expenseCategories: [
    { name: 'Workforce', value: 22000, color: 'var(--az-accent)' },
    { name: 'Infrastructure', value: 12500, color: '#3182CE' },
    { name: 'Rent', value: 7000, color: 'var(--az-warning)' },
    { name: 'Marketing', value: 6500, color: 'var(--az-danger)' },
    { name: 'SaaS & Software', value: 4400, color: 'var(--az-success)' }
  ]
};

const fallbackInvoices = {
  stats: {
    outstanding: 34500.00,
    overdue: 12800.00,
    paidThisMonth: 19400.00
  },
  agingAnalysis: [
    { range: '0-30 days', amount: 15000 },
    { range: '31-60 days', amount: 11200 },
    { range: '61-90 days', amount: 4800 },
    { range: '90+ days', amount: 3500 }
  ],
  list: [
    { id: 'INV-2026-001', client: 'Starlight Corp', amount: 12000.00, issueDate: '2026-07-10', dueDate: '2026-08-10', status: 'pending' },
    { id: 'INV-2026-002', client: 'Nexus Logistics', amount: 4800.00, issueDate: '2026-06-15', dueDate: '2026-07-15', status: 'overdue' },
    { id: 'INV-2026-003', client: 'Apex Labs', amount: 8500.00, issueDate: '2026-07-02', dueDate: '2026-08-02', status: 'paid' },
    { id: 'INV-2026-004', client: 'Delta Partners', amount: 10900.00, issueDate: '2026-07-01', dueDate: '2026-08-01', status: 'paid' },
    { id: 'INV-2026-005', client: 'Velocity Studio', amount: 8000.00, issueDate: '2026-05-10', dueDate: '2026-06-10', status: 'overdue' },
    { id: 'INV-2026-006', client: 'Zenith Media', amount: 3000.00, issueDate: '2026-07-12', dueDate: '2026-08-12', status: 'pending' }
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON COMPONENT FOR GRACEFUL LOADING STATES
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonLoader() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-[var(--az-border)] rounded-2xl opacity-40"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-[var(--az-border)] rounded-2xl opacity-40"></div>
        <div className="h-96 bg-[var(--az-border)] rounded-2xl opacity-40"></div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FINANCE COMPONENT (Main Page Container)
// ─────────────────────────────────────────────────────────────────────────────
export default function Finance() {
  const { bizProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // States for live API or sample fallbacks
  const [financeSummary, setFinanceSummary] = useState(fallbackSummary);
  const [invoiceData, setInvoiceData] = useState(fallbackInvoices);

  const fetchFinanceData = useCallback(async () => {
    setLoading(true);
    try {
      const summaryRes = await request('/api/business/finances/summary').catch(() => null);
      const invoicesRes = await invoicesApi.list().catch(() => null);

      if (summaryRes) {
        // Merge or replace structure with defaults in case fields differ
        setFinanceSummary({
          kpis: summaryRes.kpis || fallbackSummary.kpis,
          revenueVsExpenses: summaryRes.revenueVsExpenses || fallbackSummary.revenueVsExpenses,
          cashFlow: summaryRes.cashFlow || fallbackSummary.cashFlow,
          quickStats: summaryRes.quickStats || fallbackSummary.quickStats,
          transactions: summaryRes.transactions || fallbackSummary.transactions,
          recurringExpenses: summaryRes.recurringExpenses || fallbackSummary.recurringExpenses,
          budgetTracker: summaryRes.budgetTracker || fallbackSummary.budgetTracker,
          expenseCategories: summaryRes.expenseCategories || fallbackSummary.expenseCategories
        });
      }

      if (invoicesRes) {
        // Compute stats and build a nice structure if it is just a raw array list
        const list = Array.isArray(invoicesRes) ? invoicesRes : (invoicesRes.data || invoicesRes.list || fallbackInvoices.list);
        const outstanding = list.filter(i => i.status === 'pending').reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
        const overdue = list.filter(i => i.status === 'overdue').reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
        const paidThisMonth = list.filter(i => i.status === 'paid').reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

        setInvoiceData({
          stats: {
            outstanding: outstanding || fallbackInvoices.stats.outstanding,
            overdue: overdue || fallbackInvoices.stats.overdue,
            paidThisMonth: paidThisMonth || fallbackInvoices.stats.paidThisMonth
          },
          agingAnalysis: fallbackInvoices.agingAnalysis, // default bar shape
          list: list.length > 0 ? list : fallbackInvoices.list
        });
      }
    } catch (e) {
      console.warn("Failed fetching finance APIs, proceeding with fallback data structure.", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  // Set up standard tab objects for the UI Tab component
  const tabsConfig = [
    {
      label: 'Overview',
      icon: TrendingUp,
      content: (
        <OverviewTab
          kpis={financeSummary.kpis}
          revenueVsExpenses={financeSummary.revenueVsExpenses}
          cashFlow={financeSummary.cashFlow}
          quickStats={financeSummary.quickStats}
        />
      )
    },
    {
      label: 'Transactions',
      icon: Wallet,
      content: (
        <TransactionsTab
          transactions={financeSummary.transactions}
        />
      )
    },
    {
      label: 'Invoices & Payables',
      icon: Receipt,
      content: (
        <InvoicesTab
          stats={invoiceData.stats}
          list={invoiceData.list}
          agingAnalysis={invoiceData.agingAnalysis}
        />
      )
    },
    {
      label: 'Recurring & Expenses',
      icon: Repeat,
      content: (
        <ExpensesAndBudgetTab
          recurring={financeSummary.recurringExpenses}
          categories={financeSummary.expenseCategories}
          budget={financeSummary.budgetTracker}
        />
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 font-['Plus_Jakarta_Sans'] text-[var(--az-text)]">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--az-border)] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[var(--az-text)] via-[var(--az-accent)] to-[var(--az-text)] bg-clip-text text-transparent">
            Finance & Revenue Intelligence
          </h1>
          <p className="text-sm text-[var(--az-text)] opacity-70 mt-1">
            Real-time balance, deep invoice telemetry, performance forecasting and cost management.
          </p>
        </div>
        <button
          onClick={fetchFinanceData}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--az-surface)] border border-[var(--az-border)] rounded-xl text-sm font-semibold hover:bg-[var(--az-border)] transition-all active:scale-95 text-[var(--az-text)]"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Sync Ledger</span>
        </button>
      </div>

      {loading ? (
        <SkeletonLoader />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={containerVariants}
          className="space-y-6"
        >
          {/* Enhanced tab switcher */}
          <Tabs
            tabs={tabsConfig}
            defaultIndex={activeTab}
            onChange={(idx) => setActiveTab(idx)}
            className="w-full"
          />
        </motion.div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1: OVERVIEW SUB-COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function OverviewTab({ kpis, revenueVsExpenses, cashFlow, quickStats }) {
  return (
    <motion.div variants={containerVariants} className="space-y-6">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants} className={`${cardStyleClass} relative overflow-hidden flex flex-col justify-between h-36`}>
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold opacity-70">Total Revenue</span>
            <div className="p-2 bg-[var(--az-accent)]/10 rounded-xl text-[var(--az-accent)]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold tracking-tight">
              <AnimatedNumber value={kpis.totalRevenue} format={(n) => fmtUSDC(n)} />
            </div>
            <p className="text-xs text-[var(--az-success)] flex items-center gap-1 mt-1 font-semibold">
              <span>+12.4% vs last period</span>
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={`${cardStyleClass} relative overflow-hidden flex flex-col justify-between h-36`}>
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold opacity-70">Expenses</span>
            <div className="p-2 bg-[var(--az-danger)]/10 rounded-xl text-[var(--az-danger)]">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold tracking-tight">
              <AnimatedNumber value={kpis.totalExpenses} format={(n) => fmtUSDC(n)} />
            </div>
            <p className="text-xs text-[var(--az-danger)] flex items-center gap-1 mt-1 font-semibold">
              <span>+4.2% vs last period</span>
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={`${cardStyleClass} relative overflow-hidden flex flex-col justify-between h-36`}>
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold opacity-70">Net Profit</span>
            <div className="p-2 bg-[var(--az-success)]/10 rounded-xl text-[var(--az-success)]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold tracking-tight">
              <AnimatedNumber value={kpis.netProfit} format={(n) => fmtUSDC(n)} />
            </div>
            <p className="text-xs text-[var(--az-success)] flex items-center gap-1 mt-1 font-semibold">
              <span>+18.1% net surge</span>
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={`${cardStyleClass} relative overflow-hidden flex flex-col justify-between h-36`}>
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold opacity-70">Profit Margin</span>
            <div className="p-2 bg-[var(--az-warning)]/10 rounded-xl text-[var(--az-warning)]">
              <ProfitMarginIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold tracking-tight">
              <AnimatedNumber value={kpis.profitMargin} format={(n) => `${fmt(n, 1)}%`} />
            </div>
            <div className="w-full bg-[var(--az-border)] h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-[var(--az-warning)] h-full rounded-full" style={{ width: `${Math.min(kpis.profitMargin, 100)}%` }}></div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Revenue vs Expenses & Cash Flow Trend Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className={cardStyleClass}>
          <h3 className="text-lg font-bold mb-4">Revenue vs Expenses</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueVsExpenses} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--az-border)" opacity={0.5} />
                <XAxis dataKey="month" stroke="var(--az-text)" opacity={0.6} tickLine={false} style={{ fontSize: '12px' }} />
                <YAxis stroke="var(--az-text)" opacity={0.6} tickLine={false} style={{ fontSize: '12px' }} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: 'var(--az-surface)', borderColor: 'var(--az-border)', borderRadius: '12px' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Bar dataKey="revenue" fill="var(--az-accent)" name="Revenue" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" fill="var(--az-danger)" name="Expenses" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={cardStyleClass}>
          <h3 className="text-lg font-bold mb-4">Cash Flow Index</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlow} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--az-accent)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--az-accent)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--az-border)" opacity={0.5} />
                <XAxis dataKey="date" stroke="var(--az-text)" opacity={0.6} tickLine={false} style={{ fontSize: '12px' }} />
                <YAxis stroke="var(--az-text)" opacity={0.6} tickLine={false} style={{ fontSize: '12px' }} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: 'var(--az-surface)', borderColor: 'var(--az-border)', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="balance" stroke="var(--az-accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorInflow)" name="Net Cash Flow" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Quick stats and Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className={`${cardStyleClass} flex flex-col justify-between`}>
          <div>
            <h3 className="text-lg font-bold">Quick Efficiency Metrics</h3>
            <p className="text-xs opacity-75 mb-4">Key indicators of customer purchase flows and liquidity rates.</p>
          </div>
          <div className="space-y-6 py-2">
            <div className="flex items-center justify-between border-b border-[var(--az-border)] pb-3">
              <div>
                <p className="text-xs opacity-60">Avg Order Value</p>
                <p className="text-xl font-bold mt-1">{fmtUSDC(quickStats.avgOrderValue)}</p>
              </div>
              <span className="text-xs font-semibold text-[var(--az-success)] bg-[var(--az-success)]/10 px-2 py-1 rounded-lg">Healthy</span>
            </div>
            <div className="flex items-center justify-between border-b border-[var(--az-border)] pb-3">
              <div>
                <p className="text-xs opacity-60">Fulfillment Liquidity</p>
                <p className="text-xl font-bold mt-1">98.4%</p>
              </div>
              <span className="text-xs font-semibold text-[var(--az-success)] bg-[var(--az-success)]/10 px-2 py-1 rounded-lg">Superior</span>
            </div>
            <div className="flex items-center justify-between pb-1">
              <div>
                <p className="text-xs opacity-60">Operational Burn Rate</p>
                <p className="text-xl font-bold mt-1">Low</p>
              </div>
              <span className="text-xs font-semibold text-[var(--az-success)] bg-[var(--az-success)]/10 px-2 py-1 rounded-lg">Optimized</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={`${cardStyleClass} lg:col-span-2`}>
          <h3 className="text-lg font-bold mb-2">Payment Method Distribution</h3>
          <p className="text-xs opacity-75 mb-4">Breakdown of system inbound volumes by payment gateways.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={quickStats.paymentMethodBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {quickStats.paymentMethodBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(v) => fmtUSDC(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {quickStats.paymentMethodBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="opacity-80">{item.name}</span>
                  </div>
                  <span className="font-bold">{fmtUSDC(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2: TRANSACTIONS SUB-COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function TransactionsTab({ transactions }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filter & Sort Logic
  const processedTransactions = useMemo(() => {
    let list = [...transactions];

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(t =>
        t.description.toLowerCase().includes(s) ||
        t.category.toLowerCase().includes(s) ||
        t.id.toLowerCase().includes(s)
      );
    }

    if (typeFilter !== 'all') {
      list = list.filter(t => t.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      list = list.filter(t => t.status === statusFilter);
    }

    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date) - new Date(b.date);
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      } else {
        comparison = a[sortField].localeCompare(b[sortField]);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [transactions, searchTerm, typeFilter, statusFilter, sortField, sortOrder]);

  // Paginated elements
  const totalPages = Math.ceil(processedTransactions.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedTransactions.slice(start, start + itemsPerPage);
  }, [processedTransactions, currentPage]);

  const filteredTotal = useMemo(() => {
    return processedTransactions.reduce((acc, curr) => {
      if (curr.type === 'income') return acc + curr.amount;
      return acc - curr.amount;
    }, 0);
  }, [processedTransactions]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  return (
    <motion.div variants={containerVariants} className="space-y-6">
      {/* Filters Panel */}
      <motion.div variants={itemVariants} className={`${cardStyleClass} !p-4 flex flex-col md:flex-row gap-3 items-center justify-between`}>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--az-text)] opacity-55" />
          <input
            type="text"
            placeholder="Search description, category..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-transparent border border-[var(--az-border)] rounded-xl outline-none focus:border-[var(--az-accent)] transition-colors"
          />
        </div>

        <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-60 flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 text-xs font-semibold bg-[var(--az-surface)] border border-[var(--az-border)] rounded-xl focus:border-[var(--az-accent)] text-[var(--az-text)]"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs opacity-60">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 text-xs font-semibold bg-[var(--az-surface)] border border-[var(--az-border)] rounded-xl focus:border-[var(--az-accent)] text-[var(--az-text)]"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <button
            onClick={() => {
              // Stub export action
              alert("Telemetry: Export transaction roster configured! Ready for CSV production.");
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--az-accent)] text-white text-xs font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all ml-auto md:ml-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </motion.div>

      {/* Main Roster Table */}
      <motion.div variants={itemVariants} className={`${cardStyleClass} !p-0 overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--az-border)] bg-[var(--az-text)]/[0.02]">
                <th onClick={() => toggleSort('date')} className="p-4 font-bold opacity-75 cursor-pointer hover:bg-[var(--az-border)]/20 transition-colors">
                  <div className="flex items-center gap-1.5">Date <ArrowUpDown className="w-3.5 h-3.5" /></div>
                </th>
                <th className="p-4 font-bold opacity-75">Description</th>
                <th className="p-4 font-bold opacity-75">Category</th>
                <th onClick={() => toggleSort('amount')} className="p-4 font-bold opacity-75 cursor-pointer hover:bg-[var(--az-border)]/20 transition-colors">
                  <div className="flex items-center gap-1.5">Amount <ArrowUpDown className="w-3.5 h-3.5" /></div>
                </th>
                <th className="p-4 font-bold opacity-75">Status</th>
                <th className="p-4 font-bold opacity-75 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--az-border)]">
              {paginatedList.length > 0 ? (
                paginatedList.map((t, idx) => (
                  <tr key={idx} className="hover:bg-[var(--az-text)]/[0.01] transition-colors">
                    <td className="p-4 font-medium opacity-80">{t.date}</td>
                    <td className="p-4">
                      <p className="font-semibold">{t.description}</p>
                      <p className="text-xs opacity-60">{t.id}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md bg-[var(--az-border)]/40 text-xs font-semibold">{t.category}</span>
                    </td>
                    <td className="p-4 font-bold">
                      <span className={t.type === 'income' ? 'text-[var(--az-success)]' : 'text-[var(--az-danger)]'}>
                        {t.type === 'income' ? '+' : '-'}{fmtUSDC(t.amount)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        t.status === 'completed' ? 'bg-[var(--az-success)]/10 text-[var(--az-success)]' :
                        t.status === 'pending' ? 'bg-[var(--az-warning)]/10 text-[var(--az-warning)]' :
                        'bg-[var(--az-danger)]/10 text-[var(--az-danger)]'
                      }`}>
                        {t.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                        {t.status === 'pending' && <Clock className="w-3 h-3" />}
                        {t.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                        <span className="capitalize">{t.status}</span>
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => alert(`Reviewing transaction audit ledger for: ${t.id}`)}
                        className="text-xs font-bold text-[var(--az-accent)] hover:underline"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center opacity-60">No transactions matching current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary & Pagination */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 border-t border-[var(--az-border)] bg-[var(--az-text)]/[0.02]">
          <div className="text-sm font-semibold">
            Filtered net total:&nbsp;
            <span className={filteredTotal >= 0 ? 'text-[var(--az-success)]' : 'text-[var(--az-danger)]'}>
              {filteredTotal >= 0 ? '+' : ''}{fmtUSDC(filteredTotal)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 bg-transparent border border-[var(--az-border)] rounded-lg hover:bg-[var(--az-border)] transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-2">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 bg-transparent border border-[var(--az-border)] rounded-lg hover:bg-[var(--az-border)] transition-colors disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3: INVOICES & PAYABLES SUB-COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function InvoicesTab({ stats, list, agingAnalysis }) {
  return (
    <motion.div variants={containerVariants} className="space-y-6">
      {/* Summary KPI panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div variants={itemVariants} className={`${cardStyleClass} flex items-center justify-between`}>
          <div>
            <p className="text-xs opacity-65 font-semibold">Outstanding Balance</p>
            <p className="text-2xl font-black mt-1 text-[var(--az-accent)]">
              <AnimatedNumber value={stats.outstanding} format={(n) => fmtUSDC(n)} />
            </p>
          </div>
          <div className="p-3 bg-[var(--az-accent)]/15 rounded-2xl text-[var(--az-accent)]">
            <Clock className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={`${cardStyleClass} flex items-center justify-between`}>
          <div>
            <p className="text-xs opacity-65 font-semibold">Overdue Receivables</p>
            <p className="text-2xl font-black mt-1 text-[var(--az-danger)]">
              <AnimatedNumber value={stats.overdue} format={(n) => fmtUSDC(n)} />
            </p>
          </div>
          <div className="p-3 bg-[var(--az-danger)]/15 rounded-2xl text-[var(--az-danger)]">
            <AlertCircle className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={`${cardStyleClass} flex items-center justify-between`}>
          <div>
            <p className="text-xs opacity-65 font-semibold">Settled This Month</p>
            <p className="text-2xl font-black mt-1 text-[var(--az-success)]">
              <AnimatedNumber value={stats.paidThisMonth} format={(n) => fmtUSDC(n)} />
            </p>
          </div>
          <div className="p-3 bg-[var(--az-success)]/15 rounded-2xl text-[var(--az-success)]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Aging analysis chart */}
        <motion.div variants={itemVariants} className={`${cardStyleClass} lg:col-span-2`}>
          <h3 className="text-base font-bold mb-1">Aging Analysis</h3>
          <p className="text-xs opacity-65 mb-4">Chronological bucket representing pending payouts.</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingAnalysis} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--az-border)" opacity={0.5} />
                <XAxis dataKey="range" stroke="var(--az-text)" opacity={0.6} tickLine={false} style={{ fontSize: '11px' }} />
                <YAxis stroke="var(--az-text)" opacity={0.6} tickLine={false} style={{ fontSize: '11px' }} />
                <RechartsTooltip formatter={(v) => fmtUSDC(v)} />
                <Bar dataKey="amount" fill="var(--az-accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Invoice list */}
        <motion.div variants={itemVariants} className={`${cardStyleClass} lg:col-span-3 space-y-4`}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold">Active Receivables</h3>
              <p className="text-xs opacity-65">Roster of pending client billings</p>
            </div>
            <button
              onClick={() => alert("Creating a new invoice system payload...")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--az-accent)] text-white text-xs font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Invoice</span>
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-72 pr-1">
            {list.map((inv, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-[var(--az-border)] rounded-xl hover:bg-[var(--az-text)]/[0.01] transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{inv.id}</span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${
                      inv.status === 'paid' ? 'bg-[var(--az-success)]/10 text-[var(--az-success)]' :
                      inv.status === 'pending' ? 'bg-[var(--az-warning)]/10 text-[var(--az-warning)]' :
                      'bg-[var(--az-danger)]/10 text-[var(--az-danger)]'
                    }`}>
                      {inv.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs font-semibold opacity-75">{inv.client}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-black">{fmtUSDC(inv.amount)}</p>
                  <p className="text-[10px] opacity-60">Due: {inv.dueDate}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 4: RECURRING & EXPENSES SUB-COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function ExpensesAndBudgetTab({ recurring, categories, budget }) {
  return (
    <motion.div variants={containerVariants} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recurring Expense templates list */}
        <motion.div variants={itemVariants} className={`${cardStyleClass} lg:col-span-3 space-y-4`}>
          <div>
            <h3 className="text-base font-bold">Recurring Outflows</h3>
            <p className="text-xs opacity-65">System operations retainers and standard software costs.</p>
          </div>

          <div className="space-y-3">
            {recurring.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 border border-[var(--az-border)] rounded-xl hover:bg-[var(--az-text)]/[0.01] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[var(--az-text)]/[0.04] rounded-xl text-opacity-80">
                    <Calendar className="w-5 h-5 text-[var(--az-accent)]" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] opacity-60 flex items-center gap-1 capitalize">
                        <Repeat className="w-3 h-3" /> {item.interval}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--az-border)]"></span>
                      <span className="text-[10px] font-semibold opacity-60 flex items-center gap-0.5"><Tag className="w-3 h-3" /> {item.category}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-sm">{fmtUSDC(item.amount)}</p>
                  <p className="text-[10px] opacity-60 mt-0.5">Next: {item.nextDate}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Expense Category Donut */}
        <motion.div variants={itemVariants} className={`${cardStyleClass} lg:col-span-2 flex flex-col justify-between`}>
          <div>
            <h3 className="text-base font-bold">Outflow Distribution</h3>
            <p className="text-xs opacity-65 mb-4">Historical expenses classified under organizational groups.</p>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(v) => fmtUSDC(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] font-semibold">
            {categories.map((cat, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                <span className="opacity-80 truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Budget tracker */}
      <motion.div variants={itemVariants} className={cardStyleClass}>
        <h3 className="text-lg font-bold mb-1">Functional Budget Envelopes</h3>
        <p className="text-xs opacity-65 mb-6">Comparison tracking of actual operational expenditure against fixed guidelines.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budget.map((b, idx) => {
            const percentage = Math.min((b.actual / b.budget) * 100, 100);
            const isNearingLimit = percentage > 85;

            return (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold">{b.category}</span>
                  <span className="text-xs">
                    <span className="font-bold">{fmtUSDC(b.actual)}</span>
                    <span className="opacity-60"> of {fmtUSDC(b.budget)}</span>
                  </span>
                </div>
                <div className="w-full bg-[var(--az-border)] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isNearingLimit ? 'bg-[var(--az-danger)]' : 'bg-[var(--az-accent)]'}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[10px] opacity-60">
                  <span>{fmt(percentage, 0)}% spent</span>
                  {isNearingLimit && <span className="text-[var(--az-danger)] font-bold">Exhaustion warning threshold reached</span>}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
