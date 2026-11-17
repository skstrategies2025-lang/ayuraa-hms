/**
 * AyurStorage  -  the data layer of every HMS screen.
 *
 * Data is kept in memory for the screens (instant UI) and every change is sent to the API in order
 * (see enqueue). All endpoints live in src/common/index.js (SummaryApi); this file only decides which
 * one to call. Method names (getPatients, addPatient, updateInvoice ...) are the ones the screens use.
 */
import SummaryApi, { callApi, getContext, getSession } from '@/common';

const IPD_ROLES = ['hms_admin', 'doctor', 'nurse', 'reception'];
// an older backend does not list the 'ipd' tab: add it for the roles that work with inpatients
const withIpdTab = (tabs, role) => (tabs.includes('ipd') || !tabs.includes('patients') || !IPD_ROLES.includes(role) ? tabs : [...tabs.slice(0, tabs.indexOf('patients') + 1), 'ipd', ...tabs.slice(tabs.indexOf('patients') + 1)]);

const ALL_TABS = ['dashboard', 'financial_analytics', 'patients', 'ipd', 'prescriptions', 'diet_charts', 'panchakarma', 'follow_up_central', 'pharmacy', 'billing', 'appointments', 'clinic_crm', 'camps_crm', 'pamphlets', 'staff_payroll', 'settings'];

/* ─────────────────────────── API adapter ───────────────────────────
 * Turns "load / save / delete this record" into the right POST endpoint with the logged-in ids.
 * Answers are read defensively (list in data / data.items / data.rows ...), so small differences in the
 * backend's response shape do not break the screens.
 */
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const asArray = (d) => (Array.isArray(d) ? d : d?.items ?? d?.rows ?? d?.records ?? d?.data ?? []);
// a stored row may come back as { id, data: {...record} } -> flatten to the record the screens use
const flat = (r) => (isObj(r) && isObj(r.data) ? { ...r.data, id: r.data.id ?? r.id } : r);
const rowsOf = (d) => asArray(d).map(flat).filter(isObj);

const api = {
  /** All rows of one record type (reads every page). */
  async fetchCollection(key) {
    const rows = [];
    const limit = 500;
    for (let page = 1; page <= 40; page += 1) {
      const { hospital_id, branch_id } = getContext();
      const res = await callApi(SummaryApi.hmsRecords, { hospital_id, branch_id, collection: key, page, limit });
      const list = rowsOf(res.data);
      rows.push(...list);
      const pages = res.pagination?.totalPages ?? res.data?.pagination?.totalPages ?? res.meta?.totalPages;
      if (pages ? page >= pages : list.length < limit) break;
    }
    return rows;
  },

  /** Everything the portal needs after login:  { me, config, branches, doctorNotes, collections } */
  async bootstrap() {
    const { hospital_id, user_id, branch_id } = getContext();
    const res = await callApi(SummaryApi.hmsBootstrap, { hospital_id, user_id, branch_id });
    const d = isObj(res.data) ? res.data : {};
    const session = getSession() || {};

    // record lists – use the ones bootstrap returned, load the missing ones one by one
    const given = isObj(d.collections) ? d.collections : {};
    const keys = Object.keys(COLLECTIONS);
    const loaded = await Promise.all(keys.map(async (k) => {
      if (given[k]) return [k, rowsOf(given[k])];
      if (!OPTIONAL_COLLECTIONS.includes(k)) return [k, await api.fetchCollection(k)];
      try { localMode.delete(k); return [k, await api.fetchCollection(k)]; } catch (err) {
        if (err?.status === 401) throw err;
        localMode.add(k); return [k, readLocal(k)]; // backend has no table for it yet
      }
    }));
    const collections = Object.fromEntries(loaded);

    let config = d.config ?? d.settings;
    if (!isObj(config)) { const r = await callApi(SummaryApi.hmsSettings, { hospital_id }); config = r.data?.config ?? r.data ?? {}; }
    let branches = d.branches;
    if (!Array.isArray(branches)) { const r = await callApi(SummaryApi.hmsGetBranches, { hospital_id }); branches = asArray(r.data?.branches ?? r.data); }

    const me = d.me ?? {};
    return {
      me: {
        user: me.user ?? d.user ?? { id: session.id, name: session.name, userId: session.userId, mustChangePassword: false },
        hospital: me.hospital ?? d.hospital,
        staffRole: me.staffRole ?? me.staff_role ?? session.staffRole ?? 'hms_admin',
        branchId: me.branchId ?? me.branch_id ?? session.branchId ?? null,
        modules: me.modules ?? ALL_TABS,
        tabs: withIpdTab(me.tabs ?? ALL_TABS, me.staffRole ?? me.staff_role ?? session.staffRole ?? 'hms_admin'),
      },
      config,
      branches,
      doctorNotes: d.doctorNotes ?? d.doctor_notes ?? '',
      collections,
    };
  },

  /** Saves a new record. Returns the stored record (server may add ids / fix the UHID) + meta. */
  async createRecord(key, item) {
    const { hospital_id, user_id, branch_id } = getContext();
    const res = await callApi(SummaryApi.hmsCreateRecord, { hospital_id, user_id, branch_id: item.branchId || branch_id, collection: key, data: item });
    return api._stored(res, item);
  },
  async updateRecord(key, item) {
    const { hospital_id, user_id } = getContext();
    const res = await callApi(SummaryApi.hmsUpdateRecord, { hospital_id, user_id, collection: key, id: item.id, data: item });
    return api._stored(res, item);
  },
  async deleteRecord(key, id) {
    const { hospital_id, user_id } = getContext();
    await callApi(SummaryApi.hmsDeleteRecord, { hospital_id, user_id, collection: key, id });
  },
  // server answer -> the record to keep in memory (what we sent + anything the server changed)
  _stored(res, sent) {
    const d = isObj(res.data) ? (res.data.record ?? res.data.item ?? res.data) : {};
    const back = flat(d);
    const record = isObj(back) ? { ...sent, ...back, id: back.id ?? sent.id } : sent;
    return { record, meta: res.meta ?? res.data?.meta };
  },

  async updateSettings(changed) {
    const { hospital_id, user_id } = getContext();
    const res = await callApi(SummaryApi.hmsUpdateSettings, { hospital_id, user_id, config: changed });
    const back = res.data?.config ?? res.data;
    return { ...changed, ...(isObj(back) ? back : {}) };
  },
  async syncBranches(branches) {
    const { hospital_id } = getContext();
    const res = await callApi(SummaryApi.hmsSyncBranches, { hospital_id, branches });
    const list = asArray(res.data?.branches ?? res.data);
    return list.length ? list : branches;
  },
  async saveDoctorNotes(notes) {
    const { hospital_id } = getContext();
    await callApi(SummaryApi.hmsSaveDoctorNotes, { hospital_id, notes });
  },
  async restore(backup) {
    const { hospital_id, user_id } = getContext();
    await callApi(SummaryApi.hmsRestoreBackup, { hospital_id, user_id, backup });
  },
};

// uploaded images are stored inline (data URLs), so no address rewriting is needed
const absoluteUrl = (u) => u || '';
const relativeUrl = (u) => u || '';

/* ─────────────────────────── record types ─────────────────────────── */

// key = name used in state and backup files, slug = URL segment of the API
const COLLECTIONS = {
  patients: 'patients',
  medicines: 'medicines',
  panchakarma: 'panchakarma',
  appointments: 'appointments',
  invoices: 'invoices',
  staff: 'staff',
  camps: 'camps',
  templates: 'templates',
  clinicLeads: 'clinic-leads',
  pamphlets: 'pamphlets',
  ksharaSutra: 'kshara-sutra',
  dietCharts: 'diet-charts',
  doctorTodos: 'doctor-todos',
  ipdBeds: 'ipd-beds',
  ipdAdmissions: 'ipd-admissions',
};

/* Inpatient (IPD) record types. Until the backend knows them ("Unknown collection") they are kept in this
 * browser (localStorage) so the screens still work; once the backend patch is installed they use the API. */
const OPTIONAL_COLLECTIONS = ['ipdBeds', 'ipdAdmissions'];
const localMode = new Set();
const localKey = (key) => `ayur_local_${getContext().hospital_id || 'h'}_${key}`;
const readLocal = (key) => { try { return JSON.parse(localStorage.getItem(localKey(key))) || []; } catch { return []; } };
const writeLocal = (key, list) => { try { localStorage.setItem(localKey(key), JSON.stringify(list)); } catch { /* storage full / private mode */ } };

const COLLECTIONS_BY_SLUG = COLLECTIONS;

const EMPTY_CONFIG = {
  hospitalName: '', tagline: '', registrationNumber: '', gstNumber: '', logoUrl: '', themeColor: '#0f6240', themeName: 'emerald',
  uhidPrefix: 'AYUR-', uhidStartSequence: 1001, uhidCurrentSequence: 1001, website: '', supportPhone: '', supportEmail: '',
  address: '', currentBranchId: '', activeLanguage: 'en', currency: '₹', googleReviewUrl: '',
};

/* ─────────────────────────── state ─────────────────────────── */

const state = {
  loaded: false,
  me: null, // { user, hospital, staffRole, branchId, modules, tabs }
  config: { ...EMPTY_CONFIG },
  serverConfig: { ...EMPTY_CONFIG }, // last config the server confirmed (used to send only edited fields)
  branches: [],
  doctorNotes: '',
  ...Object.fromEntries(Object.keys(COLLECTIONS).map((k) => [k, []])),
};

// id -> JSON text of the last version known to the server, per record type. Lets us detect real changes
// even when a screen edits an object in place before saving the list.
const known = Object.fromEntries(Object.keys(COLLECTIONS).map((k) => [k, new Map()]));

const listeners = new Set();
const notifyAll = () => listeners.forEach((fn) => { try { fn(); } catch (e) { console.error('storage listener error', e); } });

/* per-user preferences kept in the browser (not shared with colleagues) */
const prefKey = (name) => `ayur_hms_${state.me?.user?.id || 'u'}_${name}`;
const readPref = (name, fallback) => { try { return localStorage.getItem(prefKey(name)) || fallback; } catch { return fallback; } };
const writePref = (name, value) => { try { localStorage.setItem(prefKey(name), value); } catch { /* private mode */ } };

/* ─────────────────────────── write queue ─────────────────────────── */

let chain = Promise.resolve();
const sync = { pending: 0, error: '' };
const syncListeners = new Set();
const notifySync = () => syncListeners.forEach((fn) => fn({ ...sync }));

/** Runs requests one after another so creates always reach the server before the edits that follow. */
function enqueue(task) {
  sync.pending += 1; sync.error = ''; notifySync();
  chain = chain.then(task).catch(async (err) => {
    if (err?.status === 401) { window.dispatchEvent(new Event('hms:unauthorized')); return; }
    console.error('HMS save failed:', err);
    sync.error = err?.message || 'Could not save';
    notifySync();
    await AyurStorage.reload().catch(() => {}); // show what the server really has
  }).finally(() => { sync.pending -= 1; notifySync(); });
}

/* ─────────────────────────── generic record helpers ─────────────────────────── */

const snap = (key, list) => { known[key] = new Map(list.map((x) => [x.id, JSON.stringify(x)])); };

/** Server answered with the stored record (it may have fixed e.g. the UHID or the id) -> put it in memory. */
function applyServerRecord(key, record, meta, localId = record.id) {
  state[key] = state[key].map((x) => (x.id === localId ? record : x));
  if (localId !== record.id) known[key].delete(localId);
  known[key].set(record.id, JSON.stringify(record));
  if (meta?.uhidCurrentSequence && state.config.uhidCurrentSequence < meta.uhidCurrentSequence) {
    state.config = { ...state.config, uhidCurrentSequence: meta.uhidCurrentSequence };
    state.serverConfig = { ...state.serverConfig, uhidCurrentSequence: meta.uhidCurrentSequence };
  }
  notifyAll();
}

/** Replace a whole list: sends creates, edits and deletes by comparing with what the server knows. */
function saveList(key, next) {
  const prev = known[key];
  state[key] = [...next];
  notifyAll();
  if (localMode.has(key)) { writeLocal(key, state[key]); snap(key, state[key]); return; }

  const seen = new Set();
  for (const item of next) {
    seen.add(item.id);
    const text = JSON.stringify(item);
    const before = prev.get(item.id);
    if (before === text) continue;
    prev.set(item.id, text);
    if (before === undefined) {
      enqueue(async () => { const r = await api.createRecord(key, item); applyServerRecord(key, r.record, r.meta, item.id); });
    } else {
      enqueue(async () => { const r = await api.updateRecord(key, item); applyServerRecord(key, r.record, r.meta, item.id); });
    }
  }
  for (const id of [...prev.keys()]) {
    if (seen.has(id)) continue;
    prev.delete(id);
    enqueue(() => api.deleteRecord(key, id));
  }
}

/** getX / saveX / addX / updateX / deleteX for one record type. */
const crud = (key) => ({
  get: () => [...state[key]],
  save: (list) => saveList(key, list),
  add: (item) => saveList(key, [item, ...state[key]]),
  update: (item) => saveList(key, state[key].map((x) => (x.id === item.id ? item : x))),
  remove: (id) => saveList(key, state[key].filter((x) => x.id !== id)),
});
const C = Object.fromEntries(Object.keys(COLLECTIONS).map((k) => [k, crud(k)]));

/* ─────────────────────────── public API ─────────────────────────── */

export const AyurStorage = {
  /* lifecycle */
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  subscribeSync(fn) { syncListeners.add(fn); fn({ ...sync }); return () => syncListeners.delete(fn); },
  isLoaded: () => state.loaded,
  getMe: () => state.me,

  /** Loads the hospital's data. Call once after login (HmsPortal does this). */
  async reload() {
    const data = await api.bootstrap();
    state.me = data.me;
    state.serverConfig = { ...EMPTY_CONFIG, ...data.config, logoUrl: absoluteUrl(data.config.logoUrl) };
    state.branches = data.branches;
    state.doctorNotes = data.doctorNotes || '';
    for (const key of Object.keys(COLLECTIONS)) { state[key] = data.collections[key] || []; snap(key, state[key]); }

    // preferences: language and current branch are per user
    state.config = {
      ...state.serverConfig,
      activeLanguage: 'en', // the portal is English-only
      currentBranchId: this._pickBranch(),
    };
    state.loaded = true;
    notifyAll();
    return state.me;
  },
  _pickBranch() {
    const ids = state.branches.map((b) => b.id);
    if (state.me?.branchId) return state.me.branchId; // staff tied to one branch
    const saved = readPref('branch', '');
    return ids.includes(saved) ? saved : ids[0] || '';
  },
  /** Forget everything (logout). */
  clear() {
    state.loaded = false; state.me = null;
    for (const key of Object.keys(COLLECTIONS)) { state[key] = []; known[key].clear(); }
    state.branches = []; state.config = { ...EMPTY_CONFIG };
    notifyAll();
  },

  /* configuration & branches */
  getConfig: () => ({ ...state.config }),
  /** Per-user preferences stay in the browser; branding / UHID / contact details go to the server (hospital admin). */
  saveConfig(config) {
    const { currentBranchId, activeLanguage, ...shared } = config;
    writePref('lang', activeLanguage || 'en');
    state.config = { ...config };
    notifyAll();

    const changed = {};
    for (const [k, v] of Object.entries(shared)) if (JSON.stringify(v) !== JSON.stringify(state.serverConfig[k])) changed[k] = v;
    if (!Object.keys(changed).length || state.me?.staffRole !== 'hms_admin') return;
    state.serverConfig = { ...state.serverConfig, ...changed };
    enqueue(async () => {
      const body = { ...changed, ...(changed.logoUrl !== undefined ? { logoUrl: relativeUrl(changed.logoUrl) } : {}) };
      const back = await api.updateSettings(body);
      const saved = { ...back, logoUrl: absoluteUrl(back.logoUrl ?? state.config.logoUrl) };
      state.serverConfig = { ...state.serverConfig, ...saved };
      state.config = { ...state.config, logoUrl: saved.logoUrl };
      notifyAll();
    });
  },
  getBranches: () => [...state.branches],
  saveBranches(branches) {
    state.branches = [...branches];
    notifyAll();
    enqueue(async () => {
      state.branches = await api.syncBranches(branches);
      if (!state.branches.some((b) => b.id === state.config.currentBranchId)) state.config = { ...state.config, currentBranchId: this._pickBranch() };
      notifyAll();
    });
  },
  getCurrentBranch() {
    return state.branches.find((b) => b.id === state.config.currentBranchId) || state.branches[0];
  },
  setCurrentBranch(branchId) {
    if (state.me?.branchId) return; // branch-bound staff cannot switch
    writePref('branch', branchId);
    state.config = { ...state.config, currentBranchId: branchId };
    notifyAll();
  },

  /* record types (same names the screens always used) */
  getPatients: C.patients.get, savePatients: C.patients.save, addPatient: C.patients.add, updatePatient: C.patients.update, deletePatient: C.patients.remove,
  getMedicines: C.medicines.get, saveMedicines: C.medicines.save, addMedicine: C.medicines.add, updateMedicine: C.medicines.update, deleteMedicine: C.medicines.remove,
  getPanchakarma: C.panchakarma.get, savePanchakarma: C.panchakarma.save, addPanchakarma: C.panchakarma.add, updatePanchakarma: C.panchakarma.update,
  getAppointments: C.appointments.get, saveAppointments: C.appointments.save, addAppointment: C.appointments.add, updateAppointment: C.appointments.update,
  getInvoices: C.invoices.get, saveInvoices: C.invoices.save, addInvoice: C.invoices.add, updateInvoice: C.invoices.update,
  getStaff: C.staff.get, saveStaff: C.staff.save, addStaff: C.staff.add, updateStaff: C.staff.update,
  getCamps: C.camps.get, saveCamps: C.camps.save, addCamp: C.camps.add, updateCamp: C.camps.update,
  getSavedTemplates: C.templates.get, saveTemplates: C.templates.save, addSavedTemplate: C.templates.add, deleteSavedTemplate: C.templates.remove,
  getClinicLeads: C.clinicLeads.get, saveClinicLeads: C.clinicLeads.save, addClinicLead: C.clinicLeads.add, updateClinicLead: C.clinicLeads.update, deleteClinicLead: C.clinicLeads.remove,
  getPamphlets: C.pamphlets.get, savePamphlets: C.pamphlets.save,
  getKsharaSutraPatients: C.ksharaSutra.get, saveKsharaSutraPatients: C.ksharaSutra.save, addKsharaSutraPatient: C.ksharaSutra.add, updateKsharaSutraPatient: C.ksharaSutra.update,
  getDietChartTemplates: C.dietCharts.get, saveDietChartTemplates: C.dietCharts.save, addDietChartTemplate: C.dietCharts.add,
  getIpdBeds: C.ipdBeds.get, saveIpdBeds: C.ipdBeds.save, addIpdBed: C.ipdBeds.add, updateIpdBed: C.ipdBeds.update, deleteIpdBed: C.ipdBeds.remove,
  getIpdAdmissions: C.ipdAdmissions.get, saveIpdAdmissions: C.ipdAdmissions.save, addIpdAdmission: C.ipdAdmissions.add, updateIpdAdmission: C.ipdAdmissions.update,
  /** true while IPD data is kept only in this browser (backend patch not installed yet) */
  isIpdLocal: () => localMode.has('ipdAdmissions') || localMode.has('ipdBeds'),
  getDoctorTodos: C.doctorTodos.get, saveDoctorTodos: C.doctorTodos.save, addDoctorTodo: C.doctorTodos.add, deleteDoctorTodo: C.doctorTodos.remove,
  toggleDoctorTodo(id) {
    C.doctorTodos.save(state.doctorTodos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  },

  /* doctor's notepad (saved 0.8 s after the last keystroke) */
  getDoctorNotes: () => state.doctorNotes,
  saveDoctorNotes(notes) {
    state.doctorNotes = notes;
    notifyAll();
    clearTimeout(AyurStorage._notesTimer);
    AyurStorage._notesTimer = setTimeout(() => enqueue(() => api.saveDoctorNotes(state.doctorNotes)), 800);
  },

  /**
   * Next UHID shown in the registration form. The server is the authority: when the patient is saved it
   * confirms the number or issues a fresh one if a colleague took it first (see applyServerRecord).
   */
  generateAndIncrementUHID() {
    const cfg = state.config;
    const seq = cfg.uhidCurrentSequence || cfg.uhidStartSequence || 1001;
    state.config = { ...cfg, uhidCurrentSequence: seq + 1 };
    notifyAll();
    return `${cfg.uhidPrefix || 'AYUR-'}${seq}`;
  },

  /* backup & restore (hospital admin) */
  exportBackupJSON() {
    return JSON.stringify({
      version: '3.0', exportedAt: new Date().toISOString(),
      config: state.config, branches: state.branches,
      ...Object.fromEntries(Object.keys(COLLECTIONS).map((k) => [k, state[k]])),
      doctorNotes: state.doctorNotes,
    }, null, 2);
  },
  restoreBackupJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== 'object') return false;
      enqueue(async () => { await api.restore(data); await AyurStorage.reload(); });
      return true;
    } catch (e) { console.error('Backup restoration failed:', e); return false; }
  },
  /** Kept for compatibility: re-reads everything from the database. */
  resetToDefault() { return AyurStorage.reload(); },
};

export default AyurStorage;
