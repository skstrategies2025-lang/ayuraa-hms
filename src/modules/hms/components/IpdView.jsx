import React, { useMemo, useState } from 'react';
import {
  BedDouble, Plus, Search, X, Stethoscope, ClipboardList, LogOut, ArrowRightLeft, HeartPulse, AlertTriangle,
  Printer, Trash2, Wrench, Info, CheckCircle2,
} from 'lucide-react';
import { AyurStorage } from '../services/storage';

/* ───────────── helpers ───────────── */
const BED_TYPES = ['General Ward', 'Semi-Private', 'Private', 'Deluxe', 'Panchakarma Suite', 'ICU'];
const DISCHARGE_TYPES = ['Normal', 'Discharge on Request (LAMA)', 'Referred', 'Absconded', 'Expired'];
const ROUND_DUE_HOURS = 12;

const localDT = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const parse = (s) => (s ? new Date(s) : new Date());
const fmtDT = (s) => (s ? parse(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
const fmtD = (s) => (s ? parse(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const hoursSince = (s) => (Date.now() - parse(s).getTime()) / 3600000;
const daysBetween = (a, b) => Math.max(1, Math.ceil((parse(b).getTime() - parse(a).getTime()) / 86400000));
const uid = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const money = (cur, n) => `${cur || '₹'}${Math.round(n || 0).toLocaleString('en-IN')}`;

const inputCls = 'w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40';
const btnPrimary = 'px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed';
const btnGhost = 'px-3 py-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5';

const Field = ({ label, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">{label}</span>
    {children}
  </label>
);

const Modal = ({ title, subtitle, onClose, children, wide }) => (
  <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
    <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} my-6`}>
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-stone-200">
        <div>
          <h3 className="text-base font-black text-stone-900">{title}</h3>
          {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
        </div>
        <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

const Pill = ({ tone = 'stone', children }) => {
  const tones = {
    stone: 'bg-stone-100 text-stone-700 border-stone-200',
    green: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-sky-50 text-sky-800 border-sky-200',
  };
  return <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${tones[tone]}`}>{children}</span>;
};

/** Beds the screen treats as occupied = the bed of every patient currently admitted. */
const currentBed = (adm) => adm.bedHistory?.[adm.bedHistory.length - 1];
const lastRound = (adm) => (adm.rounds || []).reduce((m, r) => (!m || parse(r.at) > parse(m.at) ? r : m), null);
const roundDue = (adm) => {
  const lr = lastRound(adm);
  return hoursSince(lr ? lr.at : adm.admittedAt) >= ROUND_DUE_HOURS;
};

/* ═════════════════════════ main view ═════════════════════════ */
export const IpdView = ({ patients, beds, admissions, currentBranch, config, staff = [], staffRole, ipdLocal }) => {
  const cur = config?.currency || '₹';
  const canAdmit = ['hms_admin', 'doctor', 'nurse', 'reception'].includes(staffRole);
  const canDischarge = ['hms_admin', 'doctor'].includes(staffRole);
  const canManageBeds = ['hms_admin', 'nurse'].includes(staffRole);

  const [tab, setTab] = useState('admissions');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Admitted');
  const [admitFor, setAdmitFor] = useState(null); // { bedId? }
  const [openId, setOpenId] = useState(null);
  const [roundFor, setRoundFor] = useState(null);
  const [dischargeId, setDischargeId] = useState(null);
  const [showBeds, setShowBeds] = useState(false);

  const branchBeds = useMemo(() => beds.filter((b) => b.branchId === currentBranch.id), [beds, currentBranch.id]);
  const branchAdm = useMemo(() => admissions.filter((a) => a.branchId === currentBranch.id), [admissions, currentBranch.id]);
  const active = branchAdm.filter((a) => a.status === 'Admitted');
  const occupied = useMemo(() => Object.fromEntries(active.map((a) => [currentBed(a)?.bedId, a])), [active]);
  const freeBeds = branchBeds.filter((b) => !occupied[b.id] && !b.outOfService);
  const dischargedToday = branchAdm.filter((a) => a.status === 'Discharged' && a.discharge?.at?.slice(0, 10) === localDT().slice(0, 10)).length;
  const roundsDue = active.filter(roundDue).length;
  const openAdm = admissions.find((a) => a.id === openId);

  const list = branchAdm
    .filter((a) => filter === 'All' || a.status === filter)
    .filter((a) => {
      const q = search.toLowerCase();
      return !q || [a.patientName, a.uhid, a.admissionNo, a.doctor, a.diagnosis].some((v) => (v || '').toLowerCase().includes(q));
    })
    .sort((a, b) => parse(b.admittedAt) - parse(a.admittedAt));

  const stats = [
    { label: 'Admitted now', value: active.length, icon: BedDouble },
    { label: 'Beds free / total', value: `${freeBeds.length} / ${branchBeds.length}`, icon: CheckCircle2 },
    { label: `Rounds due (>${ROUND_DUE_HOURS}h)`, value: roundsDue, icon: HeartPulse, alert: roundsDue > 0 },
    { label: 'Discharged today', value: dischargedToday, icon: LogOut },
  ];

  const TABS = [['admissions', 'Admissions'], ['beds', 'Bed Board'], ['rounds', 'Rounds'], ['discharges', 'Discharges']];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <h2 className="text-xl font-serif font-black text-stone-900 flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-amber-700" /> Inpatient Department (IPD)
          </h2>
          <p className="text-xs text-stone-500">Admissions, bed allocation, daily rounds and discharge for {currentBranch.name}</p>
        </div>
        {canAdmit && (
          <button onClick={() => setAdmitFor({})} className={btnPrimary}><Plus className="w-4 h-4" /> Admit Patient</button>
        )}
      </div>

      {ipdLocal && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>The server has no IPD tables yet, so inpatient data is saved <strong>only in this browser</strong> and is not shared with colleagues. Install the IPD backend patch (see <code>ipd-backend-patch/</code>) and reload to save it in the database.</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`bg-white border rounded-2xl p-4 shadow-sm ${s.alert ? 'border-amber-300' : 'border-stone-200'}`}>
            <div className="flex items-center justify-between text-stone-500"><span className="text-[11px] font-semibold">{s.label}</span><s.icon className={`w-4 h-4 ${s.alert ? 'text-amber-600' : 'text-emerald-700'}`} /></div>
            <div className="mt-1 text-2xl font-black text-stone-900">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 bg-stone-50 p-1 rounded-xl border border-stone-200 text-xs w-full sm:w-fit overflow-x-auto">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`px-4 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${tab === id ? 'bg-emerald-700 text-white shadow' : 'text-stone-500 hover:text-stone-800'}`}>{label}</button>
        ))}
      </div>

      {/* ───────── Admissions ───────── */}
      {tab === 'admissions' && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient, UHID, admission no., doctor, diagnosis…" className={`${inputCls} pl-9`} />
            </div>
            <div className="flex gap-1.5 bg-stone-50 p-1 rounded-xl border border-stone-200 text-xs w-full sm:w-auto">
              {['Admitted', 'Discharged', 'All'].map((s) => (
                <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-lg font-bold ${filter === s ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-500 hover:text-stone-800'}`}>{s}</button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase tracking-wider">
                <tr>{['Admission', 'Patient', 'Bed', 'Doctor / Diagnosis', 'Admitted', 'Status', ''].map((h) => <th key={h} className="text-left px-4 py-3 font-bold">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {list.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-stone-500">No admissions found.</td></tr>}
                {list.map((a) => (
                  <tr key={a.id} onClick={() => setOpenId(a.id)} className="hover:bg-emerald-50/40 cursor-pointer">
                    <td className="px-4 py-3 font-mono font-bold text-amber-700">{a.admissionNo}</td>
                    <td className="px-4 py-3"><div className="font-bold text-stone-900">{a.patientName}</div><div className="text-[10px] text-stone-500">{a.uhid}</div></td>
                    <td className="px-4 py-3">{currentBed(a)?.bedLabel || '—'}</td>
                    <td className="px-4 py-3"><div>{a.doctor || '—'}</div><div className="text-[10px] text-stone-500 truncate max-w-[220px]">{a.diagnosis}</div></td>
                    <td className="px-4 py-3">{fmtDT(a.admittedAt)}</td>
                    <td className="px-4 py-3 space-x-1">
                      <Pill tone={a.status === 'Admitted' ? 'green' : 'stone'}>{a.status}</Pill>
                      {a.status === 'Admitted' && roundDue(a) && <Pill tone="amber">Round due</Pill>}
                    </td>
                    <td className="px-4 py-3 text-stone-400">›</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────── Bed board ───────── */}
      {tab === 'beds' && (
        <BedBoard beds={branchBeds} occupied={occupied} cur={cur} canManage={canManageBeds} canAdmit={canAdmit}
          onAdmit={(bedId) => setAdmitFor({ bedId })} onOpen={(id) => setOpenId(id)} onSetup={() => setShowBeds(true)} />
      )}

      {/* ───────── Rounds ───────── */}
      {tab === 'rounds' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {active.length === 0 && <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-xs">No patients are admitted right now.</div>}
          {[...active].sort((a, b) => Number(roundDue(b)) - Number(roundDue(a))).map((a) => {
            const lr = lastRound(a);
            return (
              <div key={a.id} className={`bg-white border rounded-2xl p-5 shadow-sm space-y-3 ${roundDue(a) ? 'border-amber-300' : 'border-stone-200'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <button onClick={() => setOpenId(a.id)} className="font-black text-stone-900 hover:underline text-left">{a.patientName}</button>
                    <div className="text-[11px] text-stone-500">{currentBed(a)?.bedLabel} · {a.doctor || 'Doctor not set'}</div>
                  </div>
                  {roundDue(a) ? <Pill tone="amber">Due</Pill> : <Pill tone="green">Up to date</Pill>}
                </div>
                {lr ? (
                  <div className="text-xs bg-stone-50 rounded-xl p-3 border border-stone-200">
                    <div className="flex justify-between text-[10px] text-stone-500 mb-1"><span>{lr.type} round · {lr.by || '—'}</span><span>{fmtDT(lr.at)}</span></div>
                    <VitalsLine v={lr.vitals} />
                    {lr.notes && <p className="mt-1 text-stone-700 line-clamp-3">{lr.notes}</p>}
                  </div>
                ) : <p className="text-xs text-stone-500">No round recorded yet since admission ({fmtDT(a.admittedAt)}).</p>}
                <button onClick={() => setRoundFor(a.id)} className={btnPrimary}><Stethoscope className="w-4 h-4" /> Record round</button>
              </div>
            );
          })}
        </div>
      )}

      {/* ───────── Discharges ───────── */}
      {tab === 'discharges' && (
        <div className="space-y-4">
          {canDischarge && active.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">Ready to discharge?</div>
              <div className="flex flex-wrap gap-2">
                {active.map((a) => <button key={a.id} onClick={() => setDischargeId(a.id)} className={btnGhost}><LogOut className="w-3.5 h-3.5" /> {a.patientName} · {currentBed(a)?.bedLabel}</button>)}
              </div>
            </div>
          )}
          <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase tracking-wider">
                <tr>{['Patient', 'Admitted', 'Discharged', 'Stay', 'Type', 'Follow-up', ''].map((h) => <th key={h} className="text-left px-4 py-3 font-bold">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {branchAdm.filter((a) => a.status === 'Discharged').length === 0 && <tr><td colSpan={7} className="p-10 text-center text-stone-500">No discharges yet.</td></tr>}
                {branchAdm.filter((a) => a.status === 'Discharged').sort((a, b) => parse(b.discharge?.at) - parse(a.discharge?.at)).map((a) => (
                  <tr key={a.id} className="hover:bg-emerald-50/40">
                    <td className="px-4 py-3"><div className="font-bold">{a.patientName}</div><div className="text-[10px] text-stone-500">{a.admissionNo}</div></td>
                    <td className="px-4 py-3">{fmtD(a.admittedAt)}</td>
                    <td className="px-4 py-3">{fmtD(a.discharge?.at)}</td>
                    <td className="px-4 py-3">{daysBetween(a.admittedAt, a.discharge?.at)} day(s)</td>
                    <td className="px-4 py-3"><Pill tone={a.discharge?.type === 'Normal' ? 'green' : 'amber'}>{a.discharge?.type}</Pill></td>
                    <td className="px-4 py-3">{a.discharge?.followUpDate ? fmtD(a.discharge.followUpDate) : '—'}</td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button onClick={() => printSummary(a, currentBranch, config)} className={btnGhost}><Printer className="w-3.5 h-3.5" /> Summary</button>
                      <button onClick={() => setOpenId(a.id)} className={btnGhost}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────── modals ───────── */}
      {admitFor && (
        <AdmitModal patients={patients} admissions={admissions} freeBeds={freeBeds} presetBedId={admitFor.bedId} currentBranch={currentBranch} staff={staff} cur={cur}
          onClose={() => setAdmitFor(null)} onDone={(id) => { setAdmitFor(null); setOpenId(id); }} />
      )}
      {openAdm && !dischargeId && !roundFor && (
        <DetailModal adm={openAdm} freeBeds={freeBeds} cur={cur} canDischarge={canDischarge} onClose={() => setOpenId(null)}
          onRound={() => setRoundFor(openAdm.id)} onDischarge={() => setDischargeId(openAdm.id)} onPrint={() => printSummary(openAdm, currentBranch, config)} />
      )}
      {roundFor && admissions.find((a) => a.id === roundFor) && (
        <RoundModal adm={admissions.find((a) => a.id === roundFor)} staffRole={staffRole} onClose={() => setRoundFor(null)} />
      )}
      {dischargeId && admissions.find((a) => a.id === dischargeId) && (
        <DischargeModal adm={admissions.find((a) => a.id === dischargeId)} cur={cur} currentBranch={currentBranch}
          onClose={() => setDischargeId(null)} onDone={() => setDischargeId(null)} />
      )}
      {showBeds && <BedSetupModal currentBranch={currentBranch} onClose={() => setShowBeds(false)} />}
    </div>
  );
};

/* ═════════════════════════ bed board ═════════════════════════ */
const BedBoard = ({ beds, occupied, cur, canManage, canAdmit, onAdmit, onOpen, onSetup }) => {
  const wards = [...new Set(beds.map((b) => b.ward))];
  if (beds.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-3">
        <BedDouble className="w-8 h-8 mx-auto text-stone-400" />
        <p>No beds are set up for this branch yet.</p>
        {canManage ? <button onClick={onSetup} className={`${btnPrimary} mx-auto`}><Plus className="w-4 h-4" /> Set up ward & beds</button> : <p>Ask a hospital admin or nurse in charge to add them.</p>}
      </div>
    );
  }
  const toggleService = (b) => AyurStorage.updateIpdBed({ ...b, outOfService: !b.outOfService });
  const remove = (b) => { if (window.confirm(`Delete bed ${b.bedNo}?`)) AyurStorage.deleteIpdBed(b.id); };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-[11px] text-stone-600">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Free</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500" /> Occupied</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-stone-400" /> Out of service</span>
        </div>
        {canManage && <button onClick={onSetup} className={btnGhost}><Plus className="w-3.5 h-3.5" /> Add beds</button>}
      </div>
      {wards.map((w) => {
        const wb = beds.filter((b) => b.ward === w).sort((a, b) => a.bedNo.localeCompare(b.bedNo, undefined, { numeric: true }));
        return (
          <div key={w} className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-black text-stone-900 text-sm">{w}</h4>
              <span className="text-[11px] text-stone-500">{wb.filter((b) => occupied[b.id]).length}/{wb.length} occupied · {wb[0].type} · {money(cur, wb[0].ratePerDay)}/day</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {wb.map((b) => {
                const adm = occupied[b.id];
                const tone = adm ? 'border-amber-300 bg-amber-50' : b.outOfService ? 'border-stone-300 bg-stone-100' : 'border-emerald-300 bg-emerald-50';
                return (
                  <div key={b.id} className={`rounded-xl border p-3 text-xs ${tone}`}>
                    <div className="flex items-center justify-between"><span className="font-black text-stone-900">{b.bedNo}</span><BedDouble className="w-4 h-4 text-stone-500" /></div>
                    {adm ? (
                      <button onClick={() => onOpen(adm.id)} className="mt-1.5 text-left w-full">
                        <div className="font-bold text-stone-800 truncate">{adm.patientName}</div>
                        <div className="text-[10px] text-stone-500">Day {daysBetween(adm.admittedAt, new Date().toISOString())}{roundDue(adm) ? ' · round due' : ''}</div>
                      </button>
                    ) : b.outOfService ? <div className="mt-1.5 text-[10px] text-stone-500">Out of service</div> : (
                      canAdmit ? <button onClick={() => onAdmit(b.id)} className="mt-1.5 text-[11px] font-bold text-emerald-800 hover:underline">+ Admit here</button> : <div className="mt-1.5 text-[10px] text-emerald-800">Available</div>
                    )}
                    {canManage && !adm && (
                      <div className="mt-2 flex gap-1">
                        <button title={b.outOfService ? 'Put back in service' : 'Mark out of service'} onClick={() => toggleService(b)} className="p-1 rounded hover:bg-white/70 text-stone-500"><Wrench className="w-3.5 h-3.5" /></button>
                        <button title="Delete bed" onClick={() => remove(b)} className="p-1 rounded hover:bg-white/70 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ═════════════════════════ bed setup ═════════════════════════ */
const BedSetupModal = ({ currentBranch, onClose }) => {
  const [ward, setWard] = useState('General Ward');
  const [prefix, setPrefix] = useState('G-');
  const [count, setCount] = useState(6);
  const [type, setType] = useState('General Ward');
  const [rate, setRate] = useState(800);
  const save = (e) => {
    e.preventDefault();
    const n = Math.min(Math.max(Number(count) || 0, 1), 60);
    const stamp = Date.now().toString(36);
    const newBeds = Array.from({ length: n }, (_, i) => ({
      id: `ipdbed-${stamp}${i}`, branchId: currentBranch.id, ward: ward.trim() || type, bedNo: `${prefix}${i + 1}`, type, ratePerDay: Number(rate) || 0, outOfService: false,
    }));
    AyurStorage.saveIpdBeds([...newBeds, ...AyurStorage.getIpdBeds()]);
    onClose();
  };
  return (
    <Modal title="Add ward & beds" subtitle="Creates a numbered set of beds in one ward" onClose={onClose}>
      <form onSubmit={save} className="grid grid-cols-2 gap-3">
        <Field label="Ward name"><input className={inputCls} value={ward} onChange={(e) => setWard(e.target.value)} required /></Field>
        <Field label="Bed type"><select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>{BED_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Bed number prefix"><input className={inputCls} value={prefix} onChange={(e) => setPrefix(e.target.value)} /></Field>
        <Field label="How many beds"><input type="number" min={1} max={60} className={inputCls} value={count} onChange={(e) => setCount(e.target.value)} /></Field>
        <Field label="Charge per day" className="col-span-2"><input type="number" min={0} className={inputCls} value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
        <div className="col-span-2 flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className={btnGhost}>Cancel</button><button className={btnPrimary}>Create beds</button></div>
      </form>
    </Modal>
  );
};

/* ═════════════════════════ admit ═════════════════════════ */
const AdmitModal = ({ patients, admissions, freeBeds, presetBedId, currentBranch, staff, cur, onClose, onDone }) => {
  const admittedIds = new Set(admissions.filter((a) => a.status === 'Admitted').map((a) => a.patientId));
  const [q, setQ] = useState('');
  const [patientId, setPatientId] = useState('');
  const [bedId, setBedId] = useState(presetBedId || freeBeds[0]?.id || '');
  const [doctor, setDoctor] = useState(currentBranch.doctorInCharge || '');
  const [diagnosis, setDiagnosis] = useState('');
  const [admissionType, setAdmissionType] = useState('Planned');
  const [admittedAt, setAdmittedAt] = useState(localDT());
  const [expected, setExpected] = useState('');
  const [attendant, setAttendant] = useState('');
  const [attendantPhone, setAttendantPhone] = useState('');
  const [advance, setAdvance] = useState(0);
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');

  const matches = patients.filter((p) => !q || [p.name, p.uhid, p.phone].some((v) => (v || '').toLowerCase().includes(q.toLowerCase()))).slice(0, 8);
  const patient = patients.find((p) => p.id === patientId);
  const bed = freeBeds.find((b) => b.id === bedId);

  const submit = (e) => {
    e.preventDefault();
    if (!patient) return setErr('Choose a patient.');
    if (admittedIds.has(patient.id)) return setErr('This patient is already admitted.');
    if (!bed) return setErr('Choose a free bed.');
    const adm = {
      id: uid('adm'),
      admissionNo: `ADM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: patient.id, patientName: patient.name, uhid: patient.uhid, patientPhone: patient.phone, age: patient.age, gender: patient.gender,
      branchId: currentBranch.id, status: 'Admitted', admissionType, admittedAt, date: admittedAt.slice(0, 10),
      expectedDischarge: expected || '', doctor, diagnosis, attendant, attendantPhone, advancePaid: Number(advance) || 0, notes,
      bedHistory: [{ bedId: bed.id, bedLabel: `${bed.ward} · ${bed.bedNo}`, rate: bed.ratePerDay, from: admittedAt, to: '' }],
      rounds: [],
    };
    AyurStorage.addIpdAdmission(adm);
    onDone(adm.id);
  };

  return (
    <Modal title="Admit patient" subtitle={currentBranch.name} onClose={onClose} wide>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Field label="Patient">
            {patient ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs">
                <span><strong>{patient.name}</strong> · {patient.uhid} · {patient.age ? `${patient.age}y` : ''} {patient.gender || ''}</span>
                <button type="button" onClick={() => setPatientId('')} className="text-stone-500 hover:text-stone-800"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <div>
                <input className={inputCls} placeholder="Search by name, UHID or phone…" value={q} onChange={(e) => setQ(e.target.value)} />
                <div className="mt-1 max-h-40 overflow-y-auto border border-stone-200 rounded-xl divide-y divide-stone-100">
                  {matches.length === 0 && <div className="p-3 text-xs text-stone-500">No patient found. Register the patient first from Patient Records.</div>}
                  {matches.map((p) => (
                    <button type="button" key={p.id} disabled={admittedIds.has(p.id)} onClick={() => setPatientId(p.id)} className="w-full text-left px-3 py-2 text-xs hover:bg-stone-50 disabled:opacity-50">
                      <strong>{p.name}</strong> <span className="text-stone-500">· {p.uhid} · {p.phone}</span>{admittedIds.has(p.id) && <span className="ml-2 text-amber-700">already admitted</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Field>
        </div>
        <Field label="Bed">
          <select className={inputCls} value={bedId} onChange={(e) => setBedId(e.target.value)} required>
            {freeBeds.length === 0 && <option value="">No free beds</option>}
            {freeBeds.map((b) => <option key={b.id} value={b.id}>{b.ward} · {b.bedNo} ({money(cur, b.ratePerDay)}/day)</option>)}
          </select>
        </Field>
        <Field label="Admitting doctor"><input list="ipd-doctors" className={inputCls} value={doctor} onChange={(e) => setDoctor(e.target.value)} /><datalist id="ipd-doctors">{staff.map((s) => <option key={s.id} value={s.name} />)}</datalist></Field>
        <Field label="Admission type"><select className={inputCls} value={admissionType} onChange={(e) => setAdmissionType(e.target.value)}>{['Planned', 'Emergency', 'Panchakarma Course', 'Transfer-in'].map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Admitted on"><input type="datetime-local" className={inputCls} value={admittedAt} onChange={(e) => setAdmittedAt(e.target.value)} required /></Field>
        <Field label="Diagnosis / reason" className="sm:col-span-2"><input className={inputCls} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Sandhigata Vata – Panchakarma course" required /></Field>
        <Field label="Expected discharge"><input type="date" className={inputCls} value={expected} onChange={(e) => setExpected(e.target.value)} /></Field>
        <Field label={`Advance deposit (${cur})`}><input type="number" min={0} className={inputCls} value={advance} onChange={(e) => setAdvance(e.target.value)} /></Field>
        <Field label="Attendant name"><input className={inputCls} value={attendant} onChange={(e) => setAttendant(e.target.value)} /></Field>
        <Field label="Attendant phone"><input className={inputCls} value={attendantPhone} onChange={(e) => setAttendantPhone(e.target.value)} /></Field>
        <Field label="Admission notes" className="sm:col-span-2"><textarea rows={2} className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        {err && <p className="sm:col-span-2 text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />{err}</p>}
        <div className="sm:col-span-2 flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className={btnGhost}>Cancel</button><button className={btnPrimary}>Admit</button></div>
      </form>
    </Modal>
  );
};

/* ═════════════════════════ admission detail ═════════════════════════ */
const VitalsLine = ({ v }) => {
  if (!v) return null;
  const parts = [v.bp && `BP ${v.bp}`, v.pulse && `Pulse ${v.pulse}`, v.temp && `Temp ${v.temp}°F`, v.spo2 && `SpO₂ ${v.spo2}%`, v.resp && `RR ${v.resp}`, v.weight && `${v.weight} kg`].filter(Boolean);
  return parts.length ? <div className="text-[11px] font-semibold text-stone-700">{parts.join(' · ')}</div> : null;
};

const DetailModal = ({ adm, freeBeds, cur, canDischarge, onClose, onRound, onDischarge, onPrint }) => {
  const [transferTo, setTransferTo] = useState('');
  const bed = currentBed(adm);
  const isActive = adm.status === 'Admitted';
  const rounds = [...(adm.rounds || [])].sort((a, b) => parse(b.at) - parse(a.at));

  const transfer = () => {
    const target = freeBeds.find((b) => b.id === transferTo);
    if (!target) return;
    const at = localDT();
    const history = adm.bedHistory.map((h, i) => (i === adm.bedHistory.length - 1 ? { ...h, to: at } : h));
    history.push({ bedId: target.id, bedLabel: `${target.ward} · ${target.bedNo}`, rate: target.ratePerDay, from: at, to: '' });
    AyurStorage.updateIpdAdmission({ ...adm, bedHistory: history });
    setTransferTo('');
  };

  return (
    <Modal title={adm.patientName} subtitle={`${adm.admissionNo} · ${adm.uhid || ''} · ${adm.age ? `${adm.age}y ` : ''}${adm.gender || ''}`} onClose={onClose} wide>
      <div className="space-y-5 text-xs">
        <div className="flex flex-wrap gap-2 items-center">
          <Pill tone={isActive ? 'green' : 'stone'}>{adm.status}</Pill><Pill tone="blue">{adm.admissionType}</Pill>
          {isActive && roundDue(adm) && <Pill tone="amber">Round due</Pill>}
          <div className="ml-auto flex flex-wrap gap-2">
            {isActive && <button onClick={onRound} className={btnPrimary}><Stethoscope className="w-4 h-4" /> Record round</button>}
            {isActive && canDischarge && <button onClick={onDischarge} className={btnGhost}><LogOut className="w-3.5 h-3.5" /> Discharge</button>}
            {!isActive && <button onClick={onPrint} className={btnGhost}><Printer className="w-3.5 h-3.5" /> Discharge summary</button>}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-stone-50 border border-stone-200 rounded-xl p-4">
          {[['Bed', bed?.bedLabel], ['Doctor', adm.doctor], ['Admitted', fmtDT(adm.admittedAt)], ['Expected discharge', adm.expectedDischarge ? fmtD(adm.expectedDischarge) : '—'],
            ['Attendant', [adm.attendant, adm.attendantPhone].filter(Boolean).join(' · ') || '—'], ['Advance paid', money(cur, adm.advancePaid)]].map(([k, v]) => (
            <div key={k}><div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">{k}</div><div className="font-semibold text-stone-900">{v || '—'}</div></div>
          ))}
          <div className="col-span-full"><div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">Diagnosis</div><div className="font-semibold">{adm.diagnosis}</div>{adm.notes && <div className="text-stone-600 mt-1">{adm.notes}</div>}</div>
        </div>

        {isActive && (
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Transfer to another bed" className="flex-1 min-w-[200px]">
              <select className={inputCls} value={transferTo} onChange={(e) => setTransferTo(e.target.value)}>
                <option value="">Select a free bed…</option>
                {freeBeds.map((b) => <option key={b.id} value={b.id}>{b.ward} · {b.bedNo} ({money(cur, b.ratePerDay)}/day)</option>)}
              </select>
            </Field>
            <button disabled={!transferTo} onClick={transfer} className={btnGhost}><ArrowRightLeft className="w-3.5 h-3.5" /> Transfer</button>
          </div>
        )}

        {adm.bedHistory?.length > 1 && (
          <div><div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-1">Bed history</div>
            <ul className="space-y-1">{adm.bedHistory.map((h, i) => <li key={i} className="text-stone-700">{h.bedLabel} <span className="text-stone-500">· {fmtDT(h.from)} → {h.to ? fmtDT(h.to) : 'now'}</span></li>)}</ul></div>
        )}

        <div>
          <div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-2 flex items-center gap-1"><ClipboardList className="w-3.5 h-3.5" /> Rounds ({rounds.length})</div>
          {rounds.length === 0 && <p className="text-stone-500">No rounds recorded yet.</p>}
          <ol className="space-y-2 border-l-2 border-emerald-200 pl-4">
            {rounds.map((r) => (
              <li key={r.id} className="relative">
                <span className="absolute -left-[22px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <div className="flex justify-between text-[10px] text-stone-500"><span><Pill tone={r.type === 'Doctor' ? 'blue' : 'green'}>{r.type}</Pill> {r.by}</span><span>{fmtDT(r.at)}</span></div>
                <VitalsLine v={r.vitals} />
                {r.notes && <p className="text-stone-800 mt-0.5">{r.notes}</p>}
                {r.orders && <p className="text-stone-600 mt-0.5"><strong>Orders:</strong> {r.orders}</p>}
              </li>
            ))}
          </ol>
        </div>

        {!isActive && adm.discharge && (
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">Discharge — {adm.discharge.type} · {fmtDT(adm.discharge.at)}</div>
            {adm.discharge.summary && <p><strong>Summary:</strong> {adm.discharge.summary}</p>}
            {adm.discharge.medicines && <p><strong>Medicines:</strong> {adm.discharge.medicines}</p>}
            {adm.discharge.advice && <p><strong>Advice / Pathya:</strong> {adm.discharge.advice}</p>}
            {adm.discharge.billTotal !== undefined && <p><strong>Bill:</strong> {money(cur, adm.discharge.billTotal)} · advance {money(cur, adm.advancePaid)} · balance {money(cur, adm.discharge.balance)}{adm.discharge.invoiceNumber ? ` · ${adm.discharge.invoiceNumber}` : ''}</p>}
          </div>
        )}
      </div>
    </Modal>
  );
};

/* ═════════════════════════ rounds ═════════════════════════ */
const RoundModal = ({ adm, staffRole, onClose }) => {
  const me = AyurStorage.getMe();
  const [type, setType] = useState(staffRole === 'nurse' ? 'Nurse' : 'Doctor');
  const [at, setAt] = useState(localDT());
  const [v, setV] = useState({ bp: '', pulse: '', temp: '', spo2: '', resp: '', weight: '' });
  const [notes, setNotes] = useState('');
  const [orders, setOrders] = useState('');
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

  const save = (e) => {
    e.preventDefault();
    const vitals = Object.fromEntries(Object.entries(v).filter(([, x]) => x !== ''));
    const round = { id: uid('rnd'), at, type, by: me?.user?.name || '', vitals, notes, orders };
    AyurStorage.updateIpdAdmission({ ...adm, rounds: [...(adm.rounds || []), round] });
    onClose();
  };
  return (
    <Modal title="Record round" subtitle={`${adm.patientName} · ${currentBed(adm)?.bedLabel}`} onClose={onClose}>
      <form onSubmit={save} className="grid grid-cols-3 gap-3">
        <Field label="Round by" className="col-span-1"><select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}><option>Doctor</option><option>Nurse</option></select></Field>
        <Field label="Time" className="col-span-2"><input type="datetime-local" className={inputCls} value={at} onChange={(e) => setAt(e.target.value)} required /></Field>
        <Field label="BP (mmHg)"><input className={inputCls} placeholder="120/80" value={v.bp} onChange={set('bp')} /></Field>
        <Field label="Pulse (/min)"><input type="number" className={inputCls} value={v.pulse} onChange={set('pulse')} /></Field>
        <Field label="Temp (°F)"><input type="number" step="0.1" className={inputCls} value={v.temp} onChange={set('temp')} /></Field>
        <Field label="SpO₂ (%)"><input type="number" className={inputCls} value={v.spo2} onChange={set('spo2')} /></Field>
        <Field label="Resp. rate"><input type="number" className={inputCls} value={v.resp} onChange={set('resp')} /></Field>
        <Field label="Weight (kg)"><input type="number" step="0.1" className={inputCls} value={v.weight} onChange={set('weight')} /></Field>
        <Field label="Clinical notes / progress" className="col-span-3"><textarea rows={3} className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Complaints, appetite, sleep, bowel, response to therapy…" /></Field>
        <Field label="Orders / plan" className="col-span-3"><textarea rows={2} className={inputCls} value={orders} onChange={(e) => setOrders(e.target.value)} placeholder="Medicines, therapies, diet changes, investigations…" /></Field>
        <div className="col-span-3 flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className={btnGhost}>Cancel</button><button className={btnPrimary}>Save round</button></div>
      </form>
    </Modal>
  );
};

/* ═════════════════════════ discharge ═════════════════════════ */
const DischargeModal = ({ adm, cur, currentBranch, onClose, onDone }) => {
  const [at, setAt] = useState(localDT());
  const [type, setType] = useState('Normal');
  const [finalDx, setFinalDx] = useState(adm.diagnosis || '');
  const [summary, setSummary] = useState('');
  const [medicines, setMedicines] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [makeInvoice, setMakeInvoice] = useState(true);
  const [discount, setDiscount] = useState(0);
  const [extra, setExtra] = useState([]); // extra charge lines

  const roomLines = adm.bedHistory.map((h, i) => {
    const to = i === adm.bedHistory.length - 1 ? at : h.to;
    return { id: `room-${i}`, description: `Room charges – ${h.bedLabel}`, quantity: daysBetween(h.from, to), unitPrice: h.rate || 0 };
  });
  const [lineEdits, setLineEdits] = useState({});
  const lines = [...roomLines.map((l) => ({ ...l, ...(lineEdits[l.id] || {}) })), ...extra].map((l) => ({ ...l, total: (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0) }));
  const subTotal = lines.reduce((s, l) => s + l.total, 0);
  const grand = Math.max(0, subTotal - (Number(discount) || 0));
  const balance = grand - (adm.advancePaid || 0); // negative = refund due

  const editLine = (l, k, val) => (l.id.startsWith('room-') ? setLineEdits({ ...lineEdits, [l.id]: { ...(lineEdits[l.id] || {}), [k]: val } }) : setExtra(extra.map((x) => (x.id === l.id ? { ...x, [k]: val } : x))));

  const submit = (e) => {
    e.preventDefault();
    if (parse(at) < parse(adm.admittedAt)) return window.alert('Discharge time cannot be before admission.');
    if (!window.confirm(`Discharge ${adm.patientName}? This frees the bed.`)) return;
    let invoiceNumber = '';
    if (makeInvoice && subTotal > 0) {
      invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      AyurStorage.addInvoice({
        id: uid('inv'), invoiceNumber, patientId: adm.patientId, patientName: adm.patientName, uhid: adm.uhid, date: at.slice(0, 10),
        items: lines.map((l, i) => ({ id: `item-${Date.now()}-${i}`, description: l.description, category: 'IPD', quantity: Number(l.quantity) || 0, unitPrice: Number(l.unitPrice) || 0, total: l.total })),
        subTotal, taxAmount: 0, discount: Number(discount) || 0, grandTotal: grand, paymentMode: 'Cash',
        paymentStatus: balance > 0 ? 'Pending' : 'Paid', branchId: currentBranch.id, admissionId: adm.id,
      });
    }
    const history = adm.bedHistory.map((h, i) => (i === adm.bedHistory.length - 1 ? { ...h, to: at } : h));
    AyurStorage.updateIpdAdmission({
      ...adm, status: 'Discharged', bedHistory: history,
      discharge: { at, type, finalDiagnosis: finalDx, summary, medicines, advice, followUpDate, billTotal: grand, balance, invoiceNumber },
    });
    onDone();
  };

  return (
    <Modal title="Discharge patient" subtitle={`${adm.patientName} · ${currentBed(adm)?.bedLabel} · admitted ${fmtDT(adm.admittedAt)}`} onClose={onClose} wide>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Discharge time"><input type="datetime-local" className={inputCls} value={at} onChange={(e) => setAt(e.target.value)} required /></Field>
        <Field label="Discharge type"><select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>{DISCHARGE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Final diagnosis" className="sm:col-span-2"><input className={inputCls} value={finalDx} onChange={(e) => setFinalDx(e.target.value)} required /></Field>
        <Field label="Course in hospital / summary" className="sm:col-span-2"><textarea rows={3} className={inputCls} value={summary} onChange={(e) => setSummary(e.target.value)} /></Field>
        <Field label="Medicines on discharge"><textarea rows={3} className={inputCls} value={medicines} onChange={(e) => setMedicines(e.target.value)} /></Field>
        <Field label="Advice / Pathya-Apathya"><textarea rows={3} className={inputCls} value={advice} onChange={(e) => setAdvice(e.target.value)} /></Field>
        <Field label="Follow-up date"><input type="date" className={inputCls} value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} /></Field>

        <div className="sm:col-span-2 border border-stone-200 rounded-xl overflow-hidden mt-1">
          <div className="flex items-center justify-between bg-stone-50 px-3 py-2"><span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Charges</span>
            <button type="button" onClick={() => setExtra([...extra, { id: uid('x'), description: 'Therapy / procedure', quantity: 1, unitPrice: 0 }])} className="text-[11px] font-bold text-emerald-800 hover:underline">+ Add charge</button></div>
          <div className="divide-y divide-stone-100">
            {lines.map((l) => (
              <div key={l.id} className="grid grid-cols-12 gap-2 px-3 py-2 items-center text-xs">
                <input className={`${inputCls} col-span-6`} value={l.description} disabled={l.id.startsWith('room-')} onChange={(e) => editLine(l, 'description', e.target.value)} />
                <input type="number" min={0} className={`${inputCls} col-span-2`} value={l.quantity} onChange={(e) => editLine(l, 'quantity', e.target.value)} />
                <input type="number" min={0} className={`${inputCls} col-span-2`} value={l.unitPrice} onChange={(e) => editLine(l, 'unitPrice', e.target.value)} />
                <div className="col-span-2 text-right font-bold">{money(cur, l.total)}</div>
              </div>
            ))}
          </div>
          <div className="bg-stone-50 px-3 py-2 text-xs space-y-1">
            <div className="flex justify-between items-center"><span>Discount</span><input type="number" min={0} className={`${inputCls} !w-28 text-right`} value={discount} onChange={(e) => setDiscount(e.target.value)} /></div>
            <div className="flex justify-between font-black text-sm"><span>Total</span><span>{money(cur, grand)}</span></div>
            <div className="flex justify-between text-stone-600"><span>Advance paid</span><span>− {money(cur, adm.advancePaid)}</span></div>
            <div className={`flex justify-between font-bold ${balance > 0 ? 'text-red-700' : 'text-emerald-800'}`}><span>{balance > 0 ? 'Balance due' : 'Refund due'}</span><span>{money(cur, Math.abs(balance))}</span></div>
          </div>
        </div>
        <label className="sm:col-span-2 flex items-center gap-2 text-xs text-stone-700"><input type="checkbox" checked={makeInvoice} onChange={(e) => setMakeInvoice(e.target.checked)} /> Create this bill as an invoice in Billing</label>
        <div className="sm:col-span-2 flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className={btnGhost}>Cancel</button><button className={btnPrimary}><LogOut className="w-4 h-4" /> Confirm discharge</button></div>
      </form>
    </Modal>
  );
};

/* ═════════════════════════ printable discharge summary ═════════════════════════ */
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function printSummary(a, branch, config) {
  const d = a.discharge || {};
  const rounds = [...(a.rounds || [])].sort((x, y) => parse(x.at) - parse(y.at));
  const w = window.open('', '_blank', 'width=800,height=900');
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>Discharge Summary – ${esc(a.patientName)}</title>
<style>body{font:13px/1.5 Inter,Arial,sans-serif;color:#0d2c20;padding:32px}h1{margin:0;font-size:20px}h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid #c3d4c9;padding-bottom:3px;margin-top:20px}table{width:100%;border-collapse:collapse}td{padding:3px 8px 3px 0;vertical-align:top}.mut{color:#64796e}</style></head><body>
<h1>${esc(config?.hospitalName || 'Hospital')}</h1><div class="mut">${esc(branch?.name || '')} ${esc(config?.address || '')}</div>
<h2>Discharge Summary</h2>
<table><tr><td class="mut">Patient</td><td><b>${esc(a.patientName)}</b> (${esc(a.uhid)}) ${esc(a.age || '')}${a.age ? 'y' : ''} ${esc(a.gender || '')}</td><td class="mut">Admission no.</td><td>${esc(a.admissionNo)}</td></tr>
<tr><td class="mut">Admitted</td><td>${esc(fmtDT(a.admittedAt))}</td><td class="mut">Discharged</td><td>${esc(fmtDT(d.at))} (${esc(d.type)})</td></tr>
<tr><td class="mut">Doctor</td><td>${esc(a.doctor)}</td><td class="mut">Bed</td><td>${esc(a.bedHistory?.map((h) => h.bedLabel).join(' → '))}</td></tr></table>
<h2>Diagnosis</h2><p>${esc(d.finalDiagnosis || a.diagnosis)}</p>
<h2>Course in hospital</h2><p>${esc(d.summary) || '—'}</p>
${rounds.length ? `<h2>Round notes</h2><table>${rounds.map((r) => `<tr><td class="mut" style="white-space:nowrap">${esc(fmtDT(r.at))}</td><td>${esc(r.type)}: ${esc(r.notes || '')} ${r.vitals ? `<span class="mut">${esc(Object.entries(r.vitals).map(([k, v]) => `${k} ${v}`).join(', '))}</span>` : ''}</td></tr>`).join('')}</table>` : ''}
<h2>Medicines on discharge</h2><p>${esc(d.medicines) || '—'}</p>
<h2>Advice / Pathya-Apathya</h2><p>${esc(d.advice) || '—'}</p>
<h2>Follow-up</h2><p>${d.followUpDate ? esc(fmtD(d.followUpDate)) : 'As advised'}</p>
<p style="margin-top:48px" class="mut">Doctor's signature: ______________________</p>
<script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}

export default IpdView;
