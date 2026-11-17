import React, { useState } from 'react';
import { Tent, Users, Plus, MapPin, X } from 'lucide-react';
import { AyurStorage } from '../services/storage';
export const CampsAndCRMView = ({ camps, currentBranch, config }) => {
  const [selectedCampId, setSelectedCampId] = useState(camps[0]?.id || '');
  const [leadStatusFilter, setLeadStatusFilter] = useState('All');
  const [leadSearch, setLeadSearch] = useState('');
  // Modals
  const [showAddCampModal, setShowAddCampModal] = useState(false);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  // New Camp form
  const [campName, setCampName] = useState('');
  const [campDate, setCampDate] = useState(new Date().toISOString().split('T')[0]);
  const [campLocation, setCampLocation] = useState('');
  const [coordinator, setCoordinator] = useState('Manjunath Gowda (CRM Head)');
  const [leadDoctor, setLeadDoctor] = useState(currentBranch.doctorInCharge);
  const [targetFootfall, setTargetFootfall] = useState(250);
  const [budgetSpent, setBudgetSpent] = useState(30000);
  const [campNotes, setCampNotes] = useState('');
  // Fast Lead Entry form
  const [leadName, setLeadName] = useState('');
  const [leadAge, setLeadAge] = useState(45);
  const [leadGender, setLeadGender] = useState('Female');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadVillage, setLeadVillage] = useState('');
  const [leadComplaint, setLeadComplaint] = useState('Severe knee joint pain (Sandhigata Vata)');
  const [leadDosha, setLeadDosha] = useState('Vata Pradhana');
  const [leadStatus, setLeadStatus] = useState('Screened at Camp');
  const [conversionVal, setConversionVal] = useState(0);
  const selectedCamp = camps.find((c) => c.id === selectedCampId) || camps[0];
  // Lead filtering
  const filteredLeads = (selectedCamp?.patientLeads || []).filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
      l.phone.includes(leadSearch) ||
      l.villageOrArea.toLowerCase().includes(leadSearch.toLowerCase()) ||
      l.primaryComplaint.toLowerCase().includes(leadSearch.toLowerCase());
    const matchesStatus = leadStatusFilter === 'All' ? true : l.status === leadStatusFilter;
    return matchesSearch && matchesStatus;
  });
  // Calculate CRM conversions
  const totalLeads = selectedCamp?.patientLeads?.length || 0;
  const convertedLeads = (selectedCamp?.patientLeads || []).filter(
    (l) => l.status === 'Enrolled in Panchakarma' || l.status === 'Visited Hospital'
  ).length;
  const totalConversionRevenue = (selectedCamp?.patientLeads || []).reduce(
    (acc, curr) => acc + (curr.conversionValue || 0),
    0
  );
  const handleCreateCamp = (e) => {
    e.preventDefault();
    const newCamp = {
      id: `camp-${Date.now()}`,
      campName,
      date: campDate,
      location: campLocation,
      organizingBranchId: currentBranch.id,
      coordinatorName: coordinator,
      leadDoctor: leadDoctor,
      targetFootfall: Number(targetFootfall),
      actualRegistrations: 0,
      freeMedicinesDistributedWorth: 0,
      budgetSpent: Number(budgetSpent),
      notes: campNotes,
      status: 'Upcoming',
      patientLeads: [],
    };
    AyurStorage.addCamp(newCamp);
    setSelectedCampId(newCamp.id);
    setShowAddCampModal(false);
    setCampName('');
    setCampLocation('');
  };
  const handleAddCampLead = (e) => {
    e.preventDefault();
    if (!selectedCamp) return;
    const newLead = {
      id: `clead-${Date.now()}`,
      campId: selectedCamp.id,
      name: leadName.trim(),
      age: Number(leadAge),
      gender: leadGender,
      phone: leadPhone.trim(),
      villageOrArea: leadVillage.trim(),
      primaryComplaint: leadComplaint.trim(),
      doshaSuspected: leadDosha,
      assignedFollowUpDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: leadStatus,
      conversionValue: Number(conversionVal),
    };
    const updatedCamp = {
      ...selectedCamp,
      actualRegistrations: selectedCamp.actualRegistrations + 1,
      patientLeads: [newLead, ...selectedCamp.patientLeads],
    };
    AyurStorage.updateCamp(updatedCamp);
    setShowAddLeadModal(false);
    setLeadName('');
    setLeadPhone('');
    setLeadVillage('');
  };
  const handleUpdateLeadStatus = (leadId, newStatus, convValue) => {
    if (!selectedCamp) return;
    const updatedLeads = selectedCamp.patientLeads.map((l) => {
      if (l.id === leadId) {
        return {
          ...l,
          status: newStatus,
          conversionValue:
            convValue !== undefined ? convValue : newStatus === 'Enrolled in Panchakarma' ? 14000 : l.conversionValue,
        };
      }
      return l;
    });
    const updatedCamp = {
      ...selectedCamp,
      patientLeads: updatedLeads,
    };
    AyurStorage.updateCamp(updatedCamp);
  };
  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <h2 className="text-xl font-serif font-black text-stone-900 flex items-center gap-2">
            <Tent className="w-5 h-5 text-amber-700" />
            Medical Camp Organizer & Ayurvedic Hospital CRM
          </h2>
          <p className="text-xs text-stone-500">
            Outreach camp scheduling, rapid patient screening entry, lead lifecycle pipeline, and conversion analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddCampModal(true)}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold border border-stone-300 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4 text-amber-700" />
            <span>Organize New Camp</span>
          </button>

          <button
            onClick={() => setShowAddLeadModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Fast Camp Lead Entry</span>
          </button>
        </div>
      </div>

      {/* Camp Selector Carousel */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-lg space-y-3">
        <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
          Select Active / Archived Medical Camp
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {camps.map((camp) => {
            const isSelected = selectedCamp?.id === camp.id;
            return (
              <div
                key={camp.id}
                onClick={() => setSelectedCampId(camp.id)}
                className={`p-4 rounded-xl cursor-pointer border transition-all ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-600 text-stone-900 shadow ring-1 ring-emerald-500/30'
                    : 'bg-stone-50 border-stone-200 hover:border-stone-300 text-stone-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-stone-900 line-clamp-1">{camp.campName}</h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      camp.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : camp.status === 'Active Today'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {camp.status}
                  </span>
                </div>

                <div className="text-xs text-stone-500 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span className="truncate">{camp.location}</span>
                </div>

                <div className="mt-3 pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
                  <span className="text-stone-500">
                    Date: <strong className="text-stone-800">{camp.date}</strong>
                  </span>
                  <span className="text-emerald-700 font-bold font-mono">
                    {camp.patientLeads?.length || 0} Registered Leads
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Camp Analytics Bar */}
      {selectedCamp && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-card">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Camp Footfall (Target: {selectedCamp.targetFootfall})
            </span>
            <div className="text-2xl font-bold font-serif text-stone-900">
              {selectedCamp.actualRegistrations}{' '}
              <span className="text-xs text-emerald-700 font-sans font-normal">pts</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-1">Lead Vaidya: {selectedCamp.leadDoctor.split(',')[0]}</div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-card">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
              Hospital Conversion Rate
            </span>
            <div className="text-2xl font-bold text-amber-700">
              {totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0}%
            </div>
            <div className="text-[11px] text-stone-500 mt-1">{convertedLeads} converted into hospital care</div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-card">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
              Panchakarma Revenue Generated
            </span>
            <div className="text-2xl font-bold text-emerald-700">
              ₹{totalConversionRevenue.toLocaleString()}
            </div>
            <div className="text-[11px] text-stone-500 mt-1">Direct ROI on camp expenses</div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-card">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Camp Budget & Free Medicines
            </span>
            <div className="text-base font-bold text-stone-900 mt-1">
              ₹{selectedCamp.budgetSpent.toLocaleString()} Budget
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">Coord: {selectedCamp.coordinatorName}</div>
          </div>
        </div>
      )}

      {/* Leads CRM Table & Lifecycle Pipeline */}
      {selectedCamp && (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" />
                Patient Leads Pipeline: {selectedCamp.campName}
              </h3>
              <p className="text-xs text-stone-500">
                Move camp screened patients through the clinical conversion funnel
              </p>
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {['All', 'Screened at Camp', 'Follow-up Called', 'Visited Hospital', 'Enrolled in Panchakarma'].map(
                (s) => (
                  <button
                    key={s}
                    onClick={() => setLeadStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      leadStatusFilter === s
                        ? 'bg-amber-500 text-stone-950 shadow'
                        : 'bg-stone-50 text-stone-500 border border-stone-200 hover:text-stone-800'
                    }`}
                  >
                    {s}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Leads Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-semibold text-[11px]">
                  <th className="py-2.5 px-3">Patient Name & Demographics</th>
                  <th className="py-2.5 px-3">Contact & Village</th>
                  <th className="py-2.5 px-3">Primary Complaint & Dosha</th>
                  <th className="py-2.5 px-3">Follow-up Date</th>
                  <th className="py-2.5 px-3">Funnel Status</th>
                  <th className="py-2.5 px-3 text-right">Actions / Transition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-500">
                      No leads found for current filter. Click "Fast Camp Lead Entry" to add attendees.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-stone-900 text-xs">{lead.name}</div>
                        <span className="text-[11px] text-stone-500">
                          {lead.age} yrs • {lead.gender}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-stone-700">
                        <div className="font-mono">{lead.phone}</div>
                        <span className="text-[11px] text-stone-500">{lead.villageOrArea}</span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-stone-800">{lead.primaryComplaint}</div>
                        <span className="text-[10px] text-amber-700 font-semibold">{lead.doshaSuspected}</span>
                      </td>

                      <td className="py-3 px-3 font-mono text-stone-500">{lead.assignedFollowUpDate}</td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            lead.status === 'Enrolled in Panchakarma'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : lead.status === 'Visited Hospital'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : lead.status === 'Follow-up Called'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {lead.status}
                        </span>
                        {lead.conversionValue ? (
                          <div className="text-[10px] font-mono text-emerald-700 mt-0.5">
                            ₹{lead.conversionValue.toLocaleString()}
                          </div>
                        ) : null}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {lead.status !== 'Enrolled in Panchakarma' && (
                            <button
                              onClick={() => handleUpdateLeadStatus(lead.id, 'Enrolled in Panchakarma', 14000)}
                              className="px-2 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
                              title="Enroll in Panchakarma"
                            >
                              Enroll Panchakarma
                            </button>
                          )}
                          {lead.status === 'Screened at Camp' && (
                            <button
                              onClick={() => handleUpdateLeadStatus(lead.id, 'Follow-up Called')}
                              className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-amber-700 rounded text-[10px]"
                            >
                              Mark Called
                            </button>
                          )}
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

      {/* MODAL: ORGANIZE NEW MEDICAL CAMP */}
      {showAddCampModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-2xl max-w-lg w-full p-6 text-stone-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <h3 className="font-bold text-base text-stone-900">Organize New Ayurvedic Medical Camp</h3>
              <button onClick={() => setShowAddCampModal(false)} className="text-stone-500 hover:text-stone-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCamp} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Camp Title</label>
                <input
                  type="text"
                  placeholder="e.g. Swastha Ayur Rural Free Health Camp"
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Camp Date</label>
                  <input
                    type="date"
                    value={campDate}
                    onChange={(e) => setCampDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Target Footfall</label>
                  <input
                    type="number"
                    value={targetFootfall}
                    onChange={(e) => setTargetFootfall(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Venue / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Community Hall, Mandya Village, Karnataka"
                  value={campLocation}
                  onChange={(e) => setCampLocation(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Lead Ayurvedic Vaidya</label>
                  <input
                    type="text"
                    value={leadDoctor}
                    onChange={(e) => setLeadDoctor(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Budget Allocation (₹)</label>
                  <input
                    type="number"
                    value={budgetSpent}
                    onChange={(e) => setBudgetSpent(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddCampModal(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold shadow"
                >
                  Save & Publish Camp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FAST CAMP LEAD DATA ENTRY */}
      {showAddLeadModal && selectedCamp && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-2xl max-w-lg w-full p-6 text-stone-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div>
                <h3 className="font-bold text-base text-stone-900">Fast Camp Screening Lead Entry</h3>
                <p className="text-xs text-stone-500">Camp: {selectedCamp.campName}</p>
              </div>
              <button onClick={() => setShowAddLeadModal(false)} className="text-stone-500 hover:text-stone-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCampLead} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-stone-700 font-semibold mb-1">Patient Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Anand Murthy"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Age</label>
                  <input
                    type="number"
                    value={leadAge}
                    onChange={(e) => setLeadAge(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 text-center"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98450..."
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Village / Local Area</label>
                  <input
                    type="text"
                    placeholder="e.g. Ganjam Village"
                    value={leadVillage}
                    onChange={(e) => setLeadVillage(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Chief Complaint Identified</label>
                <input
                  type="text"
                  placeholder="e.g. Bilateral knee pain (Sandhigata Vata) for 1 year"
                  value={leadComplaint}
                  onChange={(e) => setLeadComplaint(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Suspected Dosha</label>
                  <select
                    value={leadDosha}
                    onChange={(e) => setLeadDosha(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  >
                    <option value="Vata Pradhana">Vata Pradhana (Joints, Neuro)</option>
                    <option value="Pitta Pradhana">Pitta Pradhana (Skin, Acid)</option>
                    <option value="Kapha Pradhana">Kapha Pradhana (Weight, Mucus)</option>
                    <option value="Vata-Kapha">Vata-Kapha (Chronic, Stiff)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Initial Funnel Stage</label>
                  <select
                    value={leadStatus}
                    onChange={(e) => setLeadStatus(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-bold"
                  >
                    <option value="Screened at Camp">Screened at Camp</option>
                    <option value="Follow-up Called">Follow-up Called</option>
                    <option value="Visited Hospital">Visited Hospital</option>
                    <option value="Enrolled in Panchakarma">Enrolled in Panchakarma</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold shadow"
                >
                  Save Camp Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
