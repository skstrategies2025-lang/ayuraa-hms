import React, { useState } from 'react';
import { Phone, MessageSquare, Filter, Search, X, Check, Edit3 } from 'lucide-react';
import { AyurStorage } from '../services/storage';
export const FollowUpCentralView = ({
  patients,
  panchakarma,
  ksharaPatients = AyurStorage.getKsharaSutraPatients(),
  appointments,
  camps,
  config,
  currentBranch,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];
  const [dateMode, setDateMode] = useState('today');
  const [customDate, setCustomDate] = useState(todayStr);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [callLogModalItem, setCallLogModalItem] = useState(null);
  const [newCallStatus, setNewCallStatus] = useState('Called - Confirmed');
  const [newNextDate, setNewNextDate] = useState(todayStr);
  const [callNoteText, setCallNoteText] = useState('Patient confirmed arrival for consultation.');
  const [toastMsg, setToastMsg] = useState(null);
  // Local call log overrides stored in memory for real-time tracking
  const [callLogs, setCallLogs] = useState({});
  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };
  // Compile all follow-up sources across hospital database
  const allFollowUps = [];
  // 1. Clinical Visits Follow-Up
  patients.forEach((pat) => {
    pat.clinicalVisits?.forEach((visit) => {
      if (visit.followUpDate) {
        allFollowUps.push({
          id: `fu-visit-${visit.id}`,
          patientId: pat.id,
          patientName: pat.name,
          uhid: pat.uhid,
          phone: pat.phone || '+91 98450 11234',
          age: pat.age,
          gender: pat.gender,
          category: 'OPD Clinical Visit',
          reason: visit.nidanaDiagnosis || 'General Clinical Review',
          dueDate: visit.followUpDate,
          status: callLogs[`fu-visit-${visit.id}`]?.status || 'Scheduled',
          lastCallNote: callLogs[`fu-visit-${visit.id}`]?.note,
        });
      }
    });
  });
  // 2. Panchakarma Active Course Follow-ups
  panchakarma
    .filter((p) => p.status === 'In Progress' && p.branchId === currentBranch.id)
    .forEach((proc) => {
      const pat = patients.find((p) => p.id === proc.patientId);
      allFollowUps.push({
        id: `fu-pk-${proc.id}`,
        patientId: proc.patientId,
        patientName: proc.patientName,
        uhid: pat?.uhid || 'AYUR-PAT',
        phone: pat?.phone || '+91 98450 11234',
        age: pat?.age || 45,
        gender: pat?.gender || 'Other',
        category: 'Panchakarma Daily Care',
        reason: `${proc.therapyName} (Day ${proc.currentDay} of ${proc.totalDays})`,
        dueDate: todayStr, // Active Panchakarma needs daily contact
        status: callLogs[`fu-pk-${proc.id}`]?.status || 'Scheduled',
        lastCallNote: callLogs[`fu-pk-${proc.id}`]?.note || proc.postProcedureNotes,
      });
    });
  // 3. Ksharasutra 7-Day Weekly Thread Change Follow-ups
  ksharaPatients.forEach((kPat) => {
    allFollowUps.push({
      id: `fu-ks-${kPat.id}`,
      patientId: kPat.patientId,
      patientName: kPat.patientName,
      uhid: kPat.uhid,
      phone: kPat.phone,
      age: kPat.age,
      gender: kPat.gender,
      category: 'Ksharasutra Thread Change',
      reason: `${kPat.diagnosis.split('(')[0]} - 7-Day Thread Change Sitting #${kPat.currentSitting + 1}`,
      dueDate: kPat.nextFollowUpDate,
      status: callLogs[`fu-ks-${kPat.id}`]?.status || 'Scheduled',
      lastCallNote: callLogs[`fu-ks-${kPat.id}`]?.note,
    });
  });
  // 4. Camp Leads Follow-ups
  camps.forEach((camp) => {
    camp.patientLeads?.forEach((lead) => {
      if (lead.assignedFollowUpDate) {
        allFollowUps.push({
          id: `fu-camp-${lead.id}`,
          patientId: lead.id,
          patientName: lead.name,
          uhid: `CAMP-${lead.campId.slice(-4)}`,
          phone: lead.phone,
          age: lead.age,
          gender: lead.gender,
          category: 'Camp Lead Follow-up',
          reason: `${lead.primaryComplaint} (Camp: ${camp.campName})`,
          dueDate: lead.assignedFollowUpDate,
          status: callLogs[`fu-camp-${lead.id}`]?.status || 'Scheduled',
          lastCallNote: callLogs[`fu-camp-${lead.id}`]?.note,
        });
      }
    });
  });
  // Target Date Filter calculation
  const targetDate =
    dateMode === 'today' ? todayStr : dateMode === 'tomorrow' ? tomorrowStr : dateMode === 'custom' ? customDate : '';
  const filteredItems = allFollowUps.filter((item) => {
    // Date match
    let dateMatches = false;
    if (dateMode === 'overdue') {
      dateMatches = item.dueDate < todayStr && item.status !== 'Called - Confirmed';
    } else {
      dateMatches = item.dueDate === targetDate;
    }
    // Category match
    const catMatches = categoryFilter === 'All' || item.category === categoryFilter;
    // Search match
    const searchMatches =
      item.patientName.toLowerCase().includes(search.toLowerCase()) ||
      item.phone.includes(search) ||
      item.uhid.toLowerCase().includes(search.toLowerCase()) ||
      item.reason.toLowerCase().includes(search.toLowerCase());
    return dateMatches && catMatches && searchMatches;
  });
  // 1-Click WhatsApp Follow-up Alert Generator
  const handleSendWhatsAppAlert = (item) => {
    const cleanPhone = item.phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `🌿 *Namaste ${item.patientName}!* \n\n` +
        `Warm greetings from *${config.hospitalName}* (${currentBranch.name}).\n\n` +
        `🗓️ *Scheduled Follow-Up Reminder:*\n` +
        `Your regular Ayurvedic review / procedure is due on *${item.dueDate}*.\n` +
        `📌 *Procedure / Service:* ${item.reason}\n\n` +
        `Please ensure regular follow-up to maintain treatment continuity and permanent recovery. ` +
        `If you need to reschedule or confirm your time slot, please reply to this message or call us at *${currentBranch.phone}*.\n\n` +
        `📍 *Location:* ${currentBranch.address}\n` +
        `Vaidya: ${currentBranch.doctorInCharge}\n` +
        `Wishing you sound health & longevity! 🙏`
    );
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${message}`, '_blank');
    triggerToast(`WhatsApp reminder dispatched to ${item.patientName}`);
  };
  // Save Call Modal
  const handleSaveCallModal = () => {
    if (!callLogModalItem) return;
    setCallLogs((prev) => ({
      ...prev,
      [callLogModalItem.id]: {
        status: newCallStatus,
        note: callNoteText,
        nextDate: newNextDate,
      },
    }));
    setCallLogModalItem(null);
    triggerToast(`Follow-up call updated for ${callLogModalItem.patientName}!`);
  };
  const totalDue = filteredItems.length;
  const totalCompleted = filteredItems.filter((i) => i.status === 'Called - Confirmed').length;
  const totalPending = totalDue - totalCompleted;
  const complianceRate = totalDue > 0 ? Math.round((totalCompleted / totalDue) * 100) : 100;
  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: config.themeColor || '#0f6240' }}
            >
              Patient Retention & Clinical Continuity
            </span>
            <span className="text-xs text-stone-500 font-mono">Central Follow-Up Calling Station</span>
          </div>
          <h2 className="text-2xl font-serif font-black text-stone-900 tracking-tight">
            Scheduled Follow-Ups, Patient Calling & WhatsApp Alerts
          </h2>
          <p className="text-xs text-stone-600 mt-1 max-w-3xl">
            Unified date-filtered station for all upcoming OPD reviews, Panchakarma daily check-ins, Ksharasutra weekly
            thread changes, and Medical Camp screenings. Call directly or dispatch pre-composed WhatsApp reminders in 1
            click.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Follow-Up Retention</div>
            <div className="text-2xl font-black text-emerald-700">{complianceRate}%</div>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-card">
          <div className="text-xs text-stone-500">Total Follow-Ups Due</div>
          <div className="text-2xl font-black text-stone-900 mt-0.5">{totalDue}</div>
          <div className="text-[10px] text-stone-400 mt-1">On selected date filter</div>
        </div>

        <div className="bg-white border border-emerald-200 p-4 rounded-2xl shadow-card">
          <div className="text-xs text-emerald-700 font-bold">Calls Completed</div>
          <div className="text-2xl font-black text-emerald-600 mt-0.5">{totalCompleted}</div>
          <div className="text-[10px] text-emerald-600/80 mt-1">Confirmed & Documented</div>
        </div>

        <div className="bg-white border border-amber-200 p-4 rounded-2xl shadow-card">
          <div className="text-xs text-amber-700 font-bold">Pending Calls</div>
          <div className="text-2xl font-black text-amber-600 mt-0.5">{totalPending}</div>
          <div className="text-[10px] text-amber-600/80 mt-1">Awaiting staff contact</div>
        </div>

        <div className="bg-white border border-red-200 p-4 rounded-2xl shadow-card">
          <div className="text-xs text-red-700 font-bold">Overdue Follow-Ups</div>
          <div className="text-2xl font-black text-red-600 mt-0.5">
            {allFollowUps.filter((i) => i.dueDate < todayStr && i.status !== 'Called - Confirmed').length}
          </div>
          <div className="text-[10px] text-red-600/80 mt-1">Missed appointment risk</div>
        </div>
      </div>

      {/* Date Filter Bar & Controls */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Preset Date Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'today', label: `Today (${todayStr})` },
              { id: 'tomorrow', label: `Tomorrow (${tomorrowStr})` },
              { id: 'overdue', label: '🚨 Overdue / Missed' },
              { id: 'custom', label: '📅 Pick Specific Date' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDateMode(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dateMode === tab.id ? 'text-white shadow-sm' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
                style={{
                  backgroundColor: dateMode === tab.id ? config.themeColor || '#0f6240' : undefined,
                }}
              >
                {tab.label}
              </button>
            ))}

            {dateMode === 'custom' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="text-xs bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-1.5 font-mono text-stone-800"
              />
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search patient, phone, UHID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-stone-500" /> Filter Department:
          </span>
          {[
            'All',
            'OPD Clinical Visit',
            'Panchakarma Daily Care',
            'Ksharasutra Thread Change',
            'Camp Lead Follow-up',
          ].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                categoryFilter === cat
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Follow-up Patient List */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-stone-500 text-xs">
            No patients scheduled for follow-up on this date filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Patient Information</th>
                  <th className="py-3 px-4">Department & Care Type</th>
                  <th className="py-3 px-4">Procedure / Review Reason</th>
                  <th className="py-3 px-4">Mobile Phone</th>
                  <th className="py-3 px-4">Status & Notes</th>
                  <th className="py-3 px-4 text-right">Direct Call & WhatsApp Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredItems.map((item) => {
                  const isConfirmed = item.status === 'Called - Confirmed';
                  const isOverdue = item.dueDate < todayStr && !isConfirmed;
                  return (
                    <tr key={item.id} className="hover:bg-stone-50/80 transition-colors">
                      {/* Patient Name & UHID */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900 text-sm">{item.patientName}</div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          {item.uhid} • Age {item.age} ({item.gender})
                        </div>
                      </td>

                      {/* Department Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.category === 'Ksharasutra Thread Change'
                              ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                              : item.category === 'Panchakarma Daily Care'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : item.category === 'Camp Lead Follow-up'
                                  ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {item.category}
                        </span>
                        <div className="text-[10px] text-stone-400 mt-1">Due: {item.dueDate}</div>
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-stone-800">{item.reason}</div>
                      </td>

                      {/* Mobile Number Prominently */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-800 text-sm">{item.phone}</td>

                      {/* Status & Last Call Log */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-block ${
                            isConfirmed
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'Rescheduled'
                                ? 'bg-blue-100 text-blue-800'
                                : isOverdue
                                  ? 'bg-red-100 text-red-800 animate-pulse'
                                  : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {item.status}
                        </span>
                        {item.lastCallNote && (
                          <div className="text-[10px] text-stone-500 italic mt-0.5 truncate max-w-xs">
                            "{item.lastCallNote}"
                          </div>
                        )}
                      </td>

                      {/* Actions: Call & WhatsApp */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click Phone Call */}
                          <a
                            href={`tel:${item.phone}`}
                            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                            title="Direct Phone Call"
                          >
                            <Phone className="w-3.5 h-3.5 text-amber-400" />
                            <span>Call</span>
                          </a>

                          {/* 1-Click WhatsApp Alert */}
                          <button
                            onClick={() => handleSendWhatsAppAlert(item)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                            title="Dispatch Pre-formatted WhatsApp Reminder"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>

                          {/* Quick Status / Note Log */}
                          <button
                            onClick={() => {
                              setCallLogModalItem(item);
                              setNewCallStatus(item.status);
                              setCallNoteText(item.lastCallNote || 'Called patient, confirmed follow-up attendance.');
                            }}
                            className="p-1.5 text-stone-600 hover:bg-stone-100 rounded-lg"
                            title="Log Call Outcome"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: LOG CALL OUTCOME & RESCHEDULE */}
      {callLogModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 text-stone-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-stone-900">Record Follow-Up Call Outcome</h3>
              </div>
              <button onClick={() => setCallLogModalItem(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-stone-50 p-3 rounded-2xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-500">Patient:</span>
                <strong className="text-stone-900">{callLogModalItem.patientName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Phone:</span>
                <span className="font-mono font-bold text-emerald-700">{callLogModalItem.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Reason:</span>
                <span className="text-stone-700">{callLogModalItem.reason}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Call Status</label>
                <select
                  value={newCallStatus}
                  onChange={(e) => setNewCallStatus(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-bold"
                >
                  <option value="Called - Confirmed">Called - Confirmed (Patient visiting on time)</option>
                  <option value="Rescheduled">Rescheduled to a new date</option>
                  <option value="No Answer">No Answer / Line Busy</option>
                  <option value="Scheduled">Pending / Re-attempt needed</option>
                </select>
              </div>

              {newCallStatus === 'Rescheduled' && (
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">New Rescheduled Follow-Up Date</label>
                  <input
                    type="date"
                    value={newNextDate}
                    onChange={(e) => setNewNextDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Call Notes / Discussion Summary</label>
                <textarea
                  rows={3}
                  value={callNoteText}
                  onChange={(e) => setCallNoteText(e.target.value)}
                  placeholder="Record patient feedback, symptoms, or special instructions given..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setCallLogModalItem(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCallModal}
                className="px-4 py-2 text-white rounded-xl text-xs font-bold shadow-sm"
                style={{ backgroundColor: config.themeColor || '#0f6240' }}
              >
                Save Call Outcome
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
