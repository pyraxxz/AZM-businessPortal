import { useState, useEffect } from 'react';
import { employeeApi } from '@/lib/marketplaceApi';
import { usePermission } from '@/hooks/usePermission';
import {
  Card,
  Button,
  Badge,
  Input,
  Select,
  Modal,
  Empty,
  Skeleton,
  Avatar
} from '@/components/ui';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { useToast } from '@/components/ui/Toast';
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  Clock,
  Calendar,
  DollarSign,
  Ban,
  CheckCircle2,
  Filter,
  Grid,
  List,
  Download,
  Building,
  Shield
} from 'lucide-react';

const STATUS_COLORS = {
  ACTIVE: '#6C4FD1',
  SUSPENDED: '#F59E0B',
  TERMINATED: '#EF4444',
};

export default function Employees() {
  const { toast } = useToast();
  const { hasPermission } = usePermission();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search, view & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  // Profile side-drawer / modal details
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Invite member state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    azmId: '',
    role: 'STAFF',
    title: '',
    department: '',
    payrollType: 'HOURLY',
    salaryAmount: '',
    hourlyRate: '',
    paymentPreference: 'USDC',
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await employeeApi.list();
      setEmployees(res.data?.employees || []);
    } catch (err) {
      toast.error('Failed to load employee directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleInviteSubmit = async () => {
    try {
      if (!inviteForm.azmId) {
        toast.error('Azaman ID is required');
        return;
      }
      const payload = {
        azmId: inviteForm.azmId,
        role: inviteForm.role,
        title: inviteForm.title,
        department: inviteForm.department,
        payrollType: inviteForm.payrollType,
        salaryAmount: inviteForm.payrollType === 'SALARY' ? parseFloat(inviteForm.salaryAmount || 0) : undefined,
        hourlyRate: inviteForm.payrollType === 'HOURLY' ? parseFloat(inviteForm.hourlyRate || 0) : undefined,
        paymentPreference: inviteForm.paymentPreference,
      };

      await employeeApi.create(payload);
      toast.success('Member invited successfully');
      setIsInviteOpen(false);
      setInviteForm({
        azmId: '',
        role: 'STAFF',
        title: '',
        department: '',
        payrollType: 'HOURLY',
        salaryAmount: '',
        hourlyRate: '',
        paymentPreference: 'USDC',
      });
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to invite team member');
    }
  };

  const handleExportRoster = () => {
    toast.success('Roster exported successfully as CSV (UI simulation)');
  };

  // Filter staff locally
  const filteredEmployees = employees.filter((emp) => {
    const name = emp.user?.fullName || '';
    const email = emp.user?.email || '';
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || emp.role === roleFilter;
    const matchesDept = departmentFilter === 'ALL' || emp.department === departmentFilter;
    const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;

    return matchesSearch && matchesRole && matchesDept && matchesStatus;
  });

  // Departments list extracted dynamically
  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  // KPI Calculations
  const totalCount = employees.length;
  const activeCount = employees.filter(e => e.status === 'ACTIVE').length;
  const onLeaveCount = employees.filter(e => e.status === 'SUSPENDED').length;
  const deptsCount = departments.length;

  // Helper to color initials beautifully
  const getInitialsColor = (name) => {
    if (!name) return '#6C4FD1';
    const colors = ['#6C4FD1', '#10B981', '#3B82F6', '#EC4899', '#F59E0B', '#8B5CF6'];
    const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const canCreate = hasPermission('employees.create');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--az-text)]">Team Directory</h1>
            <Badge color="#6C4FD1" bg="rgba(108, 79, 209, 0.1)">
              {totalCount} Staff Member{totalCount !== 1 ? 's' : ''}
            </Badge>
          </div>
          <p className="text-sm text-[var(--sn-text-muted)] mt-1">
            Manage your staff directory, permissions, departments, compensation models, and schedule metrics.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleExportRoster} className="gap-2 text-[var(--az-text)]">
            <Download className="w-4 h-4" /> Export Roster
          </Button>
          {canCreate && (
            <Button onClick={() => setIsInviteOpen(true)} className="bg-[#6C4FD1] text-white hover:bg-[#5b42b1] gap-2">
              <UserPlus className="w-4 h-4" /> Invite Member
            </Button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassPanel className="p-4 border border-[var(--az-border)] rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#6C4FD1]/10 text-[#6C4FD1]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-[var(--sn-text-muted)]">Total Staff</span>
            <p className="text-xl font-extrabold text-[var(--az-text)]">{totalCount}</p>
          </div>
        </GlassPanel>

        <GlassPanel className="p-4 border border-[var(--az-border)] rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-[var(--sn-text-muted)]">Active Now</span>
            <p className="text-xl font-extrabold text-[var(--az-text)]">{activeCount}</p>
          </div>
        </GlassPanel>

        <GlassPanel className="p-4 border border-[var(--az-border)] rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-[var(--sn-text-muted)]">On Leave / Suspended</span>
            <p className="text-xl font-extrabold text-[var(--az-text)]">{onLeaveCount}</p>
          </div>
        </GlassPanel>

        <GlassPanel className="p-4 border border-[var(--az-border)] rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-[var(--sn-text-muted)]">Departments</span>
            <p className="text-xl font-extrabold text-[var(--az-text)]">{deptsCount}</p>
          </div>
        </GlassPanel>
      </div>

      {/* Search & Filter Controls */}
      <GlassPanel className="p-4 border border-[var(--az-border)] rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sn-text-muted)]" />
          <Input
            placeholder="Search by operator name or email address..."
            className="pl-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-[var(--az-border)]/20 px-3 py-1.5 rounded-xl border border-[var(--az-border)] text-xs font-semibold">
            <Filter className="w-3.5 h-3.5 text-[var(--sn-text-muted)]" />
            <span className="text-[var(--sn-text-muted)]">Filters</span>
          </div>

          <Select
            value={roleFilter}
            onChange={(val) => setRoleFilter(val)}
            options={[
              { value: 'ALL', label: 'All Roles' },
              { value: 'OWNER', label: 'Owner' },
              { value: 'MANAGER', label: 'Manager' },
              { value: 'SUPERVISOR', label: 'Supervisor' },
              { value: 'STAFF', label: 'Staff' }
            ]}
          />

          <Select
            value={departmentFilter}
            onChange={(val) => setDepartmentFilter(val)}
            options={[
              { value: 'ALL', label: 'All Depts' },
              ...departments.map(d => ({ value: d, label: d }))
            ]}
          />

          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: 'ALL', label: 'All Status' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'SUSPENDED', label: 'Suspended' },
              { value: 'TERMINATED', label: 'Terminated' }
            ]}
          />

          {/* Toggle View Modes */}
          <div className="flex bg-[var(--az-border)]/20 p-1 rounded-xl border border-[var(--az-border)] ml-auto md:ml-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-[#6C4FD1]' : 'text-[var(--sn-text-muted)]'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow text-[#6C4FD1]' : 'text-[var(--sn-text-muted)]'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </GlassPanel>

      {/* Directory Main List/Grid View */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <Card className="flex items-center justify-center py-16 border-dashed border-[var(--az-border)]">
          <Empty icon={Users} title="No staff members match" description="Refine your query filters or insert a new team invite." />
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((emp) => {
            const fullName = emp.user?.fullName || 'Invite Pending';
            const initColor = getInitialsColor(fullName);
            return (
              <GlassPanel
                key={emp.id}
                onClick={() => { setSelectedEmployee(emp); setIsDrawerOpen(true); }}
                className="p-5 border border-[var(--az-border)] rounded-2xl flex flex-col hover:shadow-lg hover:border-[#6C4FD1]/30 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: initColor }}
                    >
                      {getInitials(fullName)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--az-text)] group-hover:text-[#6C4FD1] transition-colors line-clamp-1">
                        {fullName}
                      </h3>
                      <p className="text-xs text-[var(--sn-text-muted)] mt-0.5 line-clamp-1">
                        {emp.title || emp.role}
                      </p>
                    </div>
                  </div>
                  <Badge
                    color={STATUS_COLORS[emp.status] || '#6C4FD1'}
                    bg={`${STATUS_COLORS[emp.status] || '#6C4FD1'}12`}
                  >
                    {emp.status}
                  </Badge>
                </div>

                <div className="space-y-2 border-t border-[var(--az-border)] pt-3 text-xs text-[var(--sn-text-muted)] flex-1">
                  <div className="flex items-center justify-between">
                    <span>Department:</span>
                    <span className="font-semibold text-[var(--az-text)]">{emp.department || 'Operations'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Compensation:</span>
                    <span className="font-semibold text-[var(--az-text)]">
                      {emp.payrollType === 'SALARY' ? `$${emp.salaryAmount}/yr` : `$${emp.hourlyRate || 0}/hr`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Payment:</span>
                    <span className="font-semibold text-[var(--az-text)] font-mono">{emp.paymentPreference || 'USDC'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--az-border)] flex items-center justify-between text-[11px] text-[var(--sn-text-muted)]">
                  <span>Hired: {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : 'Pending'}</span>
                  <span className="text-[#6C4FD1] group-hover:underline font-semibold">View Details →</span>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      ) : (
        /* List Mode View */
        <GlassPanel className="border border-[var(--az-border)] rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--az-border)]/20 text-xs font-semibold text-[var(--sn-text-muted)] border-b border-[var(--az-border)]">
                <th className="p-4">Staff Member</th>
                <th className="p-4">Department</th>
                <th className="p-4">Role</th>
                <th className="p-4">Compensation</th>
                <th className="p-4">Status</th>
                <th className="p-4">Hire Date</th>
                <th className="p-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--az-border)] text-xs text-[var(--az-text)]">
              {filteredEmployees.map((emp) => {
                const fullName = emp.user?.fullName || 'Invite Pending';
                const initColor = getInitialsColor(fullName);
                return (
                  <tr
                    key={emp.id}
                    onClick={() => { setSelectedEmployee(emp); setIsDrawerOpen(true); }}
                    className="hover:bg-[var(--az-border)]/10 cursor-pointer transition-colors"
                  >
                    <td className="p-4 flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                        style={{ backgroundColor: initColor }}
                      >
                        {getInitials(fullName)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold truncate">{fullName}</p>
                        <p className="text-[10px] text-[var(--sn-text-muted)] truncate">{emp.user?.email || '—'}</p>
                      </div>
                    </td>
                    <td className="p-4 font-semibold">{emp.department || 'Operations'}</td>
                    <td className="p-4 text-[var(--sn-text-muted)]">{emp.title || emp.role}</td>
                    <td className="p-4 font-mono font-semibold">
                      {emp.payrollType === 'SALARY' ? `$${emp.salaryAmount}/yr` : `$${emp.hourlyRate || 0}/hr`}
                    </td>
                    <td className="p-4">
                      <span
                        className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase"
                        style={{ color: STATUS_COLORS[emp.status], backgroundColor: `${STATUS_COLORS[emp.status]}12` }}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--sn-text-muted)]">
                      {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4 text-right text-[#6C4FD1] font-semibold hover:underline">View →</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </GlassPanel>
      )}

      {/* Side Profile Detail Drawer (Right Aligned Modal Simulation) */}
      {selectedEmployee && (
        <Modal
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title="Staff Profile Details"
        >
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
            
            {/* Drawer Hero */}
            <div className="flex items-center gap-4 border-b border-[var(--az-border)] pb-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: getInitialsColor(selectedEmployee.user?.fullName || 'Pending') }}
              >
                {getInitials(selectedEmployee.user?.fullName || 'Pending')}
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[var(--az-text)]">
                  {selectedEmployee.user?.fullName || 'Invite Pending'}
                </h3>
                <p className="text-xs text-[var(--sn-text-muted)] mt-0.5">
                  {selectedEmployee.title || selectedEmployee.role} — {selectedEmployee.department || 'Operations'}
                </p>
              </div>
            </div>

            {/* Profile Contact */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[var(--sn-text-muted)] uppercase tracking-wider">Contact & Account</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-xs text-[var(--sn-text-muted)] bg-[var(--az-border)]/15 p-3 rounded-xl border border-[var(--az-border)]">
                  <Mail className="w-4 h-4 text-[#6C4FD1]" />
                  <span className="truncate">{selectedEmployee.user?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--sn-text-muted)] bg-[var(--az-border)]/15 p-3 rounded-xl border border-[var(--az-border)]">
                  <Phone className="w-4 h-4 text-[#6C4FD1]" />
                  <span>{selectedEmployee.user?.phoneNumber || 'No phone recorded'}</span>
                </div>
              </div>
            </div>

            {/* Permissions Summary Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[var(--sn-text-muted)] uppercase tracking-wider">System Permissions Summary</h4>
              <GlassPanel className="p-4 border border-[var(--az-border)] rounded-xl space-y-2">
                <div className="flex items-center justify-between border-b border-[var(--az-border)] pb-2 text-xs">
                  <span className="font-bold text-[var(--az-text)] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#6C4FD1]" /> Policy Assignment: {selectedEmployee.role}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(selectedEmployee.permissions && selectedEmployee.permissions.length > 0) ? (
                    selectedEmployee.permissions.map((p, i) => (
                      <Badge key={i} color="#6C4FD1" bg="rgba(108, 79, 209, 0.1)">{p}</Badge>
                    ))
                  ) : (
                    <p className="text-[11px] text-[var(--sn-text-muted)]">Default role-level permissions are applied to this account.</p>
                  )}
                </div>
              </GlassPanel>
            </div>

            {/* Quick Actions Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[var(--sn-text-muted)] uppercase tracking-wider">Operational Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <a
                  href="/employees"
                  className="flex items-center justify-between p-3.5 bg-white border border-[var(--az-border)] hover:border-[#6C4FD1] rounded-xl transition-all font-semibold text-[#6C4FD1]"
                >
                  <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Schedule Roster</span>
                  <span>View & Edit →</span>
                </a>
                <a
                  href="/employees"
                  className="flex items-center justify-between p-3.5 bg-white border border-[var(--az-border)] hover:border-[#6C4FD1] rounded-xl transition-all font-semibold text-[#6C4FD1]"
                >
                  <span className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> Payroll Position</span>
                  <span>Review →</span>
                </a>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--az-border)] flex justify-end">
              <Button onClick={() => setIsDrawerOpen(false)} variant="secondary">Close Profile</Button>
            </div>

          </div>
        </Modal>
      )}

      {/* Invite Member Modal */}
      <Modal open={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite Team Member">
        <div className="space-y-4">
          <Input
            label="Azaman ID (User ID)"
            placeholder="AZM-1234567"
            value={inviteForm.azmId}
            onChange={e => setInviteForm({ ...inviteForm, azmId: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Title (e.g. Lead Designer)"
              placeholder="Title"
              value={inviteForm.title}
              onChange={e => setInviteForm({ ...inviteForm, title: e.target.value })}
            />
            <Input
              label="Department"
              placeholder="E.g. Engineering"
              value={inviteForm.department}
              onChange={e => setInviteForm({ ...inviteForm, department: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase tracking-wider">System Role</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[var(--az-border)] text-[var(--az-text)] text-sm outline-none focus:border-[#6C4FD1]"
                value={inviteForm.role}
                onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
              >
                <option value="STAFF">Staff Operator</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--sn-text-muted)] uppercase tracking-wider">Payroll Model</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[var(--az-border)] text-[var(--az-text)] text-sm outline-none focus:border-[#6C4FD1]"
                value={inviteForm.payrollType}
                onChange={e => setInviteForm({ ...inviteForm, payrollType: e.target.value })}
              >
                <option value="HOURLY">Hourly Rate Model</option>
                <option value="SALARY">Salary Model</option>
              </select>
            </div>
          </div>

          {inviteForm.payrollType === 'SALARY' ? (
            <Input
              label="Yearly Salary (USDC / USD equivalent)"
              placeholder="e.g. 75000"
              value={inviteForm.salaryAmount}
              onChange={e => setInviteForm({ ...inviteForm, salaryAmount: e.target.value })}
            />
          ) : (
            <Input
              label="Hourly Rate (USDC / USD equivalent)"
              placeholder="e.g. 25"
              value={inviteForm.hourlyRate}
              onChange={e => setInviteForm({ ...inviteForm, hourlyRate: e.target.value })}
            />
          )}

          <div className="pt-4 border-t border-[var(--az-border)] flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInviteSubmit} className="bg-[#6C4FD1] text-white hover:bg-[#5b42b1]">Send Invitation</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
