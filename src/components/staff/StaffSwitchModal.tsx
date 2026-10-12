import React, { useState } from 'react';
import {
  X,
  Users,
  KeyRound,
  Shield,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { StaffMember, StaffRole } from '../../types';
import { useBusinessData } from '../../context/BusinessDataContext';
import { ROLE_CONFIGS } from '../../lib/staffPermissions';

interface StaffSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenManageStaff?: () => void;
}

export const StaffSwitchModal: React.FC<StaffSwitchModalProps> = ({
  isOpen,
  onClose,
  onOpenManageStaff,
}) => {
  const { staffList, currentSession, switchStaffSession, startStaffShift, activeShift } = useBusinessData();
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [openingFloat, setOpeningFloat] = useState<string>('0');
  const [isStartingShift, setIsStartingShift] = useState(false);

  if (!isOpen) return null;

  const handleSelectStaff = (member: StaffMember) => {
    setSelectedStaff(member);
    setPinInput('');
    setError('');
  };

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    setIsAuthorizing(true);
    setError('');

    const res = await switchStaffSession(selectedStaff.id, pinInput);
    setIsAuthorizing(false);

    if (res.success) {
      if (isStartingShift) {
        await startStaffShift(selectedStaff.id, parseFloat(openingFloat) || 0);
      }
      setSelectedStaff(null);
      setPinInput('');
      onClose();
    } else {
      setError(res.message);
    }
  };

  const handleSwitchToOwner = async () => {
    const ownerStaff = staffList.find((s) => s.role === 'owner');
    if (ownerStaff) {
      handleSelectStaff(ownerStaff);
    } else {
      await switchStaffSession(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FEFEFE] dark:bg-[#001A35] w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Switch Register Cashier
              </h3>
              <p className="text-[11px] text-slate-500">
                Active: <strong className="text-slate-800 dark:text-slate-200">{currentSession.staffName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {!selectedStaff ? (
            /* Staff List Selection */
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Select staff profile to unlock register terminal:
              </p>

              <div className="space-y-2">
                {staffList
                  .filter((s) => s.isActive)
                  .map((staff) => {
                    const isCurrent = currentSession.staffId === staff.id;
                    const cfg = ROLE_CONFIGS[staff.role] || ROLE_CONFIGS.cashier;

                    return (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => handleSelectStaff(staff)}
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-[#059669]'
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
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {staff.name}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.2 rounded capitalize ${cfg.badgeBg} ${cfg.badgeText}`}
                              >
                                {cfg.label}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              PIN: ••••
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isCurrent ? (
                            <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-500 flex items-center gap-0.5">
                              <span>Switch</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>

              {onOpenManageStaff && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenManageStaff();
                    }}
                    className="text-xs font-bold text-[#059669] hover:underline"
                  >
                    Manage Staff Accounts & Permissions →
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* PIN Unlock Panel for Selected Staff */
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-[#059669] dark:text-[#34D399] flex items-center justify-center mx-auto font-bold text-base shadow-2xs">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Unlock as {selectedStaff.name}
                </h4>
                <p className="text-xs text-slate-500">
                  Role: <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">{selectedStaff.role}</span> • Enter 4-digit PIN
                </p>
              </div>

              <form onSubmit={handleAuthorize} className="space-y-4">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  autoFocus
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setError('');
                  }}
                  placeholder="••••"
                  className="w-full text-center tracking-[0.4em] text-3xl font-mono py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#059669] focus:outline-none text-slate-900 dark:text-white"
                />

                {error && (
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Optional Shift Start with Float */}
                {selectedStaff.role === 'cashier' && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isStartingShift}
                        onChange={(e) => setIsStartingShift(e.target.checked)}
                        className="rounded text-[#059669] focus:ring-[#059669]"
                      />
                      <span>Start a new Shift with Cash Drawer Float</span>
                    </label>

                    {isStartingShift && (
                      <div className="pl-6 space-y-1">
                        <span className="text-[11px] text-slate-500">Opening cash float in till:</span>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-bold text-slate-400">
                            ₦
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={openingFloat}
                            onChange={(e) => setOpeningFloat(e.target.value)}
                            placeholder="0"
                            className="w-full pl-7 pr-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStaff(null)}
                    className="py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Back to List
                  </button>
                  <button
                    type="submit"
                    disabled={pinInput.length < 4 || isAuthorizing}
                    className="py-2.5 px-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-[#FEFEFE] text-xs font-bold shadow-2xs transition-colors disabled:opacity-50"
                  >
                    Authorize Session
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
