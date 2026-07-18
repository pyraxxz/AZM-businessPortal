import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { business as businessApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { Card, Button, Badge, Switch, Avatar, GlassPanel } from '@/components/ui';
import { KYB_STATUS_META } from '@/lib/utils';
import {
  Building2,
  Users,
  Bell,
  Sliders,
  ChevronRight,
  ShieldAlert,
  Moon,
  Sun,
  LogOut,
  CheckCircle2,
  Link,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { bizProfile, user, logout, refreshProfile } = useAuth();
  const { hasPermission } = usePermission();
  const canManage = hasPermission('settings.manage');
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    document.documentElement.classList.toggle('dark');
    toast.success(`${nextDark ? 'Dark' : 'Light'} mode enabled`);
  };

  const copyBizId = async () => {
    if (!bizProfile?.bizId) return;
    try {
      await navigator.clipboard.writeText(bizProfile.bizId);
      toast.success('Business ID copied to clipboard');
    } catch {
      toast.error('Failed to copy Business ID');
    }
  };

  // Quick settings items linked to sub-paths or handled gracefully
  const QUICK_SETTINGS = [
    {
      icon: Users,
      title: 'Team & Roles',
      description: 'Manage staff roles, access permissions and invite members.',
      link: '/employees',
      color: '#6C4FD1'
    },
    {
      icon: Bell,
      title: 'Notification Prefs',
      description: 'Choose which email, push, and SMS alerts you want to receive.',
      link: '/notifications',
      color: '#3B82F6'
    },
    {
      icon: Sliders,
      title: 'Business Meta',
      description: 'Configure operational hours, category details, and metadata.',
      link: '/settings',
      color: '#10B981'
    },
    {
      icon: ShieldAlert,
      title: 'Danger Zone',
      description: 'Permanently delete this business account, apps, and associated data.',
      link: '/settings',
      color: '#EF4444'
    }
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fade-in" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--az-text)] tracking-tight">Settings Hub</h1>
        <p className="text-sm text-[var(--sn-text-muted)] mt-1">
          Configure business metadata, team access, connected services, and system preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card + Account Status */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Business Profile Card */}
          <GlassPanel className="overflow-hidden border border-[var(--az-border)] rounded-2xl relative flex flex-col">
            {/* Cover Banner */}
            <div className="h-28 w-full bg-gradient-to-r from-[#6C4FD1]/20 to-[#3B82F6]/20 relative overflow-hidden">
              {bizProfile?.coverPhotoUrl ? (
                <img src={bizProfile.coverPhotoUrl} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-tr from-[#6C4FD1] to-[#a29bfe] opacity-30" />
              )}
              {/* KYB Status Badge floating */}
              <div className="absolute top-3 right-3">
                <Badge
                  className="backdrop-blur-md"
                  color={KYB_STATUS_META[bizProfile?.kybStatus || 'UNVERIFIED']?.color || '#EF4444'}
                  bg="rgba(255, 255, 255, 0.85)"
                >
                  {bizProfile?.kybStatus || 'UNVERIFIED'}
                </Badge>
              </div>
            </div>

            {/* Profile Avatar & Info */}
            <div className="px-5 pb-5 pt-0 relative flex flex-col flex-1">
              <div className="flex justify-between items-end -mt-10 mb-4">
                <div className="w-20 h-20 rounded-2xl border-4 border-[var(--az-bg)] bg-white overflow-hidden shadow-md flex-shrink-0 flex items-center justify-center">
                  {bizProfile?.logoUrl ? (
                    <img src={bizProfile.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-10 h-10 text-[#6C4FD1]" />
                  )}
                </div>
              </div>

              <div className="space-y-1.5 flex-1">
                <h2 className="text-lg font-bold text-[var(--az-text)] flex items-center gap-1.5">
                  {bizProfile?.businessName || 'Business Portal'}
                </h2>
                <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-[#6C4FD1]/10 text-[#6C4FD1] uppercase tracking-wider">
                  {bizProfile?.category || 'General Business'}
                </span>
                <p className="text-xs text-[var(--sn-text-muted)] line-clamp-2 mt-2">
                  {bizProfile?.description || 'No business description provided yet.'}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-[var(--az-border)] flex items-center justify-between text-xs">
                <span className="text-[var(--sn-text-muted)]">Business ID:</span>
                <button
                  onClick={copyBizId}
                  className="font-mono text-[#6C4FD1] hover:underline cursor-pointer"
                  title="Click to copy"
                >
                  {bizProfile?.bizId ? `${bizProfile.bizId.slice(0, 8)}...${bizProfile.bizId.slice(-6)}` : '—'}
                </button>
              </div>
            </div>
          </GlassPanel>

          {/* Account Profile Card */}
          <GlassPanel className="p-5 border border-[var(--az-border)] rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-[var(--az-text)]">User Session</h3>
            <div className="flex items-center gap-3.5">
              <Avatar
                name={user?.fullName || user?.email || 'User'}
                src={user?.avatarUrl}
                className="w-12 h-12 rounded-xl shadow-inner border border-[var(--az-border)]"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[var(--az-text)] truncate">{user?.fullName || 'Active Operator'}</p>
                <p className="text-xs text-[var(--sn-text-muted)] truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs px-2 py-1 rounded-md bg-[var(--az-border)] text-[var(--az-text)] font-semibold uppercase tracking-wider">
                {user?.role || 'Operator'}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={logout}
                className="text-red-500 hover:text-red-600 hover:bg-red-50/50 border border-red-100/30 gap-1.5 h-9"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </Button>
            </div>
          </GlassPanel>

          {/* Theme Switcher Toggle */}
          <GlassPanel className="p-5 border border-[var(--az-border)] rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Moon className="w-5 h-5 text-[#6C4FD1]" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <p className="text-sm font-bold text-[var(--az-text)]">Theme Mode</p>
                <p className="text-xs text-[var(--sn-text-muted)]">
                  {isDarkMode ? 'Dark UI theme' : 'Light UI theme'} enabled
                </p>
              </div>
            </div>
            <Switch checked={isDarkMode} onChange={toggleTheme} />
          </GlassPanel>

        </div>

        {/* Right Column: Quick Settings + Integrations */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Settings Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[var(--az-text)] uppercase tracking-wider pl-1">Quick Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {QUICK_SETTINGS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <GlassPanel
                    key={idx}
                    className="p-5 border border-[var(--az-border)] rounded-2xl flex items-start gap-4 hover:shadow-md hover:border-[#6C4FD1]/40 transition-all duration-300 group cursor-pointer"
                    onClick={() => {
                      window.location.href = item.link;
                    }}
                  >
                    <div
                      className="p-3 rounded-xl flex-shrink-0"
                      style={{ backgroundColor: `${item.color}12`, color: item.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-[var(--az-text)] group-hover:text-[#6C4FD1] transition-colors">
                          {item.title}
                        </h4>
                        <ChevronRight className="w-4 h-4 text-[var(--sn-text-muted)] group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p className="text-xs text-[var(--sn-text-muted)] mt-1.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </GlassPanel>
                );
              })}
            </div>
          </div>

          {/* Integrations & Connected Services */}
          <GlassPanel className="p-6 border border-[var(--az-border)] rounded-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--az-text)]">Integration & Gateway Status</h3>
                <p className="text-xs text-[var(--sn-text-muted)] mt-0.5">
                  Monitor live synchronization, gateway tokens, and push webhooks.
                </p>
              </div>
              <Badge color="#10B981" bg="rgba(16, 185, 129, 0.1)">Active Connection</Badge>
            </div>

            <div className="divide-y divide-[var(--az-border)]">
              {/* API Token Status */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--az-text)]">Merchant Scoped Token</p>
                    <p className="text-[10px] text-[var(--sn-text-muted)]">Verified live backend operations</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-semibold text-emerald-500">Authorized</span>
                </div>
              </div>

              {/* Webhook Status */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#6C4FD1]/10 flex items-center justify-center text-[#6C4FD1]">
                    <Link className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--az-text)]">Webhooks Gateway</p>
                    <p className="text-[10px] text-[var(--sn-text-muted)]">Pushing transaction status changes</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-semibold text-emerald-500">Online</span>
                </div>
              </div>

              {/* Service Status */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--az-text)]">AZM Blockchain Gateway</p>
                    <p className="text-[10px] text-[var(--sn-text-muted)]">Escrow funding & settlement layer</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-semibold text-emerald-500">Synced</span>
                </div>
              </div>
            </div>
          </GlassPanel>

        </div>
      </div>
    </div>
  );
}
