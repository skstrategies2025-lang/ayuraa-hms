import React, { useState } from 'react';
import { UserCheck, Plus, Printer, X } from 'lucide-react';
import { AyurStorage } from '../services/storage';
import { StaffFormModal } from './StaffFormModal';
import { StaffProfileCard } from './StaffProfileCard';
export const StaffAndPayrollView = ({ staff, currentBranch, config }) => {
  const [selectedStaff, setSelectedStaff] = useState(staff[0] || null);
  const [showPaySlipModal, setShowPaySlipModal] = useState(false);
  // staff form: null = closed, { member: null } = add, { member } = edit
  const [staffModal, setStaffModal] = useState(null);
  const branchStaff = staff.filter((s) => s.branchId === currentBranch.id);
  // Calculate salary components for selected staff
  const calculatePayroll = (member) => {
    const presentDays = member.attendanceThisMonth.presentDays;
    const totalWorkingDays = member.attendanceThisMonth.totalDays;
    const perDaySalary = Math.round(member.monthlySalary / totalWorkingDays);
    const earnedBaseSalary = perDaySalary * presentDays;
    // Simulate therapy sessions conducted this month
    const estimatedTherapiesConducted = member.role.includes('Therapist')
      ? 42
      : member.role.includes('Vaidya')
        ? 56
        : 0;
    const incentiveEarned = estimatedTherapiesConducted * member.panchakarmaIncentiveRate;
    const grossSalary = earnedBaseSalary + incentiveEarned;
    const pfDeduction = Math.round(earnedBaseSalary * 0.12);
    const netSalary = grossSalary - pfDeduction;
    return {
      earnedBaseSalary,
      estimatedTherapiesConducted,
      incentiveEarned,
      grossSalary,
      pfDeduction,
      netSalary,
    };
  };
  const handleLogAttendance = (member, isPresent) => {
    const updated = {
      ...member,
      attendanceThisMonth: {
        ...member.attendanceThisMonth,
        presentDays: isPresent
          ? Math.min(member.attendanceThisMonth.totalDays, member.attendanceThisMonth.presentDays + 1)
          : Math.max(0, member.attendanceThisMonth.presentDays - 1),
        leavesTaken: !isPresent
          ? member.attendanceThisMonth.leavesTaken + 1
          : Math.max(0, member.attendanceThisMonth.leavesTaken - 1),
      },
    };
    AyurStorage.updateStaff(updated);
    if (selectedStaff?.id === member.id) {
      setSelectedStaff(updated);
    }
  };
  const handleSaveStaff = (record) => {
    const isNew = !staff.some((m) => m.id === record.id);
    if (isNew) AyurStorage.addStaff(record);
    else AyurStorage.updateStaff(record);
    setSelectedStaff(record);
    setStaffModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <h2 className="text-xl font-serif font-black text-stone-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-700" />
            Staff Attendance, Salaries & Panchakarma Incentives
          </h2>
          <p className="text-xs text-stone-500">
            Monthly attendance roster, therapist procedure bonus, PF deductions, and printable payroll slips
          </p>
        </div>

        <button
          onClick={() => setStaffModal({ member: null })}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Roster & Salary Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Staff Directory (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Hospital Staff Roster ({branchStaff.length} Employees)
              </span>
              <span className="text-[11px] text-stone-500 font-mono">Unit {currentBranch.code}</span>
            </div>

            <div className="space-y-2.5">
              {branchStaff.map((member) => {
                const isSelected = selectedStaff?.id === member.id;
                const attendancePct = Math.round(
                  (member.attendanceThisMonth.presentDays / member.attendanceThisMonth.totalDays) * 100
                );
                return (
                  <div
                    key={member.id}
                    onClick={() => setSelectedStaff(member)}
                    className={`p-4 rounded-xl cursor-pointer border transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-600 text-stone-900 shadow ring-1 ring-emerald-500/30'
                        : 'bg-stone-50 border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-sm text-stone-900">{member.name}</div>
                        <div className="text-xs text-amber-700 font-medium mt-0.5">{member.role}</div>
                        <div className="text-[11px] text-stone-500 font-mono mt-1">{member.phone}</div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-emerald-700 block">
                          ₹{member.monthlySalary.toLocaleString()} / mo
                        </span>
                        <span className="text-[10px] text-stone-500">+₹{member.panchakarmaIncentiveRate}/therapy</span>
                      </div>
                    </div>

                    {/* Attendance Indicator */}
                    <div className="mt-3 pt-2.5 border-t border-stone-200 flex items-center justify-between text-xs">
                      <div>
                        Attendance:{' '}
                        <strong className="text-stone-900">
                          {member.attendanceThisMonth.presentDays} / {member.attendanceThisMonth.totalDays} Days
                        </strong>{' '}
                        <span className="text-emerald-700 font-bold font-mono">({attendancePct}%)</span>
                      </div>

                      {/* Quick Attendance Bump */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLogAttendance(member, true);
                          }}
                          className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-800 text-emerald-200 text-[10px] font-bold"
                          title="Mark Present Today"
                        >
                          +1 Present
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLogAttendance(member, false);
                          }}
                          className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px]"
                          title="Mark Leave"
                        >
                          Leave
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Payroll Calculator & Salary Slip (6 cols) */}
        {selectedStaff ? (
          <div className="lg:col-span-6 bg-white border border-stone-200 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-bold text-stone-900 text-base">Monthly Salary & Incentive Voucher</h3>
                <p className="text-xs text-stone-500">
                  {selectedStaff.name} • {selectedStaff.role}
                </p>
              </div>

              <div className="flex items-center gap-2">
              <button
                onClick={() => setStaffModal({ member: selectedStaff })}
                className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => setShowPaySlipModal(true)}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Generate Pay Slip</span>
              </button>
              </div>
            </div>

            {/* Calculations Box */}
            {(() => {
              const payroll = calculatePayroll(selectedStaff);
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                      <span className="text-[10px] uppercase font-bold text-stone-500 block mb-0.5">
                        Base Monthly Salary
                      </span>
                      <div className="text-lg font-bold font-mono text-stone-900">
                        ₹{selectedStaff.monthlySalary.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-1">
                        Earned: ₹{payroll.earnedBaseSalary.toLocaleString()} (
                        {selectedStaff.attendanceThisMonth.presentDays} days)
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                      <span className="text-[10px] uppercase font-bold text-amber-700 block mb-0.5">
                        Panchakarma Procedure Bonus
                      </span>
                      <div className="text-lg font-bold font-mono text-amber-700">
                        +₹{payroll.incentiveEarned.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-1">
                        {payroll.estimatedTherapiesConducted} sessions × ₹{selectedStaff.panchakarmaIncentiveRate}
                      </div>
                    </div>
                  </div>

                  {/* Salary Statement Table */}
                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2 text-xs">
                    <div className="flex justify-between text-stone-700">
                      <span>Base Earned Wages:</span>
                      <span className="font-mono">₹{payroll.earnedBaseSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-amber-700">
                      <span>Panchakarma Performance Bonus:</span>
                      <span className="font-mono">+₹{payroll.incentiveEarned.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-stone-500">
                      <span>Gross Remuneration:</span>
                      <span className="font-mono font-bold text-stone-900">₹{payroll.grossSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Provident Fund / Tax Deduction (12%):</span>
                      <span className="font-mono">-₹{payroll.pfDeduction.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline text-sm font-bold text-emerald-700">
                      <span>Net Disbursed Take-home Pay:</span>
                      <span className="text-xl text-amber-700">₹{payroll.netSalary.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-500 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-stone-500 uppercase font-bold">
                        Direct Salary Credit Bank
                      </span>
                      <strong className="text-stone-900 font-mono">{selectedStaff.bankAccount}</strong>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      Active Payroll
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : null}
      </div>

      {/* STAFF PROFILE: details, ID numbers, document photos, bank accounts */}
      {selectedStaff && (
        <StaffProfileCard member={selectedStaff} onEdit={() => setStaffModal({ member: selectedStaff })} />
      )}

      {/* MODAL: PRINTABLE SALARY PAY SLIP */}
      {showPaySlipModal && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-2xl max-w-xl w-full p-6 text-stone-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <h3 className="font-bold text-base text-stone-900">Monthly Salary Voucher Slip</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button onClick={() => setShowPaySlipModal(false)} className="text-stone-500 hover:text-stone-900 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable White Paper Voucher */}
            <div className="bg-white text-stone-900 p-6 rounded-xl font-sans text-xs space-y-4">
              <div className="text-center border-b pb-3">
                <h4 className="font-serif font-black text-lg text-emerald-900">{config.hospitalName}</h4>
                <div className="text-[11px] text-stone-600">{currentBranch.name} • Monthly Salary Slip</div>
                <div className="text-[10px] text-stone-500">
                  Pay Period: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
              </div>

              <div className="bg-stone-50 p-2.5 rounded border grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  Employee Name: <strong>{selectedStaff.name}</strong>
                </div>
                <div>
                  Role: <strong>{selectedStaff.role}</strong>
                </div>
                <div>
                  Attendance:{' '}
                  <strong>
                    {selectedStaff.attendanceThisMonth.presentDays} / {selectedStaff.attendanceThisMonth.totalDays} Days
                  </strong>
                </div>
                <div>
                  Bank: <strong className="font-mono">{selectedStaff.bankAccount}</strong>
                </div>
              </div>

              {(() => {
                const p = calculatePayroll(selectedStaff);
                return (
                  <div className="space-y-1.5 text-[11px] pt-1">
                    <div className="flex justify-between py-1 border-b">
                      <span>Base Wages for Attended Days:</span>
                      <strong className="font-mono">₹{p.earnedBaseSalary.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b text-emerald-900">
                      <span>Panchakarma Procedure Performance Incentive:</span>
                      <strong className="font-mono">+₹{p.incentiveEarned.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b text-red-800">
                      <span>Statutory PF Deduction:</span>
                      <strong className="font-mono">-₹{p.pfDeduction.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between pt-2 text-sm font-bold text-emerald-950">
                      <span>Net Salary Credited:</span>
                      <span className="font-mono text-base font-black">₹{p.netSalary.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-6 border-t flex justify-between items-end text-[10px] text-stone-500">
                <span>Employee Signature</span>
                <span className="text-center">
                  <div className="font-bold text-stone-800">Hospital Finance Officer</div>
                  <div>Accounts & Payroll Department</div>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT STAFF MEMBER */}
      {staffModal && (
        <StaffFormModal
          member={staffModal.member}
          currentBranch={currentBranch}
          onClose={() => setStaffModal(null)}
          onSave={handleSaveStaff}
        />
      )}
    </div>
  );
};
