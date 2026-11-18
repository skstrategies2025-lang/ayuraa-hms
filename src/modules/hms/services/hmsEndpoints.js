/**
 * Typed client for the HMS feature endpoints (backend: hms/*.php).
 *
 * Every call takes the logged-in ids (hospital_id, user_id, branch_id) from getContext() and merges
 * any extra fields on top, so a Super Admin can pass hospital_id: 0 for the built-in library.
 * The endpoint URLs live in SummaryApi (src/common/index.js); this file only chooses the endpoint
 * and shapes the request body. Each function returns the response's `data` field.
 */
import SummaryApi, { callApi, getContext } from '@/common';

const call = async (endpoint, extra = {}) => {
  const res = await callApi(SummaryApi[endpoint], { ...getContext(), ...extra });
  return res.data;
};

/* ───────── staff attendance ─────────
 * get-attendance -> { month, daysInMonth, records, summary[] (payableDays per staff) } */
export const getAttendance = ({ month, branchId, staffId } = {}) =>
  call('hmsGetAttendance', { month, branch_id: branchId, staff_id: staffId });
// one day, a leave range (dates[]) or many staff (staff_ids[]); status: present|absent|half_day|leave|weekly_off|holiday
export const saveAttendance = (payload) => call('hmsSaveAttendance', payload);
export const deleteAttendance = (staffId, attDate) =>
  call('hmsDeleteAttendance', { staff_id: staffId, att_date: attDate });

/* ───────── bank accounts (shown on invoices) ───────── */
export const getBankAccounts = () => call('hmsGetBankAccounts');
export const saveBankAccount = (account) => call('hmsSaveBankAccount', account); // id -> edit, no id -> add
export const deleteBankAccount = (id) => call('hmsDeleteBankAccount', { id });

/* ───────── departments ─────────
 * hospital_id 0 = standard list (Super Admin only) */
export const getDepartments = ({ lang, includeInactive } = {}) =>
  call('hmsGetDepartments', { lang, include_inactive: includeInactive });
export const saveDepartment = (dept) => call('hmsSaveDepartment', dept);
export const deleteDepartment = (id) => call('hmsDeleteDepartment', { id });

/* ───────── follow-ups ─────────
 * filter: { leadId } | { campId } | { dueOn: 'YYYY-MM-DD' } */
export const getFollowups = ({ leadId, campId, dueOn } = {}) =>
  call('hmsGetFollowups', { lead_id: leadId, camp_id: campId, due_on: dueOn });
export const saveFollowup = (entry) => call('hmsSaveFollowup', entry); // id -> edit
export const deleteFollowup = (id) => call('hmsDeleteFollowup', { id });

/* ───────── health calendar ─────────
 * Super Admin switches master days on/off per clinic; the clinic can add its own days. */
export const getHealthCalendar = ({ year, month, lang } = {}) =>
  call('hmsGetHealthCalendar', { year, month, lang });
export const setHealthDayEnabled = (healthDayId, isEnabled) =>
  call('hmsSaveHospitalHealthDay', { health_day_id: healthDayId, is_enabled: isEnabled });
export const saveCustomHealthDay = ({ id, customName, customDate }) =>
  call('hmsSaveHospitalHealthDay', { id, custom_name: customName, custom_date: customDate });
export const deleteCustomHealthDay = (id) => call('hmsDeleteHospitalHealthDay', { id });

/* ───────── poster templates (pamphlet studio) ─────────
 * returns the built-in library (hospital_id 0) plus this clinic's uploads (own: true) */
export const getPosterTemplates = (filter = {}) =>
  call('hmsGetPosterTemplates', {
    category: filter.category,
    language: filter.language,
    health_day_id: filter.healthDayId,
    treatment_code: filter.treatmentCode,
    search: filter.search,
    include_inactive: filter.includeInactive,
  });
// image: "data:image/...;base64,..." is stored on the server; hospital_id 0 = built-in (Super Admin)
export const savePosterTemplate = (poster) => call('hmsSavePosterTemplate', poster);
export const deletePosterTemplate = (id, hospitalId) =>
  call('hmsDeletePosterTemplate', { id, ...(hospitalId !== undefined ? { hospital_id: hospitalId } : {}) });

/* ───────── procedure catalogue (billing / camps) ───────── */
export const getProcedureCatalog = (filter = {}) =>
  call('hmsGetProcedureCatalog', {
    category: filter.category,
    department_code: filter.departmentCode,
    search: filter.search,
    include_inactive: filter.includeInactive,
  });
export const saveProcedure = (proc) => call('hmsSaveProcedure', proc);
export const deleteProcedure = (id) => call('hmsDeleteProcedure', { id });

/* ───────── camp lead procedures ─────────
 * items: [{ procedure_id?, procedure_name?, amount? }]; send [] to clear the lead's procedures */
export const getCampLeadProcedures = ({ leadId, campId } = {}) =>
  call('hmsGetCampLeadProcedures', { lead_id: leadId, camp_id: campId });
export const saveCampLeadProcedures = ({ leadId, campId, items }) =>
  call('hmsSaveCampLeadProcedures', { lead_id: leadId, camp_id: campId, items });

/* ───────── tax rates ───────── */
export const getTaxRates = ({ includeInactive } = {}) =>
  call('hmsGetTaxRates', { include_inactive: includeInactive });
export const saveTaxRate = (rate) => call('hmsSaveTaxRate', rate);
export const deleteTaxRate = (id) => call('hmsDeleteTaxRate', { id });

/* ───────── user preferences (app language, per user) ───────── */
export const getPreferences = () => call('hmsGetPreferences');
export const savePreferences = (language) => call('hmsSavePreferences', { language });
