import React, { useState } from 'react';
import { FileSignature, Search, Plus, Check, Sparkles, Trash2, X, Save } from 'lucide-react';
import { AyurStorage } from '../services/storage';
export const ClinicalNoteTemplateModal = ({ isOpen, onClose, config, onApplyTemplate, currentDraft }) => {
  if (!isOpen) return null;
  const [templates, setTemplates] = useState(AyurStorage.getSavedTemplates());
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTemplateId, setActiveTemplateId] = useState(templates[0]?.id || '');
  const [mode, setMode] = useState('browse');
  // Form state for saving new template
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('Musculoskeletal & Joints');
  const [newSubjective, setNewSubjective] = useState(currentDraft?.soapSubjective || '');
  const [newObjective, setNewObjective] = useState(currentDraft?.soapObjective || '');
  const [newAssessment, setNewAssessment] = useState(currentDraft?.soapAssessment || '');
  const [newPlan, setNewPlan] = useState(currentDraft?.soapPlan || '');
  const [newDosha, setNewDosha] = useState(currentDraft?.doshaPredominance || 'Vata');
  const [newPathya, setNewPathya] = useState(currentDraft?.pathyaDiet || '');
  const [newApathya, setNewApathya] = useState(currentDraft?.apathyaDiet || '');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const categories = [
    'All',
    'Musculoskeletal & Joints',
    'Panchakarma Detox',
    'Digestive & Agni',
    'Dermatology',
    'Neuropsychiatry',
    'Custom Doctor Notes',
  ];
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.soapAssessment.toLowerCase().includes(search.toLowerCase()) ||
      t.soapSubjective.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      selectedCategory === 'All'
        ? true
        : selectedCategory === 'Custom Doctor Notes'
          ? t.isCustom
          : t.category.toLowerCase().includes(selectedCategory.toLowerCase().slice(0, 5));
    return matchesSearch && matchesCat;
  });
  const activeTemplate = templates.find((t) => t.id === activeTemplateId) || filteredTemplates[0] || templates[0];
  const handleSaveNewTemplate = (e) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;
    const newTmpl = {
      id: `tmpl-custom-${Date.now()}`,
      name: newTemplateName.trim(),
      category: newTemplateCategory,
      doshaPredominance: newDosha,
      soapSubjective: newSubjective.trim(),
      soapObjective: newObjective.trim(),
      soapAssessment: newAssessment.trim(),
      soapPlan: newPlan.trim(),
      pathyaDiet: newPathya.trim() || undefined,
      apathyaDiet: newApathya.trim() || undefined,
      recommendedPanchakarma: currentDraft?.recommendedPanchakarma || [],
      defaultPrescriptions: currentDraft?.prescriptions || [],
      createdAt: new Date().toISOString().split('T')[0],
      isCustom: true,
    };
    AyurStorage.addSavedTemplate(newTmpl);
    const updated = AyurStorage.getSavedTemplates();
    setTemplates(updated);
    setActiveTemplateId(newTmpl.id);
    setSaveSuccessMsg(`Template "${newTmpl.name}" saved to your clinical library!`);
    setTimeout(() => {
      setSaveSuccessMsg('');
      setMode('browse');
    }, 1500);
  };
  const handleDeleteTemplate = (id, name) => {
    if (confirm(`Remove template "${name}" from your clinical library?`)) {
      AyurStorage.deleteSavedTemplate(id);
      const updated = AyurStorage.getSavedTemplates();
      setTemplates(updated);
      if (activeTemplateId === id) {
        setActiveTemplateId(updated[0]?.id || '');
      }
    }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-5xl w-full text-stone-900 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl text-white shadow-sm"
              style={{ backgroundColor: config.themeColor || '#0f6240' }}
            >
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-black text-lg text-stone-900">
                  Ayurvedic Clinical Note Templates (EMR / SOAP)
                </h3>
                <span className="text-[11px] text-stone-500 font-mono">
                  {templates.length} Pre-configured & Custom Notes
                </span>
              </div>
              <p className="text-xs text-stone-600">
                Instantly load evidence-based classical clinical notes for Arthritis, Panchakarma, Agni, Skin & more, or
                save your own custom consultation protocols.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex p-1 bg-stone-200/70 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setMode('browse')}
                className={`px-3 py-1.5 rounded-lg transition-all ${mode === 'browse' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
              >
                Browse Library
              </button>
              <button
                onClick={() => setMode('save_new')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${mode === 'save_new' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Current as New</span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {mode === 'browse' ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {/* Left Column: Template List & Filters */}
            <div className="w-full md:w-80 border-r border-stone-200 flex flex-col bg-stone-50/50 shrink-0">
              {/* Search Bar */}
              <div className="p-3 border-b border-stone-200 bg-white">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search templates (e.g. Arthritis, SOAP)..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-stone-400"
                  />
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="p-2.5 border-b border-stone-200 flex gap-1.5 overflow-x-auto text-[11px] scrollbar-none bg-stone-50">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-all ${
                      selectedCategory === cat
                        ? 'bg-stone-900 text-white font-bold'
                        : 'text-stone-600 hover:bg-stone-200/70'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Template Items List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {filteredTemplates.length === 0 ? (
                  <div className="p-6 text-center text-xs text-stone-500">No templates found matching "{search}".</div>
                ) : (
                  filteredTemplates.map((t) => {
                    const isSelected = activeTemplate?.id === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setActiveTemplateId(t.id)}
                        className={`p-3 rounded-2xl cursor-pointer transition-all border text-left ${
                          isSelected
                            ? 'bg-white border-stone-300 shadow-sm ring-1'
                            : 'bg-white/70 border-stone-200/80 hover:bg-white hover:border-stone-300'
                        }`}
                        style={{
                          borderColor: isSelected ? config.themeColor || '#0f6240' : undefined,
                        }}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-semibold text-xs text-stone-900 line-clamp-1">{t.name}</h4>
                          {t.isCustom && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                              Custom
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                          <span>{t.category}</span>
                          <span>·</span>
                          <span className="font-semibold text-stone-700">{t.doshaPredominance}</span>
                        </div>

                        <p className="text-[11px] text-stone-600 line-clamp-2 mt-1.5 leading-snug">
                          {t.soapAssessment || t.soapSubjective}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Template Detailed Preview */}
            <div className="flex-1 flex flex-col bg-white overflow-y-auto p-5 sm:p-6 min-h-0">
              {activeTemplate ? (
                <div className="space-y-5 flex-1">
                  {/* Top Bar of Active Template */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
                    <div>
                      <div className="flex items-center gap-2 mb-1 text-xs text-stone-500">
                        <span className="font-medium text-stone-700">{activeTemplate.category}</span>
                        <span>·</span>
                        <span>
                          Dosha: <strong>{activeTemplate.doshaPredominance}</strong>
                        </span>
                        {activeTemplate.isCustom && (
                          <>
                            <span>·</span>
                            <span className="text-amber-700">Created {activeTemplate.createdAt}</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-xl font-serif font-black text-stone-900">{activeTemplate.name}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeTemplate.isCustom && (
                        <button
                          onClick={() => handleDeleteTemplate(activeTemplate.id, activeTemplate.name)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold flex items-center gap-1 border border-red-200 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onApplyTemplate(activeTemplate);
                          onClose();
                        }}
                        className="px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 active:scale-95 transition-all"
                        style={{ backgroundColor: config.themeColor || '#0f6240' }}
                      >
                        <Check className="w-4 h-4" />
                        <span>Load This Template</span>
                      </button>
                    </div>
                  </div>

                  {/* SOAP Note Visual Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* S: Subjective */}
                    <div className="bg-stone-50/70 border border-stone-200 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center font-mono">
                          S
                        </div>
                        <h5 className="font-bold text-xs uppercase tracking-wider text-stone-700">
                          Subjective (Symptoms & History)
                        </h5>
                      </div>
                      <p className="text-xs text-stone-700 whitespace-pre-line leading-relaxed">
                        {activeTemplate.soapSubjective}
                      </p>
                    </div>

                    {/* O: Objective */}
                    <div className="bg-stone-50/70 border border-stone-200 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center font-mono">
                          O
                        </div>
                        <h5 className="font-bold text-xs uppercase tracking-wider text-stone-700">
                          Objective (Pariksha & Vitals)
                        </h5>
                      </div>
                      <p className="text-xs text-stone-700 whitespace-pre-line leading-relaxed">
                        {activeTemplate.soapObjective}
                      </p>
                    </div>

                    {/* A: Assessment */}
                    <div className="bg-stone-50/70 border border-stone-200 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center font-mono">
                          A
                        </div>
                        <h5 className="font-bold text-xs uppercase tracking-wider text-stone-700">
                          Assessment (Nidana & Doshic Diagnosis)
                        </h5>
                      </div>
                      <p className="text-xs text-stone-700 whitespace-pre-line leading-relaxed font-semibold">
                        {activeTemplate.soapAssessment}
                      </p>
                    </div>

                    {/* P: Plan */}
                    <div className="bg-stone-50/70 border border-stone-200 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center font-mono">
                          P
                        </div>
                        <h5 className="font-bold text-xs uppercase tracking-wider text-stone-700">
                          Plan (Chikitsa & Procedures)
                        </h5>
                      </div>
                      <p className="text-xs text-stone-700 whitespace-pre-line leading-relaxed">
                        {activeTemplate.soapPlan}
                      </p>
                    </div>
                  </div>

                  {/* Dietary Guidance & Procedures */}
                  {(activeTemplate.pathyaDiet ||
                    activeTemplate.apathyaDiet ||
                    activeTemplate.recommendedPanchakarma?.length) && (
                    <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                      <h5 className="font-bold text-xs uppercase tracking-wider text-stone-800 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pre-Configured Dietary & Panchakarma Recommendations</span>
                      </h5>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {activeTemplate.pathyaDiet && (
                          <div className="p-2.5 bg-emerald-50/60 border border-emerald-200/60 rounded-xl">
                            <span className="font-bold text-emerald-800 block mb-0.5">Pathya (Recommended Diet):</span>
                            <span className="text-stone-700">{activeTemplate.pathyaDiet}</span>
                          </div>
                        )}
                        {activeTemplate.apathyaDiet && (
                          <div className="p-2.5 bg-red-50/60 border border-red-200/60 rounded-xl">
                            <span className="font-bold text-red-800 block mb-0.5">Apathya (Diet to Avoid):</span>
                            <span className="text-stone-700">{activeTemplate.apathyaDiet}</span>
                          </div>
                        )}
                      </div>

                      {activeTemplate.recommendedPanchakarma && activeTemplate.recommendedPanchakarma.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-xs text-stone-500 font-medium">Recommended Therapies:</span>
                          {activeTemplate.recommendedPanchakarma.map((pk, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-stone-800"
                            >
                              {pk}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Load Action Button at Bottom */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        onApplyTemplate(activeTemplate);
                        onClose();
                      }}
                      className="px-6 py-2.5 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2 active:scale-95 transition-all"
                      style={{ backgroundColor: config.themeColor || '#0f6240' }}
                    >
                      <Check className="w-4 h-4" />
                      <span>Load into Current EMR Note</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-stone-500">
                  Select a template on the left to preview.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Save New Custom Template Mode */
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            <form onSubmit={handleSaveNewTemplate} className="max-w-2xl mx-auto space-y-4">
              <div>
                <h4 className="text-lg font-serif font-black text-stone-900">Save Clinical Note as Custom Template</h4>
                <p className="text-xs text-stone-600">
                  Save your personalized clinical findings, treatment protocol, and diet advice as a reusable template
                  for 1-click documentation on future patients.
                </p>
              </div>

              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Template Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cervical Spondylosis Greeva Basti Protocol"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Clinical Category</label>
                  <select
                    value={newTemplateCategory}
                    onChange={(e) => setNewTemplateCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-stone-400"
                  >
                    <option value="Musculoskeletal & Joints">Musculoskeletal & Joints</option>
                    <option value="Panchakarma Detox">Panchakarma Detox</option>
                    <option value="Digestive & Agni">Digestive & Agni</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Neuropsychiatry">Neuropsychiatry</option>
                    <option value="Women Health">Women Health</option>
                    <option value="General Consultation">General Consultation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Dosha Predominance</label>
                  <select
                    value={newDosha}
                    onChange={(e) => setNewDosha(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="Vata">Vata</option>
                    <option value="Pitta">Pitta</option>
                    <option value="Kapha">Kapha</option>
                    <option value="Vata-Pitta">Vata-Pitta</option>
                    <option value="Pitta-Kapha">Pitta-Kapha</option>
                    <option value="Vata-Kapha">Vata-Kapha</option>
                    <option value="Tridosha">Tridosha</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Subjective (Patient Complaints & Srotas History) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={newSubjective}
                  onChange={(e) => setNewSubjective(e.target.value)}
                  placeholder="Patient reports pain, stiffness..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Objective (Ashtavidha Pariksha, Vitals, Range of Motion) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder="Nadi, Jihwa, Agni, Sparsha observations..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Assessment (Ayurvedic Nidana & Modern Diagnosis) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={newAssessment}
                  onChange={(e) => setNewAssessment(e.target.value)}
                  placeholder="e.g. Sandhigata Vata with Asthidhatu Kshaya..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Plan (Chikitsa Sutra & Panchakarma Protocol) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  placeholder="e.g. Snehana, Swedana, Basti protocol and medications..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Pathya (Wholesome Diet)</label>
                  <input
                    type="text"
                    value={newPathya}
                    onChange={(e) => setNewPathya(e.target.value)}
                    placeholder="Warm cow ghee, garlic milk, barley..."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Apathya (Unwholesome Diet)</label>
                  <input
                    type="text"
                    value={newApathya}
                    onChange={(e) => setNewApathya(e.target.value)}
                    placeholder="Cold drinks, curd at night, fermented items..."
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMode('browse')}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 active:scale-95 transition-all"
                  style={{ backgroundColor: config.themeColor || '#0f6240' }}
                >
                  <Save className="w-4 h-4" />
                  <span>Save Template to Library</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
