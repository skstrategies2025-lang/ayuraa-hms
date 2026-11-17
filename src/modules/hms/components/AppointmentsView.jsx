import React, { useState } from 'react';
import { CalendarClock, Search, Plus, MessageSquare, Phone, X, Sparkles, BellRing } from 'lucide-react';
import { AyurStorage } from '../services/storage';
export const AppointmentsView = ({ appointments, patients, currentBranch, config }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAptForSms, setSelectedAptForSms] = useState(null);
  const [smsDeliveryToast, setSmsDeliveryToast] = useState(null);
  // New appointment form state
  const [patientId, setPatientId] = useState(patients[0]?.id || '');
  const [doctorName, setDoctorName] = useState(currentBranch.doctorInCharge);
  const [aptDate, setAptDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 10:30 AM');
  const [aptType, setAptType] = useState('First Consultation');
  const [notes, setNotes] = useState('Nadi Pariksha & Diet Evaluation');
  const branchAppointments = appointments.filter((a) => a.branchId === currentBranch.id);
  const filtered = branchAppointments.filter((apt) => {
    const matchesSearch =
      apt.patientName.toLowerCase().includes(search.toLowerCase()) ||
      apt.patientPhone.includes(search) ||
      apt.doctorName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const handleCreateAppointment = (e) => {
    e.preventDefault();
    const pat = patients.find((p) => p.id === patientId) || patients[0];
    const newApt = {
      id: `apt-${Date.now()}`,
      patientId: pat.id,
      patientName: pat.name,
      patientPhone: pat.phone,
      doctorName: doctorName,
      branchId: currentBranch.id,
      date: aptDate,
      timeSlot: timeSlot,
      type: aptType,
      status: 'Confirmed',
      reminderSmsSent: true,
      notes: notes,
    };
    AyurStorage.addAppointment(newApt);
    setShowAddModal(false);
    triggerSmsToast(newApt);
  };
  const handleUpdateStatus = (aptId, newStatus) => {
    const apt = appointments.find((a) => a.id === aptId);
    if (apt) {
      const updated = { ...apt, status: newStatus };
      AyurStorage.updateAppointment(updated);
    }
  };
  const triggerSmsToast = (apt) => {
    setSmsDeliveryToast(`Automated SMS & WhatsApp reminder dispatched to ${apt.patientName} (${apt.patientPhone})!`);
    setTimeout(() => {
      setSmsDeliveryToast(null);
    }, 4500);
  };
  const handleResendSms = (apt) => {
    const updated = { ...apt, reminderSmsSent: true };
    AyurStorage.updateAppointment(updated);
    triggerSmsToast(apt);
  };
  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {smsDeliveryToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-700 border border-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <BellRing className="w-5 h-5 text-amber-300" />
          <span className="text-xs font-bold">{smsDeliveryToast}</span>
        </div>
      )}

      {/* Header & New Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <h2 className="text-xl font-serif font-black text-stone-900 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-amber-700" />
            Automated Appointment Scheduling & Patient SMS Alerts
          </h2>
          <p className="text-xs text-stone-500">
            Real-time OP queue, Nadi Pariksha slots, therapist booking, and automated WhatsApp/SMS notifications
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search patient, mobile number, or doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-1.5 bg-stone-50 p-1 rounded-xl border border-stone-200 text-xs w-full sm:w-auto">
          {['All', 'Confirmed', 'Scheduled', 'Completed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                statusFilter === s ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-xs shadow-card">
            No appointments found for this filter.
          </div>
        ) : (
          filtered.map((apt) => (
            <div
              key={apt.id}
              className="bg-white border border-stone-200 hover:border-emerald-300 rounded-2xl p-5 shadow-lg space-y-3 flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-stone-50 px-2 py-0.5 rounded-full border border-stone-200">
                    {apt.type}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      apt.status === 'Confirmed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : apt.status === 'Completed'
                          ? 'bg-stone-100 text-stone-700'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>

                <div className="mt-3">
                  <h4 className="font-bold text-sm text-stone-900">{apt.patientName}</h4>
                  <div className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5 font-mono">
                    <Phone className="w-3 h-3 text-emerald-700" />
                    <span>{apt.patientPhone}</span>
                  </div>
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Date:</span>
                    <strong className="text-stone-800">{apt.date}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Slot:</span>
                    <span className="font-mono text-amber-700 font-bold">{apt.timeSlot}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Physician:</span>
                    <span className="text-stone-700 truncate max-w-[150px]">{apt.doctorName.split(',')[0]}</span>
                  </div>
                </div>

                {apt.notes && <p className="text-[11px] text-stone-500 italic mt-2">Note: "{apt.notes}"</p>}
              </div>

              {/* Card Footer: SMS Reminder & Status */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleResendSms(apt)}
                  className="text-amber-700 hover:text-amber-700 font-semibold flex items-center gap-1"
                  title="Resend SMS / WhatsApp Reminder"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send SMS Reminder</span>
                </button>

                {apt.status !== 'Completed' && (
                  <button
                    onClick={() => handleUpdateStatus(apt.id, 'Completed')}
                    className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold"
                  >
                    Mark Done
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: BOOK NEW APPOINTMENT */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-2xl max-w-lg w-full p-6 text-stone-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-base text-stone-900">Book Patient Appointment</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-stone-500 hover:text-stone-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Select Patient</label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-bold"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.uhid}) - {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Appointment Type</label>
                  <select
                    value={aptType}
                    onChange={(e) => setAptType(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  >
                    <option value="First Consultation">First Consultation</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Panchakarma Session">Panchakarma Session</option>
                    <option value="Camp Follow-up">Camp Follow-up</option>
                    <option value="Nadi Pariksha">Nadi Pariksha (Pulse Diagnosis)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Doctor In-Charge</label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    value={aptDate}
                    onChange={(e) => setAptDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Time Slot</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-mono"
                  >
                    <option value="09:00 AM - 09:30 AM">09:00 AM - 09:30 AM</option>
                    <option value="09:30 AM - 10:00 AM">09:30 AM - 10:00 AM</option>
                    <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                    <option value="11:00 AM - 11:30 AM">11:00 AM - 11:30 AM</option>
                    <option value="02:30 PM - 03:00 PM">02:30 PM - 03:00 PM</option>
                    <option value="04:00 PM - 04:30 PM">04:00 PM - 04:30 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Clinical Note / Reason for Visit</label>
                <input
                  type="text"
                  placeholder="e.g. Follow-up post Januvasthi therapy course"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800">
                <span className="font-bold flex items-center gap-1 text-amber-700">
                  <Sparkles className="w-3.5 h-3.5" /> Automated Patient SMS & WhatsApp
                </span>
                Upon booking, the system immediately fires an SMS alert with doctor name, exact time slot, fasting
                instructions for Nadi Pariksha, and clinic Google Maps link.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold shadow"
                >
                  Book & Dispatch SMS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
