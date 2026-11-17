import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  MessageSquare,
  CheckCircle2,
  Clock,
  Filter,
  X,
  UserPlus,
  Kanban,
  List,
  PhoneCall,
} from 'lucide-react';
import { AyurStorage } from '../services/storage';
export const ClinicCRMView = ({ leads, currentBranch, config, onPatientConverted }) => {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [viewMode, setViewMode] = useState('kanban');
  const [toastMsg, setToastMsg] = useState('');
  // New Lead Modal State
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSource, setLeadSource] = useState('Website');
  const [leadStage, setLeadStage] = useState('New Inquiry');
  const [leadService, setLeadService] = useState('Panchakarma Detox 14-Day Package');
  const [leadValue, setLeadValue] = useState(25000);
  const [leadNotes, setLeadNotes] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState(new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]);
  const [assignedVaidya, setAssignedVaidya] = useState(currentBranch.doctorInCharge);
  const branchLeads = leads.filter((l) => l.branchId === currentBranch.id);
  // Filter logic
  const filteredLeads = branchLeads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      l.interestedService.toLowerCase().includes(search.toLowerCase()) ||
      l.notes.toLowerCase().includes(search.toLowerCase());
    const matchesStage = stageFilter === 'All' ? true : l.stage === stageFilter;
    const matchesSource = sourceFilter === 'All' ? true : l.source === sourceFilter;
    return matchesSearch && matchesStage && matchesSource;
  });
  // Pipeline stages
  const stages = [
    'New Inquiry',
    'Consultation Scheduled',
    'Panchakarma Enrolled',
    'Active Patient',
    'Follow-up Due',
    'Inactive',
  ];
  // Pipeline metrics
  const totalPipelineValue = branchLeads.reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);
  const enrolledValue = branchLeads
    .filter((l) => l.stage === 'Panchakarma Enrolled' || l.stage === 'Active Patient')
    .reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);
  const activeLeadsCount = branchLeads.filter((l) => l.stage !== 'Inactive').length;
  const handleCreateLead = (e) => {
    e.preventDefault();
    const newLead = {
      id: `clead-${Date.now()}`,
      name: leadName.trim(),
      phone: leadPhone.trim(),
      email: leadEmail.trim() || undefined,
      source: leadSource,
      stage: leadStage,
      interestedService: leadService,
      estimatedValue: Number(leadValue),
      notes: leadNotes.trim(),
      lastContactDate: new Date().toISOString().split('T')[0],
      nextFollowUpDate: nextFollowUp,
      assignedVaidya: assignedVaidya,
      branchId: currentBranch.id,
    };
    AyurStorage.addClinicLead(newLead);
    setShowAddLeadModal(false);
    setLeadName('');
    setLeadPhone('');
    setLeadEmail('');
    setLeadNotes('');
  };
  const handleUpdateStage = (lead, newStage) => {
    const updated = {
      ...lead,
      stage: newStage,
      lastContactDate: new Date().toISOString().split('T')[0],
    };
    AyurStorage.updateClinicLead(updated);
  };
  const handleConvertToPatient = (lead) => {
    // Generate new UHID using custom sequence
    const generatedUHID = AyurStorage.generateAndIncrementUHID();
    const newPatient = {
      id: `pat-${Date.now()}`,
      uhid: generatedUHID,
      name: lead.name,
      age: 40,
      gender: 'Female',
      phone: lead.phone,
      email: lead.email || '',
      address: currentBranch.city,
      bloodGroup: 'B +ve',
      occupation: 'Self / Professional',
      registeredDate: new Date().toISOString().split('T')[0],
      branchId: currentBranch.id,
      prakriti: 'Vata-Pitta',
      primaryCondition: lead.interestedService,
      emergencyContact: {
        name: 'Family Contact',
        relation: 'Spouse',
        phone: lead.phone,
      },
      admissionStatus: lead.stage === 'Panchakarma Enrolled' ? 'Daycare Panchakarma' : 'OPD (Outpatient)',
      referredBy: `Clinic CRM (${lead.source})`,
      bloodReports: [],
      clinicalImages: [],
      clinicalVisits: [
        {
          id: `vis-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          doctorName: lead.assignedVaidya,
          chiefComplaints: lead.notes || lead.interestedService,
          ashtavidhaPariksha: {
            nadi: 'Vata-Pitta',
            mutra: 'Prakruta',
            mala: 'Mala Pravritti',
            jihwa: 'Alpa Sama',
            shabda: 'Prakruta',
            sparsha: 'Sheeta',
            druk: 'Prakruta',
            aakruti: 'Madhyama',
          },
          agni: 'Visham (Irregular)',
          koshtha: 'Madhyama (Moderate)',
          vikriti: { vata: 50, pitta: 30, kapha: 20 },
          nidanaDiagnosis: lead.interestedService,
          chikitsaPlan: 'Converted from Clinic CRM inquiry. Initial Panchakarma consultation.',
          prescriptions: [],
          pathyaDiet: 'Warm home-cooked food with ghee',
          apathyaDiet: 'Cold beverages and fried items',
        },
      ],
    };
    AyurStorage.addPatient(newPatient);
    // Update lead stage
    handleUpdateStage(lead, 'Active Patient');
    if (onPatientConverted) {
      onPatientConverted(newPatient);
    }
    setToastMsg(`Lead "${lead.name}" successfully converted to registered patient! UHID generated: ${generatedUHID}`);
    setTimeout(() => setToastMsg(''), 4500);
  };
  return (
    <div className="space-y-6">
      {/* Top Header & Fast Actions */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: config.themeColor || '#0f6240' }}
            >
              Direct Clinic Inquiries & Pipeline
            </span>
            <span className="text-xs text-stone-500 font-mono">Branch: {currentBranch.name}</span>
          </div>
          <h2 className="text-2xl font-serif font-black text-stone-900 tracking-tight">
            Clinic Patient CRM & Leads Pipeline
          </h2>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl">
            Track inquiries from your website, Google & Instagram ads, walk-in queries, phone calls, and convert leads
            into registered patients with 1 click.
          </p>
        </div>

        {toastMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="bg-stone-100 p-1 rounded-xl flex items-center border border-stone-200 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Pipeline</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'table' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddLeadModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow flex items-center gap-1.5 transition-all active:scale-95"
            style={{ backgroundColor: config.themeColor || '#0f6240' }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Clinic Lead</span>
          </button>
        </div>
      </div>

      {/* Pipeline Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-card">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
            Total Active Leads
          </span>
          <div className="text-2xl font-bold font-serif text-stone-900">{activeLeadsCount}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Inquiries across all channels</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-card">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
            Total Estimated Pipeline
          </span>
          <div className="text-2xl font-bold text-emerald-700">₹{totalPipelineValue.toLocaleString()}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Potential consultation & therapy yield</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-card">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
            Enrolled / Active Value
          </span>
          <div className="text-2xl font-bold text-amber-600">₹{enrolledValue.toLocaleString()}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">Secured Panchakarma bookings</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-card">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
            Lead-to-Patient Conversion
          </span>
          <div className="text-2xl font-bold text-indigo-700">
            {branchLeads.length > 0
              ? Math.round(
                  (branchLeads.filter((l) => l.stage === 'Panchakarma Enrolled' || l.stage === 'Active Patient')
                    .length /
                    branchLeads.length) *
                    100
                )
              : 0}
            %
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">Successful therapy enrollment</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search lead name, phone, interested treatment, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Source Filter */}
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <span>Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-800 focus:outline-none"
            >
              <option value="All">All Sources</option>
              <option value="Website">Website Form</option>
              <option value="Google Search">Google Search</option>
              <option value="Meta / Instagram">Meta / Instagram Ads</option>
              <option value="Direct Walk-in">Direct Walk-in</option>
              <option value="Phone Call">Phone Call</option>
              <option value="WhatsApp">WhatsApp Inquiry</option>
              <option value="Doctor Referral">Doctor Referral</option>
            </select>
          </div>

          {/* Stage Filter */}
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <span>Stage:</span>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-800 focus:outline-none"
            >
              <option value="All">All Stages</option>
              {stages.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KANBAN PIPELINE VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5 items-start overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.stage === stage);
            const stageVal = stageLeads.reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);
            return (
              <div
                key={stage}
                className="bg-stone-100/80 border border-stone-200 rounded-2xl p-3 min-w-[240px] flex flex-col space-y-3"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <div>
                    <h4 className="font-bold text-xs text-stone-800 leading-tight">{stage}</h4>
                    <span className="text-[10px] text-stone-500 font-mono">₹{stageVal.toLocaleString()}</span>
                  </div>
                  <span className="w-5 h-5 rounded-full bg-white border border-stone-200 text-stone-700 font-bold text-[10px] flex items-center justify-center shadow-xs">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-0.5">
                  {stageLeads.length === 0 ? (
                    <div className="p-4 text-center text-stone-400 text-[11px] italic bg-white/50 rounded-xl border border-dashed border-stone-200">
                      No leads
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="p-3 bg-white border border-stone-200 rounded-2xl shadow-card hover:border-emerald-500 hover:shadow transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <h5 className="font-bold text-xs text-stone-900">{lead.name}</h5>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-medium">
                              {lead.source}
                            </span>
                          </div>
                          <span className="font-mono text-[11px] font-bold text-emerald-700">
                            ₹{lead.estimatedValue.toLocaleString()}
                          </span>
                        </div>

                        <div className="text-[11px] text-stone-600 font-medium">{lead.interestedService}</div>

                        {lead.notes && (
                          <p className="text-[10px] text-stone-500 line-clamp-2 italic bg-stone-50 p-1.5 rounded">
                            "{lead.notes}"
                          </p>
                        )}

                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-500">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-stone-400" />
                            {lead.nextFollowUpDate}
                          </span>

                          <div className="flex items-center gap-1">
                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Namaste ${lead.name}, greetings from ${config.hospitalName}. We are following up regarding your inquiry for ${lead.interestedService}. How may we assist you with scheduling your Ayurvedic consultation with ${lead.assignedVaidya}?`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </a>
                            <a
                              href={`tel:${lead.phone}`}
                              className="p-1 rounded-md bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
                              title="Call Lead"
                            >
                              <PhoneCall className="w-3 h-3" />
                            </a>
                          </div>
                        </div>

                        {/* Convert to Patient Quick Action */}
                        <div className="pt-1 flex items-center justify-between gap-1">
                          <select
                            value={lead.stage}
                            onChange={(e) => handleUpdateStage(lead, e.target.value)}
                            className="bg-stone-50 border border-stone-200 rounded px-1.5 py-0.5 text-[10px] text-stone-700 flex-1"
                          >
                            {stages.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleConvertToPatient(lead)}
                            className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-[10px] flex items-center gap-0.5 shadow-xs"
                            title="Convert to Registered Patient"
                          >
                            <UserPlus className="w-2.5 h-2.5" />
                            <span>Convert</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Lead Name & Phone</th>
                  <th className="py-3 px-4">Inquiry Source</th>
                  <th className="py-3 px-4">Interested Treatment</th>
                  <th className="py-3 px-4">Est. Value</th>
                  <th className="py-3 px-4">Funnel Stage</th>
                  <th className="py-3 px-4">Next Follow-up</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400">
                      No leads matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-4">
                        <strong className="text-stone-900 block">{lead.name}</strong>
                        <span className="text-[11px] font-mono text-stone-500">{lead.phone}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-medium border border-stone-200">
                          {lead.source}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-800 font-medium">{lead.interestedService}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                        ₹{lead.estimatedValue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={lead.stage}
                          onChange={(e) => handleUpdateStage(lead, e.target.value)}
                          className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-800 font-semibold"
                        >
                          {stages.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-600">{lead.nextFollowUpDate}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Namaste ${lead.name}, greetings from ${config.hospitalName}. We are following up regarding your inquiry for ${lead.interestedService}. How may we assist you with scheduling your Ayurvedic consultation with ${lead.assignedVaidya}?`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleConvertToPatient(lead)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-[11px] flex items-center gap-1 shadow-xs"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Convert</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD CLINIC LEAD */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 text-stone-900 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-stone-900">Add New Clinic Inquiry / Lead</h3>
              </div>
              <button onClick={() => setShowAddLeadModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Patient / Prospect Name</label>
                <input
                  type="text"
                  placeholder="e.g. Anand Murthy"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Phone Number (WhatsApp)</label>
                  <input
                    type="tel"
                    placeholder="+91 98450..."
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="prospect@gmail.com"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Lead Source</label>
                  <select
                    value={leadSource}
                    onChange={(e) => setLeadSource(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-medium"
                  >
                    <option value="Website">Website Form</option>
                    <option value="Google Search">Google Search</option>
                    <option value="Meta / Instagram">Meta / Instagram Ads</option>
                    <option value="Direct Walk-in">Direct Walk-in</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="WhatsApp">WhatsApp Inquiry</option>
                    <option value="Doctor Referral">Doctor Referral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Initial Stage</label>
                  <select
                    value={leadStage}
                    onChange={(e) => setLeadStage(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-semibold"
                  >
                    {stages.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Interested Treatment / Service</label>
                  <input
                    type="text"
                    placeholder="e.g. Panchakarma Detox 14-Day"
                    value={leadService}
                    onChange={(e) => setLeadService(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Estimated Value (₹)</label>
                  <input
                    type="number"
                    value={leadValue}
                    onChange={(e) => setLeadValue(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Next Follow-up Date</label>
                <input
                  type="date"
                  value={nextFollowUp}
                  onChange={(e) => setNextFollowUp(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Inquiry Details & Symptoms Mentioned</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Has bilateral knee stiffness for 1 year, wants natural non-surgical remedy..."
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-stone-900"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white font-bold rounded-xl shadow-sm"
                  style={{ backgroundColor: config.themeColor || '#0f6240' }}
                >
                  Save Clinic Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
