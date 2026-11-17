import React, { useRef, useState } from 'react';
import { X, Camera, Upload, Trash2, Star, Plus, AlertCircle } from 'lucide-react';
import {
  CUSTOM_ROLE,
  STAFF_STATUS_OPTIONS,
  BANK_ACCOUNT_TYPES,
  COMMON_BANKS,
  allRoleOptions,
  emptyBankAccount,
  rememberCustomRole,
  staffToForm,
  emptyStaffForm,
  validateStaffForm,
  buildStaffRecord,
  formatAadhaar,
  compressImage,
} from '../utils/staffHelpers';

const inputCls = (err) =>
  `w-full bg-stone-50 border ${err ? 'border-red-400 bg-red-50/40' : 'border-stone-300'} rounded-xl px-3 py-2 text-stone-900 text-xs focus:outline-none focus:border-emerald-600`;

const Field = ({ label, error, required, children, className = '' }) => (
  <div className={className}>
    <label className="block text-stone-700 font-semibold mb-1 text-xs">
      {label}
      {required && <span className="text-red-600"> *</span>}
    </label>
    {children}
    {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
  </div>
);

const Section = ({ title, hint, children }) => (
  <div className="space-y-3">
    <div className="pb-1.5 border-b border-stone-200">
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">{title}</h4>
      {hint && <p className="text-[11px] text-stone-500">{hint}</p>}
    </div>
    {children}
  </div>
);

/** One document photo: take a photo with the camera, or pick one from the gallery. */
const DocumentPhoto = ({ label, value, onChange, error, required, hint }) => {
  const cameraRef = useRef(null);
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true);
    setPhotoError('');
    try {
      onChange(await compressImage(file));
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`rounded-xl border p-3 bg-stone-50 ${error ? 'border-red-400' : 'border-stone-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-stone-800">
          {label}
          {required && <span className="text-red-600"> *</span>}
        </span>
        {value && (
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
            Captured
          </span>
        )}
      </div>

      {value ? (
        <img src={value} alt={label} className="h-32 w-full object-contain rounded-lg bg-white border border-stone-200" />
      ) : (
        <div className="h-32 w-full rounded-lg bg-white border border-dashed border-stone-300 flex flex-col items-center justify-center text-[11px] text-stone-400">
          {busy ? 'Preparing photo…' : 'No photo yet'}
          {hint && <span className="mt-0.5 text-[10px]">{hint}</span>}
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={busy}
          className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 disabled:opacity-60"
        >
          <Camera className="w-3.5 h-3.5" /> {value ? 'Retake' : 'Take photo'}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="px-2.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 disabled:opacity-60"
        >
          <Upload className="w-3.5 h-3.5" /> Upload
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="px-2.5 py-1.5 text-red-700 hover:bg-red-50 rounded-lg text-[11px] font-semibold flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </button>
        )}
      </div>

      {/* capture="environment" opens the back camera on phones */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {(error || photoError) && (
        <p className="text-[11px] text-red-600 mt-1.5 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {photoError || error}
        </p>
      )}
    </div>
  );
};

/**
 * Add or edit a staff member. Used for both: pass `member` to edit, leave it out to add.
 * Everything can be changed later by opening the profile and choosing Edit.
 */
export const StaffFormModal = ({ member, currentBranch, onClose, onSave }) => {
  const isEdit = Boolean(member);
  const [roles] = useState(() => allRoleOptions());
  const [form, setForm] = useState(() => (member ? staffToForm(member, roles) : emptyStaffForm()));
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const err = (key) => (submitted ? errors[key] : undefined);

  /* bank accounts */
  const updateBank = (id, patch) =>
    set({ bankAccounts: form.bankAccounts.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
  const addBank = () => set({ bankAccounts: [...form.bankAccounts, emptyBankAccount(form.bankAccounts.length === 0)] });
  const setPrimaryBank = (id) =>
    set({ bankAccounts: form.bankAccounts.map((a) => ({ ...a, isPrimary: a.id === id })) });
  const removeBank = (id) => {
    const rest = form.bankAccounts.filter((a) => a.id !== id);
    if (rest.length && !rest.some((a) => a.isPrimary)) rest[0] = { ...rest[0], isPrimary: true };
    set({ bankAccounts: rest });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    const found = validateStaffForm(form);
    setErrors(found);
    if (Object.keys(found).length) {
      // jump to the first problem
      setTimeout(() => document.querySelector('[data-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
      return;
    }
    if (form.roleChoice === CUSTOM_ROLE) rememberCustomRole(form.customRole);
    onSave(buildStaffRecord(form, member, currentBranch.id));
  };

  const bankErrors = errors.banks || {};
  const errorCount = Object.keys(errors).length + Object.keys(bankErrors).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-stone-300 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col text-stone-900 shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-stone-200">
          <div>
            <h3 className="font-bold text-base text-stone-900">
              {isEdit ? `Edit Staff Profile: ${member.name}` : 'Add Hospital Staff Member'}
            </h3>
            <p className="text-[11px] text-stone-500">
              Branch: {currentBranch.name}. Fields marked * are required. Everything can be changed later.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-stone-500 hover:text-stone-900 p-1" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-xs">
          {submitted && errorCount > 0 && (
            <div className="rounded-xl border border-red-300 bg-red-50 text-red-800 px-3 py-2 text-[11px] font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Please correct the {errorCount} highlighted item{errorCount > 1 ? 's' : ''} below.
            </div>
          )}

          {/* 1. Role */}
          <Section title="1. Designation & Employment">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Full Name" required error={err("name")}>
                <input
                  type="text"
                  placeholder="e.g. Dr. Akhilesh Tripathi"
                  value={form.name}
                  onChange={(e) => set({ name: e.target.value })}
                  data-invalid={!!err('name')}
                  className={`${inputCls(err('name'))} font-bold`}
                />
              </Field>

              <Field label="Designation / Role" required error={err('role')}>
                <select
                  value={form.roleChoice}
                  onChange={(e) => set({ roleChoice: e.target.value })}
                  className={inputCls(err('role'))}
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                  <option value={CUSTOM_ROLE}>+ Custom role (type your own)</option>
                </select>
              </Field>

              {form.roleChoice === CUSTOM_ROLE && (
                <Field label="Custom Designation" required error={err('customRole')} className="md:col-span-2">
                  <input
                    type="text"
                    placeholder="e.g. Yoga Instructor, Marma Specialist"
                    value={form.customRole}
                    onChange={(e) => set({ customRole: e.target.value })}
                    data-invalid={!!err('customRole')}
                    className={inputCls(err('customRole'))}
                  />
                </Field>
              )}

              <Field label="Date of Joining">
                <input
                  type="date"
                  value={form.joinDate}
                  onChange={(e) => set({ joinDate: e.target.value })}
                  className={inputCls()}
                />
              </Field>

              <Field label="Employment Status">
                <select value={form.status} onChange={(e) => set({ status: e.target.value })} className={inputCls()}>
                  {STAFF_STATUS_OPTIONS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          {/* 2. Personal & contact */}
          <Section title="2. Personal & Contact Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Mobile Number" required error={err('phone')}>
                <input
                  type="tel"
                  placeholder="10-digit mobile"
                  value={form.phone}
                  onChange={(e) => set({ phone: e.target.value })}
                  data-invalid={!!err('phone')}
                  className={`${inputCls(err('phone'))} font-mono`}
                />
              </Field>
              <Field label="Alternate Mobile" error={err('altPhone')}>
                <input
                  type="tel"
                  value={form.altPhone}
                  onChange={(e) => set({ altPhone: e.target.value })}
                  className={`${inputCls(err('altPhone'))} font-mono`}
                />
              </Field>
              <Field label="Email" error={err('email')}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set({ email: e.target.value })}
                  className={inputCls(err('email'))}
                />
              </Field>
              <Field label="Gender">
                <select value={form.gender} onChange={(e) => set({ gender: e.target.value })} className={inputCls()}>
                  <option value="">Select</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Date of Birth">
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => set({ dateOfBirth: e.target.value })}
                  className={inputCls()}
                />
              </Field>
              <Field label="Qualification (BAMS, DAMS, etc.)">
                <input
                  type="text"
                  value={form.qualification}
                  onChange={(e) => set({ qualification: e.target.value })}
                  className={inputCls()}
                />
              </Field>
              <Field label="Residential Address" className="md:col-span-2">
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) => set({ address: e.target.value })}
                  className={inputCls()}
                />
              </Field>
              <Field label="Emergency Contact Name">
                <input
                  type="text"
                  value={form.emergencyName}
                  onChange={(e) => set({ emergencyName: e.target.value })}
                  className={inputCls()}
                />
              </Field>
              <Field label="Emergency Contact Number" error={err('emergencyPhone')}>
                <input
                  type="tel"
                  value={form.emergencyPhone}
                  onChange={(e) => set({ emergencyPhone: e.target.value })}
                  className={`${inputCls(err('emergencyPhone'))} font-mono`}
                />
              </Field>
            </div>
          </Section>

          {/* 3. Identity documents */}
          <Section title="3. Identity Documents" hint="Aadhaar and PAN numbers, with photos of the cards. Use Take photo on a phone to capture them directly.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Aadhaar Number" required error={err('aadhaarNumber')}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="XXXX XXXX XXXX"
                  value={form.aadhaarNumber}
                  onChange={(e) => set({ aadhaarNumber: formatAadhaar(e.target.value) })}
                  data-invalid={!!err('aadhaarNumber')}
                  className={`${inputCls(err('aadhaarNumber'))} font-mono tracking-wider`}
                />
              </Field>
              <Field label="PAN Number" required error={err('panNumber')}>
                <input
                  type="text"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  value={form.panNumber}
                  onChange={(e) => set({ panNumber: e.target.value.toUpperCase() })}
                  data-invalid={!!err('panNumber')}
                  className={`${inputCls(err('panNumber'))} font-mono uppercase tracking-wider`}
                />
              </Field>

              <div data-invalid={!!err('aadhaarFront')}>
                <DocumentPhoto
                  label="Aadhaar Card: Front"
                  required
                  value={form.aadhaarFront}
                  onChange={(v) => set({ aadhaarFront: v })}
                  error={err('aadhaarFront')}
                  hint="Photo of the front side"
                />
              </div>
              <DocumentPhoto
                label="Aadhaar Card: Back"
                value={form.aadhaarBack}
                onChange={(v) => set({ aadhaarBack: v })}
                hint="Optional"
              />
              <div data-invalid={!!err('panPhoto')}>
                <DocumentPhoto
                  label="PAN Card"
                  required
                  value={form.panPhoto}
                  onChange={(v) => set({ panPhoto: v })}
                  error={err('panPhoto')}
                  hint="Photo of the PAN card"
                />
              </div>
              <DocumentPhoto
                label="Qualification Certificate"
                value={form.qualificationDoc}
                onChange={(v) => set({ qualificationDoc: v })}
                hint="Optional"
              />
            </div>
          </Section>

          {/* 4. Bank accounts */}
          <Section
            title="4. Bank Accounts & Salary Credit"
            hint="Add one or more accounts. Mark one as the salary account. Salaries are credited to it."
          >
            {(errors.bankNone && submitted) && (
              <p className="text-[11px] text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.bankNone}
              </p>
            )}

            <datalist id="bank-names">
              {COMMON_BANKS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>

            <div className="space-y-3">
              {form.bankAccounts.map((a, idx) => {
                const be = submitted ? bankErrors[a.id] || {} : {};
                return (
                  <div
                    key={a.id}
                    className={`rounded-xl border-2 p-3 space-y-3 ${
                      a.isPrimary ? 'border-emerald-600 bg-emerald-50/50' : 'border-stone-200 bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-800">Account {idx + 1}</span>
                        {a.isPrimary ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-white flex items-center gap-1">
                            <Star className="w-3 h-3" /> Salary credit account
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPrimaryBank(a.id)}
                            className="text-[11px] font-bold text-emerald-800 hover:underline"
                          >
                            Make this the salary account
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBank(a.id)}
                        className="text-[11px] font-semibold text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Field label="Bank Name" required error={be.bankName}>
                        <input
                          type="text"
                          list="bank-names"
                          placeholder="e.g. State Bank of India"
                          value={a.bankName}
                          onChange={(e) => updateBank(a.id, { bankName: e.target.value })}
                          className={inputCls(be.bankName)}
                        />
                      </Field>
                      <Field label="Account Holder Name" required error={be.accountHolder}>
                        <input
                          type="text"
                          value={a.accountHolder}
                          onChange={(e) => updateBank(a.id, { accountHolder: e.target.value })}
                          className={inputCls(be.accountHolder)}
                        />
                      </Field>
                      <Field label="Account Number" required error={be.accountNumber}>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={a.accountNumber}
                          onChange={(e) => updateBank(a.id, { accountNumber: e.target.value.replace(/\D/g, '') })}
                          className={`${inputCls(be.accountNumber)} font-mono`}
                        />
                      </Field>
                      <Field label="IFSC Code" required error={be.ifsc}>
                        <input
                          type="text"
                          placeholder="SBIN0001234"
                          maxLength={11}
                          value={a.ifsc}
                          onChange={(e) => updateBank(a.id, { ifsc: e.target.value.toUpperCase() })}
                          className={`${inputCls(be.ifsc)} font-mono uppercase`}
                        />
                      </Field>
                      <Field label="Account Type">
                        <select
                          value={a.accountType}
                          onChange={(e) => updateBank(a.id, { accountType: e.target.value })}
                          className={inputCls()}
                        >
                          {BANK_ACCOUNT_TYPES.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Branch">
                        <input
                          type="text"
                          value={a.branch}
                          onChange={(e) => updateBank(a.id, { branch: e.target.value })}
                          className={inputCls()}
                        />
                      </Field>
                    </div>

                    <DocumentPhoto
                      label="Passbook / Cancelled Cheque"
                      value={a.passbookPhoto}
                      onChange={(v) => updateBank(a.id, { passbookPhoto: v })}
                      hint="Optional"
                    />
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addBank}
              className="w-full py-2 rounded-xl border-2 border-dashed border-stone-300 hover:border-emerald-600 text-stone-600 hover:text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add another bank account
            </button>
          </Section>

          {/* 5. Salary */}
          <Section title="5. Salary & Incentive">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Monthly Base Salary (₹)" required error={err('monthlySalary')}>
                <input
                  type="number"
                  min={0}
                  value={form.monthlySalary}
                  onChange={(e) => set({ monthlySalary: e.target.value })}
                  className={`${inputCls(err('monthlySalary'))} font-bold`}
                />
              </Field>
              <Field label="Panchakarma Incentive (₹ per session)">
                <input
                  type="number"
                  min={0}
                  value={form.panchakarmaIncentiveRate}
                  onChange={(e) => set({ panchakarmaIncentiveRate: e.target.value })}
                  className={`${inputCls()} text-amber-700 font-bold`}
                />
              </Field>
            </div>
          </Section>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 sticky bottom-0 bg-white pb-1">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl font-semibold">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold shadow">
              {isEdit ? 'Save Changes' : 'Save Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
