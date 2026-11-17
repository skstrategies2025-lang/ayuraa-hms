import React, { useState } from 'react';
import {
  Search,
  Plus,
  Activity,
  FileText,
  Image as ImageIcon,
  Share2,
  Download,
  Heart,
  X,
  Phone,
  Mail,
  Sparkles,
  BookOpen,
  Receipt,
  Utensils,
  Printer,
  Flame,
  User,
  CreditCard,
} from 'lucide-react';
import { AyurStorage } from '../services/storage';
import { ClinicalNoteTemplateModal } from './ClinicalNoteTemplateModal';
export const PatientsView = ({
  patients,
  currentBranch,
  config,
  onOpenNewPatient,
  onOpenPrescriptionForPatient,
  onNavigateToDietChart,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [doshaFilter, setDoshaFilter] = useState('All');
  const [selectedPatient, setSelectedPatient] = useState(patients[0] || null);
  const [activeTab, setActiveTab] = useState('overview');
  // Modals inside patient view
  const [showAddLabModal, setShowAddLabModal] = useState(false);
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFullDossierModal, setShowFullDossierModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  // Form states for adding blood report
  const [newLabTestName, setNewLabTestName] = useState('Routine Hemogram & ESR');
  const [newLabNotes, setNewLabNotes] = useState('');
  const [newLabParams, setNewLabParams] = useState([
    { parameter: 'Hemoglobin (Hb)', value: '12.5', unit: 'g/dL', normalRange: '12 - 16', status: 'Normal' },
    { parameter: 'ESR (1st Hour)', value: '28', unit: 'mm/hr', normalRange: '0 - 20', status: 'High' },
    { parameter: 'Serum Creatinine', value: '0.9', unit: 'mg/dL', normalRange: '0.6 - 1.2', status: 'Normal' },
  ]);
  // Form states for clinical image
  const [newImageTitle, setNewImageTitle] = useState('');
  const [newImageStage, setNewImageStage] = useState('Before Treatment');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageSite, setNewImageSite] = useState('');
  const [newImageDesc, setNewImageDesc] = useState('');
  const brandColor = config.themeColor || '#0f6240';
  // Cross-module patient records from storage
  const allProcedures = AyurStorage.getPanchakarma();
  const allInvoices = AyurStorage.getInvoices();
  const selectedPatientProcedures = selectedPatient
    ? allProcedures.filter(
        (p) => p.patientId === selectedPatient.id || p.patientName.toLowerCase() === selectedPatient.name.toLowerCase()
      )
    : [];
  const selectedPatientInvoices = selectedPatient
    ? allInvoices.filter((i) => i.patientId === selectedPatient.id || i.uhid === selectedPatient.uhid)
    : [];
  // Deep multi-attribute filtering across Name, UHID, Phone, Condition, Address, Age, Gender, Blood Group, Prakriti
  const filteredPatients = patients.filter((p) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q
      ? true
      : p.name.toLowerCase().includes(q) ||
        p.uhid.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.primaryCondition.toLowerCase().includes(q) ||
        (p.address && p.address.toLowerCase().includes(q)) ||
        (p.gender && p.gender.toLowerCase().startsWith(q)) ||
        String(p.age) === q ||
        (p.bloodGroup && p.bloodGroup.toLowerCase().includes(q)) ||
        (p.prakriti && p.prakriti.toLowerCase().includes(q));
    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'OPD'
          ? p.admissionStatus.includes('OPD')
          : statusFilter === 'IPD'
            ? p.admissionStatus.includes('IPD')
            : p.admissionStatus.includes('Daycare');
    const matchesDosha = doshaFilter === 'All' ? true : p.prakriti.includes(doshaFilter);
    return matchesSearch && matchesStatus && matchesDosha;
  });
  const handleAddBloodReport = (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    const newReport = {
      id: `rep-${Date.now()}`,
      testName: newLabTestName,
      testDate: new Date().toISOString().split('T')[0],
      sampleType: 'Venous Blood',
      labTechnician: 'Central Ayurvedic Pathology Lab',
      doctorNotes: newLabNotes,
      results: newLabParams,
    };
    const updatedPatient = {
      ...selectedPatient,
      bloodReports: [newReport, ...(selectedPatient.bloodReports || [])],
    };
    AyurStorage.updatePatient(updatedPatient);
    setSelectedPatient(updatedPatient);
    setShowAddLabModal(false);
    setNewLabNotes('');
  };
  const handleAddClinicalImage = (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    const newRecord = {
      id: `img-${Date.now()}`,
      title: newImageTitle || `${newImageStage} Record`,
      date: new Date().toISOString().split('T')[0],
      stage: newImageStage,
      imageUrl:
        newImageUrl || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
      description: newImageDesc,
      bodySite: newImageSite || 'Affected Area',
    };
    const updatedPatient = {
      ...selectedPatient,
      clinicalImages: [newRecord, ...(selectedPatient.clinicalImages || [])],
    };
    AyurStorage.updatePatient(updatedPatient);
    setSelectedPatient(updatedPatient);
    setShowAddImageModal(false);
    setNewImageTitle('');
    setNewImageUrl('');
    setNewImageDesc('');
    setNewImageSite('');
  };
  // When a template is loaded directly into the patient's visits
  const handleApplyTemplateToPatient = (tmpl) => {
    if (!selectedPatient) return;
    const newVisit = {
      id: `vis-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      doctorName: currentBranch.doctorInCharge,
      chiefComplaints: tmpl.soapSubjective,
      ashtavidhaPariksha: {
        nadi: `${tmpl.doshaPredominance} Gathi`,
        mutra: 'Prakruta',
        mala: 'Samanya',
        jihwa: 'Alpa Sama',
        shabda: 'Prakruta',
        sparsha: 'Sheeta-Snigdha',
        druk: 'Prakruta',
        aakruti: 'Madhyama',
      },
      agni: 'Visham (Irregular)',
      koshtha: 'Madhyama (Moderate)',
      vikriti: { vata: 50, pitta: 30, kapha: 20 },
      nidanaDiagnosis: tmpl.soapAssessment,
      chikitsaPlan: tmpl.soapPlan,
      panchakarmaPrescribed: tmpl.recommendedPanchakarma || [],
      prescriptions: tmpl.defaultPrescriptions || [],
      pathyaDiet: tmpl.pathyaDiet || 'Warm light food and boiled water',
      apathyaDiet: tmpl.apathyaDiet || 'Cold refrigerated food and day sleep',
      followUpDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    };
    const updated = {
      ...selectedPatient,
      clinicalVisits: [newVisit, ...(selectedPatient.clinicalVisits || [])],
    };
    AyurStorage.updatePatient(updated);
    setSelectedPatient(updated);
    setActiveTab('visits');
  };
  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: brandColor }}
            >
              Patient Dossier & EMR
            </span>
            <span className="text-xs text-stone-500 font-mono">{patients.length} Registered Patients</span>
          </div>
          <h2 className="text-2xl font-serif font-black text-stone-900 tracking-tight">
            Ayurvedic Clinical Records & Pathology History
          </h2>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl">
            Detailed patient profiles, blood test reports, clinical photography before/after Panchakarma, and Ashtavidha
            Pariksha consultation logs.
          </p>
        </div>

        <button
          onClick={onOpenNewPatient}
          className="px-4 py-2.5 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-2 self-start md:self-auto"
          style={{ backgroundColor: brandColor }}
        >
          <Plus className="w-4 h-4" />
          <span>New Patient Intake</span>
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Patient Directory (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-stone-200 rounded-2xl p-4 shadow-card space-y-3">
          {/* Search & Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Name, UHID, Age, Gender, City, Phone, Condition..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-1 bg-stone-100 p-1 rounded-xl text-[11px]">
              {['All', 'OPD', 'IPD', 'Daycare'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`flex-1 py-1 rounded-lg font-medium transition-all ${
                    statusFilter === tab
                      ? 'bg-white text-stone-900 font-bold shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Dosha Prakriti Filter Chips */}
            <div className="flex gap-1 pt-1 overflow-x-auto pb-0.5">
              {['All', 'Vata', 'Pitta', 'Kapha'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDoshaFilter(d)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold shrink-0 transition-all ${
                    doshaFilter === d
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {d === 'All' ? 'All Doshas' : `${d} Prakriti`}
                </button>
              ))}
            </div>
          </div>

          {/* Patient Cards List */}
          <div className="space-y-2 max-h-[72vh] overflow-y-auto pr-1">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-xs">No patients found.</div>
            ) : (
              filteredPatients.map((pat) => {
                const isSelected = selectedPatient?.id === pat.id;
                return (
                  <div
                    key={pat.id}
                    onClick={() => setSelectedPatient(pat)}
                    className={`p-3.5 rounded-xl cursor-pointer border transition-all text-left ${
                      isSelected
                        ? 'bg-white border-2 shadow'
                        : 'bg-stone-50/70 border-stone-200 hover:border-stone-300'
                    }`}
                    style={{
                      borderColor: isSelected ? brandColor : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900">{pat.name}</span>
                      <span className="font-mono text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-700 font-semibold">
                        {pat.uhid}
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1.5">
                      <span>
                        {pat.age}y · {pat.gender}
                      </span>
                      <span>·</span>
                      <span className="text-stone-700 font-semibold">{pat.prakriti}</span>
                    </div>

                    <div className="text-xs text-stone-600 mt-1 line-clamp-1">{pat.primaryCondition}</div>

                    <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px]">
                      <span className="text-stone-500 font-medium">{pat.admissionStatus.split(' ')[0]}</span>
                      <span className="text-stone-400 font-mono">{pat.phone}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Patient Dossier (8 cols) */}
        {selectedPatient ? (
          <div className="lg:col-span-8 space-y-4">
            {/* Patient Hero Summary Card */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-stone-100">
                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-serif font-black text-2xl shadow-sm shrink-0"
                    style={{ backgroundColor: brandColor }}
                  >
                    {selectedPatient.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-serif font-black text-stone-900">{selectedPatient.name}</h3>
                      <span className="font-mono text-xs bg-stone-100 px-2 py-0.5 rounded-lg text-stone-700 font-bold">
                        {selectedPatient.uhid}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 mt-1 flex flex-wrap items-center gap-2">
                      <span>
                        {selectedPatient.age} yrs · {selectedPatient.gender}
                      </span>
                      <span>·</span>
                      <span>
                        Blood: <strong>{selectedPatient.bloodGroup}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Registered: <strong>{selectedPatient.registeredDate}</strong>
                      </span>
                    </div>
                    <div className="text-xs text-stone-600 mt-1 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-stone-400" /> {selectedPatient.phone}
                      </span>
                      {selectedPatient.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-stone-400" /> {selectedPatient.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onOpenPrescriptionForPatient(selectedPatient)}
                    className="px-3.5 py-2 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                    style={{ backgroundColor: brandColor }}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Write Rx</span>
                  </button>

                  {onNavigateToDietChart && (
                    <button
                      onClick={() => onNavigateToDietChart(selectedPatient.id)}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-300 flex items-center gap-1.5 transition-all"
                    >
                      <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Prescribe Diet Chart</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowFullDossierModal(true)}
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold border border-stone-300 flex items-center gap-1.5 transition-all"
                    title="Print Complete Patient 360 Dossier"
                  >
                    <Printer className="w-3.5 h-3.5 text-stone-600" />
                    <span>Patient 360 EMR</span>
                  </button>

                  <button
                    onClick={() => setShowExportModal(true)}
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold border border-stone-200 flex items-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5 text-stone-500" />
                    <span>Referral Slip</span>
                  </button>
                </div>
              </div>

              {/* Prakriti & Condition Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block mb-1">
                    Prakriti (Constitution)
                  </span>
                  <span className="font-bold text-stone-900 text-sm">{selectedPatient.prakriti}</span>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block mb-1">
                    Chief Ayurvedic Condition
                  </span>
                  <span className="font-bold text-stone-900 text-sm line-clamp-1">
                    {selectedPatient.primaryCondition}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block mb-1">
                    Status / Cottage Room
                  </span>
                  <span className="font-bold text-stone-900 text-sm">{selectedPatient.admissionStatus}</span>
                </div>
              </div>

              {/* Dossier Tabs */}
              <div className="flex gap-1.5 mt-5 border-b border-stone-200 pb-2 overflow-x-auto">
                {[
                  { id: 'overview', label: 'Pariksha & Demographics', icon: Activity },
                  {
                    id: 'visits',
                    label: `Consultations (${selectedPatient.clinicalVisits?.length || 0})`,
                    icon: FileText,
                  },
                  { id: 'panchakarma', label: `Panchakarma (${selectedPatientProcedures.length})`, icon: Sparkles },
                  {
                    id: 'blood_tests',
                    label: `Lab Reports (${selectedPatient.bloodReports?.length || 0})`,
                    icon: Heart,
                  },
                  {
                    id: 'clinical_images',
                    label: `Photos (${selectedPatient.clinicalImages?.length || 0})`,
                    icon: ImageIcon,
                  },
                  { id: 'billing', label: `Billing & Accounts (${selectedPatientInvoices.length})`, icon: Receipt },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                        isActive
                          ? 'bg-stone-900 text-white font-bold shadow-sm'
                          : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TAB CONTENT 1: OVERVIEW & ASHTAVIDHA PARIKSHA */}
            {activeTab === 'overview' && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card space-y-5">
                <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Baseline Ashtavidha Pariksha (Classical Ayurvedic Diagnostics)
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">Nadi (Pulse)</span>
                    <span className="font-semibold text-stone-800">{selectedPatient.prakriti} Gathi</span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">Jihwa (Tongue)</span>
                    <span className="font-semibold text-stone-800">Alpa Sama (Mild coated)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">Agni (Digestion)</span>
                    <span className="font-semibold text-stone-800">Visham (Irregular)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">Koshtha (Bowels)</span>
                    <span className="font-semibold text-stone-800">Madhyama</span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">Mutra (Urine)</span>
                    <span className="font-semibold text-stone-800">Prakruta (Normal)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">Sparsha (Touch)</span>
                    <span className="font-semibold text-stone-800">Sheeta-Ruksha (Dry/Cool)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">Druk (Eyes/Vision)</span>
                    <span className="font-semibold text-stone-800">Prakruta</span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">Aakruti (Built)</span>
                    <span className="font-semibold text-stone-800">Madhyama</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                  <div className="font-bold text-stone-800">Emergency Contact:</div>
                  <div className="text-stone-600">
                    {selectedPatient.emergencyContact.name} ({selectedPatient.emergencyContact.relation}) ·{' '}
                    {selectedPatient.emergencyContact.phone}
                  </div>
                  <div className="font-bold text-stone-800 mt-2">Residential Address:</div>
                  <div className="text-stone-600">{selectedPatient.address}</div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: BLOOD TEST REPORTS */}
            {activeTab === 'blood_tests' && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-600" />
                    Laboratory Diagnostic Panels
                  </h4>
                  <button
                    onClick={() => setShowAddLabModal(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1"
                    style={{ backgroundColor: brandColor }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Lab Report</span>
                  </button>
                </div>

                {!selectedPatient.bloodReports || selectedPatient.bloodReports.length === 0 ? (
                  <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs">
                    No lab reports uploaded yet. Click "Upload Lab Report" to record diagnostic findings.
                  </div>
                ) : (
                  selectedPatient.bloodReports.map((report) => (
                    <div key={report.id} className="border border-stone-200 rounded-2xl p-4 bg-stone-50/50 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                        <div>
                          <h5 className="font-bold text-xs text-stone-900">{report.testName}</h5>
                          <span className="text-[11px] text-stone-500">
                            Date: {report.testDate} · Sample: {report.sampleType}
                          </span>
                        </div>
                        <span className="text-[11px] text-stone-600 font-medium">
                          Technician: {report.labTechnician}
                        </span>
                      </div>

                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="text-stone-500 border-b border-stone-200 text-[11px]">
                            <th className="py-1">Parameter</th>
                            <th className="py-1">Result</th>
                            <th className="py-1">Reference Range</th>
                            <th className="py-1 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {report.results.map((res, idx) => (
                            <tr key={idx} className="py-1">
                              <td className="py-1.5 font-medium text-stone-800">{res.parameter}</td>
                              <td className="py-1.5 font-bold font-mono">
                                {res.value} {res.unit}
                              </td>
                              <td className="py-1.5 text-stone-500">
                                {res.normalRange} {res.unit}
                              </td>
                              <td className="py-1.5 text-right">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    res.status === 'High'
                                      ? 'bg-red-50 text-red-700 border border-red-200'
                                      : res.status === 'Low'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  {res.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {report.doctorNotes && (
                        <div className="p-2.5 rounded-2xl bg-white border border-stone-200 text-xs text-stone-700 shadow-card">
                          <strong>Vaidya Correlation:</strong> {report.doctorNotes}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT 3: CLINICAL BEFORE/AFTER PHOTOS */}
            {activeTab === 'clinical_images' && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    Clinical Photography & Panchakarma Outcomes
                  </h4>
                  <button
                    onClick={() => setShowAddImageModal(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1"
                    style={{ backgroundColor: brandColor }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Clinical Photo</span>
                  </button>
                </div>

                {!selectedPatient.clinicalImages || selectedPatient.clinicalImages.length === 0 ? (
                  <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs">
                    No clinical photos attached. Capture Before & After photos for documented treatment outcomes.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedPatient.clinicalImages.map((img) => (
                      <div
                        key={img.id}
                        className="border border-stone-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between bg-stone-50"
                      >
                        <div>
                          <div className="relative aspect-video bg-stone-100 overflow-hidden">
                            <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
                            <span
                              className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[11px] font-bold shadow-sm ${
                                img.stage === 'Before Treatment'
                                  ? 'bg-red-600 text-white'
                                  : img.stage === 'During Panchakarma'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-emerald-600 text-white'
                              }`}
                            >
                              {img.stage}
                            </span>
                            <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-mono bg-black/75 text-white">
                              {img.date}
                            </span>
                          </div>

                          <div className="p-3.5 space-y-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-bold text-stone-900 text-xs">{img.title}</h5>
                              <span className="text-[10px] text-stone-600 bg-stone-200 px-1.5 py-0.5 rounded">
                                {img.bodySite}
                              </span>
                            </div>
                            <p className="text-xs text-stone-600 leading-relaxed mt-1">{img.description}</p>
                          </div>
                        </div>

                        <div className="p-2.5 border-t border-stone-200 bg-white flex justify-end">
                          <button
                            onClick={() => setShowExportModal(true)}
                            className="text-xs text-stone-700 hover:text-stone-900 font-semibold flex items-center gap-1"
                          >
                            <Share2 className="w-3.5 h-3.5 text-stone-500" />
                            <span>Referral Export</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 4: CLINICAL VISITS & NOTE TEMPLATES */}
            {activeTab === 'visits' && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
                  <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Clinical Consultation History
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowTemplateModal(true)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold border border-stone-300 flex items-center gap-1.5 transition-all"
                      title="Load pre-configured or saved clinical note template"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                      <span>Load Note Template</span>
                    </button>
                    <button
                      onClick={() => onOpenPrescriptionForPatient(selectedPatient)}
                      className="px-3.5 py-1.5 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                      style={{ backgroundColor: brandColor }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Write Full Rx</span>
                    </button>
                  </div>
                </div>

                {!selectedPatient.clinicalVisits || selectedPatient.clinicalVisits.length === 0 ? (
                  <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs">
                    No clinical visit records found. Click "Load Note Template" to quickly populate an Arthritis,
                    Panchakarma, or custom consultation note.
                  </div>
                ) : (
                  selectedPatient.clinicalVisits.map((visit) => (
                    <div key={visit.id} className="border border-stone-200 rounded-2xl p-5 bg-stone-50/50 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-200 gap-2">
                        <div>
                          <div className="font-bold text-sm text-stone-900">{visit.doctorName}</div>
                          <div className="text-xs text-stone-500">
                            Date: <strong className="text-stone-800">{visit.date}</strong>
                          </div>
                        </div>
                        {visit.followUpDate && (
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold self-start sm:self-auto">
                            Follow-up: {visit.followUpDate}
                          </span>
                        )}
                      </div>

                      <div className="text-xs space-y-1">
                        <strong className="text-stone-500 uppercase text-[10px] tracking-wider block">
                          Chief Complaints:
                        </strong>
                        <p className="text-stone-800">{visit.chiefComplaints}</p>
                      </div>

                      <div className="text-xs space-y-1">
                        <strong className="text-amber-800 uppercase text-[10px] tracking-wider block">
                          Ayurvedic Nidana (Diagnosis):
                        </strong>
                        <p className="text-stone-900 font-semibold">{visit.nidanaDiagnosis}</p>
                      </div>

                      <div className="text-xs space-y-1">
                        <strong className="text-emerald-800 uppercase text-[10px] tracking-wider block">
                          Chikitsa Sutra (Treatment Plan):
                        </strong>
                        <p className="text-stone-800">{visit.chikitsaPlan}</p>
                      </div>

                      {/* Prescribed medicines list */}
                      {visit.prescriptions?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-stone-200">
                          <span className="text-[11px] font-bold text-stone-700 uppercase block mb-2">
                            Prescribed Formulations:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {visit.prescriptions.map((rx) => (
                              <div key={rx.id} className="p-2.5 rounded-2xl bg-white border border-stone-200 shadow-card">
                                <div className="font-bold text-stone-900">{rx.medicineName}</div>
                                <div className="text-[11px] text-stone-500">
                                  {rx.brand} · {rx.form}
                                </div>
                                <div className="text-[11px] font-semibold mt-1" style={{ color: brandColor }}>
                                  {rx.dosage} · {rx.frequency} · {rx.timing}
                                </div>
                                <div className="text-[10px] text-stone-500">
                                  Anupana: {rx.anupana} ({rx.durationDays} days)
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT 5: PANCHAKARMA THERAPY RECORD */}
            {activeTab === 'panchakarma' && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-stone-900">
                      Panchakarma Department Therapy Progression ({selectedPatientProcedures.length})
                    </h4>
                  </div>
                  <span className="text-xs text-stone-500 font-mono">Patient UHID: {selectedPatient.uhid}</span>
                </div>

                {selectedPatientProcedures.length === 0 ? (
                  <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs space-y-2">
                    <p>No Panchakarma procedures currently registered for {selectedPatient.name}.</p>
                    <button
                      onClick={() => onOpenPrescriptionForPatient(selectedPatient)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: brandColor }}
                    >
                      Prescribe Panchakarma in Consultation
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedPatientProcedures.map((proc) => {
                      const pct = Math.min(100, Math.round((proc.currentDay / proc.totalDays) * 100));
                      return (
                        <div
                          key={proc.id}
                          className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 space-y-3 text-xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-200">
                            <div>
                              <div className="font-bold text-stone-900 text-sm flex items-center gap-2">
                                <Flame className="w-4 h-4 text-amber-500" />
                                <span>{proc.therapyName}</span>
                              </div>
                              <div className="text-[11px] text-stone-500 mt-0.5">
                                Started: <strong>{proc.startDate}</strong> • Suite: <strong>{proc.roomName}</strong>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono self-start sm:self-auto ${
                                proc.status === 'Completed'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : proc.status === 'In Progress'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {proc.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-stone-700">
                            <div>
                              <span className="text-[10px] text-stone-500 block">Daily Time Slot</span>
                              <span className="font-mono font-medium">{proc.dailyTimeSlot}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-stone-500 block">Therapist</span>
                              <span className="font-semibold text-stone-800">{proc.therapistAssigned}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-stone-500 block">Doctor In Charge</span>
                              <span className="font-medium text-stone-800">{proc.doctorInCharge}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-stone-500 block">Medicated Formulations</span>
                              <span className="text-emerald-800 font-semibold">{proc.medicatedOilsUsed}</span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1 pt-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-stone-500">Therapy Course Progress:</span>
                              <strong className="text-stone-900">
                                Day {proc.currentDay} of {proc.totalDays} ({pct}%)
                              </strong>
                            </div>
                            <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: brandColor,
                                }}
                              />
                            </div>
                          </div>

                          {proc.preProcedureNotes && (
                            <div className="p-2 rounded-lg bg-white border border-stone-200 text-[11px] text-stone-600">
                              <strong className="text-stone-800">Pre-Procedure Evaluation:</strong>{' '}
                              {proc.preProcedureNotes}
                            </div>
                          )}

                          {proc.postProcedureNotes && (
                            <div className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-200 text-[11px] text-stone-700">
                              <strong className="text-emerald-900">Post-Therapy Clinical Notes:</strong>{' '}
                              {proc.postProcedureNotes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 6: BILLING & FINANCIAL INVOICES */}
            {activeTab === 'billing' && (
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-stone-900">
                      Billing History & Invoices ({selectedPatientInvoices.length})
                    </h4>
                  </div>
                  <div className="text-xs font-bold text-stone-700">
                    Total Invoiced:{' '}
                    <span style={{ color: brandColor }}>
                      ₹{selectedPatientInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {selectedPatientInvoices.length === 0 ? (
                  <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs">
                    No invoices generated yet for this patient.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedPatientInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                          <div>
                            <span className="font-mono font-bold text-stone-900 text-sm">{inv.invoiceNumber}</span>
                            <span className="text-[11px] text-stone-500 ml-2">Date: {inv.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                inv.paymentStatus === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {inv.paymentStatus}
                            </span>
                            <span className="font-bold text-sm text-stone-900">₹{inv.grandTotal.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-stone-500 uppercase font-bold block">Billed Items:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {inv.items.map((item) => (
                              <div
                                key={item.id}
                                className="p-2 bg-white rounded-lg border border-stone-200 flex justify-between items-center text-[11px]"
                              >
                                <span>
                                  {item.description} ({item.quantity}x)
                                </span>
                                <span className="font-bold text-stone-800">₹{item.total}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between text-[11px] text-stone-500">
                          <span>
                            Payment Mode: <strong>{inv.paymentMode}</strong>
                          </span>
                          <span>
                            Subtotal: ₹{inv.subTotal} • Tax: ₹{inv.taxAmount} • Disc: ₹{inv.discount}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* MODAL: ADD BLOOD TEST REPORT */}
      {showAddLabModal && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-xl w-full p-6 text-stone-900 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-stone-900">Record Laboratory Diagnostic Results</h3>
                <p className="text-xs text-stone-500">
                  Patient: {selectedPatient.name} ({selectedPatient.uhid})
                </p>
              </div>
              <button onClick={() => setShowAddLabModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBloodReport} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Test Panel Name</label>
                <input
                  type="text"
                  value={newLabTestName}
                  onChange={(e) => setNewLabTestName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-400"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-2">Parameters to Record</label>
                <div className="space-y-2">
                  {newLabParams.map((p, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-stone-50 p-2 rounded-xl border border-stone-200"
                    >
                      <div className="col-span-5 font-bold text-stone-800">{p.parameter}</div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={p.value}
                          onChange={(e) => {
                            const updated = [...newLabParams];
                            updated[idx].value = e.target.value;
                            setNewLabParams(updated);
                          }}
                          className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-mono font-bold text-stone-900"
                        />
                      </div>
                      <div className="col-span-4 flex items-center justify-end">
                        <select
                          value={p.status}
                          onChange={(e) => {
                            const updated = [...newLabParams];
                            updated[idx].status = e.target.value;
                            setNewLabParams(updated);
                          }}
                          className={`rounded px-2 py-1 text-[11px] font-bold border ${
                            p.status === 'High'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : p.status === 'Low'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          <option value="Normal">Normal</option>
                          <option value="High">High</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Pathologist / Vaidya Notes</label>
                <textarea
                  rows={2}
                  value={newLabNotes}
                  onChange={(e) => setNewLabNotes(e.target.value)}
                  placeholder="e.g. Elevated ESR correlating with inflammatory Sandhigata Vata effusion..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-400"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddLabModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white rounded-xl font-bold shadow-sm"
                  style={{ backgroundColor: brandColor }}
                >
                  Save Lab Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CLINICAL BEFORE/AFTER PHOTO */}
      {showAddImageModal && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 text-stone-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-stone-900">Upload Clinical Photography Record</h3>
                <p className="text-xs text-stone-500">Before & After Panchakarma Documentation</p>
              </div>
              <button onClick={() => setShowAddImageModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddClinicalImage} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Photo Title</label>
                <input
                  type="text"
                  placeholder="e.g. Bilateral knee joint swelling Day 1"
                  value={newImageTitle}
                  onChange={(e) => setNewImageTitle(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Treatment Stage</label>
                  <select
                    value={newImageStage}
                    onChange={(e) => setNewImageStage(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900"
                  >
                    <option value="Before Treatment">Before Treatment</option>
                    <option value="During Panchakarma">During Panchakarma</option>
                    <option value="After Treatment">After Treatment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Anatomical Site</label>
                  <input
                    type="text"
                    placeholder="e.g. Lumbar spine, Scalp, Knee"
                    value={newImageSite}
                    onChange={(e) => setNewImageSite(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Image URL / Clinical Camera Snapshot</label>
                <input
                  type="url"
                  placeholder="https://... (or leave for sample clinical image)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Clinical Observations & Physical Signs
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe erythema, scaling, ROM restriction, or swelling reduction..."
                  value={newImageDesc}
                  onChange={(e) => setNewImageDesc(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-stone-900"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddImageModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white rounded-xl font-bold shadow-sm"
                  style={{ backgroundColor: brandColor }}
                >
                  Save Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MEDICAL SHARING EXPORT CARD */}
      {showExportModal && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-2xl w-full p-6 text-stone-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-amber-600" />
                <h3 className="font-serif font-black text-base text-stone-900">Medical Referral & Patient Dossier</h3>
              </div>
              <button onClick={() => setShowExportModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4 text-xs font-sans">
              <div className="border-b border-stone-200 pb-3 flex justify-between items-start">
                <div>
                  <h4 className="font-serif font-black text-base text-stone-900">{config.hospitalName}</h4>
                  <p className="text-[11px] text-stone-500">
                    {config.tagline} · Reg: {config.registrationNumber}
                  </p>
                </div>
                <div className="text-right text-[11px]">
                  <strong className="font-mono">{selectedPatient.uhid}</strong>
                  <div className="text-stone-500">Date: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-3 rounded-2xl border border-stone-200 shadow-card">
                <div>
                  <strong>Patient:</strong> {selectedPatient.name} ({selectedPatient.age}y/{selectedPatient.gender})
                </div>
                <div>
                  <strong>Prakriti:</strong> {selectedPatient.prakriti}
                </div>
                <div>
                  <strong>Ayurvedic Nidana:</strong> {selectedPatient.primaryCondition}
                </div>
                <div>
                  <strong>Admission:</strong> {selectedPatient.admissionStatus}
                </div>
              </div>

              <div>
                <strong className="text-stone-800 block text-xs mb-1">Clinical Progress Summary:</strong>
                <p className="text-stone-600 leading-relaxed text-[11px]">
                  Patient undergoing classical Ayurvedic Panchakarma intervention. Documented relief in mobility, joint
                  tenderness and cutaneous lesions. Blood inflammatory markers showing steady remission.
                </p>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-between items-center text-[10px] text-stone-500">
                <span>Authorized Vaidya Signature: {currentBranch.doctorInCharge}</span>
                <span className="font-mono">SECURE-MD-HASH-{selectedPatient.uhid}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex justify-end gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                style={{ backgroundColor: brandColor }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print / Save Referral Card</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PATIENT 360 COMPREHENSIVE EMR DOSSIER (PRINTABLE) */}
      {showFullDossierModal && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-4xl w-full my-auto max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Navigation Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: brandColor }}
                >
                  360
                </div>
                <div>
                  <h3 className="font-serif font-black text-base text-stone-900 leading-tight">
                    Comprehensive Patient 360 EMR Dossier
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    UHID: {selectedPatient.uhid} · Complete longitudinal clinical & financial record
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                  style={{ backgroundColor: brandColor }}
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Dossier / Export PDF</span>
                </button>
                <button
                  onClick={() => setShowFullDossierModal(false)}
                  className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-stone-800 bg-white">
              {/* Official Clinic Letterhead */}
              <div
                className="border-b-2 pb-5 flex flex-col sm:flex-row justify-between items-start gap-4"
                style={{ borderColor: brandColor }}
              >
                <div className="flex items-start gap-3">
                  {config.logoUrl ? (
                    <img
                      src={config.logoUrl}
                      alt={config.hospitalName}
                      className="w-14 h-14 object-contain rounded-xl border border-stone-200 p-1 bg-white"
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm"
                      style={{ backgroundColor: brandColor }}
                    >
                      {config.hospitalName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl font-serif font-black text-stone-900 leading-tight">
                      {config.hospitalName}
                    </h1>
                    <p className="text-xs text-stone-600 font-medium">{config.tagline}</p>
                    <p className="text-[11px] text-stone-500 mt-1">
                      {config.address} · Phone: {config.phone} · Reg No:{' '}
                      <span className="font-mono">{config.registrationNumber}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right sm:self-center bg-stone-50 p-3 rounded-2xl border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                    Ayurvedic EMR Record
                  </span>
                  <span className="text-sm font-black font-mono" style={{ color: brandColor }}>
                    {selectedPatient.uhid}
                  </span>
                  <span className="text-[11px] text-stone-500 block mt-0.5">
                    Generated:{' '}
                    {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Patient Core Demographics */}
              <div className="bg-stone-50/70 rounded-2xl p-4 border border-stone-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Demographic & Registration Particulars
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase block font-semibold">Full Name</span>
                    <strong className="text-stone-900 font-serif text-sm">{selectedPatient.name}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase block font-semibold">Age / Gender</span>
                    <strong className="text-stone-800">
                      {selectedPatient.age} Years · {selectedPatient.gender}
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase block font-semibold">Blood Group</span>
                    <strong className="text-stone-800">{selectedPatient.bloodGroup || 'Not Tested'}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase block font-semibold">Admission Category</span>
                    <strong className="text-stone-800">{selectedPatient.admissionStatus}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase block font-semibold">Contact Number</span>
                    <span className="text-stone-800 font-mono">{selectedPatient.phone}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase block font-semibold">Email ID</span>
                    <span className="text-stone-800">{selectedPatient.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase block font-semibold">Registration Date</span>
                    <span className="text-stone-800">{selectedPatient.registeredDate}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase block font-semibold">Emergency Contact</span>
                    <span className="text-stone-800">
                      {selectedPatient.emergencyContact?.name} (
                      {selectedPatient.emergencyContact?.relation || 'Guardian'})
                    </span>
                  </div>
                </div>
                {selectedPatient.address && (
                  <div className="mt-2.5 pt-2 border-t border-stone-200 text-xs">
                    <span className="text-stone-400 text-[10px] uppercase font-semibold mr-2">
                      Residential Address:
                    </span>
                    <span className="text-stone-700">{selectedPatient.address}</span>
                  </div>
                )}
              </div>

              {/* Ayurvedic Baseline Examination & Ashtavidha Pariksha */}
              <div className="border border-stone-200 rounded-2xl p-4 bg-white space-y-3 shadow-card">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    Ayurvedic Nidana & Ashtavidha Pariksha (Classical Diagnosis)
                  </h4>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white"
                    style={{ backgroundColor: brandColor }}
                  >
                    Prakriti: {selectedPatient.prakriti}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-xs">
                  <span className="font-bold text-amber-900 block mb-0.5">
                    Primary Ayurvedic Nidana / Chief Diagnosis:
                  </span>
                  <p className="text-stone-800 font-medium">{selectedPatient.primaryCondition}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                    <span className="text-[10px] font-bold uppercase text-stone-400 block">Nadi (Pulse)</span>
                    <span className="font-semibold text-stone-800">
                      {selectedPatient.prakriti.includes('Vata')
                        ? 'Vata-dominant (Sarpa Gati)'
                        : selectedPatient.prakriti.includes('Pitta')
                          ? 'Manduka Gati (Pitta)'
                          : 'Hamsa Gati (Kapha)'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                    <span className="text-[10px] font-bold uppercase text-stone-400 block">Jihva (Tongue)</span>
                    <span className="font-semibold text-stone-800">Saama (Mild Coated Coating)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                    <span className="text-[10px] font-bold uppercase text-stone-400 block">Mala (Bowel)</span>
                    <span className="font-semibold text-stone-800">Baddha / Vibandha (Irregular)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                    <span className="text-[10px] font-bold uppercase text-stone-400 block">Mutra (Urine)</span>
                    <span className="font-semibold text-stone-800">Prakruta (Normal clear)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                    <span className="text-[10px] font-bold uppercase text-stone-400 block">Shabda (Voice/Speech)</span>
                    <span className="font-semibold text-stone-800">Spashta (Clear tone)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                    <span className="text-[10px] font-bold uppercase text-stone-400 block">Sparsha (Touch)</span>
                    <span className="font-semibold text-stone-800">Sheeta-Ruksha (Dry & Cool)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                    <span className="text-[10px] font-bold uppercase text-stone-400 block">Druk (Vision/Eyes)</span>
                    <span className="font-semibold text-stone-800">Prakruta (Clear vision)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100">
                    <span className="text-[10px] font-bold uppercase text-stone-400 block">Aakruti (Constitution)</span>
                    <span className="font-semibold text-stone-800">Madhyama Shareera</span>
                  </div>
                </div>
              </div>

              {/* Consultation & Visit History */}
              <div className="border border-stone-200 rounded-2xl p-4 bg-white space-y-3 shadow-card">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Clinical Consultation Timeline ({selectedPatient.clinicalVisits?.length || 0} Consultations)
                </h4>

                {!selectedPatient.clinicalVisits || selectedPatient.clinicalVisits.length === 0 ? (
                  <p className="text-xs text-stone-500 italic p-3 bg-stone-50 rounded-xl">
                    No past clinical visits recorded.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedPatient.clinicalVisits.map((visit) => (
                      <div
                        key={visit.id}
                        className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-start border-b border-stone-200 pb-2">
                          <div>
                            <span className="font-bold text-stone-900">
                              {visit.date} · {visit.doctorName}
                            </span>
                            <span className="text-stone-500 ml-2">Type: {visit.visitType}</span>
                          </div>
                          {visit.nextFollowUpDate && (
                            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Next Follow-up: {visit.nextFollowUpDate}
                            </span>
                          )}
                        </div>

                        <div>
                          <strong className="text-stone-700">Chief Complaints & Samprapti:</strong>
                          <p className="text-stone-800 mt-0.5">{visit.chiefComplaints}</p>
                          {visit.diagnosis && <p className="text-stone-600 mt-0.5 italic">Nidana: {visit.diagnosis}</p>}
                        </div>

                        {visit.prescribedMedicines && visit.prescribedMedicines.length > 0 && (
                          <div className="pt-1.5">
                            <strong className="text-stone-700 block mb-1">Prescribed Formulations:</strong>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {visit.prescribedMedicines.map((med, mIdx) => (
                                <div key={mIdx} className="p-2 rounded-lg bg-white border border-stone-200 text-[11px]">
                                  <strong className="text-stone-900">{med.medicineName}</strong>
                                  <div className="text-stone-600">
                                    {med.dosage} · {med.frequency} · {med.duration}
                                  </div>
                                  {med.instructions && (
                                    <div className="text-stone-500 italic">Anupana: {med.instructions}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Panchakarma Therapy Courses */}
              <div className="border border-stone-200 rounded-2xl p-4 bg-white space-y-3 shadow-card">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Panchakarma & Classical Procedures ({selectedPatientProcedures.length} Prescribed Courses)
                </h4>

                {selectedPatientProcedures.length === 0 ? (
                  <p className="text-xs text-stone-500 italic p-3 bg-stone-50 rounded-xl">
                    No Panchakarma procedures currently prescribed for this patient.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedPatientProcedures.map((proc) => (
                      <div
                        key={proc.id}
                        className="p-3 rounded-xl bg-purple-50/40 border border-purple-200 text-xs space-y-1.5"
                      >
                        <div className="flex justify-between items-start">
                          <strong className="text-stone-900 font-serif">{proc.therapyName}</strong>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              proc.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : proc.status === 'In Progress'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {proc.status}
                          </span>
                        </div>
                        <div className="text-stone-600 text-[11px] space-y-0.5">
                          <div>
                            Course: <strong>{proc.totalDays} Days</strong> (Completed: {proc.daysCompleted || 0} Days)
                          </div>
                          <div>
                            Room: <strong>{proc.room || 'Therapy Suite 1'}</strong> · Time Slot:{' '}
                            <strong>{proc.dailySlot || '10:00 AM'}</strong>
                          </div>
                          <div>
                            Therapist: <strong>{proc.therapistName || 'Assigned Therapist'}</strong>
                          </div>
                          {proc.medicinesUsed && (
                            <div>
                              Formulations: <span className="font-medium text-stone-700">{proc.medicinesUsed}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lab Diagnostic Reports */}
              {selectedPatient.bloodReports && selectedPatient.bloodReports.length > 0 && (
                <div className="border border-stone-200 rounded-2xl p-4 bg-white space-y-3 shadow-card">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-red-600" />
                    Pathology & Laboratory Diagnostic Panels
                  </h4>
                  <div className="space-y-3">
                    {selectedPatient.bloodReports.map((report) => (
                      <div key={report.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                        <div className="flex justify-between font-bold text-stone-900 mb-1.5">
                          <span>{report.testName}</span>
                          <span className="text-stone-500 text-[11px]">{report.testDate}</span>
                        </div>
                        <table className="w-full text-[11px]">
                          <thead>
                            <tr className="text-stone-400 border-b border-stone-200 text-left">
                              <th className="py-1">Parameter</th>
                              <th className="py-1">Result</th>
                              <th className="py-1">Reference</th>
                              <th className="py-1 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {report.results.map((r, i) => (
                              <tr key={i}>
                                <td className="py-1 font-medium">{r.parameter}</td>
                                <td className="py-1 font-mono font-bold">
                                  {r.value} {r.unit}
                                </td>
                                <td className="py-1 text-stone-500">
                                  {r.normalRange} {r.unit}
                                </td>
                                <td className="py-1 text-right">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${r.status === 'High' ? 'text-red-700 bg-red-50' : r.status === 'Low' ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'}`}
                                  >
                                    {r.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Billing & Financial Ledger Summary */}
              <div className="border border-stone-200 rounded-2xl p-4 bg-white space-y-3 shadow-card">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    Hospital Billing & Invoices ({selectedPatientInvoices.length} Bills)
                  </h4>
                  <span className="font-bold text-xs text-stone-900 font-mono">
                    Total Billed: ₹
                    {selectedPatientInvoices
                      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
                      .toLocaleString('en-IN')}
                  </span>
                </div>

                {selectedPatientInvoices.length === 0 ? (
                  <p className="text-xs text-stone-500 italic p-3 bg-stone-50 rounded-xl">
                    No billing invoices generated yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedPatientInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs"
                      >
                        <div>
                          <strong className="font-mono text-stone-900">{inv.invoiceNumber}</strong>
                          <span className="text-stone-500 ml-2">Date: {inv.date}</span>
                          <span className="text-stone-600 block text-[11px] mt-0.5">
                            Items: {inv.items?.map((it) => it.description).join(', ') || 'Consultation & Dispensary'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}
                          >
                            {inv.status}
                          </span>
                          <strong className="font-mono text-sm text-stone-900">
                            ₹{inv.totalAmount.toLocaleString('en-IN')}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Authorized Medical Sign-off */}
              <div className="pt-6 border-t-2 border-stone-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs text-stone-600">
                <div className="space-y-1">
                  <p className="font-bold text-stone-900">Ayurvedic EMR Integrity Guarantee</p>
                  <p className="text-[11px] text-stone-500">
                    This document is an authenticated clinical and longitudinal summary recorded at{' '}
                    {config.hospitalName}.
                  </p>
                  <p className="font-mono text-[10px] text-stone-400">
                    HASH: SHA256-AYUR-{selectedPatient.uhid}-{Date.now()}
                  </p>
                </div>
                <div className="text-right sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto">
                  <div className="h-10"></div>
                  <strong className="block text-stone-900 font-serif">
                    {config.doctorName || currentBranch.doctorInCharge}
                  </strong>
                  <span className="text-[11px] text-stone-500 block">
                    Senior Ayurvedic Physician & Medical Superintendent
                  </span>
                  <span className="text-[10px] text-stone-400 block font-mono">
                    Reg No: {config.registrationNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CLINICAL NOTE TEMPLATES DRAWER */}
      <ClinicalNoteTemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        config={config}
        onApplyTemplate={handleApplyTemplateToPatient}
      />
    </div>
  );
};
