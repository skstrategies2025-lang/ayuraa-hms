import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  CheckCircle2,
  Flame,
  X,
  Phone,
  MessageSquare,
  Scissors,
  Activity,
  BookOpen,
  Check,
} from 'lucide-react';
import { AyurStorage } from '../services/storage';
export const PanchakarmaView = ({ panchakarma, patients, staff, currentBranch, config }) => {
  // Sub-tabs
  const [activeTab, setActiveTab] = useState('active_suites');
  const [filterTherapy, setFilterTherapy] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  // Daily Calling Modal & Follow-Up State
  const [selectedCallProc, setSelectedCallProc] = useState(null);
  const [callVegaCount, setCallVegaCount] = useState('4 - Madhyama Shuddhi');
  const [callAppetite, setCallAppetite] = useState('Sama (Balanced)');
  const [callLakshana, setCallLakshana] = useState('Samyak (Optimal)');
  const [callVitals, setCallVitals] = useState('BP 120/80, Pulse 74/min, No giddiness');
  const [callNotes, setCallNotes] = useState('Patient reports light abdomen, following Peya diet regimen strictly.');
  const [toastMsg, setToastMsg] = useState(null);
  // Ksharasutra State
  const [ksharaPatients, setKsharaPatients] = useState(
    () => AyurStorage.getKsharaSutraPatients() || []
  );
  const [selectedKshara, setSelectedKshara] = useState(null);
  const [newThreadLength, setNewThreadLength] = useState(1.5);
  const [newThreadDischarge, setNewThreadDischarge] = useState('Minimal Serous');
  const [newThreadNotes, setNewThreadNotes] = useState('Healthy granulation at base, cut-through advancing smoothly.');
  // New Panchakarma booking states
  const [newPatientId, setNewPatientId] = useState(patients[0]?.id || '');
  const [newTherapyName, setNewTherapyName] = useState('Shirodhara');
  const [newTherapist, setNewTherapist] = useState('Kalyani S. (Lead Panchakarma Specialist)');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTotalDays, setNewTotalDays] = useState(7);
  const [newTimeSlot, setNewTimeSlot] = useState('09:30 AM - 10:45 AM');
  const [newRoom, setNewRoom] = useState('Dhanwanthari Therapy Suite #1');
  const [newOils, setNewOils] = useState('Chandanadi Taila & Ksheerabala 101');
  const [newPreNotes, setNewPreNotes] = useState('Snehana & Swedana checked, BP normal');
  const branchProcedures = panchakarma.filter((p) => !p.branchId || p.branchId === currentBranch.id);
  const filteredProcedures = branchProcedures.filter((p) => {
    const matchesTherapy =
      filterTherapy === 'All' ? true : p.therapyName.toLowerCase().includes(filterTherapy.toLowerCase());
    const matchesStatus =
      filterStatus === 'All'
        ? true
        : filterStatus === 'Waiting'
          ? p.status === 'Scheduled' || p.status === 'Waiting'
          : filterStatus === 'In Progress'
            ? p.status === 'In Progress'
            : filterStatus === 'Completed'
              ? p.status === 'Completed'
              : true;
    return matchesTherapy && matchesStatus;
  });
  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };
  // Progress Day
  const handleProgressDay = (proc) => {
    if (proc.currentDay < proc.totalDays) {
      const updated = {
        ...proc,
        currentDay: proc.currentDay + 1,
        status: proc.currentDay + 1 === proc.totalDays ? 'Completed' : 'In Progress',
      };
      AyurStorage.updatePanchakarma(updated);
      triggerToast(`Day ${proc.currentDay + 1} logged for ${proc.patientName}`);
    }
  };
  // Add Booking
  const handleAddNewBooking = (e) => {
    e.preventDefault();
    const pat = patients.find((p) => p.id === newPatientId) || patients[0];
    const newProc = {
      id: `pk-${Date.now()}`,
      patientId: pat.id,
      patientName: pat.name,
      therapyName: newTherapyName,
      therapistAssigned: newTherapist,
      doctorInCharge: currentBranch.doctorInCharge,
      startDate: newStartDate,
      totalDays: newTotalDays,
      currentDay: 1,
      dailyTimeSlot: newTimeSlot,
      roomName: newRoom,
      medicatedOilsUsed: newOils,
      status: 'In Progress',
      preProcedureNotes: newPreNotes,
      branchId: currentBranch.id,
    };
    AyurStorage.addPanchakarma(newProc);
    setShowAddModal(false);
    triggerToast(`Panchakarma program booked for ${pat.name}!`);
  };
  // 1-Click WhatsApp Follow-Up Dispatch
  const handleSendPKWhatsApp = (proc, pat) => {
    const phone = pat?.phone || '+91 98450 11234';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `🌿 *Namaste ${proc.patientName}!* \n\n` +
        `This is a daily care check-in from *${config.hospitalName}* regarding your ongoing *${proc.therapyName}* (Day ${proc.currentDay} of ${proc.totalDays}).\n\n` +
        `🩺 *Daily Recovery Check:* \n` +
        `1. How is your bowel movement & Vega frequency today?\n` +
        `2. Are you experiencing any fatigue, dizziness, or burning sensation?\n` +
        `3. Did you follow the warm Peya / liquid diet advised by the Vaidya?\n\n` +
        `If you have any discomfort, please reply directly or call our clinic hotline at ${currentBranch.phone}.\n\n` +
        `Wishing you complete Dhatu purification & sound health! 🙏`
    );
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${message}`, '_blank');
    triggerToast(`WhatsApp alert opened for ${proc.patientName}`);
  };
  // Save Daily Call Log
  const handleSaveCallLog = () => {
    if (!selectedCallProc) return;
    const { proc } = selectedCallProc;
    const updated = {
      ...proc,
      postProcedureNotes: `[Daily Call Day ${proc.currentDay}] Vega: ${callVegaCount} | Agni: ${callAppetite} | Shuddhi: ${callLakshana} | Vitals: ${callVitals}. Note: ${callNotes}`,
    };
    AyurStorage.updatePanchakarma(updated);
    setSelectedCallProc(null);
    triggerToast(`Daily procedure follow-up notes logged for ${proc.patientName}!`);
  };
  // Log Ksharasutra Thread Change
  const handleSaveThreadChange = (patient) => {
    const newRecord = {
      id: `tc-${Date.now()}`,
      sittingNumber: (patient.threadHistory?.length || 0) + 1,
      date: new Date().toISOString().split('T')[0],
      tractLengthCm: newThreadLength,
      threadType: 'Apamarga Kshara Sutra',
      dischargeStatus: newThreadDischarge,
      healingProgressNotes: newThreadNotes,
      medicationsGiven: 'Triphala Guggulu 2 tabs bid, Jatyadi Taila local instillation, Panchavalkala sitz bath',
      nextSittingDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      performedBy: currentBranch.doctorInCharge,
    };
    const updatedPatient = {
      ...patient,
      currentTractLengthCm: newThreadLength,
      currentSitting: newRecord.sittingNumber,
      nextFollowUpDate: newRecord.nextSittingDueDate,
      status: newThreadLength <= 0.2 ? 'Complete Healing / Cut-Through' : 'Active Treatment',
      threadHistory: [...(patient.threadHistory || []), newRecord],
    };
    AyurStorage.updateKsharaSutraPatient(updatedPatient);
    setKsharaPatients(AyurStorage.getKsharaSutraPatients());
    setSelectedKshara(null);
    triggerToast(`Weekly thread change sitting logged for ${patient.patientName}!`);
  };
  const therapyTypes = [
    'All',
    'Abhyanga',
    'Shirodhara',
    'Januvasthi',
    'Takradhara',
    'Elakizhi',
    'Virechana',
    'Basti',
    'Nasya',
  ];
  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Title & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <h2 className="text-xl font-serif font-black text-stone-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-700" />
            Panchakarma Department & Shalya Parasurgical Suite
          </h2>
          <p className="text-xs text-stone-500">
            NABH-accredited classical detoxification, daily Vega calling alerts, Samsarjana Krama & Ksharasutra tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Main Navigation Sub-tabs */}
          <div className="bg-white border border-stone-200 p-1 rounded-2xl flex items-center gap-1 shadow-card">
            <button
              onClick={() => setActiveTab('active_suites')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'active_suites' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              🌿 Active Suites ({branchProcedures.length})
            </button>
            <button
              onClick={() => setActiveTab('daily_calling')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'daily_calling' ? 'bg-emerald-600 text-white shadow' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              📞 Daily Call Alerts
            </button>
            <button
              onClick={() => setActiveTab('detailed_protocols')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'detailed_protocols'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              📋 Classical Protocols
            </button>
            <button
              onClick={() => setActiveTab('ksharasutra_shalya')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ksharasutra_shalya'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              🧵 Ksharasutra Suite ({ksharaPatients.length})
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Book Course</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: ACTIVE THERAPY SUITES */}
      {activeTab === 'active_suites' && (
        <div className="space-y-4">
          {/* Status Pipeline Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-stone-200 text-xs shadow-card">
            {[
              { id: 'All', label: `All Procedures (${branchProcedures.length})` },
              {
                id: 'Waiting',
                label: `⏳ Waiting / Scheduled (${branchProcedures.filter((p) => p.status === 'Scheduled' || p.status === 'Waiting').length})`,
              },
              {
                id: 'In Progress',
                label: `🌿 In Progress (${branchProcedures.filter((p) => p.status === 'In Progress').length})`,
              },
              {
                id: 'Completed',
                label: `✅ Completed (${branchProcedures.filter((p) => p.status === 'Completed').length})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  filterStatus === tab.id
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Therapy Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {therapyTypes.map((t) => (
              <button
                key={t}
                onClick={() => setFilterTherapy(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  filterTherapy === t
                    ? 'bg-stone-200 text-stone-950 shadow'
                    : 'bg-white text-stone-500 border border-stone-200 hover:text-stone-800'
                }`}
              >
                {t === 'All' ? 'All Therapies' : t}
              </button>
            ))}
          </div>

          {/* Active Therapies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProcedures.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-xs shadow-card">
                No Panchakarma therapies found for this filter combination.
              </div>
            ) : (
              filteredProcedures.map((proc) => {
                const progress = Math.round((proc.currentDay / proc.totalDays) * 100);
                const isCompleted = proc.status === 'Completed' || proc.currentDay >= proc.totalDays;
                const isWaiting = proc.status === 'Scheduled' || proc.status === 'Waiting';
                const pat = patients.find((p) => p.id === proc.patientId);
                return (
                  <div
                    key={proc.id}
                    className="p-5 rounded-2xl bg-white border border-stone-200 hover:border-amber-300 transition-all shadow-xl flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                        <div className="flex items-center gap-2">
                          <Flame className="w-4 h-4 text-amber-700" />
                          <h3 className="font-bold text-stone-900 text-sm">{proc.therapyName}</h3>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isWaiting
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {isWaiting ? '⏳ Waiting / Scheduled' : proc.status}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs text-stone-700">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Patient:</span>
                          <span className="font-bold text-stone-900">{proc.patientName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Phone:</span>
                          <span className="font-mono text-emerald-700 font-semibold">
                            {pat?.phone || '+91 98450 11234'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Suite / Room:</span>
                          <span className="text-stone-700 font-medium">{proc.roomName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Therapist:</span>
                          <span className="text-amber-800 font-medium">{proc.therapistAssigned}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Time Slot:</span>
                          <span className="font-mono text-stone-700">{proc.dailyTimeSlot}</span>
                        </div>
                      </div>

                      <div className="mt-3 text-xs bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                        <span className="text-stone-500 text-[10px] uppercase font-bold block">
                          Medicated Formulations:
                        </span>
                        <p className="text-emerald-700 text-[11px] italic mt-0.5">{proc.medicatedOilsUsed}</p>
                      </div>

                      {/* Daily Progress Bar */}
                      <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-stone-500">Treatment Progression:</span>
                          <strong className="text-stone-900">
                            Day {proc.currentDay} of {proc.totalDays} ({progress}%)
                          </strong>
                        </div>
                        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-amber-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {proc.postProcedureNotes && (
                        <div className="mt-2 text-[10px] text-stone-500 bg-stone-50 p-2 rounded-lg border border-stone-200">
                          {proc.postProcedureNotes}
                        </div>
                      )}
                    </div>

                    {/* Card Actions: Daily Follow-up Call + Progress */}
                    <div className="pt-3 border-t border-stone-200 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <a
                          href={`tel:${pat?.phone || '+919845011234'}`}
                          className="flex-1 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5 text-amber-700" />
                          <span>Call</span>
                        </a>

                        <button
                          onClick={() => handleSendPKWhatsApp(proc, pat)}
                          className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedCallProc({ proc, patient: pat });
                            setCallNotes(`Patient day ${proc.currentDay} procedure reviewed.`);
                          }}
                          className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs"
                          title="Log Daily Call Notes"
                        >
                          <Activity className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-stone-500">
                          {isWaiting ? 'Status: Waiting for admission' : `Started: ${proc.startDate}`}
                        </span>
                        {isWaiting ? (
                          <button
                            onClick={() => {
                              const updated = {
                                ...proc,
                                status: 'In Progress',
                                currentDay: 1,
                                startDate: new Date().toISOString().split('T')[0],
                              };
                              AyurStorage.updatePanchakarma(updated);
                              triggerToast(`Admitted & Started Day 1 for ${proc.patientName}`);
                            }}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shadow-sm"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-stone-950" />
                            <span>Admit & Start Day 1</span>
                          </button>
                        ) : !isCompleted ? (
                          <button
                            onClick={() => handleProgressDay(proc)}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Log Day {proc.currentDay} Done</span>
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: DAILY CALLING ALERTS & FOLLOW-UP HUB */}
      {activeTab === 'daily_calling' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
            <div>
              <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-700" />
                Active Panchakarma Daily Calling Desk & Recovery Checks
              </h3>
              <p className="text-xs text-stone-500">
                Contact all patients currently undergoing multi-day therapies to record Vega frequency, digestive Agni
                status, and dietary compliance
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold font-mono">
              {branchProcedures.filter((p) => p.status === 'In Progress').length} Patients Due for Daily Check-in
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Patient & UHID</th>
                  <th className="py-2.5 px-3">Therapy & Stage</th>
                  <th className="py-2.5 px-3">Phone Number</th>
                  <th className="py-2.5 px-3">Therapist Assigned</th>
                  <th className="py-2.5 px-3">Last Recorded Observation</th>
                  <th className="py-2.5 px-3 text-right">Quick Contact & Log</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {branchProcedures.map((proc) => {
                  const pat = patients.find((p) => p.id === proc.patientId);
                  const phone = pat?.phone || '+91 98450 11234';
                  return (
                    <tr key={proc.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-stone-900 text-sm">{proc.patientName}</div>
                        <div className="text-[10px] text-stone-500 font-mono">
                          {pat?.uhid || 'AYUR-PAT'} • {pat?.primaryCondition || 'Panchakarma Protocol'}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-amber-700">{proc.therapyName}</span>
                        <div className="text-[10px] text-stone-500">
                          Day {proc.currentDay} of {proc.totalDays} (
                          {Math.round((proc.currentDay / proc.totalDays) * 100)}%)
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-emerald-700">{phone}</td>

                      <td className="py-3 px-3 text-stone-700">{proc.therapistAssigned}</td>

                      <td className="py-3 px-3 text-stone-500 max-w-xs truncate text-[11px]">
                        {proc.postProcedureNotes || proc.preProcedureNotes || 'Awaiting daily check-in call'}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`tel:${phone}`}
                            className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                          >
                            <Phone className="w-3.5 h-3.5 text-amber-700" />
                            <span>Call</span>
                          </a>

                          <button
                            onClick={() => handleSendPKWhatsApp(proc, pat)}
                            className="px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                            <span>WhatsApp</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedCallProc({ proc, patient: pat });
                              setCallNotes(`Patient day ${proc.currentDay} check-in call completed.`);
                            }}
                            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                          >
                            <Activity className="w-3.5 h-3.5" />
                            <span>Log</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: DETAILED CLASSICAL PROCEDURES & PROTOCOLS */}
      {activeTab === 'detailed_protocols' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xl">
            <h3 className="font-serif font-black text-lg text-stone-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-700" />
              Classical Brihat Trayi Panchakarma Clinical Reference & Phase Protocols
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Standardized NABH & Charaka Samhita guidelines for Poorvakarma (Pre-detox), Pradhanakarma (Purification),
              and Paschatkarma (Dietary re-ignition)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PROTOCOL 1: VAMANA KARMA */}
            <div className="bg-white border border-stone-200 p-5 rounded-2xl space-y-3 shadow-card">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <h4 className="font-bold text-amber-700 text-sm">1.Vamana Karma - Therapeutic Emesis</h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                  Kapha Elimination
                </span>
              </div>
              <div className="text-xs space-y-2 text-stone-700">
                <div>
                  <strong className="text-stone-500 text-[11px] uppercase block">Poorvakarma:</strong>
                  Deepana-Pachana with Trikatu Churna for 3 days. Internal Snehapana with Mahatiktaka Ghrita in
                  escalating doses (30ml to 150ml) until Samyak Snigdha Lakshanas (greasy stools, aversion to fat).
                  Sarvanga Abhyanga & Bashpa Sweda on prior evening & morning.
                </div>
                <div>
                  <strong className="text-stone-500 text-[11px] uppercase block">Pradhanakarma:</strong>
                  Madanaphala Pippali Churna (3-6g) with Yashtimadhu Phanta & honey. Vega counting: Pravara (8 Vegas),
                  Madhyama (6 Vegas), Avara (4 Vegas). Antiki Lakshana: Pittanta (yellowish bilious emesis indicates
                  successful completion).
                </div>
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-[11px]">
                  <strong className="text-emerald-700 block mb-0.5">Paschat Samsarjana Krama Diet:</strong>
                  Day 1-2: Peya (thin liquid rice gruel); Day 3: Vilepi (thick rice gruel); Day 4: Akrita Yusha
                  (unseasoned green gram soup); Day 5-6: Krita Yusha with cumin and ghee; Day 7: Normal Satvik meals.
                </div>
              </div>
            </div>

            {/* PROTOCOL 2: VIRECHANA KARMA */}
            <div className="bg-white border border-stone-200 p-5 rounded-2xl space-y-3 shadow-card">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <h4 className="font-bold text-amber-700 text-sm">
                  2.Virechana Karma - Therapeutic Purgation
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  Pitta Elimination
                </span>
              </div>
              <div className="text-xs space-y-2 text-stone-700">
                <div>
                  <strong className="text-stone-500 text-[11px] uppercase block">Poorvakarma:</strong>
                  Deepana-Pachana with Chitrakadi Vati. Snehapana with Kalyanaka Ghrita or Guggulutiktaka Ghrita for 3-7
                  days. 3 days of Vishrama Kala with Abhyanga and Swedana.
                </div>
                <div>
                  <strong className="text-stone-500 text-[11px] uppercase block">Pradhanakarma:</strong>
                  Trivrit Lehya (30-50g) with Draksha Kashaya or warm milk at 09:00 AM. Vega counting: Pravara (30
                  Vegas), Madhyama (20 Vegas), Avara (10 Vegas). Kaphanta Shuddhi (mucous discharge marks completion).
                </div>
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-[11px]">
                  <strong className="text-emerald-700 block mb-0.5">Parihara Kala (Rest Rules):</strong>
                  Strict avoidance of cold winds, direct sun, loud speech, emotional turmoil, travel, and daytime
                  sleeping for twice the duration of therapy days.
                </div>
              </div>
            </div>

            {/* PROTOCOL 3: BASTI CHIKITSA */}
            <div className="bg-white border border-stone-200 p-5 rounded-2xl space-y-3 shadow-card">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <h4 className="font-bold text-amber-700 text-sm">
                  3.Basti - Medicated Herbal Enemas
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                  Vata Ardha Chikitsa
                </span>
              </div>
              <div className="text-xs space-y-2 text-stone-700">
                <div>
                  <strong className="text-stone-500 text-[11px] uppercase block">Classical Schedules:</strong>•{' '}
                  <strong>Yoga Basti (8 Days):</strong> 3 Niruha + 5 Anuvasana (Pattern: A-N-A-N-A-N-A-A)
                  <br />• <strong>Kala Basti (16 Days):</strong> 6 Niruha + 10 Anuvasana
                  <br />• <strong>Karma Basti (30 Days):</strong> 12 Niruha + 18 Anuvasana
                </div>
                <div>
                  <strong className="text-stone-500 text-[11px] uppercase block">
                    Preparation Order (Niruha Emulsion):
                  </strong>
                  1. Makshika (Honey) → 2. Saindhava (Rock salt) → 3. Sneha (Taila/Ghrita) → 4. Kalka (Herbal paste) →
                  5. Kwatha (Decoction). Administer at body temperature using Basti Putaka.
                </div>
              </div>
            </div>

            {/* PROTOCOL 4: NASYA & RAKTAMOKSHANA */}
            <div className="bg-white border border-stone-200 p-5 rounded-2xl space-y-3 shadow-card">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <h4 className="font-bold text-amber-700 text-sm">4.Nasya & Raktamokshana</h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-bold">
                  Head & Blood Detox
                </span>
              </div>
              <div className="text-xs space-y-2 text-stone-700">
                <div>
                  <strong className="text-stone-500 text-[11px] uppercase block">Nasya (Nasal Errhine):</strong>
                  Mukha Abhyanga + Nadi Sweda with Dashamoola. Anu Taila / Ksheerabala 101 instillation (8 drops/nostril
                  in Marsha Nasya). Spit in cuspidor; follow with warm water gargle and Dhoomapana.
                </div>
                <div>
                  <strong className="text-stone-500 text-[11px] uppercase block">
                    Raktamokshana (Jalaukavacharana):
                  </strong>
                  Leech therapy using non-poisonous Nirvisha Jalauka on chronic eczema, psoriasis, or varicose veins.
                  Natural detachment with Haridra Churna (Turmeric). Shatadhauta Ghrita dressing.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: KSHARASUTRA & SHALYA TANTRA ANORECTAL SUITE */}
      {activeTab === 'ksharasutra_shalya' && (
        <div className="space-y-5">
          <div className="bg-white border border-indigo-200 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                  Shalya Tantra Parasurgical Wing
                </span>
                <span className="text-xs text-stone-500">Piles • Fistula-in-ano • Pilonidal Sinus</span>
              </div>
              <h3 className="font-serif font-black text-lg text-stone-900">
                Ksharasutra Specialized Daycare & Weekly Thread Change Tracker
              </h3>
              <p className="text-xs text-stone-500 max-w-2xl mt-0.5">
                Globally recognized gold standard for Fistula-in-Ano and high-grade Piles with &lt;1.5% recurrence.
                Monitor tract cut-through velocity and weekly 7-day sittings.
              </p>
            </div>
          </div>

          {/* Kshara Sutra Patient Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ksharaPatients.map((kPat) => {
              const cutThroughProgress = Math.max(
                0,
                Math.min(
                  100,
                  Math.round(
                    ((kPat.initialTractLengthCm - kPat.currentTractLengthCm) / kPat.initialTractLengthCm) * 100
                  )
                )
              );
              return (
                <div key={kPat.id} className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">{kPat.patientName}</h4>
                      <span className="text-[10px] text-stone-500 font-mono">
                        {kPat.uhid} • Age {kPat.age} ({kPat.gender})
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Sitting #{kPat.currentSitting}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-stone-700">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Diagnosis:</span>
                      <span className="font-semibold text-amber-800">{kPat.diagnosis.split('(')[0]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Initial Tract:</span>
                      <span className="font-mono text-stone-700">{kPat.initialTractLengthCm} cm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Current Tract:</span>
                      <span className="font-mono font-bold text-emerald-700">{kPat.currentTractLengthCm} cm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Next Thread Change:</span>
                      <span className="font-mono font-bold text-amber-700">{kPat.nextFollowUpDate}</span>
                    </div>
                  </div>

                  {/* Cut-Through Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-stone-500">Tract Healing & Cut-Through:</span>
                      <strong className="text-emerald-700">{cutThroughProgress}% Done</strong>
                    </div>
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${cutThroughProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-stone-200 flex items-center justify-between gap-2">
                    <a
                      href={`tel:${kPat.phone}`}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5 text-amber-700" />
                      <span>{kPat.phone}</span>
                    </a>

                    <button
                      onClick={() => {
                        setSelectedKshara(kPat);
                        setNewThreadLength(Math.max(0, Number((kPat.currentTractLengthCm - 0.7).toFixed(1))));
                      }}
                      className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Log Thread Change</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: LOG DAILY PANCHAKARMA RECOVERY CALL */}
      {selectedCallProc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-2xl max-w-lg w-full p-6 text-stone-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-base text-stone-900">Daily Procedure Check-in Log</h3>
              </div>
              <button onClick={() => setSelectedCallProc(null)} className="text-stone-500 hover:text-stone-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-500">Patient:</span>
                <strong className="text-stone-900">{selectedCallProc.proc.patientName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Therapy:</span>
                <span className="text-amber-700 font-bold">
                  {selectedCallProc.proc.therapyName} (Day {selectedCallProc.proc.currentDay})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Phone:</span>
                <a
                  href={`tel:${selectedCallProc.patient?.phone || '+919845011234'}`}
                  className="text-emerald-700 underline font-mono"
                >
                  {selectedCallProc.patient?.phone || '+91 98450 11234'}
                </a>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Vega Count & Evacuation Pattern</label>
                <input
                  type="text"
                  value={callVegaCount}
                  onChange={(e) => setCallVegaCount(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-mono"
                  placeholder="e.g. 5 vegas, yellow watery, no blood"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Agni / Appetite</label>
                  <select
                    value={callAppetite}
                    onChange={(e) => setCallAppetite(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  >
                    <option value="Sama (Balanced)">Sama (Balanced)</option>
                    <option value="Manda (Low)">Manda (Low)</option>
                    <option value="Teekshna (High)">Teekshna (Sharp)</option>
                    <option value="Aruchi (Anorexia)">Aruchi (No Appetite)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Shuddhi Lakshana</label>
                  <select
                    value={callLakshana}
                    onChange={(e) => setCallLakshana(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  >
                    <option value="Samyak (Optimal)">Samyak (Optimal)</option>
                    <option value="Ayoga (Inadequate)">Ayoga (Inadequate)</option>
                    <option value="Atiyoga (Excessive)">Atiyoga (Excessive)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Vitals / Blood Pressure</label>
                <input
                  type="text"
                  value={callVitals}
                  onChange={(e) => setCallVitals(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Vaidya Clinical Instructions / Call Notes
                </label>
                <textarea
                  rows={2}
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setSelectedCallProc(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCallLog}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow"
              >
                Save Daily Check-in Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LOG KSHARASUTRA WEEKLY THREAD CHANGE */}
      {selectedKshara && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-2xl max-w-lg w-full p-6 text-stone-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-indigo-700" />
                <h3 className="font-bold text-base text-stone-900">Log Weekly Ksharasutra Sitting</h3>
              </div>
              <button onClick={() => setSelectedKshara(null)} className="text-stone-500 hover:text-stone-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-500">Patient:</span>
                <strong className="text-stone-900">
                  {selectedKshara.patientName} ({selectedKshara.uhid})
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Diagnosis:</span>
                <span className="text-amber-700 font-bold">{selectedKshara.diagnosis}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Previous Tract Length:</span>
                <span className="font-mono text-stone-700">{selectedKshara.currentTractLengthCm} cm</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">New Remaining Tract (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newThreadLength}
                    onChange={(e) => setNewThreadLength(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-emerald-700 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Discharge Assessment</label>
                  <select
                    value={newThreadDischarge}
                    onChange={(e) => setNewThreadDischarge(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  >
                    <option value="Minimal Serous">Minimal Serous</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Purulent">Purulent</option>
                    <option value="Nil / Granulating">Nil / Granulating</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Healing Progress & Surrounding Tissue Notes
                </label>
                <textarea
                  rows={2}
                  value={newThreadNotes}
                  onChange={(e) => setNewThreadNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-500">
                Next weekly sitting will be automatically scheduled for <strong>7 days from today</strong> (
                {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}).
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setSelectedKshara(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveThreadChange(selectedKshara)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow"
              >
                Confirm Thread Change & Schedule Next Week
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BOOK PANCHAKARMA THERAPY */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-2xl max-w-lg w-full p-6 text-stone-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-base text-stone-900">Schedule New Panchakarma Program</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-stone-500 hover:text-stone-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewBooking} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Select Patient</label>
                <select
                  value={newPatientId}
                  onChange={(e) => setNewPatientId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-bold"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.uhid}) - {p.primaryCondition}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Panchakarma Procedure</label>
                  <select
                    value={newTherapyName}
                    onChange={(e) => setNewTherapyName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-bold"
                  >
                    <option value="Abhyanga & Swedana">Abhyanga & Swedana</option>
                    <option value="Shirodhara">Shirodhara</option>
                    <option value="Januvasthi / Janu Basti">Januvasthi / Janu Basti</option>
                    <option value="Takradhara">Takradhara</option>
                    <option value="Elakizhi / Podikizhi">Elakizhi / Podikizhi</option>
                    <option value="Kashaya Basti">Kashaya Basti</option>
                    <option value="Sneha Basti / Matra Basti">Sneha Basti / Matra Basti</option>
                    <option value="Virechana Karma">Virechana Karma</option>
                    <option value="Vamana Karma">Vamana Karma</option>
                    <option value="Nasya Karma">Nasya Karma</option>
                    <option value="Raktamokshana (Jalauka)">Raktamokshana (Jalauka)</option>
                    <option value="Netra Tarpana">Netra Tarpana</option>
                    <option value="Udwarthanam">Udwarthanam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Therapist Assigned</label>
                  <select
                    value={newTherapist}
                    onChange={(e) => setNewTherapist(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  >
                    <option value="Kalyani S. (Lead Panchakarma Specialist)">Kalyani S. (Lead Specialist)</option>
                    <option value="Vipin Kumar (Senior Panchakarma Therapist)">Vipin Kumar (Senior)</option>
                    <option value="Soumya Nair (Therapist)">Soumya Nair (Therapist)</option>
                    <option value="Anand M. (Therapist)">Anand M. (Therapist)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Total Days</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={newTotalDays}
                    onChange={(e) => setNewTotalDays(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={newTimeSlot}
                    onChange={(e) => setNewTimeSlot(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Therapy Room / Suite</label>
                <select
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                >
                  <option value="Dhanwanthari Therapy Suite #1">Dhanwanthari Therapy Suite #1</option>
                  <option value="Shirodhara Pavilion B">Shirodhara Pavilion B</option>
                  <option value="Swedana Room #2">Swedana Room #2</option>
                  <option value="Virechana & Basti Ward 3">Virechana & Basti Ward 3</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Medicated Oils / Kwathas Used</label>
                <input
                  type="text"
                  placeholder="e.g. Mahanarayana Taila & Dhanwantharam"
                  value={newOils}
                  onChange={(e) => setNewOils(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold shadow"
                >
                  Confirm Therapy Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
