import React, { useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Trash2,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  Phone,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { StaffMember, StaffRole } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { useAuth } from '../../context/AuthContext';
import { ProFeatureGate } from '../subscription/ProFeatureGate';
import { ROLE_CONFIGS, ensureStaffPermissions } from '../../lib/staffPermissions';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  onNavigateToFullView?: () => void;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  onNavigateToFullView,
}) => {
  const {
    staffList,
    currentSession,
    addStaff,
    updateStaff,
    deleteStaff,
    switchStaffSession,
    activeShift,
  } = useBusinessData();
  const { business, user, isSuperAdmin, isDemoMode, isSubscribed } = useAuth();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('cashier');
  const [pin, setPin] = useState('');
  const [phone, setPhone] = useState('');

  // Switch session pin dialog
  const [switchTarget, setSwitchTarget] = useState<StaffMember | null>(null);
  const [switchPinInput, setSwitchPinInput] = useState('');
  const [switchError, setSwitchError] = useState('');

  if (!isOpen) return null;

  if (!isSubscribed) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
          <ProFeatureGate
            mode="modal"
            title="Staff Roles & Cashier PINs"
            subtitle="Secure your retail point of sale with individual cashier PINs, role-based access permissions, audit logs, and fraud prevention."
            icon={Shield}
            benefits={[
              'Unlimited staff accounts (cashiers, sales managers, supervisors)',
              'Individual 4-digit PIN access per till or tablet terminal',
              'Prevent cashier access to business reports, P&L, and expenses',
              'Shift tracking and staff-tagged receipts for full accountability',
            ]}
            onUpgrade={() => {
              onClose();
              onUpgrade?.();
            }}
            onBack={onClose}
          />
        </div>
      </div>
    );
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await addStaff({
        name: name.trim(),
        role,
        pin: pin.trim() || '0000',
        phone: phone.trim(),
        isActive: true,
        permissions: ensureStaffPermissions(role),
      });

      setIsAddingNew(false);
      setName('');
      setPin('');
      setPhone('');
      setRole('cashier');
    } catch (err: any) {
      alert('Failed to add staff member: ' + err.message);
    }
  };

  const handleExecuteSwitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!switchTarget) return;

    const res = await switchStaffSession(switchTarget.id, switchPinInput);
    if (res.success) {
      setSwitchTarget(null);
      setSwitchPinInput('');
      setSwitchError('');
      onClose();
    } else {
      setSwitchError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#001A35] w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Staff & Cashier Permissions
              </h2>
              <p className="text-xs text-slate-500">
                Manage sales attendants, assign PINs, and switch register sessions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Active Attendant Banner */}
          <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-purple-700 text-white font-bold text-xs flex items-center justify-center">
                {currentSession.staffName.charAt(0)}
              </div>
              <div>
                <span className="text-xs font-bold text-purple-950 dark:text-purple-100 block leading-tight">
                  {currentSession.staffName}
                </span>
                <span className="text-[11px] text-purple-700 dark:text-purple-300 capitalize font-medium">
                  Current Session: {currentSession.currentRole}
                </span>
              </div>
            </div>

            {currentSession.currentRole === 'cashier' ? (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 rounded-md">
                Profit Metrics Shielded
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 rounded-md">
                Full Owner Visibility
              </span>
            )}
          </div>

          {/* Full-view link */}
          {onNavigateToFullView && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToFullView();
              }}
              className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-[#059669] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Open Full Staff & Access Control Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Add Staff Button / Form toggle */}
          {!isAddingNew ? (
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Authorized Staff Members ({staffList.length})
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-[#FEFEFE] rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Cashier / Staff</span>
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleCreateStaff}
              className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white">New Staff Registration</span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Full Name:</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Chidinma Kalu"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-[#059669] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Role:</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as StaffRole)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-[#059669] focus:outline-none"
                  >
                    <option value="cashier">Cashier (POS Sales Only)</option>
                    <option value="manager">Store Manager</option>
                    <option value="inventory">Inventory Clerk</option>
                    <option value="accountant">Auditor / Accountant</option>
                    <option value="owner">Store Owner</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">4-Digit PIN Code:</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="0000"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-[#059669] focus:outline-none font-mono tracking-widest text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Phone Number (Optional):</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08012345678"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-[#059669] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-[#FEFEFE] rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          )}

          {/* Staff List */}
          <div className="space-y-2">
            {staffList.map((staff) => {
              const isCurrent = currentSession.staffId === staff.id;
              const cfg = ROLE_CONFIGS[staff.role] || ROLE_CONFIGS.cashier;

              return (
                <div
                  key={staff.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                    isCurrent
                      ? 'bg-purple-50/60 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${cfg.badgeBg} ${cfg.badgeText}`}
                    >
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{staff.name}</span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize ${cfg.badgeBg} ${cfg.badgeText}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                        {staff.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" />
                            {staff.phone}
                          </span>
                        )}
                        <span className="font-mono">PIN: ••••</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCurrent ? (
                      <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSwitchTarget(staff);
                          setSwitchPinInput('');
                          setSwitchError('');
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Switch To
                      </button>
                    )}

                    {staff.role !== 'owner' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove staff profile for ${staff.name}?`)) {
                            deleteStaff(staff.id);
                          }
                        }}
                        className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete staff"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Role Privileges Overview */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#059669]" />
              Role Permission Guardrails:
            </span>
            <ul className="list-disc list-inside text-[11px] text-slate-500 space-y-0.5 pl-1">
              <li><strong>Owner Mode:</strong> Full visibility over monthly profits, net margins, supplier debts, and expense ledgers.</li>
              <li><strong>Cashier Mode:</strong> Streamlined POS terminal only. Sales profits and sensitive cost numbers are concealed to safeguard store financial privacy.</li>
            </ul>
          </div>
        </div>

        {/* Switch Attendant PIN Modal */}
        {switchTarget && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-[#001A35] w-full max-w-xs rounded-2xl p-5 shadow-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="text-center space-y-1">
                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#059669] dark:text-[#34D399] flex items-center justify-center mx-auto font-bold text-sm">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Switch to {switchTarget.name}</h4>
                <p className="text-xs text-slate-500">Enter {switchTarget.name}'s 4-digit PIN</p>
              </div>

              <form onSubmit={handleExecuteSwitch} className="space-y-3">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  autoFocus
                  value={switchPinInput}
                  onChange={(e) => {
                    setSwitchPinInput(e.target.value);
                    setSwitchError('');
                  }}
                  placeholder="••••"
                  className="w-full text-center tracking-[0.4em] text-2xl font-mono p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#059669] focus:outline-none text-slate-900 dark:text-white"
                />
                {switchError && (
                  <p className="text-xs text-rose-600 text-center font-semibold">{switchError}</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSwitchTarget(null)}
                    className="py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-1.5 bg-[#059669] hover:bg-[#047857] text-[#FEFEFE] rounded-lg text-xs font-bold shadow-2xs cursor-pointer"
                  >
                    Authorize
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

