import React, { useState } from 'react';
import {
  Utensils,
  Search,
  Plus,
  Trash2,
  Edit3,
  Printer,
  Share2,
  X,
  AlertCircle,
  Sparkles,
  BookOpen,
  User,
  Save,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Wind,
} from 'lucide-react';
import { AyurStorage } from '../services/storage';
export const DietChartsView = ({ patients, config, currentBranch, initialSelectedPatientId }) => {
  const [dietTemplates, setDietTemplates] = useState(() => {
    return AyurStorage.getDietChartTemplates();
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState(dietTemplates[0]?.id || 'diet-piles-fistula');
  const [selectedPatientId, setSelectedPatientId] = useState(initialSelectedPatientId || patients[0]?.id || '');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  // Editing mode states for the active chart
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  // New item inputs for array fields
  const [newPathyaItem, setNewPathyaItem] = useState('');
  const [newApathyaItem, setNewApathyaItem] = useState('');
  const [newAsanaItem, setNewAsanaItem] = useState('');
  const [newPranayamaItem, setNewPranayamaItem] = useState('');
  const [newExerciseItem, setNewExerciseItem] = useState('');
  const [newLifestyleItem, setNewLifestyleItem] = useState('');
  // Modals
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const brandColor = config.themeColor || '#0f6240';
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const currentTemplate = dietTemplates.find((t) => t.id === selectedTemplateId) || dietTemplates[0];
  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };
  const categories = [
    'All',
    'Gastrointestinal',
    'Musculoskeletal',
    'Anorectal',
    'Metabolic',
    'Dermatology',
    'Gynecology',
    'Cardiovascular',
    'Respiratory',
    'Psychosomatic',
  ];
  const filteredTemplates = dietTemplates.filter((t) => {
    const matchesSearch =
      t.conditionName.toLowerCase().includes(search.toLowerCase()) ||
      t.tagline.toLowerCase().includes(search.toLowerCase()) ||
      t.doshaFocus.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      selectedCategory === 'All' ? true : t.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCat;
  });
  // Start editing the selected template
  const handleStartEdit = () => {
    if (!currentTemplate) return;
    setEditForm({ ...currentTemplate });
    setIsEditing(true);
  };
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm(null);
  };
  const handleSaveEdit = () => {
    if (!editForm) return;
    const updatedList = dietTemplates.map((t) => (t.id === editForm.id ? editForm : t));
    setDietTemplates(updatedList);
    AyurStorage.saveDietChartTemplates(updatedList);
    setIsEditing(false);
    triggerToast('Diet chart template updated & saved successfully!');
  };
  // Add new blank custom diet chart
  const handleCreateNewChart = () => {
    const newChart = {
      id: `diet-custom-${Date.now()}`,
      conditionName: 'Custom Clinical Diet Protocol',
      category: 'General Kayachikitsa',
      doshaFocus: 'Tridosha Balanced',
      tagline: 'Tailored Nutritional Prescription',
      earlyMorning: 'Warm water with herbs',
      breakfast: 'Steamed warm grains',
      midDayDrink: 'Herbal decoction or Takra',
      lunch: 'Old boiled rice, Moong dal, seasonal gourd vegetables with Cow Ghee',
      eveningSnack: 'Roasted seeds or light fruits',
      dinner: 'Light vegetable soup and soft phulka before 7:30 PM',
      bedtime: 'Warm medicated milk or warm water with Triphala',
      pathyaDoList: ['Freshly cooked warm meals', 'A2 Desi Cow Ghee in moderation', 'Lukewarm boiled water'],
      apathyaDontList: ['Avoid refrigerated cold items', 'Avoid spicy fried junk', 'Avoid late-night dinners'],
      suggestedYogaAsanas: ['Vajrasana after meals', 'Tadasana', 'Shavasana'],
      suggestedPranayama: ['Anuloma Viloma', 'Deep Diaphragmatic Breathing'],
      suggestedExercises: ['30 minutes gentle morning walk'],
      ayurvedicLifestyleRules: [
        'Maintain regular meal timings',
        'Eat in calm mindful surroundings',
        'Do not suppress natural urges',
      ],
      customNotes: 'Personalized for patient dosha vikriti',
    };
    const updated = [newChart, ...dietTemplates];
    setDietTemplates(updated);
    AyurStorage.saveDietChartTemplates(updated);
    setSelectedTemplateId(newChart.id);
    setEditForm(newChart);
    setIsEditing(true);
    triggerToast('New blank diet protocol created for editing!');
  };
  // WhatsApp share generator
  const handleShareWhatsApp = () => {
    if (!selectedPatient) {
      triggerToast('Please select a patient to send diet chart');
      return;
    }
    const target = isEditing && editForm ? editForm : currentTemplate;
    if (!target) return;
    const phone = selectedPatient.phone.replace(/[^0-9]/g, '');
    const text =
      `🌿 *${config.hospitalName.toUpperCase()} - AYURVEDIC PATHYA AHARA CHART* 🌿\n\n` +
      `👤 *Patient:* ${selectedPatient.name} (UHID: ${selectedPatient.uhid})\n` +
      `🩺 *Protocol For:* ${target.conditionName}\n` +
      `⚖️ *Dosha Focus:* ${target.doshaFocus}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🌅 *DAILY MEAL TIMETABLE:*\n` +
      `• *Early Morning (06:30 AM):* ${target.earlyMorning}\n` +
      `• *Breakfast (08:30 AM):* ${target.breakfast}\n` +
      `• *Mid-Day Drink (11:00 AM):* ${target.midDayDrink}\n` +
      `• *Lunch (01:00 PM):* ${target.lunch}\n` +
      `• *Evening Snack (04:30 PM):* ${target.eveningSnack}\n` +
      `• *Dinner (07:30 PM):* ${target.dinner}\n` +
      `• *Bedtime (09:45 PM):* ${target.bedtime}\n\n` +
      `✅ *PATHYA (FOODS TO EAT):*\n${target.pathyaDoList.map((i) => `• ${i}`).join('\n')}\n\n` +
      `❌ *APATHYA (FOODS TO STRICTLY AVOID):*\n${target.apathyaDontList.map((i) => `• ${i}`).join('\n')}\n\n` +
      (target.suggestedYogaAsanas?.length
        ? `🧘 *SUGGESTED YOGA ASANAS:*\n${target.suggestedYogaAsanas.map((i) => `• ${i}`).join('\n')}\n\n`
        : '') +
      (target.suggestedPranayama?.length
        ? `🌬️ *PRANAYAMA:*\n${target.suggestedPranayama.map((i) => `• ${i}`).join('\n')}\n\n`
        : '') +
      `📜 *AYURVEDIC LIFESTYLE RULES:*\n${target.ayurvedicLifestyleRules.map((i) => `• ${i}`).join('\n')}\n\n` +
      (target.customNotes ? `💡 *DOCTOR'S SPECIFIC ADVICE:*\n${target.customNotes}\n\n` : '') +
      `— *${currentBranch.doctorInCharge}*\n${config.hospitalName} | 📞 ${currentBranch.phone}`;
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    triggerToast(`WhatsApp diet dispatch opened for ${selectedPatient.name}`);
  };
  const activeData = isEditing && editForm ? editForm : currentTemplate;
  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-stone-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce border border-stone-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: brandColor }}
            >
              Ayurvedic Diet & Pathya Ahara Studio
            </span>
            <span className="text-xs text-stone-500 font-mono">Classical Nutrition & Lifestyle Prescription</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Disease-Specific Pathya & Apathya Diet Charts</h1>
          <p className="text-xs text-stone-500 mt-1">
            Pre-configured clinical regimens with foods to eat, foods to avoid, Yoga Asanas, and daily exercises. Fully
            doctor-editable and printable with your clinic logo and colors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCreateNewChart}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-stone-600" />
            <span>Create New Protocol</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow"
            style={{ backgroundColor: brandColor }}
          >
            <Printer className="w-4 h-4" />
            <span>Print Branded Diet Chart</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all shadow"
          >
            <Share2 className="w-4 h-4" />
            <span>Send to Patient WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Patient Selector Strip */}
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm font-bold"
            style={{ backgroundColor: brandColor }}
          >
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Prescribing Diet For Patient
            </div>
            <div className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <span>{selectedPatient ? selectedPatient.name : 'Select Patient'}</span>
              {selectedPatient && (
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-white border border-stone-200 text-stone-600">
                  {selectedPatient.uhid} • {selectedPatient.age}y/{selectedPatient.gender} • Prakriti:{' '}
                  {selectedPatient.prakriti}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-600">Change Patient:</span>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-800 focus:outline-none focus:ring-2"
            style={{ borderColor: brandColor }}
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.uhid}) - {p.primaryCondition}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Template Selector List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-stone-500" />
                <span>Clinical Diet Protocols ({filteredTemplates.length})</span>
              </h2>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search disease, dosha, foods..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Category Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all ${
                    selectedCategory === cat ? 'text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === cat ? brandColor : undefined,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Protocol Cards List */}
            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {filteredTemplates.map((tmpl) => {
                const isSelected = tmpl.id === selectedTemplateId;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => {
                      setSelectedTemplateId(tmpl.id);
                      setIsEditing(false);
                      setEditForm(null);
                    }}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-card ring-1 ring-emerald-500'
                        : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-xs text-stone-900 leading-snug">{tmpl.conditionName}</div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 shrink-0">
                        {tmpl.category}
                      </span>
                    </div>

                    <div className="text-[11px] font-medium text-stone-500 mt-1 line-clamp-1">{tmpl.tagline}</div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-stone-500 font-medium">
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <Sparkles className="w-3 h-3" />
                        {tmpl.doshaFocus}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Editable Diet Chart */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card space-y-6">
            {/* Action Bar for Chart */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>
                    {activeData.category} • {activeData.doshaFocus}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-stone-900 mt-0.5">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm?.conditionName || ''}
                      onChange={(e) =>
                        setEditForm((prev) => (prev ? { ...prev, conditionName: e.target.value } : null))
                      }
                      className="px-2 py-1 rounded border border-stone-300 font-bold text-stone-900 w-full text-lg"
                    />
                  ) : (
                    activeData.conditionName
                  )}
                </h2>
                <div className="text-xs text-stone-500 mt-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm?.tagline || ''}
                      onChange={(e) => setEditForm((prev) => (prev ? { ...prev, tagline: e.target.value } : null))}
                      className="px-2 py-0.5 rounded border border-stone-300 text-stone-600 w-full text-xs"
                    />
                  ) : (
                    activeData.tagline
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 shadow"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleStartEdit}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center gap-1.5 border border-stone-200 transition-all"
                  >
                    <Edit3 className="w-4 h-4 text-stone-600" />
                    <span>Edit Every Field</span>
                  </button>
                )}
              </div>
            </div>

            {/* Daily Ahara Timetable (Meal-by-Meal) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-amber-600" />
                  <span>Meal-by-Meal Pathya Ahara Timetable</span>
                </h3>
                {isEditing && (
                  <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Editing Mode Active
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Early Morning */}
                <div className="p-3 rounded-xl border border-stone-200 bg-stone-50/70">
                  <div className="font-bold text-stone-900 flex items-center justify-between mb-1">
                    <span className="text-amber-800 font-semibold">🌅 Early Morning (06:30 AM)</span>
                    <span className="text-[10px] text-stone-400 font-mono">Ushapan</span>
                  </div>
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={editForm?.earlyMorning || ''}
                      onChange={(e) => setEditForm((prev) => (prev ? { ...prev, earlyMorning: e.target.value } : null))}
                      className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-white text-stone-800"
                    />
                  ) : (
                    <div className="text-stone-700 leading-relaxed">{activeData.earlyMorning}</div>
                  )}
                </div>

                {/* Breakfast */}
                <div className="p-3 rounded-xl border border-stone-200 bg-stone-50/70">
                  <div className="font-bold text-stone-900 flex items-center justify-between mb-1">
                    <span className="text-amber-800 font-semibold">🥣 Breakfast (08:30 AM)</span>
                    <span className="text-[10px] text-stone-400 font-mono">Pratarasha</span>
                  </div>
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={editForm?.breakfast || ''}
                      onChange={(e) => setEditForm((prev) => (prev ? { ...prev, breakfast: e.target.value } : null))}
                      className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-white text-stone-800"
                    />
                  ) : (
                    <div className="text-stone-700 leading-relaxed">{activeData.breakfast}</div>
                  )}
                </div>

                {/* Mid-Day Drink */}
                <div className="p-3 rounded-xl border border-stone-200 bg-stone-50/70">
                  <div className="font-bold text-stone-900 flex items-center justify-between mb-1">
                    <span className="text-amber-800 font-semibold">🥥 Mid-Day Herbal Tonic (11:00 AM)</span>
                    <span className="text-[10px] text-stone-400 font-mono">Paniya</span>
                  </div>
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={editForm?.midDayDrink || ''}
                      onChange={(e) => setEditForm((prev) => (prev ? { ...prev, midDayDrink: e.target.value } : null))}
                      className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-white text-stone-800"
                    />
                  ) : (
                    <div className="text-stone-700 leading-relaxed">{activeData.midDayDrink}</div>
                  )}
                </div>

                {/* Lunch */}
                <div className="p-3 rounded-xl border border-stone-200 bg-stone-50/70">
                  <div className="font-bold text-stone-900 flex items-center justify-between mb-1">
                    <span className="text-amber-800 font-semibold">🍲 Main Lunch (01:00 PM)</span>
                    <span className="text-[10px] text-stone-400 font-mono">Madhyahna Ahara</span>
                  </div>
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={editForm?.lunch || ''}
                      onChange={(e) => setEditForm((prev) => (prev ? { ...prev, lunch: e.target.value } : null))}
                      className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-white text-stone-800"
                    />
                  ) : (
                    <div className="text-stone-700 leading-relaxed">{activeData.lunch}</div>
                  )}
                </div>

                {/* Evening Snack */}
                <div className="p-3 rounded-xl border border-stone-200 bg-stone-50/70">
                  <div className="font-bold text-stone-900 flex items-center justify-between mb-1">
                    <span className="text-amber-800 font-semibold">🍵 Evening Refreshment (04:30 PM)</span>
                    <span className="text-[10px] text-stone-400 font-mono">Sayam Ahara</span>
                  </div>
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={editForm?.eveningSnack || ''}
                      onChange={(e) => setEditForm((prev) => (prev ? { ...prev, eveningSnack: e.target.value } : null))}
                      className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-white text-stone-800"
                    />
                  ) : (
                    <div className="text-stone-700 leading-relaxed">{activeData.eveningSnack}</div>
                  )}
                </div>

                {/* Dinner */}
                <div className="p-3 rounded-xl border border-stone-200 bg-stone-50/70">
                  <div className="font-bold text-stone-900 flex items-center justify-between mb-1">
                    <span className="text-amber-800 font-semibold">🌙 Light Dinner (Before 07:30 PM)</span>
                    <span className="text-[10px] text-stone-400 font-mono">Ratri Bhojana</span>
                  </div>
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={editForm?.dinner || ''}
                      onChange={(e) => setEditForm((prev) => (prev ? { ...prev, dinner: e.target.value } : null))}
                      className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-white text-stone-800"
                    />
                  ) : (
                    <div className="text-stone-700 leading-relaxed">{activeData.dinner}</div>
                  )}
                </div>
              </div>

              {/* Bedtime */}
              <div className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 text-xs">
                <div className="font-bold text-stone-900 flex items-center justify-between mb-1">
                  <span className="text-amber-800 font-semibold">🥛 Bedtime Rasayana (09:45 PM)</span>
                  <span className="text-[10px] text-stone-400 font-mono">Nishi Kala</span>
                </div>
                {isEditing ? (
                  <textarea
                    rows={1}
                    value={editForm?.bedtime || ''}
                    onChange={(e) => setEditForm((prev) => (prev ? { ...prev, bedtime: e.target.value } : null))}
                    className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-white text-stone-800"
                  />
                ) : (
                  <div className="text-stone-700 leading-relaxed">{activeData.bedtime}</div>
                )}
              </div>
            </div>

            {/* Pathya (Foods to Eat) vs Apathya (Foods to Strictly Avoid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pathya (Do's) */}
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Pathya (Foods to Eat & Emphasize)</span>
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 font-mono">
                    {activeData.pathyaDoList.length} items
                  </span>
                </div>

                <div className="space-y-1.5">
                  {activeData.pathyaDoList.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white border border-emerald-100 text-xs text-stone-800 shadow-card"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>{item}</span>
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => {
                            if (!editForm) return;
                            const updated = editForm.pathyaDoList.filter((_, i) => i !== idx);
                            setEditForm({ ...editForm, pathyaDoList: updated });
                          }}
                          className="text-stone-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {isEditing && (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Add food to eat..."
                      value={newPathyaItem}
                      onChange={(e) => setNewPathyaItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newPathyaItem.trim() && editForm) {
                          setEditForm({ ...editForm, pathyaDoList: [...editForm.pathyaDoList, newPathyaItem.trim()] });
                          setNewPathyaItem('');
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-emerald-300 text-xs bg-white focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (newPathyaItem.trim() && editForm) {
                          setEditForm({ ...editForm, pathyaDoList: [...editForm.pathyaDoList, newPathyaItem.trim()] });
                          setNewPathyaItem('');
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Apathya (Don'ts) */}
              <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Apathya (Foods to Strictly Prohibit)</span>
                  </h4>
                  <span className="text-[10px] font-bold text-rose-700 font-mono">
                    {activeData.apathyaDontList.length} items
                  </span>
                </div>

                <div className="space-y-1.5">
                  {activeData.apathyaDontList.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white border border-rose-100 text-xs text-stone-800 shadow-card"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        <span>{item}</span>
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => {
                            if (!editForm) return;
                            const updated = editForm.apathyaDontList.filter((_, i) => i !== idx);
                            setEditForm({ ...editForm, apathyaDontList: updated });
                          }}
                          className="text-stone-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {isEditing && (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Add food to avoid..."
                      value={newApathyaItem}
                      onChange={(e) => setNewApathyaItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newApathyaItem.trim() && editForm) {
                          setEditForm({
                            ...editForm,
                            apathyaDontList: [...editForm.apathyaDontList, newApathyaItem.trim()],
                          });
                          setNewApathyaItem('');
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-rose-300 text-xs bg-white focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (newApathyaItem.trim() && editForm) {
                          setEditForm({
                            ...editForm,
                            apathyaDontList: [...editForm.apathyaDontList, newApathyaItem.trim()],
                          });
                          setNewApathyaItem('');
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Suggested Yoga Asanas, Pranayama & Exercises */}
            <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-indigo-600" />
                  <span>Suggested Yoga Asanas, Pranayama & Physical Regimen</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Asanas */}
                <div className="p-3 bg-white border border-indigo-100 rounded-2xl space-y-1.5 shadow-card">
                  <div className="text-[11px] font-bold text-indigo-950 flex items-center justify-between">
                    <span>🧘 Yoga Asanas</span>
                    <span className="text-[10px] text-indigo-600 font-mono">
                      {(activeData.suggestedYogaAsanas || []).length}
                    </span>
                  </div>
                  <ul className="text-xs text-stone-700 space-y-1">
                    {(activeData.suggestedYogaAsanas || []).map((as, i) => (
                      <li key={i} className="flex items-start justify-between gap-1">
                        <span>• {as}</span>
                        {isEditing && (
                          <button
                            onClick={() => {
                              if (!editForm) return;
                              const updated = (editForm.suggestedYogaAsanas || []).filter((_, idx) => idx !== i);
                              setEditForm({ ...editForm, suggestedYogaAsanas: updated });
                            }}
                            className="text-stone-300 hover:text-rose-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  {isEditing && (
                    <div className="flex gap-1 pt-1">
                      <input
                        type="text"
                        placeholder="Add asana..."
                        value={newAsanaItem}
                        onChange={(e) => setNewAsanaItem(e.target.value)}
                        className="flex-1 px-2 py-1 text-[11px] border border-stone-200 rounded"
                      />
                      <button
                        onClick={() => {
                          if (newAsanaItem.trim() && editForm) {
                            setEditForm({
                              ...editForm,
                              suggestedYogaAsanas: [...(editForm.suggestedYogaAsanas || []), newAsanaItem.trim()],
                            });
                            setNewAsanaItem('');
                          }
                        }}
                        className="px-2 py-1 bg-indigo-600 text-white rounded text-[11px]"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                {/* Pranayama */}
                <div className="p-3 bg-white border border-indigo-100 rounded-2xl space-y-1.5 shadow-card">
                  <div className="text-[11px] font-bold text-indigo-950 flex items-center justify-between">
                    <span>🌬️ Pranayama (Breathwork)</span>
                    <span className="text-[10px] text-indigo-600 font-mono">
                      {(activeData.suggestedPranayama || []).length}
                    </span>
                  </div>
                  <ul className="text-xs text-stone-700 space-y-1">
                    {(activeData.suggestedPranayama || []).map((pr, i) => (
                      <li key={i} className="flex items-start justify-between gap-1">
                        <span>• {pr}</span>
                        {isEditing && (
                          <button
                            onClick={() => {
                              if (!editForm) return;
                              const updated = (editForm.suggestedPranayama || []).filter((_, idx) => idx !== i);
                              setEditForm({ ...editForm, suggestedPranayama: updated });
                            }}
                            className="text-stone-300 hover:text-rose-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  {isEditing && (
                    <div className="flex gap-1 pt-1">
                      <input
                        type="text"
                        placeholder="Add pranayama..."
                        value={newPranayamaItem}
                        onChange={(e) => setNewPranayamaItem(e.target.value)}
                        className="flex-1 px-2 py-1 text-[11px] border border-stone-200 rounded"
                      />
                      <button
                        onClick={() => {
                          if (newPranayamaItem.trim() && editForm) {
                            setEditForm({
                              ...editForm,
                              suggestedPranayama: [...(editForm.suggestedPranayama || []), newPranayamaItem.trim()],
                            });
                            setNewPranayamaItem('');
                          }
                        }}
                        className="px-2 py-1 bg-indigo-600 text-white rounded text-[11px]"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                {/* Exercises */}
                <div className="p-3 bg-white border border-indigo-100 rounded-2xl space-y-1.5 shadow-card">
                  <div className="text-[11px] font-bold text-indigo-950 flex items-center justify-between">
                    <span>🏃 Exercises & Activity</span>
                    <span className="text-[10px] text-indigo-600 font-mono">
                      {(activeData.suggestedExercises || []).length}
                    </span>
                  </div>
                  <ul className="text-xs text-stone-700 space-y-1">
                    {(activeData.suggestedExercises || []).map((ex, i) => (
                      <li key={i} className="flex items-start justify-between gap-1">
                        <span>• {ex}</span>
                        {isEditing && (
                          <button
                            onClick={() => {
                              if (!editForm) return;
                              const updated = (editForm.suggestedExercises || []).filter((_, idx) => idx !== i);
                              setEditForm({ ...editForm, suggestedExercises: updated });
                            }}
                            className="text-stone-300 hover:text-rose-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  {isEditing && (
                    <div className="flex gap-1 pt-1">
                      <input
                        type="text"
                        placeholder="Add exercise..."
                        value={newExerciseItem}
                        onChange={(e) => setNewExerciseItem(e.target.value)}
                        className="flex-1 px-2 py-1 text-[11px] border border-stone-200 rounded"
                      />
                      <button
                        onClick={() => {
                          if (newExerciseItem.trim() && editForm) {
                            setEditForm({
                              ...editForm,
                              suggestedExercises: [...(editForm.suggestedExercises || []), newExerciseItem.trim()],
                            });
                            setNewExerciseItem('');
                          }
                        }}
                        className="px-2 py-1 bg-indigo-600 text-white rounded text-[11px]"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lifestyle & Dinacharya Guidelines */}
            <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Ayurvedic Lifestyle Rules (Dinacharya & Ritucharya)</span>
              </h4>
              <ul className="text-xs text-stone-700 space-y-1.5 pl-2">
                {activeData.ayurvedicLifestyleRules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-500 mt-1.5 shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Doctor's Custom Clinical Notes */}
            <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-amber-600" />
                <span>Doctor's Specific Advice & Personalized Patient Notes</span>
              </h4>
              {isEditing ? (
                <textarea
                  rows={2}
                  placeholder="Add specific notes (e.g. consume meals before 8 PM, drink 3L boiled lukewarm water with dry ginger)..."
                  value={editForm?.customNotes || ''}
                  onChange={(e) => setEditForm((prev) => (prev ? { ...prev, customNotes: e.target.value } : null))}
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-xs bg-white text-stone-800 focus:outline-none"
                />
              ) : (
                <div className="text-xs text-stone-700 italic bg-white p-3 rounded-2xl border border-stone-200 shadow-card">
                  {activeData.customNotes ||
                    'Follow above dietary schedule strictly for 21 days until next clinical review.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Branded Diet Chart Print Preview Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 border border-stone-200">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 no-print">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: brandColor }} />
                <span className="text-sm font-bold text-stone-900">
                  Print Preview: Official Ayurvedic Pathya Diet Prescription
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow"
                  style={{ backgroundColor: brandColor }}
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 rounded-xl hover:bg-stone-100 text-stone-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body (Printable Area) */}
            <div className="space-y-6 text-stone-900 print:m-0 print:p-0">
              {/* Clinic Letterhead */}
              <div
                className="p-6 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white"
                style={{ backgroundColor: brandColor, borderColor: brandColor }}
              >
                <div className="flex items-center gap-4">
                  {config.logoUrl ? (
                    <img
                      src={config.logoUrl}
                      alt="Logo"
                      className="w-14 h-14 rounded-2xl object-cover bg-white p-1 shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center text-white text-2xl font-serif font-bold">
                      AA
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">{config.hospitalName}</h1>
                    <p className="text-xs text-white/90 font-medium">
                      {config.tagline || 'NABH Certified Classical Ayurvedic Medicine & Panchakarma'}
                    </p>
                    <p className="text-[11px] text-white/80 font-mono mt-0.5">
                      Reg: {config.registrationNumber} • GST: {config.gstNumber}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs text-white/90 space-y-0.5 sm:border-l sm:border-white/20 sm:pl-4">
                  <div className="font-bold text-white">{currentBranch.name}</div>
                  <div>{currentBranch.address}</div>
                  <div>Phone: {currentBranch.phone}</div>
                  <div>Vaidya: {currentBranch.doctorInCharge}</div>
                </div>
              </div>

              {/* Title Strip */}
              <div className="text-center border-b pb-3">
                <span
                  className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  AYURVEDIC PATHYA AHARA & VIHARAPATHA (CLINICAL DIET CHART)
                </span>
                <div className="text-sm font-bold text-stone-800 mt-2">
                  Protocol: {activeData.conditionName} ({activeData.doshaFocus})
                </div>
              </div>

              {/* Patient Info Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 border border-stone-200 p-3.5 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block font-semibold">Patient Name</span>
                  <span className="font-bold text-stone-900">
                    {selectedPatient ? selectedPatient.name : 'Walk-in Patient'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block font-semibold">UHID / Age / Gender</span>
                  <span className="font-mono font-bold text-stone-900">
                    {selectedPatient?.uhid || 'AYUR-OPD'} • {selectedPatient?.age || 35}y/
                    {selectedPatient?.gender || 'M'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block font-semibold">Dosha Prakriti</span>
                  <span className="font-bold text-emerald-800">{selectedPatient?.prakriti || 'Tridosha'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 uppercase block font-semibold">Date & Doctor</span>
                  <span className="font-medium text-stone-900">
                    {new Date().toLocaleDateString('en-IN')} • {currentBranch.doctorInCharge}
                  </span>
                </div>
              </div>

              {/* Timetable Table */}
              <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="text-white text-[11px] font-bold uppercase" style={{ backgroundColor: brandColor }}>
                    <tr>
                      <th className="p-2.5 w-1/4">Time / Kala</th>
                      <th className="p-2.5 w-3/4">Prescribed Ayurvedic Food / Ahara Dravya</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    <tr className="bg-white">
                      <td className="p-2.5 font-bold text-stone-900 bg-stone-50">Early Morning (06:30 AM)</td>
                      <td className="p-2.5 text-stone-800">{activeData.earlyMorning}</td>
                    </tr>
                    <tr className="bg-stone-50/50">
                      <td className="p-2.5 font-bold text-stone-900 bg-stone-50">Breakfast (08:30 AM)</td>
                      <td className="p-2.5 text-stone-800">{activeData.breakfast}</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-2.5 font-bold text-stone-900 bg-stone-50">Mid-Day Drink (11:00 AM)</td>
                      <td className="p-2.5 text-stone-800">{activeData.midDayDrink}</td>
                    </tr>
                    <tr className="bg-stone-50/50">
                      <td className="p-2.5 font-bold text-stone-900 bg-stone-50">Lunch (01:00 PM)</td>
                      <td className="p-2.5 text-stone-800">{activeData.lunch}</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-2.5 font-bold text-stone-900 bg-stone-50">Evening Snack (04:30 PM)</td>
                      <td className="p-2.5 text-stone-800">{activeData.eveningSnack}</td>
                    </tr>
                    <tr className="bg-stone-50/50">
                      <td className="p-2.5 font-bold text-stone-900 bg-stone-50">Dinner (07:30 PM)</td>
                      <td className="p-2.5 text-stone-800">{activeData.dinner}</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-2.5 font-bold text-stone-900 bg-stone-50">Bedtime (09:45 PM)</td>
                      <td className="p-2.5 text-stone-800">{activeData.bedtime}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Pathya vs Apathya in Print */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 border border-emerald-300 bg-emerald-50/50 rounded-xl space-y-1.5">
                  <div className="font-bold text-emerald-900 uppercase tracking-wider text-[11px]">
                    ✅ Pathya (Foods Recommended to Eat)
                  </div>
                  <ul className="space-y-1 text-stone-800">
                    {activeData.pathyaDoList.map((p, i) => (
                      <li key={i}>• {p}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 border border-rose-300 bg-rose-50/50 rounded-xl space-y-1.5">
                  <div className="font-bold text-rose-900 uppercase tracking-wider text-[11px]">
                    ❌ Apathya (Foods Strictly Prohibited)
                  </div>
                  <ul className="space-y-1 text-stone-800">
                    {activeData.apathyaDontList.map((a, i) => (
                      <li key={i}>• {a}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Yoga & Exercises */}
              {(activeData.suggestedYogaAsanas?.length || activeData.suggestedPranayama?.length) && (
                <div className="p-3 border border-indigo-200 bg-indigo-50/40 rounded-xl text-xs space-y-1.5">
                  <div className="font-bold text-indigo-950 uppercase tracking-wider text-[11px]">
                    🧘 Suggested Yoga Asanas & Pranayama for Dosha Harmony
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-stone-800">
                    <div>
                      <span className="font-semibold block text-indigo-900">Asanas:</span>
                      {activeData.suggestedYogaAsanas?.join(', ')}
                    </div>
                    <div>
                      <span className="font-semibold block text-indigo-900">Pranayama:</span>
                      {activeData.suggestedPranayama?.join(', ')}
                    </div>
                  </div>
                </div>
              )}

              {/* Doctor's Signature Block */}
              <div className="pt-8 border-t border-stone-200 flex items-end justify-between text-xs">
                <div className="text-stone-500 space-y-0.5">
                  <div>* Validated by {config.hospitalName} Clinical Department</div>
                  <div>* Please review progress with Vaidya in 2 weeks</div>
                </div>
                <div className="text-right">
                  <div className="font-script text-stone-400 text-lg italic mb-1 font-serif">
                    {currentBranch.doctorInCharge}
                  </div>
                  <div className="font-bold text-stone-900">{currentBranch.doctorInCharge}</div>
                  <div className="text-[11px] text-stone-500">Chief Ayurvedic Physician & Vaidya</div>
                  <div className="text-[10px] text-stone-400 font-mono">Regd AYUSH Practitioner</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
