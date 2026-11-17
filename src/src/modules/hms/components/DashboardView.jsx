import React, { useState, useEffect } from 'react';
import {
  Users,
  Sparkles,
  Pill,
  CalendarClock,
  TrendingUp,
  Clock,
  Activity,
  CheckCircle2,
  Building2,
  Flame,
  FileSignature,
  UserPlus,
  Calendar,
  Check,
  Plus,
  Trash2,
  MessageSquare,
  Copy,
  Star,
  Scissors,
  Utensils,
  FileText,
  X,
  Heart,
} from 'lucide-react';
import {
  AYURVEDIC_DEPARTMENTS,
} from '../data/specializedData';
import { AyurStorage } from '../services/storage';
// Shown only when a hospital has no diet-chart templates yet
const EMPTY_DIET_TEMPLATE = {
  id: '', conditionName: 'No diet chart yet', category: '', doshaFocus: '', tagline: '', earlyMorning: '', breakfast: '', midDayDrink: '',
  lunch: '', eveningSnack: '', dinner: '', bedtime: '', pathyaDoList: [], apathyaDontList: [], ayurvedicLifestyleRules: [],
};

export const DashboardView = ({
  config,
  currentBranch,
  branches,
  patients,
  medicines,
  panchakarma,
  appointments,
  invoices,
  camps,
  onNavigate,
  onOpenNewPatient,
  onOpenNewRx,
  lang,
}) => {
  const brandColor = config.themeColor || '#0f6240';
  // Sub-tabs for Dashboard
  const [activeDashboardTab, setActiveDashboardTab] = useState('overview');
  // Doctor's Personal Notes & Scratchpad
  const [doctorNotes, setDoctorNotes] = useState(() => AyurStorage.getDoctorNotes() || '');
  const [notesSaveStatus, setNotesSaveStatus] = useState('saved');
  // Doctor's Daily To-Do List
  const [todos, setTodos] = useState(() => AyurStorage.getDoctorTodos() || []);
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoCategory, setNewTodoCategory] = useState('Patient');
  const [newTodoPriority, setNewTodoPriority] = useState('High');
  const [todoFilter, setTodoFilter] = useState('All');
  // Kshara Sutra specialized anorectal patients
  const [ksharaPatients, setKsharaPatients] = useState(
    () => AyurStorage.getKsharaSutraPatients() || []
  );
  const [selectedKsharaPatient, setSelectedKsharaPatient] = useState(null);
  const [showThreadChangeModal, setShowThreadChangeModal] = useState(false);
  const [showNewKsharaModal, setShowNewKsharaModal] = useState(false);
  // New thread change form state
  const [newSittingTractLength, setNewSittingTractLength] = useState(2.0);
  const [newSittingThreadType, setNewSittingThreadType] = useState('Apamarga Kshara Sutra');
  const [newSittingDischarge, setNewSittingDischarge] = useState('Minimal Serous');
  const [newSittingNotes, setNewSittingNotes] = useState(
    'Routine 1-week thread exchange done under local block. Previous thread loosened and replaced securely with rail-road technique.'
  );
  const [newSittingMeds, setNewSittingMeds] = useState(
    'Triphala Guggulu 2 tabs tid, Jatyadi Taila 5ml local push, Sitz bath twice daily.'
  );
  // Appointment Scheduling State
  const [branchAppointments, setBranchAppointments] = useState(appointments);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingPatientId, setBookingPatientId] = useState(patients[0]?.id || '');
  const [bookingDoctor, setBookingDoctor] = useState(currentBranch.doctorInCharge);
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bookingTimeSlot, setBookingTimeSlot] = useState('11:00 AM');
  const [bookingType, setBookingType] = useState('First Consultation');
  const [bookingNotes, setBookingNotes] = useState('');
  // Diet Chart Builder State
  const [dietTemplates, setDietTemplates] = useState(
    () => AyurStorage.getDietChartTemplates() || []
  );
  const [activeDietTemplate, setActiveDietTemplate] = useState(dietTemplates[0] || EMPTY_DIET_TEMPLATE);
  const [dietPatientId, setDietPatientId] = useState(patients[0]?.id || '');
  const [showDietModal, setShowDietModal] = useState(false);
  const [dietCopySuccess, setDietCopySuccess] = useState(false);
  // Google Review Dispatch Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewPatientId, setReviewPatientId] = useState(patients[0]?.id || '');
  const [reviewCopySuccess, setReviewCopySuccess] = useState(false);
  // Sync appointments from props
  useEffect(() => {
    setBranchAppointments(appointments.filter((a) => a.branchId === currentBranch.id));
  }, [appointments, currentBranch.id]);
  // Financial calculations
  const branchInvoices = invoices.filter((i) => i.branchId === currentBranch.id);
  const totalRevenue = branchInvoices.reduce((acc, curr) => acc + curr.grandTotal, 0);
  const pharmacyRevenue = branchInvoices.reduce((acc, curr) => {
    const pharmaItems = curr.items.filter((item) => item.category === 'Pharmacy');
    return acc + pharmaItems.reduce((sum, item) => sum + item.total, 0);
  }, 0);
  const panchakarmaRevenue = branchInvoices.reduce((acc, curr) => {
    const pkItems = curr.items.filter((item) => item.category === 'Panchakarma');
    return acc + pkItems.reduce((sum, item) => sum + item.total, 0);
  }, 0);
  // Stock calculations
  const today = new Date();
  const expiringMeds = medicines.filter((m) => {
    const exp = new Date(m.expiryDate);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 60;
  });
  const lowStockMeds = medicines.filter((m) => m.stock <= m.minReorderLevel);
  // Branch data
  const branchPatients = patients.filter((p) => p.branchId === currentBranch.id);
  const branchPanchakarma = panchakarma.filter((p) => p.branchId === currentBranch.id);
  // Dosha statistics
  const doshaCounts = {
    Vata: 0,
    Pitta: 0,
    Kapha: 0,
    'Vata-Pitta': 0,
    'Vata-Kapha': 0,
    'Pitta-Kapha': 0,
    Tridosha: 0,
  };
  patients.forEach((p) => {
    if (doshaCounts[p.prakriti] !== undefined) {
      doshaCounts[p.prakriti]++;
    } else {
      doshaCounts['Vata']++;
    }
  });
  // Kshara Sutra Thread Change Urgency Check (7-day rule)
  const threadChangesDueSoon = ksharaPatients.filter((kp) => {
    if (kp.status !== 'Active Treatment') return false;
    const dueDate = new Date(kp.nextFollowUpDate);
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  });
  // Handle Notes Auto-save
  const handleSaveNotes = (content) => {
    setDoctorNotes(content);
    setNotesSaveStatus('saving');
    AyurStorage.saveDoctorNotes(content);
    setTimeout(() => {
      setNotesSaveStatus('saved');
    }, 400);
  };
  const insertTimestampInNotes = () => {
    const now = new Date();
    const timeStr = `\n[${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] - `;
    handleSaveNotes(doctorNotes + timeStr);
  };
  // Handle To-Do actions
  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    const newTodo = {
      id: `todo-${Date.now()}`,
      text: newTodoText.trim(),
      completed: false,
      category: newTodoCategory,
      priority: newTodoPriority,
      dueDate: new Date().toISOString().split('T')[0],
    };
    const updated = [newTodo, ...todos];
    setTodos(updated);
    AyurStorage.saveDoctorTodos(updated);
    setNewTodoText('');
  };
  const handleToggleTodo = (id) => {
    const updated = todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    setTodos(updated);
    AyurStorage.saveDoctorTodos(updated);
  };
  const handleDeleteTodo = (id) => {
    const updated = todos.filter((t) => t.id !== id);
    setTodos(updated);
    AyurStorage.saveDoctorTodos(updated);
  };
  // Handle Quick Appointment Booking
  const handleBookAppointment = (e) => {
    e.preventDefault();
    const selectedPt = patients.find((p) => p.id === bookingPatientId);
    if (!selectedPt) return;
    const newApt = {
      id: `apt-${Date.now()}`,
      patientId: selectedPt.id,
      patientName: selectedPt.name,
      patientPhone: selectedPt.phone,
      doctorName: bookingDoctor,
      branchId: currentBranch.id,
      date: bookingDate,
      timeSlot: bookingTimeSlot,
      status: 'Scheduled',
      type: bookingType,
      reminderSmsSent: true,
      notes: bookingNotes || 'Booked via Vaidya Dashboard Station',
    };
    AyurStorage.addAppointment(newApt);
    setBranchAppointments([newApt, ...branchAppointments]);
    setShowBookingModal(false);
    setBookingNotes('');
  };
  // Handle Recording a 1-Week Thread Change
  const handleRecordThreadChange = (e) => {
    e.preventDefault();
    if (!selectedKsharaPatient) return;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 7); // Exactly 7 days for next thread change
    const newSitting = {
      id: `tc-${Date.now()}`,
      sittingNumber: selectedKsharaPatient.currentSitting + 1,
      date: new Date().toISOString().split('T')[0],
      tractLengthCm: newSittingTractLength,
      threadType: newSittingThreadType,
      dischargeStatus: newSittingDischarge,
      healingProgressNotes: newSittingNotes,
      medicationsGiven: newSittingMeds,
      nextSittingDueDate: nextDate.toISOString().split('T')[0],
      performedBy: currentBranch.doctorInCharge,
    };
    const isCutThrough = newSittingTractLength <= 0.2;
    const updatedPatient = {
      ...selectedKsharaPatient,
      currentTractLengthCm: newSittingTractLength,
      currentSitting: selectedKsharaPatient.currentSitting + 1,
      status: isCutThrough ? 'Complete Healing / Cut-Through' : 'Active Treatment',
      nextFollowUpDate: nextDate.toISOString().split('T')[0],
      threadHistory: [newSitting, ...selectedKsharaPatient.threadHistory],
    };
    const updatedList = ksharaPatients.map((p) => (p.id === updatedPatient.id ? updatedPatient : p));
    setKsharaPatients(updatedList);
    AyurStorage.saveKsharaSutraPatients(updatedList);
    setSelectedKsharaPatient(updatedPatient);
    setShowThreadChangeModal(false);
  };
  // Diet Chart WhatsApp text generator
  const getDietChartWhatsAppText = (pt, diet) => {
    return `*${config.hospitalName.toUpperCase()} - AYURVEDIC PATHYA AHARA (DIET CHART)*
Patient: *${pt.name}* (UHID: *${pt.uhid}*, Prakriti: *${pt.prakriti}*)
Condition: *${diet.conditionName}*
Vaidya In-Charge: *${currentBranch.doctorInCharge}*

🌿 *TIMED DAILY REGIMEN:*
• *Early Morning:* ${diet.earlyMorning}
• *Breakfast:* ${diet.breakfast}
• *Mid-Day Drink:* ${diet.midDayDrink}
• *Lunch:* ${diet.lunch}
• *Evening:* ${diet.eveningSnack}
• *Dinner (before 7:30 PM):* ${diet.dinner}
• *Bedtime:* ${diet.bedtime}

✅ *PATHYA (FOODS TO FAVOR):*
${diet.pathyaDoList.map((item) => `• ${item}`).join('\n')}

❌ *APATHYA (STRICTLY AVOID):*
${diet.apathyaDontList.map((item) => `• ${item}`).join('\n')}

🧘 *LIFESTYLE & SWASTHAVRITTA:*
${diet.ayurvedicLifestyleRules.map((item) => `• ${item}`).join('\n')}

📞 Clinic Support: ${config.supportPhone || '+91 98450 12000'}
Wishing you vibrant health & Arogya! 🙏
— *${config.hospitalName}*`;
  };
  // Google Review WhatsApp text generator
  const getReviewWhatsAppText = (pt) => {
    const reviewUrl =
      config.googleReviewUrl ||
      `https://g.page/r/${encodeURIComponent(config.hospitalName.toLowerCase().replace(/\s+/g, '-'))}/review`;
    return `Namaste ${pt.name} ji 🙏

Thank you for visiting *${config.hospitalName}* today for your consultation with *${currentBranch.doctorInCharge}*. We are dedicated to providing you authentic classical Ayurvedic care.

If you had a comfortable experience, could you please take 30 seconds to support us with a Google review?
👉 ${reviewUrl}

Your kind words inspire our healers and help other patients discover natural holistic recovery.

Wishing you optimal Swasthya & Arogya!
— *${config.hospitalName}*`;
  };
  const copyText = (text, isDiet = false) => {
    navigator.clipboard.writeText(text);
    if (isDiet) {
      setDietCopySuccess(true);
      setTimeout(() => setDietCopySuccess(false), 2500);
    } else {
      setReviewCopySuccess(true);
      setTimeout(() => setReviewCopySuccess(false), 2500);
    }
  };
  const targetDietPatient = patients.find((p) => p.id === dietPatientId) || patients[0];
  const targetReviewPatient = patients.find((p) => p.id === reviewPatientId) || patients[0];
  return (
    <div className="space-y-6">
      {/* 1. WELCOME HERO + INSTANT CLINICAL ACTIONS (same look as the Super Admin "Platform Overview" card) */}
      <div className="hero-card relative overflow-hidden rounded-2xl p-6 text-white shadow-hero lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
          <div className="min-w-0 xl:max-w-[560px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.35em] text-white/70">Hospital Overview</p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'},
              <br />
              {currentBranch.doctorInCharge || config.hospitalName}!
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/85">
              {config.hospitalName} · {currentBranch.name}. Monitor today&apos;s OPD, Panchakarma sessions and pharmacy stock, and keep every
              patient&apos;s care on track from one place.
            </p>

            {/* High-frequency action buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <button
                onClick={onOpenNewPatient}
                className="flex items-center gap-2 rounded-lg bg-saffron-400 px-4 py-3 text-sm font-bold text-brand-950 shadow-sm transition hover:bg-saffron-500 active:scale-95"
                title="Register new patient and generate auto UHID"
              >
                <UserPlus className="h-4 w-4" />
                <span>New Patient</span>
              </button>
              <button
                onClick={onOpenNewRx}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-bold text-brand-900 shadow-sm transition hover:bg-brand-50 active:scale-95"
                title="Open Clinical Note Templates & Rx Station"
              >
                <FileSignature className="h-4 w-4 text-brand-700" />
                <span>Consult & Rx</span>
              </button>
              <button
                onClick={() => setShowBookingModal(true)}
                className="flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3.5 py-3 text-sm font-semibold text-white transition hover:bg-white/20 active:scale-95"
                title="Schedule an appointment for a patient"
              >
                <Calendar className="h-4 w-4" />
                <span>Book Appointment</span>
              </button>
              <button
                onClick={() => setShowDietModal(true)}
                className="flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3.5 py-3 text-sm font-semibold text-white transition hover:bg-white/20 active:scale-95"
                title="Generate customized disease diet chart"
              >
                <Utensils className="h-4 w-4" />
                <span>Diet Chart Builder</span>
              </button>
              <button
                onClick={() => setShowReviewModal(true)}
                className="flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3.5 py-3 text-sm font-semibold text-white transition hover:bg-white/20 active:scale-95"
                title="Send Google Review invite to patient via WhatsApp"
              >
                <Star className="h-4 w-4 text-saffron-400" />
                <span>Google Review Link</span>
              </button>
            </div>
          </div>

          {/* Live status tiles */}
          {(() => {
            const todayStr = new Date().toISOString().split('T')[0];
            const todayAppts = branchAppointments.filter((a) => a.date === todayStr).length;
            const activeSessions = branchPanchakarma.filter((p) => p.status === 'In Progress').length;
            const stockAlerts = new Set([...expiringMeds, ...lowStockMeds].map((m) => m.id)).size;
            const tiles = [
              { label: "Today's Appointments", value: todayAppts, note: `${currentBranch.name}`, ok: true },
              { label: 'Active Panchakarma', value: activeSessions, note: `${currentBranch.activePanchakarmaRooms ?? 0} rooms available`, ok: true },
              { label: 'Pharmacy Alerts', value: stockAlerts, note: stockAlerts > 0 ? 'Expiry / low stock' : 'All stock healthy', ok: stockAlerts === 0 },
            ];
            return (
              <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3 xl:w-[560px]">
                {tiles.map((t) => (
                  <div key={t.label} className="rounded-xl border border-white/15 bg-white/10 p-4">
                    <p className="text-[13px] font-medium text-white/90">{t.label}</p>
                    <p className="mt-1.5 flex items-center gap-2 text-3xl font-extrabold tracking-tight">
                      <span className={`h-2 w-2 rounded-full ${t.ok ? 'bg-emerald-400' : 'bg-saffron-400'}`} />
                      {t.value}
                    </p>
                    <p className="mt-1 truncate text-[12px] text-white/65">{t.note}</p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* 2. MODULAR HIGH-IMPACT STATISTIC TILES (SCANNABLE FOR CLINIC OWNERS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* KPI 1: Patient Census */}
        <div
          onClick={() => onNavigate('patients')}
          className="bg-white border border-stone-200 rounded-2xl p-4 shadow-card hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Patient Dossiers</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 tabular-nums">{branchPatients.length}</span>
            <span className="text-[11px] text-emerald-700 font-semibold">+14% MoM</span>
          </div>
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>
              OPD: <strong>{branchPatients.filter((p) => p.admissionStatus.includes('OPD')).length}</strong>
            </span>
            <span>
              IPD: <strong>{branchPatients.filter((p) => p.admissionStatus.includes('IPD')).length}</strong>
            </span>
          </div>
        </div>

        {/* KPI 2: Kshara Sutra Anorectal Cases */}
        <div
          onClick={() => setActiveDashboardTab('ksharasutra')}
          className="bg-white border border-stone-200 rounded-2xl p-4 shadow-card hover:shadow-md cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden"
        >
          {threadChangesDueSoon.length > 0 && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Kshara Sutra</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 tabular-nums">{ksharaPatients.length}</span>
            <span className="text-[11px] text-stone-500">Piles & Fistula</span>
          </div>
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
            <span className="text-amber-800 font-bold">{threadChangesDueSoon.length} Thread Due</span>
            <span className="text-stone-400">1-Wk Cycle</span>
          </div>
        </div>

        {/* KPI 3: Panchakarma Occupancy */}
        <div
          onClick={() => onNavigate('panchakarma')}
          className="bg-white border border-stone-200 rounded-2xl p-4 shadow-card hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Panchakarma</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 tabular-nums">
              {branchPanchakarma.filter((p) => p.status === 'In Progress').length}
            </span>
            <span className="text-[11px] text-amber-800 font-semibold">Active Sessions</span>
          </div>
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>{currentBranch.activePanchakarmaRooms} Rooms</span>
            <span className="text-emerald-700 font-bold">100% Full</span>
          </div>
        </div>

        {/* KPI 4: Today's Appointments */}
        <div
          onClick={() => setShowBookingModal(true)}
          className="bg-white border border-stone-200 rounded-2xl p-4 shadow-card hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Consultations</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 tabular-nums">
              {branchAppointments.length}
            </span>
            <span className="text-[11px] text-stone-500">Scheduled</span>
          </div>
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span className="text-emerald-700 font-semibold">
              {branchAppointments.filter((a) => a.status === 'Completed').length} Seen
            </span>
            <span className="text-indigo-700 font-semibold">+ Schedule</span>
          </div>
        </div>

        {/* KPI 5: Pharmacy & Expiry Warning */}
        <div
          onClick={() => onNavigate('pharmacy')}
          className="bg-white border border-stone-200 rounded-2xl p-4 shadow-card hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Pharmacy</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 tabular-nums">{medicines.length}</span>
            <span className="text-[11px] text-stone-500">Medicines</span>
          </div>
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
            <span className="text-red-700 font-bold">{expiringMeds.length} Expiring</span>
            <span className="text-amber-700 font-bold">{lowStockMeds.length} Low Stock</span>
          </div>
        </div>

        {/* KPI 6: Hospital Revenue */}
        <div
          onClick={() => onNavigate('billing')}
          className="bg-white border border-stone-200 rounded-2xl p-4 shadow-card hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 tabular-nums">
              ₹{(totalRevenue / 1000).toFixed(1)}k
            </span>
            <span className="text-[11px] text-purple-700 font-semibold">Live Branch</span>
          </div>
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>Pharma: ₹{(pharmacyRevenue / 1000).toFixed(0)}k</span>
            <span>PK: ₹{(panchakarmaRevenue / 1000).toFixed(0)}k</span>
          </div>
        </div>
      </div>

      {/* 3. DASHBOARD SUB-NAVIGATION BAR (CLEAN VIEW TOGGLE) */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveDashboardTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
            activeDashboardTab === 'overview'
              ? 'bg-stone-900 text-white shadow-sm'
              : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Clinical Operations & Daily Flow</span>
        </button>

        <button
          onClick={() => setActiveDashboardTab('ksharasutra')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
            activeDashboardTab === 'ksharasutra'
              ? 'bg-red-700 text-white shadow-sm'
              : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
          }`}
        >
          <Scissors className="w-3.5 h-3.5 text-red-500" />
          <span>Kshara Sutra Tracker (Piles / Fistula 1-Wk Follow-up)</span>
          {threadChangesDueSoon.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-red-100 text-red-900 font-bold">
              {threadChangesDueSoon.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveDashboardTab('dietchart')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
            activeDashboardTab === 'dietchart'
              ? 'bg-amber-700 text-white shadow-sm'
              : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
          }`}
        >
          <Utensils className="w-3.5 h-3.5 text-amber-500" />
          <span>Ayurvedic Diet Chart (Pathya) Builder</span>
        </button>

        <button
          onClick={() => setActiveDashboardTab('departments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
            activeDashboardTab === 'departments'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Ayurvedic Departments (Ashtanga)</span>
        </button>
      </div>

      {/* 4. MAIN CONTENT AREA ACCORDING TO ACTIVE SUB-TAB */}

      {/* ================= VIEW 1: OVERVIEW & DAILY CLINICAL STATION ================= */}
      {activeDashboardTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Today's Appointments & Kshara Sutra Urgent Queue */}
          <div className="lg:col-span-7 space-y-6">
            {/* CARD A: Today's Consultations & Appointments with WhatsApp Actions */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-indigo-600" />
                    Patient Consultations & Walk-In Queue Today
                  </h3>
                  <p className="text-xs text-stone-500">
                    Live outpatient schedule, status indicators, and 1-click WhatsApp follow-ups
                  </p>
                </div>
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Schedule Patient</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {branchAppointments.length === 0 ? (
                  <div className="p-8 text-center text-stone-400 text-xs">
                    No appointments scheduled for this branch today. Click "Schedule Patient" above.
                  </div>
                ) : (
                  branchAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex flex-col items-center justify-center shrink-0 font-mono font-bold text-[11px]">
                          <span>{apt.timeSlot.split(' ')[0]}</span>
                          <span className="text-[9px] font-normal">{apt.timeSlot.split(' ')[1] || 'AM'}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-sm">{apt.patientName}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                apt.status === 'Completed'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : apt.status === 'Confirmed'
                                    ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                                    : 'bg-stone-100 text-stone-700 border-stone-300'
                              }`}
                            >
                              {apt.status}
                            </span>
                          </div>
                          <div className="text-stone-500 text-[11px] mt-0.5 flex flex-wrap gap-2">
                            <span>
                              Type: <strong>{apt.type}</strong>
                            </span>
                            <span>·</span>
                            <span>
                              Dr: <strong>{apt.doctorName.split(',')[0]}</strong>
                            </span>
                            {apt.patientPhone && (
                              <>
                                <span>·</span>
                                <span className="font-mono">{apt.patientPhone}</span>
                              </>
                            )}
                          </div>
                          {apt.notes && <p className="text-[11px] text-stone-500 mt-1 italic">"{apt.notes}"</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => {
                            const found = patients.find((p) => p.id === apt.patientId || p.name === apt.patientName);
                            if (found) {
                              onOpenNewRx();
                            } else {
                              onOpenNewRx();
                            }
                          }}
                          className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
                          title="Open prescription builder"
                        >
                          <FileSignature className="w-3.5 h-3.5" />
                          <span>Consult</span>
                        </button>

                        <button
                          onClick={() => {
                            setReviewPatientId(apt.patientId || patients[0]?.id);
                            setShowReviewModal(true);
                          }}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 transition-all"
                          title="Send Google Review invite via WhatsApp"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
                        </button>

                        {apt.patientPhone && (
                          <a
                            href={`https://wa.me/${apt.patientPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Namaste ${apt.patientName} ji 🙏 This is a reminder for your Ayurvedic appointment today at ${config.hospitalName} at ${apt.timeSlot} with ${apt.doctorName}. Please arrive 10 minutes prior.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 transition-all"
                            title="Send WhatsApp appointment reminder"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* CARD B: Kshara Sutra Anorectal Urgent 1-Week Follow-Up Highlights */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-red-600" />
                      Kshara Sutra 1-Week Thread Change Due Tracking (Shalya Tantra)
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                      7-Day Clinical Rule
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Track fistulous tract cut-through, granulation progress, and exchange schedule
                  </p>
                </div>

                <button
                  onClick={() => setActiveDashboardTab('ksharasutra')}
                  className="text-xs font-bold hover:underline"
                  style={{ color: brandColor }}
                >
                  Full Unit →
                </button>
              </div>

              <div className="space-y-3">
                {ksharaPatients.map((kp) => {
                  const dueDate = new Date(kp.nextFollowUpDate);
                  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const isUrgent = diffDays <= 3;
                  const cutProgress = Math.round(
                    ((kp.initialTractLengthCm - kp.currentTractLengthCm) / kp.initialTractLengthCm) * 100
                  );
                  return (
                    <div
                      key={kp.id}
                      className="p-4 rounded-2xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-sm">{kp.patientName}</span>
                          <span className="font-mono text-[10px] text-stone-500">({kp.uhid})</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isUrgent ? 'bg-red-100 text-red-900 border-red-300' : 'bg-stone-100 text-stone-700 border-stone-300'}`}
                          >
                            {diffDays <= 0 ? 'Due Today!' : diffDays === 1 ? 'Due Tomorrow' : `Due in ${diffDays} days`}
                          </span>
                        </div>
                        <div className="text-stone-600 font-medium text-[11px]">
                          Diagnosis: <strong className="text-stone-900">{kp.diagnosis}</strong>
                        </div>
                        <div className="text-stone-500 text-[11px] flex flex-wrap gap-2">
                          <span>
                            Sitting:{' '}
                            <strong>
                              #{kp.currentSitting} of {kp.totalEstimatedSittings}
                            </strong>
                          </span>
                          <span>·</span>
                          <span>
                            Tract: <strong>{kp.currentTractLengthCm} cm</strong> (was {kp.initialTractLengthCm} cm)
                          </span>
                          <span>·</span>
                          <span className="text-emerald-700 font-bold">{cutProgress}% Cut-Through</span>
                        </div>
                      </div>

                      {/* Cut-through Progress Bar & Action */}
                      <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                        <div className="text-right w-24">
                          <div className="text-[10px] text-stone-500">Cutting Progress</div>
                          <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full rounded-full transition-all bg-emerald-600"
                              style={{ width: `${Math.min(100, Math.max(5, cutProgress))}%` }}
                            ></div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedKsharaPatient(kp);
                            setNewSittingTractLength(Math.max(0.2, +(kp.currentTractLengthCm - 0.9).toFixed(1)));
                            setShowThreadChangeModal(true);
                          }}
                          className="px-3 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
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

            {/* CARD C: Ashtanga Classical Ayurvedic Departments Overview */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-700" />
                    Specialized Ayurvedic Clinical Departments
                  </h3>
                  <p className="text-xs text-stone-500">
                    Core classical divisions according to Sushruta & Charaka Samhitas
                  </p>
                </div>
                <button
                  onClick={() => setActiveDashboardTab('departments')}
                  className="text-xs font-bold hover:underline"
                  style={{ color: brandColor }}
                >
                  View All Departments →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AYURVEDIC_DEPARTMENTS.slice(0, 4).map((dept) => (
                  <div
                    key={dept.id}
                    className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/60 hover:bg-stone-50 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-serif font-bold text-stone-900 text-sm block">{dept.sanskritName}</span>
                        <span className="text-[11px] text-stone-500">{dept.englishName}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {dept.activeCasesCount} Active
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-600 line-clamp-1">
                      <strong>Procedures:</strong> {dept.coreProcedures.slice(0, 2).join(', ')}
                    </div>

                    <div className="text-[10px] text-stone-400 flex items-center justify-between pt-1 border-t border-stone-200/60">
                      <span>HOD: {dept.hodName.split(',')[0]}</span>
                      <span>{dept.opdTimings.split('&')[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Doctor's Scratchpad, Daily To-Do List, Review Dispatch & Dosha Census */}
          <div className="lg:col-span-5 space-y-6">
            {/* CARD 1: Doctor's Daily To-Do List */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Doctor's Daily Action & Ward To-Do List
                  </h3>
                  <p className="text-xs text-stone-500">
                    {todos.filter((t) => t.completed).length} of {todos.length} completed
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {['All', 'Pending', 'Completed'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setTodoFilter(f)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold ${todoFilter === f ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-100'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add New Task Form */}
              <form onSubmit={handleAddTodo} className="flex gap-2">
                <input
                  type="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  placeholder="Add new task (e.g. Kshara Sutra thread change, Vamana review)..."
                  className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>

              {/* Tasks List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {todos
                  .filter((t) => {
                    if (todoFilter === 'Pending') return !t.completed;
                    if (todoFilter === 'Completed') return t.completed;
                    return true;
                  })
                  .map((todo) => (
                    <div
                      key={todo.id}
                      className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 text-xs ${todo.completed ? 'bg-stone-50 border-stone-200 opacity-60' : 'bg-white border-stone-200 hover:border-stone-300'}`}
                    >
                      <div className="flex items-start gap-2.5 flex-1">
                        <button
                          onClick={() => handleToggleTodo(todo.id)}
                          className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-all ${todo.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300 hover:border-emerald-600'}`}
                        >
                          {todo.completed && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                        <div className="flex-1">
                          <p className={`text-stone-800 ${todo.completed ? 'line-through text-stone-400' : ''}`}>
                            {todo.text}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px]">
                            <span
                              className={`px-1.5 py-0.2 rounded font-semibold ${
                                todo.category === 'Procedure'
                                  ? 'bg-red-50 text-red-700'
                                  : todo.category === 'Pharmacy'
                                    ? 'bg-blue-50 text-blue-700'
                                    : todo.category === 'Patient'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {todo.category}
                            </span>
                            {todo.dueDate && <span className="text-stone-400 font-mono">Due: {todo.dueDate}</span>}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="text-stone-300 hover:text-red-600 p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* CARD 2: Doctor's Personal Clinical Notes & Scratchpad */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-stone-900 text-sm">Doctor's Personal Scratchpad & Clinical Notes</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-stone-400 font-mono">
                    {notesSaveStatus === 'saved' ? '✓ Auto-Saved' : 'Saving...'}
                  </span>
                  <button
                    onClick={insertTimestampInNotes}
                    className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[10px] font-semibold border border-stone-200 flex items-center gap-1"
                    title="Insert current date & time stamp"
                  >
                    <Clock className="w-3 h-3 text-stone-500" />
                    <span>Timestamp</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-stone-500">
                Private digital scratchpad for quick observations, bedside handover points, and drug formulas. Stored
                securely in your clinic database.
              </p>

              <textarea
                value={doctorNotes}
                onChange={(e) => handleSaveNotes(e.target.value)}
                rows={6}
                placeholder="Type doctor's confidential clinical impressions, daily ward rounds, or medicine reminders..."
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs text-stone-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600 leading-relaxed"
              />

              <div className="flex items-center justify-between text-[11px] text-stone-400">
                <span>{doctorNotes.length} characters</span>
                <button onClick={() => handleSaveNotes('')} className="hover:text-red-600 transition-colors">
                  Clear Notes
                </button>
              </div>
            </div>

            {/* CARD 3: Instant Google Review WhatsApp Dispatch Card */}
            <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 border border-amber-200/80 rounded-2xl p-6 shadow space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span>Google Review Request on WhatsApp</span>
                </div>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                  Post-Consult
                </span>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                Immediately send your clinic's Google Review rating link to any patient after their consultation to
                build authentic 5-star reputation.
              </p>

              <div className="flex items-center gap-2">
                <select
                  value={reviewPatientId}
                  onChange={(e) => setReviewPatientId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 focus:outline-none"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setShowReviewModal(true)}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm shrink-0 flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Preview & Send</span>
                </button>
              </div>
            </div>

            {/* CARD 4: Prakriti Tridosha Census Card */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-600" />
                  Prakriti Census (Patient Dosha Distribution)
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                {Object.entries(doshaCounts).map(([dosha, count]) => {
                  const total = patients.length || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={dosha} className="space-y-1">
                      <div className="flex justify-between text-stone-700">
                        <span className="font-medium">{dosha} Predominance</span>
                        <span className="font-mono font-bold">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: dosha.includes('Vata')
                              ? '#0284c7'
                              : dosha.includes('Pitta')
                                ? '#dc2626'
                                : '#16a34a',
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: KSHARA SUTRA SPECIALIZED UNIT ================= */}
      {activeDashboardTab === 'ksharasutra' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-200">Shalya Tantra Anorectal Department
                </span>
                <span className="text-xs text-stone-500 font-mono">NABH Compliant Kshara Sutra Care</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-stone-900 tracking-tight">
                Kshara Sutra Management (Piles, Fistula & Pilonidal Sinus)
              </h2>
              <p className="text-xs text-stone-600 mt-1 max-w-2xl">
                Track sequential 1-week thread exchange cycles, monitor fistulous tract length shortening in
                centimeters, record local pain scores, and administer Jatyadi Taila & Sitz bath post-operative
                protocols.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewKsharaModal(true)}
                className="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Register New Kshara Sutra Patient</span>
              </button>
            </div>
          </div>

          {/* Active Patients Roster */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {ksharaPatients.map((kp) => {
              const cutProgress = Math.round(
                ((kp.initialTractLengthCm - kp.currentTractLengthCm) / kp.initialTractLengthCm) * 100
              );
              const dueDate = new Date(kp.nextFollowUpDate);
              const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div
                  key={kp.id}
                  className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-stone-900 text-base">{kp.patientName}</h3>
                        <p className="text-xs text-stone-500 font-mono">
                          {kp.uhid} · {kp.age}y/{kp.gender}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          kp.status.includes('Complete')
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : diffDays <= 2
                              ? 'bg-red-100 text-red-900 border-red-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                      >
                        {kp.status}
                      </span>
                    </div>

                    <div className="p-3 bg-red-50/60 border border-red-100 rounded-2xl text-xs space-y-1">
                      <div className="text-red-950 font-bold">{kp.diagnosis}</div>
                      {kp.fistulaType && <div className="text-red-700 text-[11px]">Type: {kp.fistulaType}</div>}
                    </div>

                    {/* Progress details */}
                    <div className="space-y-1.5 pt-2 text-xs">
                      <div className="flex justify-between text-stone-600">
                        <span>Tract Shortening:</span>
                        <span className="font-mono font-bold text-stone-900">
                          {kp.currentTractLengthCm} cm / {kp.initialTractLengthCm} cm
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all bg-emerald-600"
                          style={{ width: `${Math.min(100, Math.max(5, cutProgress))}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[11px] text-stone-500">
                        <span>
                          Sitting #{kp.currentSitting} of ~{kp.totalEstimatedSittings}
                        </span>
                        <span className="text-emerald-700 font-bold">{cutProgress}% Cut</span>
                      </div>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] space-y-1">
                      <div className="text-stone-500">Next 1-Week Thread Change:</div>
                      <div className="font-bold text-stone-900 flex items-center justify-between">
                        <span>📅 {kp.nextFollowUpDate}</span>
                        <span className="text-red-700">
                          {diffDays <= 0 ? 'Due Today!' : diffDays === 1 ? 'Due Tomorrow' : `In ${diffDays} days`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedKsharaPatient(kp);
                        setNewSittingTractLength(Math.max(0.2, +(kp.currentTractLengthCm - 0.9).toFixed(1)));
                        setShowThreadChangeModal(true);
                      }}
                      className="flex-1 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Log Thread Change</span>
                    </button>

                    <button
                      onClick={() => setSelectedKsharaPatient(kp)}
                      className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold border border-stone-200"
                      title="View all sittings history"
                    >
                      History ({kp.threadHistory.length})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sittings History Table for Selected Patient */}
          {selectedKsharaPatient && (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-red-600" />
                    Sittings & Cut-Through History for {selectedKsharaPatient.patientName} ({selectedKsharaPatient.uhid}
                    )
                  </h3>
                  <p className="text-xs text-stone-500">
                    Chronological record of every 1-week thread change, medicated thread applied, and tissue response
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewSittingTractLength(
                      Math.max(0.2, +(selectedKsharaPatient.currentTractLengthCm - 0.9).toFixed(1))
                    );
                    setShowThreadChangeModal(true);
                  }}
                  className="px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Record New Sitting #{selectedKsharaPatient.currentSitting + 1}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Sitting #</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Tract Length</th>
                      <th className="py-2.5 px-3">Thread Formulation</th>
                      <th className="py-2.5 px-3">Discharge Status</th>
                      <th className="py-2.5 px-3">Clinical Healing Notes</th>
                      <th className="py-2.5 px-3">Medications & Dressings</th>
                      <th className="py-2.5 px-3">Vaidya</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-800">
                    {selectedKsharaPatient.threadHistory.map((th) => (
                      <tr key={th.id} className="hover:bg-stone-50/70">
                        <td className="py-3 px-3 font-mono font-bold text-red-800">Sitting #{th.sittingNumber}</td>
                        <td className="py-3 px-3 font-mono text-stone-500">{th.date}</td>
                        <td className="py-3 px-3 font-mono font-bold text-stone-900">{th.tractLengthCm} cm</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-900 border border-red-200">
                            {th.threadType}
                          </span>
                        </td>
                        <td className="py-3 px-3">{th.dischargeStatus}</td>
                        <td className="py-3 px-3 max-w-xs">{th.healingProgressNotes}</td>
                        <td className="py-3 px-3 max-w-xs text-stone-600 font-mono text-[11px]">
                          {th.medicationsGiven}
                        </td>
                        <td className="py-3 px-3 text-stone-500">{th.performedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 3: AYURVEDIC DIET CHART (PATHYA) BUILDER ================= */}
      {activeDashboardTab === 'dietchart' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">Pathya Ahara Builder
                </span>
                <span className="text-xs text-stone-500 font-mono">Fast WhatsApp Patient Dispatch</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-stone-900 tracking-tight">
                Disease-Specific Customized Ayurvedic Diet Charts
              </h2>
              <p className="text-xs text-stone-600 mt-1 max-w-2xl">
                Pre-configured classical nutritional templates for Piles/Fistula (Arshas), Arthritis (Sandhigata Vata),
                Acid Reflux (Amlapitta), Diabetes (Prameha), and Psoriasis. Edit seamlessly and send directly to your
                patient's WhatsApp with your hospital branding.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  copyText(getDietChartWhatsAppText(targetDietPatient, activeDietTemplate), true);
                }}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold border border-stone-300 flex items-center gap-1.5 transition-all"
              >
                <Copy className="w-4 h-4 text-stone-600" />
                <span>{dietCopySuccess ? '✓ Copied to Clipboard!' : 'Copy Diet Text'}</span>
              </button>

              <a
                href={`https://wa.me/${targetDietPatient.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(getDietChartWhatsAppText(targetDietPatient, activeDietTemplate))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send via WhatsApp to {targetDietPatient.name.split(' ')[0]}</span>
              </a>
            </div>
          </div>

          {/* Quick Disease Template Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {dietTemplates.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => setActiveDietTemplate(tmpl)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                  activeDietTemplate.id === tmpl.id
                    ? 'bg-amber-800 text-white shadow-sm'
                    : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>{tmpl.conditionName.split('(')[0]}</span>
              </button>
            ))}
          </div>

          {/* Main Diet Chart Canvas & Patient Assignment */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 4 cols: Patient selector & Summary */}
            <div className="lg:col-span-4 bg-white border border-stone-200 rounded-2xl p-6 shadow-card space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  Select Recipient Patient
                </span>
                <select
                  value={dietPatientId}
                  onChange={(e) => setDietPatientId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 font-bold focus:outline-none"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.uhid}) - {p.prakriti}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-500">UHID:</span>
                  <span className="font-mono font-bold text-stone-900">{targetDietPatient.uhid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Prakriti:</span>
                  <span className="font-bold text-emerald-800">{targetDietPatient.prakriti}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Phone:</span>
                  <span className="font-mono text-stone-700">{targetDietPatient.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Dosha Focus:</span>
                  <span className="font-bold text-amber-800">{activeDietTemplate.doshaFocus}</span>
                </div>
              </div>

              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs space-y-2">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ayurvedic Nutrition Philosophy</span>
                </div>
                <p className="text-stone-600 text-[11px] leading-relaxed">
                  "Pathye sati gadartasya kim aushadha nishevanai? Pathye asati gadartasya kim aushadha nishevanai?" —
                  When wholesome diet is followed, medicine is minimal; when unwholesome diet is taken, medicine is
                  useless.
                </p>
              </div>

              <a
                href={`https://wa.me/${targetDietPatient.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(getDietChartWhatsAppText(targetDietPatient, activeDietTemplate))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all block text-center"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send to WhatsApp Now</span>
              </a>
            </div>

            {/* Right 8 cols: Timed Meal Plan & Pathya / Apathya Table */}
            <div className="lg:col-span-8 bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
              <div className="border-b border-stone-200 pb-4">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {activeDietTemplate.category}
                </span>
                <h3 className="text-xl font-serif font-black text-stone-900 mt-1">
                  {activeDietTemplate.conditionName}
                </h3>
                <p className="text-xs text-stone-500 italic mt-0.5">{activeDietTemplate.tagline}</p>
              </div>

              {/* Timed Meal Schedule */}
              <div className="space-y-3">
                <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Timed Ahara Dinacharya (Daily Meal Plan)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                    <span className="font-bold text-stone-700 block text-[11px]">🌅 Early Morning (6:30 AM):</span>
                    <p className="text-stone-600 text-[11px] mt-1">{activeDietTemplate.earlyMorning}</p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                    <span className="font-bold text-stone-700 block text-[11px]">🥣 Breakfast (8:30 AM):</span>
                    <p className="text-stone-600 text-[11px] mt-1">{activeDietTemplate.breakfast}</p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                    <span className="font-bold text-stone-700 block text-[11px]">🥛 Mid-Day Hydration (11:30 AM):</span>
                    <p className="text-stone-600 text-[11px] mt-1">{activeDietTemplate.midDayDrink}</p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                    <span className="font-bold text-stone-700 block text-[11px]">🍲 Lunch (1:00 PM):</span>
                    <p className="text-stone-600 text-[11px] mt-1">{activeDietTemplate.lunch}</p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                    <span className="font-bold text-stone-700 block text-[11px]">
                      🍵 Evening Refreshment (5:00 PM):
                    </span>
                    <p className="text-stone-600 text-[11px] mt-1">{activeDietTemplate.eveningSnack}</p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                    <span className="font-bold text-stone-700 block text-[11px]">🌙 Light Dinner (by 7:30 PM):</span>
                    <p className="text-stone-600 text-[11px] mt-1">{activeDietTemplate.dinner}</p>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-200 text-xs">
                  <span className="font-bold text-indigo-900 block text-[11px]">🛌 Bedtime (Nishi Kala):</span>
                  <p className="text-stone-700 text-[11px] mt-0.5">{activeDietTemplate.bedtime}</p>
                </div>
              </div>

              {/* Pathya vs Apathya 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Pathya (Do's) */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Pathya (Foods to Favor)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-stone-700">
                    {activeDietTemplate.pathyaDoList.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Apathya (Don'ts) */}
                <div className="p-4 bg-red-50/70 border border-red-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-red-900 font-bold text-xs uppercase tracking-wider">
                    <X className="w-4 h-4 text-red-600" />
                    <span>Apathya (Strictly Forbidden)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-stone-700">
                    {activeDietTemplate.apathyaDontList.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-red-600 font-bold">✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Lifestyle Rules */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <span className="font-bold text-stone-800 text-xs uppercase tracking-wider block">
                  Swasthavritta Lifestyle Rules (Vihara):
                </span>
                <ul className="space-y-1 text-xs text-stone-600">
                  {activeDietTemplate.ayurvedicLifestyleRules.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-600 font-bold">✦</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 4: AYURVEDIC DEPARTMENTS (ASHTANGA) ================= */}
      {activeDashboardTab === 'departments' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">Eight Classical Clinical Specialties
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-stone-900 tracking-tight">
                Ayurvedic Specialized Departments Roster
              </h2>
              <p className="text-xs text-stone-600 mt-1 max-w-2xl">
                Comprehensive departmental administration, Head of Department (HOD) Vaidyas, core therapeutic
                procedures, OPD timings, and active inpatient/outpatient census.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {AYURVEDIC_DEPARTMENTS.map((dept) => (
              <div
                key={dept.id}
                className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-100 text-stone-600">
                        {dept.shortCode}
                      </span>
                      <h3 className="font-serif font-black text-stone-900 text-lg mt-1">{dept.sanskritName}</h3>
                      <p className="text-xs text-stone-500 font-medium">{dept.englishName}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {dept.activeCasesCount} Cases
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">{dept.description}</p>

                  <div className="space-y-1.5 pt-2 border-t border-stone-100 text-xs">
                    <span className="font-bold text-stone-800 text-[11px] block">Core Classical Procedures:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {dept.coreProcedures.map((proc, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-700 text-[10px]"
                        >
                          {proc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 text-[11px] text-stone-500 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Head of Dept:</span>
                    <span className="font-bold text-stone-800">{dept.hodName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">OPD Timings:</span>
                    <span className="font-mono text-stone-700">{dept.opdTimings}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL: QUICK APPOINTMENT SCHEDULER ================= */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Schedule Patient Appointment</h3>
                  <p className="text-xs text-stone-500">Fast front-desk booking with automated WhatsApp reminder</p>
                </div>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Patient</label>
                <select
                  value={bookingPatientId}
                  onChange={(e) => setBookingPatientId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none"
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.uhid}) - {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Appointment Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Time Slot</label>
                  <select
                    value={bookingTimeSlot}
                    onChange={(e) => setBookingTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none"
                  >
                    <option>09:00 AM</option>
                    <option>09:30 AM</option>
                    <option>10:00 AM</option>
                    <option>10:30 AM</option>
                    <option>11:00 AM</option>
                    <option>11:30 AM</option>
                    <option>12:00 PM</option>
                    <option>04:00 PM</option>
                    <option>04:30 PM</option>
                    <option>05:00 PM</option>
                    <option>05:30 PM</option>
                    <option>06:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Consulting Vaidya</label>
                  <select
                    value={bookingDoctor}
                    onChange={(e) => setBookingDoctor(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none"
                  >
                    <option>{currentBranch.doctorInCharge}</option>
                    <option>Dr. Akhilesh Tripathi, MS (Ayu) Shalya</option>
                    <option>Dr. Radhika Sharma, BAMS, MD (Ayu)</option>
                    <option>Dr. K. N. Namboodiri, BAMS</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Visit Category</label>
                  <select
                    value={bookingType}
                    onChange={(e) => setBookingType(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none"
                  >
                    <option value="First Consultation">First Consultation</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Panchakarma Session">Panchakarma Session</option>
                    <option value="Nadi Pariksha">Nadi Pariksha (Pulse Diagnostics)</option>
                    <option value="Camp Follow-up">Camp Follow-up</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Chief Complaints / Visit Purpose</label>
                <input
                  type="text"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="e.g. Knee pain follow-up, 1-week fistula thread replacement, Nadi Pariksha..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Appointment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: RECORD 1-WEEK KSHARA SUTRA THREAD CHANGE ================= */}
      {showThreadChangeModal && selectedKsharaPatient && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-center shrink-0">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Record 1-Week Thread Change</h3>
                  <p className="text-xs text-stone-500">
                    {selectedKsharaPatient.patientName} ({selectedKsharaPatient.uhid}) · Sitting #
                    {selectedKsharaPatient.currentSitting + 1}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowThreadChangeModal(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordThreadChange} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Measured Remaining Tract (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="15"
                    value={newSittingTractLength}
                    onChange={(e) => setNewSittingTractLength(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-mono font-bold focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-stone-400">
                    Previous: {selectedKsharaPatient.currentTractLengthCm} cm
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Medicated Thread Applied</label>
                  <select
                    value={newSittingThreadType}
                    onChange={(e) => setNewSittingThreadType(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none"
                  >
                    <option>Apamarga Kshara Sutra</option>
                    <option>Snuhi Kshara Sutra</option>
                    <option>Guggulu Kshara Sutra</option>
                    <option>Udumbara Kshara Sutra</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Discharge / Granulation Status</label>
                <select
                  value={newSittingDischarge}
                  onChange={(e) => setNewSittingDischarge(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none"
                >
                  <option>Minimal Serous</option>
                  <option>Moderate</option>
                  <option>Purulent</option>
                  <option>Nil / Granulating</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Healing & Cut-Through Notes</label>
                <textarea
                  value={newSittingNotes}
                  onChange={(e) => setNewSittingNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Prescribed Post-Procedure Medications</label>
                <input
                  type="text"
                  value={newSittingMeds}
                  onChange={(e) => setNewSittingMeds(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none"
                  required
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                <strong>Next 1-Week Follow-Up:</strong> Automatically scheduled for exactly 7 days from today (
                {new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]}).
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowThreadChangeModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Sitting #{selectedKsharaPatient.currentSitting + 1}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REGISTER NEW KSHARA SUTRA PATIENT ================= */}
      {showNewKsharaModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-center">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Register Kshara Sutra Patient</h3>
                  <p className="text-xs text-stone-500">Initiate specialized anorectal Shalya treatment protocol</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewKsharaModal(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target;
                const ptId = form.elements.namedItem('patientSelect').value;
                const diag = form.elements.namedItem('diagnosis').value;
                const tract = parseFloat(form.elements.namedItem('tractLength').value) || 4.0;
                const pt = patients.find((p) => p.id === ptId) || patients[0];
                const nextDate = new Date();
                nextDate.setDate(nextDate.getDate() + 7);
                const newKsPatient = {
                  id: `ks-pat-${Date.now()}`,
                  patientId: pt.id,
                  patientName: pt.name,
                  uhid: pt.uhid,
                  phone: pt.phone,
                  age: pt.age,
                  gender: pt.gender,
                  branchId: currentBranch.id,
                  diagnosis: diag,
                  initialTractLengthCm: tract,
                  currentTractLengthCm: tract,
                  primaryLigationDate: new Date().toISOString().split('T')[0],
                  totalEstimatedSittings: Math.ceil(tract / 0.8),
                  currentSitting: 1,
                  status: 'Active Treatment',
                  nextFollowUpDate: nextDate.toISOString().split('T')[0],
                  attendingSurgeon: currentBranch.doctorInCharge,
                  threadHistory: [
                    {
                      id: `tc-${Date.now()}`,
                      sittingNumber: 1,
                      date: new Date().toISOString().split('T')[0],
                      tractLengthCm: tract,
                      threadType: 'Apamarga Kshara Sutra',
                      dischargeStatus: 'Minimal Serous',
                      healingProgressNotes:
                        'Primary probing and ligation under local block. Medicated thread anchored securely.',
                      medicationsGiven:
                        'Jatyadi Taila 5ml local instillation, Triphala Guggulu 2 tabs tid, Sitz bath twice daily',
                      nextSittingDueDate: nextDate.toISOString().split('T')[0],
                      performedBy: currentBranch.doctorInCharge,
                    },
                  ],
                };
                const updated = [newKsPatient, ...ksharaPatients];
                setKsharaPatients(updated);
                AyurStorage.saveKsharaSutraPatients(updated);
                setShowNewKsharaModal(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Select Patient</label>
                <select
                  name="patientSelect"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none"
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.uhid})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Clinical Diagnosis</label>
                <select
                  name="diagnosis"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none"
                >
                  <option>Bhagandara (Fistula-in-Ano)</option>
                  <option>Arshas (Internal/External Piles Grade III)</option>
                  <option>Parikartika (Chronic Anal Fissure with Sentinel Pile)</option>
                  <option>Nadi Vrana (Pilonidal Sinus)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">Initial Tract Length (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="20"
                  name="tractLength"
                  defaultValue="4.5"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 font-mono font-bold focus:outline-none"
                  required
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewKsharaModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Initiate Protocol</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: GOOGLE REVIEW WHATSAPP DISPATCHER ================= */}
      {showReviewModal && targetReviewPatient && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-50 border border-yellow-200 text-amber-600 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Send Google Review on WhatsApp</h3>
                  <p className="text-xs text-stone-500">Fast 1-click review link with hospital naming</p>
                </div>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">Patient</label>
                <select
                  value={reviewPatientId}
                  onChange={(e) => setReviewPatientId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Message Preview */}
              <div className="space-y-1">
                <label className="font-bold text-stone-700">WhatsApp Message Content</label>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl font-mono text-[11px] leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap select-all text-stone-700">
                  {getReviewWhatsAppText(targetReviewPatient)}
                </div>
              </div>

              {reviewCopySuccess && (
                <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Review invitation copied to clipboard!</span>
                </div>
              )}

              <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => copyText(getReviewWhatsAppText(targetReviewPatient), false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold border border-stone-300 flex items-center gap-1.5"
                >
                  <Copy className="w-4 h-4 text-stone-500" />
                  <span>Copy Message</span>
                </button>

                <a
                  href={`https://wa.me/${targetReviewPatient.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(getReviewWhatsAppText(targetReviewPatient))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DIET CHART PREVIEW & DIRECT DISPATCH ================= */}
      {showDietModal && targetDietPatient && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-stone-200 shadow-2xl p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Send Ayurvedic Diet Chart</h3>
                  <p className="text-xs text-stone-500">
                    {targetDietPatient.name} ({targetDietPatient.uhid}) ·{' '}
                    {activeDietTemplate.conditionName.split('(')[0]}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDietModal(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Patient</label>
                  <select
                    value={dietPatientId}
                    onChange={(e) => setDietPatientId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-700">Disease Diet Template</label>
                  <select
                    value={activeDietTemplate.id}
                    onChange={(e) => {
                      const found = dietTemplates.find((t) => t.id === e.target.value);
                      if (found) setActiveDietTemplate(found);
                    }}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:outline-none"
                  >
                    {dietTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.conditionName.split('(')[0]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Message preview */}
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap select-all text-stone-700">
                {getDietChartWhatsAppText(targetDietPatient, activeDietTemplate)}
              </div>

              {dietCopySuccess && (
                <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Diet chart message copied to clipboard!</span>
                </div>
              )}

              <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDietModal(false);
                    setActiveDashboardTab('dietchart');
                  }}
                  className="px-3.5 py-2 text-stone-600 hover:text-stone-900 text-xs font-semibold underline"
                >
                  Edit / Customize Full Regimen →
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyText(getDietChartWhatsAppText(targetDietPatient, activeDietTemplate), true)}
                    className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold border border-stone-300 flex items-center gap-1.5"
                  >
                    <Copy className="w-4 h-4 text-stone-500" />
                    <span>Copy Text</span>
                  </button>

                  <a
                    href={`https://wa.me/${targetDietPatient.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(getDietChartWhatsAppText(targetDietPatient, activeDietTemplate))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send via WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
