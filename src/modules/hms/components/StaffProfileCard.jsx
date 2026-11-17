import React, { useState } from 'react';
import { Pencil, Eye, EyeOff, Landmark, ShieldCheck, AlertTriangle, Star, FileImage } from 'lucide-react';
import { maskAadhaar, maskAccount, formatAadhaar } from '../utils/staffHelpers';

const Info = ({ label, children }) => (
  <div>
    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{label}</div>
    <div className="text-xs text-stone-900 mt-0.5 break-words">{children || <span className="text-stone-400">—</span>}</div>
  </div>
);

const DocTile = ({ label, src }) => (
  <div className="rounded-xl border border-stone-200 bg-stone-50 p-2.5">
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-[11px] font-bold text-stone-800">{label}</span>
      {src ? (
        <a href={src} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-emerald-800 hover:underline">
          Open full size
        </a>
      ) : null}
    </div>
    {src ? (
      <a href={src} target="_blank" rel="noreferrer" title="Open full size">
        <img src={src} alt={label} className="h-28 w-full object-contain rounded-lg bg-white border border-stone-200" />
      </a>
    ) : (
      <div className="h-28 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 flex flex-col items-center justify-center text-[11px] text-amber-800">
        <FileImage className="w-5 h-5 mb-1" />
        Not uploaded yet
      </div>
    )}
  </div>
);

/** Profile of the selected staff member: details, ID numbers, document photos and bank accounts. */
export const StaffProfileCard = ({ member, onEdit }) => {
  const [showIds, setShowIds] = useState(false);
  const docs = member.documents || {};
  const banks = member.bankAccounts?.length
    ? member.bankAccounts
    : member.bankAccount
      ? [{ id: 'legacy', bankName: member.bankAccount, accountNumber: '', isPrimary: true, accountType: '', ifsc: '', accountHolder: '' }]
      : [];

  const missing = [];
  if (!member.aadhaarNumber) missing.push('Aadhaar number');
  if (!member.panNumber) missing.push('PAN number');
  if (!docs.aadhaarFront) missing.push('Aadhaar front photo');
  if (!docs.panCard) missing.push('PAN card photo');
  if (!banks.some((b) => b.isPrimary)) missing.push('salary bank account');

  const statusCls =
    member.status === 'Active'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : member.status === 'On Leave'
        ? 'bg-amber-50 text-amber-800 border-amber-200'
        : 'bg-stone-100 text-stone-600 border-stone-300';

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-lg space-y-5">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-700 text-white font-black text-lg flex items-center justify-center shrink-0">
            {(member.name || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base text-stone-900">{member.name}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCls}`}>
                {member.status || 'Active'}
              </span>
            </div>
            <div className="text-xs text-amber-700 font-semibold">{member.role}</div>
            <div className="text-[11px] text-stone-500">Joined {member.joinDate || '—'}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit Profile
        </button>
      </div>

      {missing.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Profile incomplete: <strong>{missing.join(', ')}</strong>. Use Edit Profile to add them.
          </span>
        </div>
      )}

      {/* personal */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">Personal & Contact</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
          <Info label="Mobile">
            <span className="font-mono">{member.phone}</span>
          </Info>
          <Info label="Alternate Mobile">
            <span className="font-mono">{member.altPhone}</span>
          </Info>
          <Info label="Email">{member.email}</Info>
          <Info label="Gender">{member.gender}</Info>
          <Info label="Date of Birth">{member.dateOfBirth}</Info>
          <Info label="Qualification">{member.qualification}</Info>
          <div className="col-span-2 md:col-span-3">
            <Info label="Address">{member.address}</Info>
          </div>
          <Info label="Emergency Contact">
            {member.emergencyContact?.name || member.emergencyContact?.phone
              ? `${member.emergencyContact?.name || ''} ${member.emergencyContact?.phone ? `(${member.emergencyContact.phone})` : ''}`
              : null}
          </Info>
        </div>
      </div>

      {/* identity */}
      <div className="rounded-xl bg-stone-50 border border-stone-200 p-3.5">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Identity Numbers
          </h4>
          <button
            type="button"
            onClick={() => setShowIds((v) => !v)}
            className="text-[11px] font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1"
          >
            {showIds ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showIds ? 'Hide' : 'Show full numbers'}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Info label="Aadhaar Number">
            <span className="font-mono tracking-wider">
              {member.aadhaarNumber ? (showIds ? formatAadhaar(member.aadhaarNumber) : maskAadhaar(member.aadhaarNumber)) : null}
            </span>
          </Info>
          <Info label="PAN Number">
            <span className="font-mono tracking-wider">{member.panNumber}</span>
          </Info>
        </div>
      </div>

      {/* documents */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">Document Photos</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <DocTile label="Aadhaar: Front" src={docs.aadhaarFront} />
          <DocTile label="Aadhaar: Back" src={docs.aadhaarBack} />
          <DocTile label="PAN Card" src={docs.panCard} />
          <DocTile label="Qualification" src={docs.qualificationDoc} />
        </div>
      </div>

      {/* bank accounts */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5" /> Bank Accounts
        </h4>
        {banks.length === 0 ? (
          <p className="text-xs text-stone-500">No bank account added yet.</p>
        ) : (
          <div className="space-y-2">
            {banks.map((b) => (
              <div
                key={b.id}
                className={`rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                  b.isPrimary ? 'border-emerald-600 bg-emerald-50/60' : 'border-stone-200 bg-white'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-stone-900 flex items-center gap-2 flex-wrap">
                    {b.bankName || 'Bank'}
                    {b.accountType && <span className="text-[10px] font-semibold text-stone-500">({b.accountType})</span>}
                  </div>
                  <div className="text-stone-600">
                    {b.accountHolder && <span>{b.accountHolder} · </span>}
                    <span className="font-mono">{b.accountNumber ? maskAccount(b.accountNumber) : ''}</span>
                    {b.ifsc && <span className="font-mono"> · {b.ifsc}</span>}
                    {b.branch && <span> · {b.branch}</span>}
                  </div>
                </div>
                {b.isPrimary ? (
                  <span className="self-start sm:self-center text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-700 text-white flex items-center gap-1 shrink-0">
                    <Star className="w-3 h-3" /> Salary credited here
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
