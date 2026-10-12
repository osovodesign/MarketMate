import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Search,
  Lock,
  Unlock,
  Sliders,
  Clock,
  ArrowRight,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Coins,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Info,
  X,
} from 'lucide-react';
import { StaffMember, StaffRole, StaffPermissions, StaffShiftRecord } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import {
  ROLE_CONFIGS,
  ROLE_PERMISSIONS_PRESETS,
  PERMISSION_DEFINITIONS,
  ensureStaffPermissions,
  hasPermission,
} from '../../lib/staffPermissions';
import { formatCurrency, getTodayDateString } from '../../lib/formatters';
import { ShiftClosingModal } from './ShiftClosingModal';
import { StaffSwitchModal } from './StaffSwitchModal';

export const StaffManagementView: React.FC = () => {
  const {
    staffList,
    currentSession,
    addStaff,
    updateStaff,
    deleteStaff,
    switchStaffSession,
    shifts,
    sales,
    activeShift,
  } = useBusinessData();
  const { business, user, isSubscribed } = useAuth();
  const currency = business?.currency || 'NGN';
  const today = getTodayDateString();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // Edit / Add Staff Modal / Drawer State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<StaffRole>('cashier');
  const [formPin, setFormPin] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPermissions, setFormPermissions] = useState<StaffPermissions>(
    ROLE_PERMISSIONS_PRESETS.cashier
  );

  // PIN Reset Quick Modal
  const [resetPinTarget, setResetPinTarget] = useState<StaffMember | null>(null);
  const [newPinInput, setNewPinInput] = useState('');

  // Switch Modal
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);

  // Shift Closing Modal
  const [isShiftClosingOpen, setIsShiftClosingOpen] = useState(false);
  const [selectedShiftForSummary, setSelectedShiftForSummary] = useState<StaffShiftRecord | null>(null);

  // Calculate today's sales metrics per staff
  const staffSalesToday = useMemo(() => {
    const todaySales = sales.filter((s) => s.saleDate === today);
    const map: Record<string, { count: number; total: number }> = {};

    todaySales.forEach((s) => {
      const key = s.staffId || 'owner';
      if (!map[key]) map[key] = { count: 0, total: 0 };
      map[key].count += 1;
      map[key].total += s.revenue;
    });

    return map;
  }, [sales, today]);

  const totalStaffSalesTodayAmount = useMemo(() => {
    return sales
      .filter((s) => s.saleDate === today)
      .reduce((sum, s) => sum + s.revenue, 0);
  }, [sales, today]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchSearch =
        !searchTerm.trim() ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.phone && s.phone.includes(searchTerm)) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchRole =
        selectedRoleFilter === 'all' || s.role === selectedRoleFilter;

      return matchSearch && matchRole;
    });
  }, [staffList, searchTerm, selectedRoleFilter]);

  // Open Form for Create
  const handleOpenCreate = () => {
    setEditingStaffId(null);
    setFormName('');
    setFormRole('cashier');
    setFormPin('');
    setFormPhone('');
    setFormEmail('');
    setFormPermissions(ROLE_PERMISSIONS_PRESETS.cashier);
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (member: StaffMember) => {
    setEditingStaffId(member.id);
    setFormName(member.name);
    setFormRole(member.role);
    setFormPin(member.pin);
    setFormPhone(member.phone || '');
    setFormEmail(member.email || '');
    setFormPermissions(ensureStaffPermissions(member.role, member.permissions));
    setIsFormOpen(true);
  };

  // Handle Preset Role Selection in Form
  const handleRoleChange = (newRole: StaffRole) => {
    setFormRole(newRole);
    setFormPermissions(ROLE_PERMISSIONS_PRESETS[newRole] || ROLE_PERMISSIONS_PRESETS.cashier);
  };

  // Toggle individual permission
  const handleTogglePermission = (key: keyof StaffPermissions) => {
    setFormPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Save Staff (Create or Update)
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      if (editingStaffId) {
        await updateStaff(editingStaffId, {
          name: formName.trim(),
          role: formRole,
          pin: formPin.trim() || '0000',
          phone: formPhone.trim(),
          email: formEmail.trim(),
          permissions: formPermissions,
        });
      } else {
        await addStaff({
          name: formName.trim(),
          role: formRole,
          pin: formPin.trim() || '0000',
          phone: formPhone.trim(),
          email: formEmail.trim(),
          isActive: true,
          permissions: formPermissions,
        });
      }
      setIsFormOpen(false);
    } catch (err: any) {
      alert('Error saving staff member: ' + (err.message || 'Unknown error'));
    }
  };

  // Execute Quick PIN Reset
  const handleExecutePinReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPinTarget || newPinInput.length < 4) return;

    try {
      await updateStaff(resetPinTarget.id, {
        pin: newPinInput.trim(),
      });
      setResetPinTarget(null);
      setNewPinInput('');
    } catch (err: any) {
      alert('Error updating PIN: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="bg-[#FEFEFE] dark:bg-[#001A35] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center font-black shadow-2xs shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#001A35] dark:text-[#FEFEFE] tracking-tight">
                  Staff & Access Control
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                  Role-Based Security
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Manage cashier accounts, configure 4-digit POS PINs, and shield confidential profit margins.
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setIsSwitchModalOpen(true)}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <KeyRound className="w-4 h-4 text-purple-600" />
              <span>Switch Active Attendant</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="py-2.5 px-4 bg-[#059669] hover:bg-[#047857] text-[#FEFEFE] text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add New Staff Member</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Active Staff Accounts
            </span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 block">
              {staffList.filter((s) => s.isActive).length} Members
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Today's Staff Sales
            </span>
            <span className="text-xl font-extrabold text-[#059669] dark:text-[#34D399] mt-0.5 block font-mono">
              {formatCurrency(totalStaffSalesTodayAmount, currency)}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Active Shift Status
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {activeShift ? `${activeShift.staffName} (Open)` : 'No active shift'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200/80 dark:border-purple-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 block">
              Store Confidentiality
            </span>
            <span className="text-xs font-bold text-purple-900 dark:text-purple-100 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Profit Shield Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Staff Directory Card */}
      <div className="bg-[#FEFEFE] dark:bg-[#001A35] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Table Filter & Search Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Authorized Team Directory ({filteredStaff.length})
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff by name or phone..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-[#059669] focus:outline-none"
              />
            </div>

            {/* Role Filter Selector */}
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="py-1.5 px-3 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-[#059669] focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="owner">Store Owners</option>
              <option value="manager">Store Managers</option>
              <option value="cashier">Cashiers / POS</option>
              <option value="inventory">Inventory Clerks</option>
              <option value="accountant">Accountants</option>
            </select>
          </div>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70 dark:bg-slate-900/70">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role & Authority</th>
                <th className="py-3 px-4">4-Digit PIN</th>
                <th className="py-3 px-4">Today's Sales Attributed</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No staff members match the selected search or filter.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const isCurrent = currentSession.staffId === staff.id || (!currentSession.staffId && staff.role === 'owner');
                  const roleCfg = ROLE_CONFIGS[staff.role] || ROLE_CONFIGS.cashier;
                  const salesData = staffSalesToday[staff.id] || { count: 0, total: 0 };

                  return (
                    <tr
                      key={staff.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        isCurrent ? 'bg-purple-50/30 dark:bg-purple-950/20' : ''
                      }`}
                    >
                      {/* Name & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${roleCfg.badgeBg} ${roleCfg.badgeText} shrink-0`}
                          >
                            {staff.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {staff.name}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              {staff.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5" />
                                  {staff.phone}
                                </span>
                              )}
                              {staff.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-2.5 h-2.5" />
                                  {staff.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${roleCfg.badgeBg} ${roleCfg.badgeText} ${roleCfg.border}`}
                          >
                            <Shield className="w-3 h-3" />
                            <span>{roleCfg.label}</span>
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] truncate">
                            {roleCfg.shortDesc}
                          </p>
                        </div>
                      </td>

                      {/* PIN Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
                            ••••
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setResetPinTarget(staff);
                              setNewPinInput('');
                            }}
                            className="text-[11px] text-[#059669] hover:underline font-semibold"
                          >
                            Reset PIN
                          </button>
                        </div>
                      </td>

                      {/* Attributed Sales Today */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(salesData.total, currency)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          {salesData.count} {salesData.count === 1 ? 'sale' : 'sales'} today
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (staff.role === 'owner') return;
                            updateStaff(staff.id, { isActive: !staff.isActive });
                          }}
                          disabled={staff.role === 'owner'}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            staff.isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              staff.isActive ? 'bg-emerald-600' : 'bg-slate-400'
                            }`}
                          />
                          <span>{staff.isActive ? 'Active' : 'Suspended'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => switchStaffSession(staff.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 text-xs font-semibold transition-colors"
                              title="Switch active session to this staff member"
                            >
                              Switch To
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(staff)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            Edit Permissions
                          </button>

                          {staff.role !== 'owner' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Remove staff profile for ${staff.name}?`)) {
                                  deleteStaff(staff.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-lg"
                              title="Remove staff member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Presets Architectural Explainer Card */}
      <div className="bg-[#FEFEFE] dark:bg-[#001A35] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#059669]" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Role Permission Architecture & Guardrails
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1">
            <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              Cashier / Sales Rep
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              Designed for retail counter attendants. Cost prices, operating expenses, and monthly profits are completely hidden. Can only give discounts up to 5% without manager override.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-1">
            <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Store Manager
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              Operational lead on the ground. Can approve customer discounts up to 20%, view stock costs for purchasing, record restocks, and manage customer credit without seeing owner bank payouts.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-1">
            <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              Inventory Clerk
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              Restricted to warehouse and catalog updates. Can receive supplier shipments, adjust damaged goods, and count stock. POS register checkout is blocked.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Shifts & Cash Drawer Reconciliation History */}
      <div className="bg-[#FEFEFE] dark:bg-[#001A35] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#059669]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Shift Reconciliations & Cash Handover Logs ({shifts.length})
            </h3>
          </div>

          {activeShift && (
            <button
              onClick={() => setIsShiftClosingOpen(true)}
              className="py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Close Active Shift ({activeShift.staffName})</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70 dark:bg-slate-900/70">
                <th className="py-3 px-4">Attendant</th>
                <th className="py-3 px-4">Started / Closed</th>
                <th className="py-3 px-4">Opening Float</th>
                <th className="py-3 px-4">Expected Cash</th>
                <th className="py-3 px-4">Counted Cash</th>
                <th className="py-3 px-4">Variance</th>
                <th className="py-3 px-4 text-right">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No completed shift records found. Shifts automatically log when cashiers close the register.
                  </td>
                </tr>
              ) : (
                shifts.map((sh) => {
                  const isBalanced = sh.cashDifference === 0;

                  return (
                    <tr key={sh.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{sh.staffName}</span>
                          <span className="text-[10px] uppercase font-semibold text-slate-400">
                            ({sh.role})
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        <div>
                          <span>{new Date(sh.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-[11px] text-slate-400 block">
                            {sh.endedAt ? `Closed: ${new Date(sh.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Still Active'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-medium">
                        {formatCurrency(sh.openingFloat, currency)}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold">
                        {formatCurrency(sh.expectedCash, currency)}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold">
                        {sh.status === 'closed'
                          ? formatCurrency(sh.actualCashCounted || 0, currency)
                          : 'In Progress'}
                      </td>

                      <td className="py-3 px-4">
                        {sh.status === 'closed' ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              isBalanced
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : sh.cashDifference! > 0
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {isBalanced
                              ? 'Balanced ✅'
                              : sh.cashDifference! > 0
                              ? `+${formatCurrency(sh.cashDifference!, currency)}`
                              : `-${formatCurrency(Math.abs(sh.cashDifference!), currency)}`}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">
                            Open
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedShiftForSummary(sh);
                            setIsShiftClosingOpen(true);
                          }}
                          className="text-[11px] text-[#059669] hover:underline font-semibold"
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Staff Slide-Over Drawer / Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-end bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FEFEFE] dark:bg-[#001A35] w-full max-w-xl h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                  {editingStaffId ? <Shield className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#001A35] dark:text-[#FEFEFE]">
                    {editingStaffId ? 'Edit Staff Permissions' : 'Register New Staff Member'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure individual access rights, risk limits, and cashier PIN.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <form onSubmit={handleSaveStaff} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  1. Staff Information & Credentials
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Chioma Nnamdi"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-[#059669] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      4-Digit Quick POS PIN *
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      required
                      value={formPin}
                      onChange={(e) => setFormPin(e.target.value)}
                      placeholder="4821"
                      className="w-full px-3 py-2 text-xs font-mono text-center tracking-widest bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-[#059669] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Phone Number (WhatsApp)
                    </label>
                    <input
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="08012345678"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-[#059669] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="chioma@store.com"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-[#059669] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Preset Role Selector */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Assign Preset Role:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['cashier', 'manager', 'inventory', 'accountant'] as StaffRole[]).map((r) => {
                      const isSelected = formRole === r;
                      const cfg = ROLE_CONFIGS[r];

                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => handleRoleChange(r)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-[#059669] bg-[#ECFDF5] dark:bg-[#064E3B]/30 shadow-2xs'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span
                            className={`text-[10px] font-bold block ${
                              isSelected ? 'text-[#059669] dark:text-[#34D399]' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {cfg.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Granular Permission Toggles Grouped by Risk Zones */}
              <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    2. Granular Permission Toggles
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Click toggles to customize
                  </span>
                </div>

                {/* Category 1: Confidential Financials (Red Zone) */}
                <div className="rounded-xl border border-rose-200/80 dark:border-rose-900/60 p-4 bg-rose-50/30 dark:bg-rose-950/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                      Financial & Cost Protection (Confidential Zone)
                    </span>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {PERMISSION_DEFINITIONS.filter((p) => p.category === 'confidential').map((def) => {
                      const isChecked = formPermissions[def.key];

                      return (
                        <label
                          key={def.key}
                          className="flex items-start justify-between gap-3 cursor-pointer p-2 rounded-lg hover:bg-rose-100/40 dark:hover:bg-rose-900/30 transition-colors"
                        >
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              {def.label}
                            </span>
                            <span className="text-[11px] text-slate-500 leading-tight block">
                              {def.description}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean(isChecked)}
                            onChange={() => handleTogglePermission(def.key)}
                            className="w-4 h-4 rounded text-[#059669] focus:ring-[#059669] mt-0.5 cursor-pointer shrink-0"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Category 2: Sales & Fraud Controls (Amber Zone) */}
                <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/60 p-4 bg-amber-50/30 dark:bg-amber-950/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Sales & Cashier Controls (Fraud Prevention Zone)
                    </span>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {PERMISSION_DEFINITIONS.filter((p) => p.category === 'fraud_prevention').map((def) => {
                      const isChecked = formPermissions[def.key];

                      return (
                        <label
                          key={def.key}
                          className="flex items-start justify-between gap-3 cursor-pointer p-2 rounded-lg hover:bg-amber-100/40 dark:hover:bg-amber-900/30 transition-colors"
                        >
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              {def.label}
                            </span>
                            <span className="text-[11px] text-slate-500 leading-tight block">
                              {def.description}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean(isChecked)}
                            onChange={() => handleTogglePermission(def.key)}
                            className="w-4 h-4 rounded text-[#059669] focus:ring-[#059669] mt-0.5 cursor-pointer shrink-0"
                          />
                        </label>
                      );
                    })}

                    {/* Max Discount Slider if discount is allowed */}
                    {formPermissions.canGiveDiscount && (
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-2 mt-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            Maximum Custom Discount Allowed:
                          </span>
                          <span className="font-bold text-amber-700 dark:text-amber-400 font-mono">
                            {formPermissions.maxDiscountPercent}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          step="1"
                          value={formPermissions.maxDiscountPercent}
                          onChange={(e) =>
                            setFormPermissions((prev) => ({
                              ...prev,
                              maxDiscountPercent: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-full accent-[#059669] cursor-pointer"
                        />
                        <p className="text-[10px] text-slate-400">
                          Any discount above {formPermissions.maxDiscountPercent}% will pause checkout and require Owner or Manager PIN authorization.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Category 3: Inventory & Stock (Blue Zone) */}
                <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/60 p-4 bg-blue-50/30 dark:bg-blue-950/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                      Inventory & Stock Catalog (Blue Zone)
                    </span>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {PERMISSION_DEFINITIONS.filter((p) => p.category === 'inventory').map((def) => {
                      const isChecked = formPermissions[def.key];

                      return (
                        <label
                          key={def.key}
                          className="flex items-start justify-between gap-3 cursor-pointer p-2 rounded-lg hover:bg-blue-100/40 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              {def.label}
                            </span>
                            <span className="text-[11px] text-slate-500 leading-tight block">
                              {def.description}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean(isChecked)}
                            onChange={() => handleTogglePermission(def.key)}
                            className="w-4 h-4 rounded text-[#059669] focus:ring-[#059669] mt-0.5 cursor-pointer shrink-0"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Category 4: Data Protection & Settings (Purple Zone) */}
                <div className="rounded-xl border border-purple-200/80 dark:border-purple-900/60 p-4 bg-purple-50/30 dark:bg-purple-950/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                    <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                      Data Protection & Security (Purple Zone)
                    </span>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {PERMISSION_DEFINITIONS.filter((p) => p.category === 'data_protection').map((def) => {
                      const isChecked = formPermissions[def.key];

                      return (
                        <label
                          key={def.key}
                          className="flex items-start justify-between gap-3 cursor-pointer p-2 rounded-lg hover:bg-purple-100/40 dark:hover:bg-purple-900/30 transition-colors"
                        >
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              {def.label}
                            </span>
                            <span className="text-[11px] text-slate-500 leading-tight block">
                              {def.description}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean(isChecked)}
                            onChange={() => handleTogglePermission(def.key)}
                            className="w-4 h-4 rounded text-[#059669] focus:ring-[#059669] mt-0.5 cursor-pointer shrink-0"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-[#059669] hover:bg-[#047857] text-[#FEFEFE] text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingStaffId ? 'Update Staff Permissions' : 'Save Staff Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick PIN Reset Dialog */}
      {resetPinTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#FEFEFE] dark:bg-[#001A35] w-full max-w-xs rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#059669] dark:text-[#34D399] flex items-center justify-center mx-auto font-bold text-sm">
                <KeyRound className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Reset PIN for {resetPinTarget.name}
              </h4>
              <p className="text-xs text-slate-500">
                Enter a new 4-digit code for terminal checkout
              </p>
            </div>

            <form onSubmit={handleExecutePinReset} className="space-y-3">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                autoFocus
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value)}
                placeholder="••••"
                className="w-full text-center tracking-[0.4em] text-2xl font-mono p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#059669] focus:outline-none text-slate-900 dark:text-white"
              />

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setResetPinTarget(null)}
                  className="py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newPinInput.length < 4}
                  className="py-2 bg-[#059669] hover:bg-[#047857] text-[#FEFEFE] rounded-xl text-xs font-bold shadow-2xs disabled:opacity-50"
                >
                  Save PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Switch Terminal Modal */}
      <StaffSwitchModal
        isOpen={isSwitchModalOpen}
        onClose={() => setIsSwitchModalOpen(false)}
        onOpenManageStaff={() => {}}
      />

      {/* Shift Closing / Reconciliation Modal */}
      <ShiftClosingModal
        isOpen={isShiftClosingOpen}
        onClose={() => {
          setIsShiftClosingOpen(false);
          setSelectedShiftForSummary(null);
        }}
        shiftToClose={selectedShiftForSummary}
      />
    </div>
  );
};
