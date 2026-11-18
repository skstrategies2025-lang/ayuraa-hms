// PHP backend. VITE_API_URL (in .env) overrides this; leave it out of .env to use the address below.
export const backendDomain =
  import.meta.env?.VITE_API_URL || "https://mintcream-otter-299554.hostingersite.com/ayuraa-php-backend/api";
// export const backendDomain = "http://localhost:5000/api";

// Portal name sent with the login request for hospital staff
export const HMS_PORTAL = "hms";

// where uploaded images live  ->  https://.../ayuraa-php-backend   (the /uploads/... paths are added to it)
export const imageDomain = backendDomain.replace(/\/api\/?$/, "");

export const SummaryApi = {
  Imagesurl: {
    url: imageDomain,
    method: "get",
  },

  // ───────────── Health / Login ─────────────
  // (there is no health file in the backend)
  Health: {
    url: `${backendDomain}/health.php`,
    method: "POST",
  },

  // body: { identifier, password, portal }  ->  data: { user, redirectTo }
  Login: {
    url: `${backendDomain}/auth/login.php`,
    method: "POST",
  },

  // ───────────── HMS panel (hospital staff) ─────────────
  // body: { hospital_id, user_id }
  hmsMe: {
    url: `${backendDomain}/hms/get-me.php`,
    method: "POST",
  },

  // body: { hospital_id, user_id?, branch_id? }  everything for the first load
  hmsBootstrap: {
    url: `${backendDomain}/hms/get-bootstrap.php`,
    method: "POST",
  },

  // body: { hospital_id }
  hmsDashboard: {
    url: `${backendDomain}/hms/get-dashboard-summary.php`,
    method: "POST",
  },

  // body: { hospital_id }
  hmsSettings: {
    url: `${backendDomain}/hms/get-settings.php`,
    method: "POST",
  },

  // body: { hospital_id, user_id?, config: {...} }
  hmsUpdateSettings: {
    url: `${backendDomain}/hms/update-settings.php`,
    method: "POST",
  },

  // body: { hospital_id, notes }
  hmsSaveDoctorNotes: {
    url: `${backendDomain}/hms/save-doctor-notes.php`,
    method: "POST",
  },

  // body: { hospital_id, branch_id? }
  hmsGetBranches: {
    url: `${backendDomain}/hms/get-branches.php`,
    method: "POST",
  },

  // body: { hospital_id, branches: [...] }
  hmsSyncBranches: {
    url: `${backendDomain}/hms/sync-branches.php`,
    method: "POST",
  },

  // body: { hospital_id, user_id?, backup: {...} }
  hmsRestoreBackup: {
    url: `${backendDomain}/hms/restore-backup.php`,
    method: "POST",
  },

  // body: { user_id, current_password, new_password }
  hmsChangePassword: {
    url: `${backendDomain}/hms/change-password.php`,
    method: "POST",
  },

  // body: { start_date?, end_date? }   (YYYY-MM-DD)
  hmsUsers: {
    url: `${backendDomain}/hms/get-users.php`,
    method: "POST",
  },

  // body: { hospital_id, login_id, full_name, password, staff_role, branch_id?, designation?, email?, phone? }
  hmsCreateUser: {
    url: `${backendDomain}/hms/create-user.php`,
    method: "POST",
  },

  // body: { hospital_id, staff_id, status?, staff_role?, branch_id?, designation?, password? }
  hmsUpdateUser: {
    url: `${backendDomain}/hms/update-user.php`,
    method: "POST",
  },

  // body: { hospital_id, page?, limit?, entity?, filter_user_id? }
  hmsAuditLogs: {
    url: `${backendDomain}/hms/get-audit-logs.php`,
    method: "POST",
  },

  // ───────────── HMS records ─────────────
  // collection = patients | medicines | panchakarma | appointments | invoices | staff | camps |
  //              templates | clinicLeads | pamphlets | ksharaSutra | dietCharts | doctorTodos
  // body: { hospital_id, collection, branch_id?, status?, search?, page?, limit? }
  hmsRecords: {
    url: `${backendDomain}/hms/get-records.php`,
    method: "POST",
  },

  // body: { hospital_id, collection, id }
  hmsRecord: {
    url: `${backendDomain}/hms/get-record.php`,
    method: "POST",
  },

  // body: { hospital_id, user_id?, branch_id?, collection, data: {...} }
  hmsCreateRecord: {
    url: `${backendDomain}/hms/create-record.php`,
    method: "POST",
  },

  // body: { hospital_id, user_id?, collection, id, data: {...} }
  hmsUpdateRecord: {
    url: `${backendDomain}/hms/update-record.php`,
    method: "POST",
  },

  // body: { hospital_id, user_id?, collection, id }
  hmsDeleteRecord: {
    url: `${backendDomain}/hms/delete-record.php`,
    method: "POST",
  },

  // ───────────── Staff attendance (hms_staff_attendance) ─────────────
  // body: { hospital_id, month (YYYY-MM), branch_id?, staff_id? }  -> { records, summary }
  hmsGetAttendance: {
    url: `${backendDomain}/hms/get-attendance.php`,
    method: "POST",
  },
  // body: { hospital_id, staff_id | staff_ids[], att_date | dates[], status, leave_type?, check_in?, check_out?, note? }
  hmsSaveAttendance: {
    url: `${backendDomain}/hms/save-attendance.php`,
    method: "POST",
  },
  // body: { hospital_id, staff_id, att_date }
  hmsDeleteAttendance: {
    url: `${backendDomain}/hms/delete-attendance.php`,
    method: "POST",
  },

  // ───────────── Bank accounts (hospital_bank_accounts) ─────────────
  // body: { hospital_id }  -> primary account first
  hmsGetBankAccounts: {
    url: `${backendDomain}/hms/get-bank-accounts.php`,
    method: "POST",
  },
  // body: { hospital_id, id?, account_holder, bank_name, account_number, ifsc_code, ... }
  hmsSaveBankAccount: {
    url: `${backendDomain}/hms/save-bank-account.php`,
    method: "POST",
  },
  // body: { hospital_id, id }
  hmsDeleteBankAccount: {
    url: `${backendDomain}/hms/delete-bank-account.php`,
    method: "POST",
  },

  // ───────────── Departments (hms_departments) ─────────────
  // body: { hospital_id, lang?, include_inactive? }
  hmsGetDepartments: {
    url: `${backendDomain}/hms/get-departments.php`,
    method: "POST",
  },
  // body: { hospital_id, user_id, id?, name_en, name_te?, name_hi?, code?, sort_order?, is_active? }
  hmsSaveDepartment: {
    url: `${backendDomain}/hms/save-department.php`,
    method: "POST",
  },
  // body: { hospital_id, user_id, id }
  hmsDeleteDepartment: {
    url: `${backendDomain}/hms/delete-department.php`,
    method: "POST",
  },

  // ───────────── Follow-ups (hms_followups) ─────────────
  // body: { hospital_id, lead_id? | camp_id? | due_on? }
  hmsGetFollowups: {
    url: `${backendDomain}/hms/get-followups.php`,
    method: "POST",
  },
  // body: { hospital_id, user_id?, id?, lead_id, camp_id?, followup_date?, mode?, outcome?, note?, next_followup_date? }
  hmsSaveFollowup: {
    url: `${backendDomain}/hms/save-followup.php`,
    method: "POST",
  },
  // body: { hospital_id, id }
  hmsDeleteFollowup: {
    url: `${backendDomain}/hms/delete-followup.php`,
    method: "POST",
  },

  // ───────────── Health calendar (health_days + hospital_health_days) ─────────────
  // body: { hospital_id, year?, month?, lang? }
  hmsGetHealthCalendar: {
    url: `${backendDomain}/hms/get-health-calendar.php`,
    method: "POST",
  },
  // body: { hospital_id, health_day_id, is_enabled } or { hospital_id, id?, custom_name, custom_date }
  hmsSaveHospitalHealthDay: {
    url: `${backendDomain}/hms/save-hospital-health-day.php`,
    method: "POST",
  },
  // body: { hospital_id, id }
  hmsDeleteHospitalHealthDay: {
    url: `${backendDomain}/hms/delete-hospital-health-day.php`,
    method: "POST",
  },

  // ───────────── Poster templates (studio_poster_templates) ─────────────
  // body: { hospital_id, category?, language?, health_day_id?, treatment_code?, search?, include_inactive? }
  hmsGetPosterTemplates: {
    url: `${backendDomain}/hms/get-poster-templates.php`,
    method: "POST",
  },
  // body: { hospital_id, user_id, id?, category, language, title, headline?, body_text?, image?, image_url?, layout_json?, ... }
  hmsSavePosterTemplate: {
    url: `${backendDomain}/hms/save-poster-template.php`,
    method: "POST",
  },
  // body: { hospital_id, user_id, id }
  hmsDeletePosterTemplate: {
    url: `${backendDomain}/hms/delete-poster-template.php`,
    method: "POST",
  },

  // ───────────── Procedure catalogue (hms_procedure_catalog) ─────────────
  // body: { hospital_id, category?, department_code?, search?, include_inactive? }
  hmsGetProcedureCatalog: {
    url: `${backendDomain}/hms/get-procedure-catalog.php`,
    method: "POST",
  },
  // body: { hospital_id, id?, name, default_amount, category?, department_code?, tax_rate_id?, is_active? }
  hmsSaveProcedure: {
    url: `${backendDomain}/hms/save-procedure.php`,
    method: "POST",
  },
  // body: { hospital_id, id }
  hmsDeleteProcedure: {
    url: `${backendDomain}/hms/delete-procedure.php`,
    method: "POST",
  },

  // ───────────── Camp lead procedures (hms_camp_lead_procedures) ─────────────
  // body: { hospital_id, lead_id? | camp_id? }
  hmsGetCampLeadProcedures: {
    url: `${backendDomain}/hms/get-camp-lead-procedures.php`,
    method: "POST",
  },
  // body: { hospital_id, user_id?, lead_id, camp_id?, items: [ { procedure_id?, procedure_name?, amount? } ] }
  hmsSaveCampLeadProcedures: {
    url: `${backendDomain}/hms/save-camp-lead-procedures.php`,
    method: "POST",
  },

  // ───────────── Tax rates (hms_tax_rates) ─────────────
  // body: { hospital_id, include_inactive? }
  hmsGetTaxRates: {
    url: `${backendDomain}/hms/get-tax-rates.php`,
    method: "POST",
  },
  // body: { hospital_id, id?, name, rate_percent, applies_to?, is_default?, is_active? }
  hmsSaveTaxRate: {
    url: `${backendDomain}/hms/save-tax-rate.php`,
    method: "POST",
  },
  // body: { hospital_id, id }
  hmsDeleteTaxRate: {
    url: `${backendDomain}/hms/delete-tax-rate.php`,
    method: "POST",
  },

  // ───────────── User preferences (hms_user_preferences) ─────────────
  // body: { hospital_id, user_id }  -> { language, source }
  hmsGetPreferences: {
    url: `${backendDomain}/hms/get-preferences.php`,
    method: "POST",
  },
  // body: { hospital_id, user_id, language }
  hmsSavePreferences: {
    url: `${backendDomain}/hms/save-preferences.php`,
    method: "POST",
  },
};

/**
 * callApi(endpoint, body) -> { success, message, data, meta, ... }
 * Throws Error(message) when the network fails or success is false.
 * error.status = HTTP status (0 = could not reach the server), error.details = server field errors.
 */
export async function callApi(endpoint, body = {}) {
  let response;
  try {
    response = await fetch(endpoint.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    const error = new Error("Unable to connect to the server.");
    error.status = 0;
    throw error;
  }

  const json = await response.json().catch(() => ({}));

  if (!response.ok || json?.success === false) {
    const error = new Error(json?.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.details = json?.details ?? json?.errors;
    throw error;
  }
  return json;
}

/* ───────────── Browser session (set from the Login answer) ───────────── */
const SESSION_KEY = "ayur_session";

export const getSession = () => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
};

export const setSession = (session) => {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}
};

export const clearSession = () => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {}
};

// Turns "/uploads/hospitals/x.jpg", "uploads/hospitals/x.jpg" or a full URL into a working image URL
export const getImageUrl = (path) => {
  if (!path) return "";
  if (/^(https?:|data:|blob:)/i.test(path)) return path; // already complete
  return `${imageDomain}/${String(path).replace(/^\/+/, "")}`;
};

// ids every HMS call needs, from the saved login:  callApi(SummaryApi.hmsUsers, { ...getContext() })
export const getContext = () => {
  const s = getSession() || {};
  return { hospital_id: s.hospitalId, user_id: s.id, branch_id: s.branchId || undefined };
};

export const getUserName = () => (getSession()?.name || "").trim();

export default SummaryApi;