import React, { useState } from 'react';
import { Printer, Share2, Sparkles, CheckCircle2, Phone, MapPin, Edit3, Award } from 'lucide-react';
export const PamphletStudioView = ({ pamphlets, config, currentBranch }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPamphletId, setSelectedPamphletId] = useState(pamphlets[0]?.id || '');
  const [copiedLink, setCopiedLink] = useState(false);
  // Editable fields for fine-tuning before printing
  const [customOffer, setCustomOffer] = useState(
    'Special Benefit: Complimentary Classical Nadi Pariksha & Diet Chart included with consultation.'
  );
  const categories = [
    'All',
    'Festivals & Occasions',
    'Panchakarma',
    'Joints & Spine',
    'Dermatology',
    'Women Health',
    'Shalya Tantra Special',
  ];
  const filteredPamphlets = pamphlets.filter((p) => {
    if (selectedCategory === 'All') return true;
    return p.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });
  const selectedPamphlet =
    filteredPamphlets.find((p) => p.id === selectedPamphletId) || filteredPamphlets[0] || pamphlets[0];
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🌿 *${selectedPamphlet.title}*\n` +
        `🏥 *${config.hospitalName}* (${currentBranch.name})\n\n` +
        `✨ ${selectedPamphlet.heroHeadline}\n\n` +
        `${selectedPamphlet.description}\n\n` +
        `🌟 *Key Health Benefits:*\n` +
        selectedPamphlet.keyBenefits.map((b) => `• ${b}`).join('\n') +
        `\n\n` +
        `🎁 *Special Clinic Offer:* ${customOffer}\n\n` +
        `📞 *Book Appointment:* ${currentBranch.phone}\n` +
        `📍 *Location:* ${currentBranch.address}\n` +
        `🌐 ${config.website}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };
  return (
    <div className="space-y-6">
      {/* Title & Actions Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: config.themeColor || '#0f6240' }}
            >
              Patient Outreach & Health Awareness
            </span>
            <span className="text-xs text-stone-500 font-mono">Ready-to-Print Clinic Pamphlet & Festival Studio</span>
          </div>
          <h2 className="text-2xl font-serif font-black text-stone-900 tracking-tight">
            Ayurvedic Occasions, Festival Flyers & Clinical Pamphlets
          </h2>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl">
            Pre-designed, evidence-based Ayurvedic educational flyers with your clinic logo, doctor credentials, and
            contact details. Print directly or send to patients on WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleShareWhatsApp}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Share via WhatsApp</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 active:scale-95 transition-all"
            style={{ backgroundColor: config.themeColor || '#0f6240' }}
          >
            <Printer className="w-4 h-4" />
            <span>Print Current Pamphlet</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat);
              const firstInCat = pamphlets.find(
                (p) => cat === 'All' || p.category.toLowerCase().includes(cat.toLowerCase())
              );
              if (firstInCat) setSelectedPamphletId(firstInCat.id);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedCategory === cat
                ? 'text-white shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
            style={{
              backgroundColor: selectedCategory === cat ? config.themeColor || '#0f6240' : undefined,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Pamphlet Template Picker Carousel */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {filteredPamphlets.map((pamphlet) => {
          const isSelected = selectedPamphlet?.id === pamphlet.id;
          return (
            <button
              key={pamphlet.id}
              onClick={() => setSelectedPamphletId(pamphlet.id)}
              className={`p-3.5 rounded-xl border text-left shrink-0 w-72 transition-all ${
                isSelected ? 'bg-white border-2 shadow' : 'bg-stone-50 border-stone-200 hover:border-stone-300'
              }`}
              style={{
                borderColor: isSelected ? config.themeColor || '#0f6240' : undefined,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  {pamphlet.category}
                </span>
                <span
                  className="px-1.5 py-0.2 rounded text-[10px] font-bold text-white"
                  style={{ backgroundColor: config.themeColor || '#0f6240' }}
                >
                  {pamphlet.badge.split(' ')[0]}
                </span>
              </div>
              <h4 className="font-bold text-xs text-stone-900 mt-1 line-clamp-1">{pamphlet.title}</h4>
              <p className="text-[11px] text-stone-500 line-clamp-2 mt-1">{pamphlet.tagline}</p>
            </button>
          );
        })}
      </div>

      {/* Customizable Offer Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-card flex flex-col sm:flex-row sm:items-center gap-3">
        <span className="text-xs font-bold text-stone-700 shrink-0 flex items-center gap-1.5">
          <Edit3 className="w-3.5 h-3.5 text-amber-500" /> Custom Clinic Offer Banner:
        </span>
        <input
          type="text"
          value={customOffer}
          onChange={(e) => setCustomOffer(e.target.value)}
          placeholder="Edit current offer displayed on this pamphlet..."
          className="flex-1 text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {/* Main Pamphlet Display: Clean Letterhead & Leaflet Preview */}
      {selectedPamphlet && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-10 shadow-card max-w-4xl mx-auto space-y-8 font-sans print:p-0 print:border-none print:shadow-none">
          {/* Pamphlet Top Header with Clinic Branding */}
          <div
            className="p-6 rounded-2xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4"
            style={{ backgroundColor: config.themeColor || '#0f6240' }}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center font-serif text-2xl font-bold text-white border border-white/20 shrink-0">
                {config.logoUrl ? (
                  <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  'AA'
                )}
              </div>
              <div>
                <h3 className="font-serif font-black text-xl text-white tracking-tight">{config.hospitalName}</h3>
                <p className="text-xs text-white/90 font-medium">{config.tagline}</p>
                <div className="text-[10px] text-white/80 mt-1 flex flex-wrap gap-2">
                  <span>Reg: {config.registrationNumber}</span>
                  <span>•</span>
                  <span>Unit: {currentBranch.name}</span>
                </div>
              </div>
            </div>

            <div className="text-right text-xs text-white/95 shrink-0 bg-white/10 px-4 py-2.5 rounded-xl border border-white/20">
              <div className="font-serif font-bold text-sm text-white">{currentBranch.doctorInCharge}</div>
              <div className="text-[11px] text-white/85">Chief Ayurvedic Physician & Director</div>
              <div className="text-[10px] text-white/80 mt-0.5">NABH Standard Authentic Care</div>
            </div>
          </div>

          {/* Hero Section */}
          <div className="space-y-3 text-center max-w-2xl mx-auto">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${config.themeColor}15` || '#0f624015',
                color: config.themeColor || '#0f6240',
              }}
            >
              {selectedPamphlet.badge}
            </span>
            <h1 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 leading-tight">
              {selectedPamphlet.heroHeadline}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{selectedPamphlet.description}</p>
          </div>

          {/* Two-Column Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Key Clinical Benefits */}
            <div className="bg-stone-50 border border-stone-200/80 p-5 rounded-2xl space-y-3">
              <h4
                className="font-bold text-sm uppercase tracking-wider flex items-center gap-2"
                style={{ color: config.themeColor || '#0f6240' }}
              >
                <Sparkles className="w-4 h-4" />
                Key Health Benefits & Outcomes
              </h4>
              <ul className="space-y-2 text-xs text-stone-700">
                {selectedPamphlet.keyBenefits.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2
                      className="w-4 h-4 shrink-0 mt-0.5"
                      style={{ color: config.themeColor || '#0f6240' }}
                    />
                    <span className="leading-snug">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Panchakarma Procedures */}
            <div className="bg-stone-50 border border-stone-200/80 p-5 rounded-2xl space-y-3">
              <h4
                className="font-bold text-sm uppercase tracking-wider flex items-center gap-2"
                style={{ color: config.themeColor || '#0f6240' }}
              >
                <Award className="w-4 h-4" />
                Specialized Therapies Administered
              </h4>
              <ul className="space-y-2 text-xs text-stone-700">
                {selectedPamphlet.recommendedProcedures.map((proc, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
                      style={{ backgroundColor: config.themeColor || '#0f6240' }}
                    >
                      {idx + 1}
                    </div>
                    <span className="font-semibold text-stone-800">{proc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pathya Lifestyle & Dietary Regimen */}
          <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
              <span>🌿</span> Classical Dietary & Ayurvedic Lifestyle Tips (Pathya)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600">
              {selectedPamphlet.dietaryTips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-stone-400">•</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Special Clinic Offer / Call to Action */}
          <div
            className="p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{
              borderColor: `${config.themeColor}40` || '#0f624040',
              backgroundColor: `${config.themeColor}08` || '#0f624008',
            }}
          >
            <div>
              <div
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: config.themeColor || '#0f6240' }}
              >
                Consultation & Booking
              </div>
              <p className="text-xs text-stone-800 font-semibold mt-0.5">{customOffer}</p>
              <p className="text-[11px] text-stone-500 mt-0.5">{selectedPamphlet.callToAction}</p>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs font-bold text-stone-900 flex items-center gap-1 sm:justify-end">
                <Phone className="w-3.5 h-3.5 text-stone-500" />
                <span>{currentBranch.phone}</span>
              </div>
              <div className="text-[11px] text-stone-500 flex items-center gap-1 sm:justify-end mt-0.5">
                <MapPin className="w-3 h-3 text-stone-400" />
                <span>{currentBranch.address}</span>
              </div>
            </div>
          </div>

          {/* Pamphlet Footer */}
          <div className="border-t border-stone-200 pt-4 flex flex-col sm:flex-row items-center justify-between text-[10px] text-stone-400 gap-2">
            <span>
              © {new Date().getFullYear()} {config.hospitalName}. All rights reserved. Authentic Classical Ayurveda.
            </span>
            <span>
              Appointment Hotline: {config.supportPhone} • {config.website}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
