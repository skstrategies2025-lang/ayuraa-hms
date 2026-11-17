/**
 * HMS portal shell  (route:  /hms/:tab )
 *
 * Loads the hospital's data from the API, applies the hospital's branding, builds the menu from the
 * tabs the API allows for this staff role, and shows the screen for the current tab.
 * The screens themselves live in ./components and talk to the API through ./services/storage.
 */
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, RefreshCw, X } from 'lucide-react';
import { clearSession, getSession } from '@/common';
import { AyurStorage } from './services/storage';
import { applyDynamicTheme } from './utils/theme';
import { Header } from './components/Header';
import { Sidebar, ALL_TAB_IDS } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { PatientsView } from './components/PatientsView';
import { IpdView } from './components/IpdView';
import { PrescriptionView } from './components/PrescriptionView';
import { DietChartsView } from './components/DietChartsView';
import { PanchakarmaView } from './components/PanchakarmaView';
import { PharmacyView } from './components/PharmacyView';
import { BillingView } from './components/BillingView';
import { ClinicCRMView } from './components/ClinicCRMView';
import { CampsAndCRMView } from './components/CampsAndCRMView';
import { PamphletStudioView } from './components/PamphletStudioView';
import { AppointmentsView } from './components/AppointmentsView';
import { FollowUpCentralView } from './components/FollowUpCentralView';
import { StaffAndPayrollView } from './components/StaffAndPayrollView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsAndBrandingView } from './components/SettingsAndBrandingView';
import { NewPatientModal } from './components/NewPatientModal';

const DEFAULT_TAB = 'dashboard';
const RX_WRITERS = ['hms_admin', 'doctor'];
const PATIENT_WRITERS = ['hms_admin', 'doctor', 'nurse', 'reception'];

/** Re-reads the store whenever any data changes, so every screen gets fresh props. */
function useHospitalData() {
  const read = () => ({
    config: AyurStorage.getConfig(),
    branches: AyurStorage.getBranches(),
    patients: AyurStorage.getPatients(),
    medicines: AyurStorage.getMedicines(),
    panchakarma: AyurStorage.getPanchakarma(),
    appointments: AyurStorage.getAppointments(),
    invoices: AyurStorage.getInvoices(),
    staff: AyurStorage.getStaff(),
    camps: AyurStorage.getCamps(),
    clinicLeads: AyurStorage.getClinicLeads(),
    pamphlets: AyurStorage.getPamphlets(),
    ksharaPatients: AyurStorage.getKsharaSutraPatients(),
    ipdBeds: AyurStorage.getIpdBeds(),
    ipdAdmissions: AyurStorage.getIpdAdmissions(),
  });
  const [data, setData] = useState(read);
  useEffect(() => AyurStorage.subscribe(() => setData(read())), []);
  return data;
}

/** Returns the previous object while its contents are unchanged, so memoised children don't re-render for nothing. */
function useStable(value) {
  const ref = useRef(value);
  if (JSON.stringify(ref.current) !== JSON.stringify(value)) ref.current = value;
  return ref.current;
}

export default function HmsPortal() {
  const navigate = useNavigate();
  const { tab } = useParams();
  const activeTab = tab || DEFAULT_TAB;

  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [loadError, setLoadError] = useState('');
  const [me, setMe] = useState(null);
  const [syncState, setSyncState] = useState({ pending: 0, error: '' });
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // mobile sidebar drawer
  // desktop sidebar: expanded (full) or collapsed (icons only); remembered in this browser
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('ayur_sidebar_collapsed') === '1'; } catch { return false; }
  });
  const toggleSidebar = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem('ayur_sidebar_collapsed', next ? '1' : '0'); } catch { /* private mode */ }
      return next;
    });
  }, []);
  const [prescriptionInitialPatientId, setPrescriptionInitialPatientId] = useState(undefined);
  const [dietPatientId, setDietPatientId] = useState(undefined);

  const { config, branches, patients, medicines, panchakarma, appointments, invoices, staff, camps, clinicLeads, pamphlets, ksharaPatients, ipdBeds, ipdAdmissions } =
    useHospitalData();

  // react-router v6 gives `navigate` a NEW identity on every route change. Anything that lists it as a
  // dependency (signOut -> load -> the first-load effect) would re-run on each menu click and show the
  // full-screen "Loading your hospital…" page. Going through a ref keeps those callbacks stable.
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const goTab = useCallback((id) => navigateRef.current(`/hms/${id}`), []);

  /* ── sign-out and session guard ── */
  const signOut = useCallback(async () => {
    clearSession();
    AyurStorage.clear();
    navigateRef.current('/login', { replace: true });
  }, []);

  useEffect(() => {
    const onUnauthorized = () => { clearSession(); AyurStorage.clear(); navigateRef.current('/login', { replace: true }); };
    window.addEventListener('hms:unauthorized', onUnauthorized);
    return () => window.removeEventListener('hms:unauthorized', onUnauthorized);
  }, []);

  /* ── first load ── */
  const load = useCallback(async () => {
    const session = getSession();
    if (!session) return navigateRef.current('/login', { replace: true });
    setStatus('loading');
    try {
      setMe(await AyurStorage.reload());
      setStatus('ready');
    } catch (err) {
      if (err.status === 401 || err.status === 403) return signOut();
      setLoadError(err.message || 'Could not load the hospital data.');
      setStatus('error');
    }
  }, [signOut]);

  // runs once when the portal opens (load is now stable), NOT on every menu change
  useEffect(() => { load(); }, [load]);
  useEffect(() => AyurStorage.subscribeSync(setSyncState), []);

  /* hospital branding colour */
  useEffect(() => { applyDynamicTheme(config.themeColor || '#0f6240'); }, [config.themeColor]);

  const staffRole = me?.staffRole;

  // every screen is available from the sidebar; only an unknown URL falls back to the dashboard
  useEffect(() => {
    if (status === 'ready' && !ALL_TAB_IDS.includes(activeTab)) navigate(`/hms/${DEFAULT_TAB}`, { replace: true });
  }, [status, activeTab, navigate]);

  // mobile drawer: close on route change / Escape, lock page scroll while open
  useEffect(() => { setMenuOpen(false); }, [activeTab]);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  /* ── header / sidebar numbers ── */
  const currentBranch = branches.find((b) => b.id === config.currentBranchId) || branches[0];
  const counts = useMemo(() => {
    if (!currentBranch) return {};
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const expiring = medicines.filter((m) => Math.ceil((new Date(m.expiryDate).getTime() - today.getTime()) / 86400000) <= 60 || m.stock <= m.minReorderLevel).length;
    const activePk = panchakarma.filter((p) => p.status === 'In Progress' && p.branchId === currentBranch.id).length;
    return {
      expiringMedicines: expiring,
      todayAppointments: appointments.filter((a) => a.date === todayStr && a.branchId === currentBranch.id).length,
      activePanchakarma: activePk,
      admittedPatients: ipdAdmissions.filter((a) => a.status === 'Admitted' && a.branchId === currentBranch.id).length,
      pendingCampLeads: camps.reduce((sum, c) => sum + (c.patientLeads || []).filter((l) => l.status === 'Screened at Camp' || l.status === 'Follow-up Called').length, 0),
      newClinicLeads: clinicLeads.filter((l) => l.branchId === currentBranch.id && l.stage === 'New Inquiry').length,
      todayFollowUps:
        patients.filter((p) => p.clinicalVisits?.some((v) => v.followUpDate === todayStr)).length +
        activePk +
        ksharaPatients.filter((k) => k.nextFollowUpDate === todayStr).length,
    };
  }, [currentBranch, medicines, panchakarma, appointments, camps, clinicLeads, patients, ksharaPatients, ipdAdmissions]);

  // The sidebar only needs these few values. Keeping them stable stops it re-rendering (and flashing)
  // every time the store hands out fresh copies of the data while you switch menus.
  const stableCounts = useStable(counts);
  const stableBrand = useStable({ logoUrl: config.logoUrl, hospitalName: config.hospitalName });

  /* ── shared actions ── */
  const openNewRx = () => { setPrescriptionInitialPatientId(patients[0]?.id); goTab('prescriptions'); };
  const openRxForPatient = (patient) => { setPrescriptionInitialPatientId(patient.id); goTab('prescriptions'); };
  const openDietChart = (patId) => { setDietPatientId(patId); goTab('diet_charts'); };

  /* ── loading / error ── */
  if (status !== 'ready') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#f3f8f5] text-stone-600 text-sm">
        {status === 'loading' ? (
          <><Loader2 className="w-6 h-6 animate-spin text-emerald-700" /> Loading your hospital…</>
        ) : (
          <>
            <p className="text-red-600 font-medium">{loadError}</p>
            <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white font-semibold">
              <RefreshCw className="w-4 h-4" /> Try again
            </button>
            <button onClick={signOut} className="text-xs underline">Sign out</button>
          </>
        )}
      </div>
    );
  }

  if (!currentBranch) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-stone-600">This hospital has no active branch yet. Ask the platform admin to add one.</div>;
  }

  const common = { config, currentBranch };

  const sidebarProps = { activeTab, onTabChange: goTab, config: stableBrand, badgeCounts: stableCounts };

  return (
    <div className="hms-root flex min-h-screen bg-[#f3f8f5] font-sans text-stone-900 antialiased selection:bg-brand-600 selection:text-white">
      {/* Sidebar (desktop) */}
      <aside
        className={`sticky top-0 hidden h-[100dvh] shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out lg:block ${
          collapsed ? 'w-[76px]' : 'w-60 xl:w-[264px]'
        }`}
      >
        <Sidebar {...sidebarProps} collapsed={collapsed} />
      </aside>

      {/* Sidebar (mobile drawer) */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[17rem] max-w-[85vw] shadow-xl">
            <Sidebar {...sidebarProps} onNavigate={() => setMenuOpen(false)} />
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="absolute right-2 top-2 rounded-md p-1.5 text-white/80 hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          config={config}
          currentBranch={currentBranch}
          branches={branches}
          onSelectBranch={(id) => AyurStorage.setCurrentBranch(id)}
          onNavigate={goTab}
          onMenu={() => setMenuOpen(true)}
          sidebarCollapsed={collapsed}
          onToggleSidebar={toggleSidebar}
          activeTab={activeTab}
          medicines={medicines}
          patients={patients}
          onOpenNewPatient={() => setIsNewPatientModalOpen(true)}
          onOpenNewRx={openNewRx}
          user={me.user}
          staffRole={staffRole}
          syncState={syncState}
          onLogout={signOut}
          canWrite={{ patients: PATIENT_WRITERS.includes(staffRole), prescriptions: RX_WRITERS.includes(staffRole) }}
        />

        <main className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-4 lg:p-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              {...common}
              branches={branches}
              patients={patients}
              medicines={medicines}
              panchakarma={panchakarma}
              appointments={appointments}
              invoices={invoices}
              camps={camps}
              onNavigate={goTab}
              onOpenNewPatient={() => setIsNewPatientModalOpen(true)}
              onOpenNewRx={openNewRx}
            />
          )}
          {activeTab === 'patients' && (
            <PatientsView {...common} patients={patients} onOpenNewPatient={() => setIsNewPatientModalOpen(true)} onOpenPrescriptionForPatient={openRxForPatient} onNavigateToDietChart={openDietChart} />
          )}
          {activeTab === 'ipd' && (
            <IpdView {...common} patients={patients} beds={ipdBeds} admissions={ipdAdmissions} staff={staff} staffRole={staffRole} ipdLocal={AyurStorage.isIpdLocal()} />
          )}
          {activeTab === 'prescriptions' && (
            <PrescriptionView {...common} patients={patients} medicines={medicines} initialPatientId={prescriptionInitialPatientId} onNavigateToPharmacy={() => goTab('pharmacy')} onNavigateToDietChart={openDietChart} />
          )}
          {activeTab === 'diet_charts' && <DietChartsView {...common} patients={patients} initialSelectedPatientId={dietPatientId} />}
          {activeTab === 'panchakarma' && <PanchakarmaView {...common} panchakarma={panchakarma} patients={patients} staff={staff} />}
          {activeTab === 'pharmacy' && <PharmacyView {...common} medicines={medicines} patients={patients} />}
          {activeTab === 'billing' && <BillingView {...common} invoices={invoices} patients={patients} />}
          {activeTab === 'clinic_crm' && <ClinicCRMView {...common} leads={clinicLeads} onPatientConverted={() => goTab('patients')} />}
          {activeTab === 'camps_crm' && <CampsAndCRMView {...common} camps={camps} />}
          {activeTab === 'pamphlets' && <PamphletStudioView {...common} pamphlets={pamphlets} />}
          {activeTab === 'appointments' && <AppointmentsView {...common} appointments={appointments} patients={patients} />}
          {activeTab === 'follow_up_central' && (
            <FollowUpCentralView {...common} patients={patients} panchakarma={panchakarma} ksharaPatients={ksharaPatients} appointments={appointments} camps={camps} />
          )}
          {activeTab === 'staff_payroll' && <StaffAndPayrollView {...common} staff={staff} />}
          {activeTab === 'financial_analytics' && (
            <AnalyticsView invoices={invoices} patients={patients} medicines={medicines} camps={camps} branches={branches} currentBranch={currentBranch} />
          )}
          {activeTab === 'settings' && <SettingsAndBrandingView {...common} branches={branches} patients={patients} medicines={medicines} />}
        </main>
      </div>

      <NewPatientModal isOpen={isNewPatientModalOpen} onClose={() => setIsNewPatientModalOpen(false)} {...common} onPatientCreated={() => goTab('patients')} />

    </div>
  );
}