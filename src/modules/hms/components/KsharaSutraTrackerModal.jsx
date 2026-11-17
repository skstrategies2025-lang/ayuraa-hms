import React, { useState } from 'react';
import { Scissors, Plus, CheckCircle2, X, MessageSquare, Activity } from 'lucide-react';
import { AyurStorage } from '../services/storage';
export const KsharaSutraTrackerModal = ({ isOpen, onClose, config, currentBranch, initialPatientId }) => {
  if (!isOpen) return null;
  const [patients, setPatients] = useState(AyurStorage.getKsharaSutraPatients());
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || patients[0]?.id || '');
  const [showLogModal, setShowLogModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  // Form for new thread change
  const [newSittingNumber, setNewSittingNumber] = useState(1);
  const [newTractLength, setNewTractLength] = useState(2.0);
  const [newThreadType, setNewThreadType] = useState('Apamarga Kshara Sutra');
  const [newDischarge, setNewDischarge] = useState('Minimal Serous');
  const [newNotes, setNewNotes] = useState(
    'Smooth thread cutting observed. Patient tolerated procedure well with warm sitz bath.'
  );
  const [newMeds, setNewMeds] = useState('Jatyadi Taila 5ml local push + Triphala Guggulu 2 tabs bid');
  const [surgeonName, setSurgeonName] = useState(currentBranch.doctorInCharge);
  const brandColor = config.themeColor || '#0f6240';
  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];
  const today = new Date().toISOString().split('T')[0];
  const handleOpenLogModal = (patient) => {
    setSelectedPatientId(patient.id);
    setNewSittingNumber(patient.currentSitting + 1);
    setNewTractLength(Math.max(0.2, Math.round((patient.currentTractLengthCm - 0.8) * 10) / 10));
    setShowLogModal(true);
  };
  const handleSaveThreadChange = (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    // Calculate next 7-day follow-up (1 week)
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 7);
    const nextFollowUpStr = nextDate.toISOString().split('T')[0];
    const newRecord = {
      id: `tc-${Date.now()}`,
      sittingNumber: newSittingNumber,
      date: today,
      tractLengthCm: Number(newTractLength),
      threadType: newThreadType,
      dischargeStatus: newDischarge,
      healingProgressNotes: newNotes.trim(),
      medicationsGiven: newMeds.trim(),
      nextSittingDueDate: nextFollowUpStr,
      performedBy: surgeonName,
    };
    const isCutThrough = Number(newTractLength) <= 0.3;
    const updatedPatient = {
      ...selectedPatient,
      currentSitting: newSittingNumber,
      currentTractLengthCm: Number(newTractLength),
      nextFollowUpDate: nextFollowUpStr,
      status: isCutThrough ? 'Complete Healing / Cut-Through' : 'Active Treatment',
      threadHistory: [newRecord, ...selectedPatient.threadHistory],
    };
    AyurStorage.updateKsharaSutraPatient(updatedPatient);
    setPatients(AyurStorage.getKsharaSutraPatients());
    setShowLogModal(false);
    setToastMessage(
      `Thread Change Sitting #${newSittingNumber} logged! Next 1-week follow-up scheduled for ${nextFollowUpStr}.`
    );
    setTimeout(() => setToastMessage(''), 4500);
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-5xl w-full text-stone-900 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl text-white shadow-sm" style={{ backgroundColor: brandColor }}>
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-black text-lg text-stone-900">
                  Shalya Tantra: Kshara Sutra Anorectal Registry
                </h3>
                <span className="text-[11px] text-stone-500 font-mono">Weekly Thread Change & Cut-Through Tracker</span>
              </div>
              <p className="text-xs text-stone-600">
                Specialized monitoring for Bhagandara (Fistula-in-Ano), Arshas (Piles), and Nadi Vrana with automated
                7-day follow-up schedules.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {toastMessage && (
          <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Content Body: Two Columns */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Left Column: Patient List with 7-Day Countdown Badges (320px) */}
          <div className="w-full md:w-80 border-r border-stone-200 flex flex-col bg-stone-50/50 shrink-0">
            <div className="p-3 border-b border-stone-200 bg-white flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Active Kshara Sutra Cases ({patients.length})
              </span>
              <span className="text-[11px] text-stone-500 font-mono">1-Wk Follow-up</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {patients.map((pat) => {
                const isSelected = selectedPatient?.id === pat.id;
                // Calculate days until thread change
                const dueDate = new Date(pat.nextFollowUpDate);
                const currDate = new Date();
                const diffDays = Math.ceil((dueDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
                const isOverdue = diffDays < 0;
                const isDueToday = diffDays === 0;
                const isDueSoon = diffDays > 0 && diffDays <= 3;
                return (
                  <div
                    key={pat.id}
                    onClick={() => setSelectedPatientId(pat.id)}
                    className={`p-3.5 rounded-2xl cursor-pointer border transition-all text-left ${
                      isSelected ? 'bg-white border-2 shadow-sm' : 'bg-white/80 border-stone-200 hover:border-stone-300'
                    }`}
                    style={{
                      borderColor: isSelected ? brandColor : undefined,
                    }}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-bold text-xs text-stone-900">{pat.patientName}</span>
                      <span className="font-mono text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                        {pat.uhid}
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-600 mt-1 line-clamp-1 font-medium">{pat.diagnosis}</div>

                    {/* Progress Bar of Tract Cut-Through */}
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-[10px] text-stone-500">
                        <span>Sitting #{pat.currentSitting}</span>
                        <span className="font-mono font-bold text-stone-800">
                          {pat.currentTractLengthCm} cm / {pat.initialTractLengthCm} cm
                        </span>
                      </div>
                      <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.round(((pat.initialTractLengthCm - pat.currentTractLengthCm) / pat.initialTractLengthCm) * 100)}%`,
                            backgroundColor: brandColor,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Next Thread Change Badge */}
                    <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px]">
                      <span className="text-stone-400">Thread Due:</span>
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold font-mono ${
                          isOverdue
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : isDueToday
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : isDueSoon
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {isOverdue
                          ? `Overdue ${Math.abs(diffDays)}d`
                          : isDueToday
                            ? 'DUE TODAY'
                            : `In ${diffDays} days (${pat.nextFollowUpDate})`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Patient Thread Registry & Ligation Notes */}
          <div className="flex-1 flex flex-col bg-white overflow-y-auto p-5 sm:p-6 min-h-0 space-y-5">
            {selectedPatient ? (
              <>
                {/* Patient Case Summary Card */}
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif font-black text-lg text-stone-900">{selectedPatient.patientName}</h4>
                      <span className="font-mono text-xs bg-stone-200 px-2 py-0.5 rounded text-stone-800 font-bold">
                        {selectedPatient.uhid}
                      </span>
                      <span className="text-xs text-stone-500 font-mono">{selectedPatient.phone}</span>
                    </div>
                    <div className="text-xs text-stone-600 mt-1 flex flex-wrap items-center gap-2">
                      <span className="font-bold text-stone-800">{selectedPatient.diagnosis}</span>
                      <span>·</span>
                      <span>
                        Type: <strong>{selectedPatient.fistulaType || 'Classical'}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Surgeon: <strong>{selectedPatient.attendingSurgeon}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* WhatsApp Follow-up Button */}
                    <a
                      href={`https://wa.me/${selectedPatient.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Namaste ${selectedPatient.patientName}, this is a reminder from ${config.hospitalName} for your scheduled weekly Kshara Sutra thread change on ${selectedPatient.nextFollowUpDate} with ${selectedPatient.attendingSurgeon}. Please take your warm sitz bath prior to your visit.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp Reminder</span>
                    </a>

                    {/* Log New Sitting Button */}
                    <button
                      onClick={() => handleOpenLogModal(selectedPatient)}
                      className="px-4 py-2 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                      style={{ backgroundColor: brandColor }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Thread Change</span>
                    </button>
                  </div>
                </div>

                {/* Progress Indicators Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-[10px] text-stone-500 block uppercase font-bold">Initial Tract Length</span>
                    <span className="font-bold font-mono text-base text-stone-900">
                      {selectedPatient.initialTractLengthCm} cm
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-[10px] text-stone-500 block uppercase font-bold">Remaining Tract</span>
                    <span className="font-bold font-mono text-base text-emerald-700">
                      {selectedPatient.currentTractLengthCm} cm
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-[10px] text-stone-500 block uppercase font-bold">Cutting Rate (UCT)</span>
                    <span className="font-bold text-stone-800">
                      {Math.round(
                        ((selectedPatient.initialTractLengthCm - selectedPatient.currentTractLengthCm) /
                          (selectedPatient.currentSitting || 1)) *
                          10
                      ) / 10}{' '}
                      cm / wk
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-[10px] text-stone-500 block uppercase font-bold">Next Thread Change</span>
                    <span className="font-bold font-mono text-amber-800">{selectedPatient.nextFollowUpDate}</span>
                  </div>
                </div>

                {/* Thread Change History Timeline */}
                <div className="space-y-3">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    Weekly Thread Change Records & Clinical Notes
                  </h5>

                  <div className="space-y-2.5">
                    {selectedPatient.threadHistory.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-2 text-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-stone-200 gap-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-6 h-6 rounded-lg text-white font-mono text-xs font-bold flex items-center justify-center shrink-0"
                              style={{ backgroundColor: brandColor }}
                            >
                              #{item.sittingNumber}
                            </span>
                            <span className="font-bold text-stone-900">Sitting #{item.sittingNumber}</span>
                            <span className="text-stone-400">·</span>
                            <span className="text-stone-600 font-mono">{item.date}</span>
                            <span className="text-stone-400">·</span>
                            <span className="text-stone-700 font-semibold">{item.threadType}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono text-stone-700 font-bold bg-white px-2 py-0.5 rounded border border-stone-200">
                              Tract: {item.tractLengthCm} cm
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.dischargeStatus === 'Nil / Granulating'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : item.dischargeStatus === 'Minimal Serous'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {item.dischargeStatus}
                            </span>
                          </div>
                        </div>

                        <p className="text-stone-700 leading-relaxed">
                          <strong>Surgeon's Notes:</strong> {item.healingProgressNotes}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                          <span>
                            Medications / Basti: <strong className="text-stone-700">{item.medicationsGiven}</strong>
                          </span>
                          <span>Performed by: {item.performedBy}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* MODAL: LOG NEW 1-WEEK THREAD CHANGE */}
      {showLogModal && selectedPatient && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 text-stone-900 shadow-2xl my-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div>
                <h3 className="font-serif font-black text-base text-stone-900">Log Kshara Sutra Thread Change</h3>
                <p className="text-xs text-stone-500">
                  {selectedPatient.patientName} ({selectedPatient.uhid}) · Sitting #{newSittingNumber}
                </p>
              </div>
              <button onClick={() => setShowLogModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveThreadChange} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Sitting Number</label>
                  <input
                    type="number"
                    value={newSittingNumber}
                    onChange={(e) => setNewSittingNumber(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Current Tract Length (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newTractLength}
                    onChange={(e) => setNewTractLength(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-mono font-bold text-emerald-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Kshara Sutra Thread Type</label>
                  <select
                    value={newThreadType}
                    onChange={(e) => setNewThreadType(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-medium"
                  >
                    <option value="Apamarga Kshara Sutra">Apamarga Kshara Sutra</option>
                    <option value="Snuhi Kshara Sutra">Snuhi Kshara Sutra</option>
                    <option value="Udumbara Kshara Sutra">Udumbara Kshara Sutra</option>
                    <option value="Guggulu Kshara Sutra">Guggulu Kshara Sutra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Wound Discharge Status</label>
                  <select
                    value={newDischarge}
                    onChange={(e) => setNewDischarge(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-medium"
                  >
                    <option value="Nil / Granulating">Nil / Clean Granulation</option>
                    <option value="Minimal Serous">Minimal Serous</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Purulent">Purulent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Healing Progression & Operative Notes</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Record tract cutting progression, sphincter integrity, pain score..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  Prescribed Post-Ligation Care & Medications
                </label>
                <input
                  type="text"
                  value={newMeds}
                  onChange={(e) => setNewMeds(e.target.value)}
                  placeholder="e.g. Jatyadi Taila Matra Basti, Triphala Guggulu"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900"
                  required
                />
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                <strong>Automated 1-Week Schedule:</strong> Saving this sitting will automatically register the
                patient’s next mandatory thread change for exactly 7 days from today.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white rounded-xl font-bold shadow-sm flex items-center gap-1.5"
                  style={{ backgroundColor: brandColor }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save & Schedule Next 7-Day Follow-up</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
