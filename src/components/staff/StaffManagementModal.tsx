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
} from 'lucide-react';
import { StaffMember, StaffRole } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    staffList,
    currentSession,
    addStaff,
    updateStaff,
    deleteStaff,
    switchStaffSession,
  } = useBusinessData();

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
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Staff & Cashier Permissions
              </h2>
              <p className="text-xs text-slate-500">
                Manage sales attendants, assign PINs, and switch register sessions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Active Attendant Banner */}
          <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-purple-700 text-white font-bold text-xs flex items-center justify-center">
                {currentSession.staffName.charAt(0)}
              </div>
              <div>
                <span className="text-xs font-bold text-purple-950 block leading-tight">
                  {currentSession.staffName}
                </span>
                <span className="text-[11px] text-purple-700 capitalize font-medium">
                  Current Session: {currentSession.currentRole}
                </span>
              </div>
            </div>
            {currentSession.currentRole === 'cashier' && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md">
                Profit Metrics Hidden
              </span>
            )}
          </div>

          {/* Add Staff Button / Form toggle */}
          {!isAddingNew ? (
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Authorized Staff Members ({staffList.length})
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Cashier / Staff</span>
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleCreateStaff}
              className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-900">New Staff Registration</span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Full Name:</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Chidinma Kalu"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Role:</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as StaffRole)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="cashier">Cashier (POS Sales Only)</option>
                    <option value="manager">Manager</option>
                    <option value="owner">Store Owner (Full Access)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">4-Digit PIN Code:</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="0000"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Phone Number (Optional):</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08012345678"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
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

              return (
                <div
                  key={staff.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                    isCurrent
                      ? 'bg-purple-50/60 border-purple-300 shadow-2xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        staff.role === 'owner'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{staff.name}</span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize ${
                            staff.role === 'owner'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {staff.role}
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
                      <span className="text-xs font-bold text-purple-700 flex items-center gap-1">
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
                        className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
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
                        className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition-colors"
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
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
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
            <div className="bg-white w-full max-w-xs rounded-2xl p-5 shadow-xl border border-slate-200 space-y-3">
              <div className="text-center space-y-1">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto font-bold text-sm">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Switch to {switchTarget.name}</h4>
                <p className="text-xs text-slate-500">Enter {switchTarget.name}'s 4-digit PIN</p>
              </div>

              <form onSubmit={handleExecuteSwitch} className="space-y-3">
                <input
                  type="password"
                  maxLength={4}
                  autoFocus
                  value={switchPinInput}
                  onChange={(e) => {
                    setSwitchPinInput(e.target.value);
                    setSwitchError('');
                  }}
                  placeholder="••••"
                  className="w-full text-center tracking-widest text-xl font-mono p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
                {switchError && (
                  <p className="text-xs text-rose-600 text-center font-semibold">{switchError}</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSwitchTarget(null)}
                    className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-2xs"
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
