// Helpers for the staff profile form (add / edit): designations, validation, bank accounts, document photos.

export const CUSTOM_ROLE = '__custom__';

export const STAFF_ROLE_OPTIONS = [
  'Chief Vaidya',
  'Ayurvedic Consultant',
  'Senior Panchakarma Therapist',
  'Panchakarma Therapist',
  'Pharmacist',
  'Lab Technician',
  'Nurse',
  'Front Desk / CRM',
  'Reception',
  'Accountant',
  'Housekeeping',
  'Driver',
  'Administrator',
];

export const STAFF_STATUS_OPTIONS = ['Active', 'On Leave', 'Inactive'];
export const BANK_ACCOUNT_TYPES = ['Savings', 'Current', 'Salary'];
export const COMMON_BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'Indian Bank',
  'IDFC FIRST Bank',
  'Yes Bank',
  'IndusInd Bank',
];

const CUSTOM_ROLES_KEY = 'ayur_custom_roles';

/* ───────── designations ───────── */

// Custom roles typed earlier are remembered in this browser, so they show up in the dropdown next time.
export function getCustomRoles() {
  try {
    const list = JSON.parse(localStorage.getItem(CUSTOM_ROLES_KEY));
    return Array.isArray(list) ? list.filter((x) => typeof x === 'string' && x.trim()) : [];
  } catch {
    return [];
  }
}

export function rememberCustomRole(role) {
  const clean = String(role || '').trim();
  if (!clean || STAFF_ROLE_OPTIONS.includes(clean)) return;
  const list = getCustomRoles();
  if (list.some((r) => r.toLowerCase() === clean.toLowerCase())) return;
  try {
    localStorage.setItem(CUSTOM_ROLES_KEY, JSON.stringify([...list, clean]));
  } catch {
    /* private mode */
  }
}

export const allRoleOptions = () => [...STAFF_ROLE_OPTIONS, ...getCustomRoles()];

/* ───────── formatting ───────── */

export const onlyDigits = (s) => String(s || '').replace(/\D/g, '');

export function formatAadhaar(value) {
  const d = onlyDigits(value).slice(0, 12);
  return d.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function maskAadhaar(value) {
  const d = onlyDigits(value);
  if (d.length < 4) return '—';
  return `XXXX XXXX ${d.slice(-4)}`;
}

export function maskAccount(value) {
  const d = onlyDigits(value);
  if (d.length <= 4) return d || '—';
  return `${'X'.repeat(d.length - 4)}${d.slice(-4)}`;
}

/* ───────── validation ───────── */

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emptyBankAccount(isPrimary = false) {
  return {
    id: `bank-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    ifsc: '',
    accountType: 'Savings',
    branch: '',
    isPrimary,
    passbookPhoto: '',
  };
}

export function emptyStaffForm() {
  return {
    name: '',
    roleChoice: 'Senior Panchakarma Therapist',
    customRole: '',
    status: 'Active',
    joinDate: new Date().toISOString().split('T')[0],
    gender: '',
    dateOfBirth: '',
    phone: '',
    altPhone: '',
    email: '',
    address: '',
    emergencyName: '',
    emergencyPhone: '',
    qualification: '',
    aadhaarNumber: '',
    panNumber: '',
    aadhaarFront: '',
    aadhaarBack: '',
    panPhoto: '',
    qualificationDoc: '',
    monthlySalary: '38000',
    panchakarmaIncentiveRate: '150',
    bankAccounts: [emptyBankAccount(true)],
  };
}

// "SBI Bank - 30894012984" (how older records stored the bank) -> one bank account
function parseLegacyBank(text) {
  const [bank, ...rest] = String(text).split(' - ');
  const account = rest.length ? rest.join(' - ') : bank;
  return { ...emptyBankAccount(true), bankName: rest.length ? bank : '', accountNumber: account.replace(/\D/g, '') };
}

/** A saved staff member -> the values the form shows. */
export function staffToForm(member, knownRoles = STAFF_ROLE_OPTIONS) {
  const docs = member.documents || {};
  const isKnown = knownRoles.includes(member.role);
  const banks =
    member.bankAccounts?.length
      ? member.bankAccounts
      : member.bankAccount
        ? [parseLegacyBank(member.bankAccount)]
        : [emptyBankAccount(true)];
  return {
    ...emptyStaffForm(),
    name: member.name || '',
    roleChoice: isKnown ? member.role : CUSTOM_ROLE,
    customRole: isKnown ? '' : member.role || '',
    status: member.status || 'Active',
    joinDate: member.joinDate || new Date().toISOString().split('T')[0],
    gender: member.gender || '',
    dateOfBirth: member.dateOfBirth || '',
    phone: member.phone || '',
    altPhone: member.altPhone || '',
    email: member.email || '',
    address: member.address || '',
    emergencyName: member.emergencyContact?.name || '',
    emergencyPhone: member.emergencyContact?.phone || '',
    qualification: member.qualification || '',
    aadhaarNumber: formatAadhaar(member.aadhaarNumber || ''),
    panNumber: member.panNumber || '',
    aadhaarFront: docs.aadhaarFront || '',
    aadhaarBack: docs.aadhaarBack || '',
    panPhoto: docs.panCard || '',
    qualificationDoc: docs.qualificationDoc || '',
    monthlySalary: String(member.monthlySalary ?? ''),
    panchakarmaIncentiveRate: String(member.panchakarmaIncentiveRate ?? ''),
    bankAccounts: banks,
  };
}

export function validateStaffForm(f) {
  const e = {};
  if (!f.name.trim()) e.name = 'Enter the full name';
  if (f.roleChoice === CUSTOM_ROLE && !f.customRole.trim()) e.customRole = 'Type the custom designation';

  const phone = onlyDigits(f.phone);
  if (phone.length < 10 || phone.length > 12) e.phone = 'Enter a valid 10-digit mobile number';
  if (f.altPhone && onlyDigits(f.altPhone).length < 10) e.altPhone = 'Enter a valid mobile number';
  if (f.emergencyPhone && onlyDigits(f.emergencyPhone).length < 10) e.emergencyPhone = 'Enter a valid mobile number';
  if (f.email && !EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email address';

  if (onlyDigits(f.aadhaarNumber).length !== 12) e.aadhaarNumber = 'Aadhaar number must be 12 digits';
  if (!PAN_RE.test(f.panNumber.toUpperCase().replace(/\s/g, ''))) e.panNumber = 'PAN format is ABCDE1234F';
  if (!f.aadhaarFront) e.aadhaarFront = 'Take or upload the front side of Aadhaar';
  if (!f.panPhoto) e.panPhoto = 'Take or upload the PAN card photo';

  if (f.monthlySalary === '' || Number(f.monthlySalary) < 0) e.monthlySalary = 'Enter the monthly base salary';

  if (!f.bankAccounts.length) {
    e.bankNone = 'Add at least one bank account';
  } else {
    const banks = {};
    f.bankAccounts.forEach((a) => {
      const b = {};
      if (!a.bankName.trim()) b.bankName = 'Choose or type the bank';
      if (!a.accountHolder.trim()) b.accountHolder = 'Enter the account holder name';
      const acc = onlyDigits(a.accountNumber);
      if (acc.length < 9 || acc.length > 18) b.accountNumber = 'Account number should be 9 to 18 digits';
      if (!IFSC_RE.test(a.ifsc.toUpperCase().replace(/\s/g, ''))) b.ifsc = 'Invalid IFSC, e.g. SBIN0001234';
      if (Object.keys(b).length) banks[a.id] = b;
    });
    if (Object.keys(banks).length) e.banks = banks;
    if (!f.bankAccounts.some((a) => a.isPrimary)) e.bankNone = 'Choose one account for salary credit';
  }
  return e;
}

/** Form values -> the record that is saved. Keeps the old `bankAccount` text in sync for payslips. */
export function buildStaffRecord(f, member, branchId) {
  const role = f.roleChoice === CUSTOM_ROLE ? f.customRole.trim() : f.roleChoice;
  const banks = f.bankAccounts.map((a) => ({
    ...a,
    bankName: a.bankName.trim(),
    accountHolder: a.accountHolder.trim(),
    accountNumber: onlyDigits(a.accountNumber),
    ifsc: a.ifsc.toUpperCase().replace(/\s/g, ''),
    branch: a.branch.trim(),
  }));
  const primary = banks.find((a) => a.isPrimary) || banks[0];
  return {
    ...(member || {}),
    id: member?.id || `st-${Date.now()}`,
    name: f.name.trim(),
    role,
    branchId: member?.branchId || branchId,
    status: f.status,
    joinDate: f.joinDate,
    gender: f.gender,
    dateOfBirth: f.dateOfBirth,
    phone: f.phone.trim(),
    altPhone: f.altPhone.trim(),
    email: f.email.trim(),
    address: f.address.trim(),
    emergencyContact: { name: f.emergencyName.trim(), phone: f.emergencyPhone.trim() },
    qualification: f.qualification.trim(),
    aadhaarNumber: onlyDigits(f.aadhaarNumber),
    panNumber: f.panNumber.toUpperCase().replace(/\s/g, ''),
    documents: {
      aadhaarFront: f.aadhaarFront,
      aadhaarBack: f.aadhaarBack,
      panCard: f.panPhoto,
      qualificationDoc: f.qualificationDoc,
    },
    bankAccounts: banks,
    bankAccount: primary ? `${primary.bankName} - ${primary.accountNumber}` : '',
    monthlySalary: Number(f.monthlySalary) || 0,
    panchakarmaIncentiveRate: Number(f.panchakarmaIncentiveRate) || 0,
    attendanceThisMonth: member?.attendanceThisMonth || { presentDays: 20, totalDays: 20, leavesTaken: 0 },
  };
}

/* ───────── document photos ───────── */

/**
 * Reads a photo from the camera or the gallery and shrinks it, so the record stays small.
 * Document text stays readable at this size.
 */
export function compressImage(file, maxSide = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Please choose an image (JPG or PNG).'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read this file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('This image could not be opened.'));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
