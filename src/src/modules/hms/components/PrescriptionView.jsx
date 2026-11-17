import React, { useState } from 'react';
import {
  FileSignature,
  Printer,
  Sparkles,
  Plus,
  Trash2,
  Check,
  User,
  FileCheck2,
  X,
  BookOpen,
  CheckCircle2,
  Copy,
  MessageSquare,
  Star,
  Utensils,
} from 'lucide-react';
import { AyurStorage } from '../services/storage';
import { ClinicalNoteTemplateModal } from './ClinicalNoteTemplateModal';
export const PrescriptionView = ({
  patients,
  medicines,
  config,
  currentBranch,
  initialPatientId,
  onNavigateToPharmacy,
  onNavigateToDietChart,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || (patients[0]?.id ?? ''));
  const [savedTemplates, setSavedTemplates] = useState(AyurStorage.getSavedTemplates());
  // Template Modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [reviewSuccessModal, setReviewSuccessModal] = useState(null);
  const [copySuccessToast, setCopySuccessToast] = useState(false);
  // Note Mode: 'classical' or 'soap'
  const [noteMode, setNoteMode] = useState('classical');
  // Clinical Notes & Diagnosis
  const [chiefComplaints, setChiefComplaints] = useState('Bilateral knee pain, stiffness in morning for 4 months.');
  const [nidana, setNidana] = useState('Sandhigata Vata (Osteoarthritis Knee Joint)');
  const [chikitsaPlan, setChikitsaPlan] = useState('Snehana, Swedana, Vata pacification, and Januvasthi protocol');
  // SOAP Specific Notes
  const [soapSubjective, setSoapSubjective] = useState(
    'Bilateral knee joint stiffness and aching pain. Pain intensifies after climbing stairs.'
  );
  const [soapObjective, setSoapObjective] = useState(
    'Vitals: BP 120/80. Crepitus palpable over patellofemoral joint. Extension deficit 10 degrees.'
  );
  const [soapAssessment, setSoapAssessment] = useState(
    'Sandhigata Vata with Dhatukshaya (Knee Osteoarthritis Grade II)'
  );
  const [soapPlan, setSoapPlan] = useState('Januvasthi for 7 days + Shamana Yogam + Matra Basti');
  const [pathyaDiet, setPathyaDiet] = useState(
    'Warm fresh food, green gram soup with cow ghee, boiled water with dry ginger.'
  );
  const [apathyaDiet, setApathyaDiet] = useState(
    'Cold drinks, refrigerated curd, black gram, excessive fasting, night wakefulness.'
  );
  const [followUpDays, setFollowUpDays] = useState(14);
  const [panchakarmaPrescribed, setPanchakarmaPrescribed] = useState([
    'Januvasthi / Janu Basti',
    'Elakizhi / Podikizhi',
  ]);
  // Panchakarma Automated Department Referral Pipeline
  const [pkReferralActive, setPkReferralActive] = useState(true);
  const [pkSelectedTherapy, setPkSelectedTherapy] = useState('Januvasthi / Janu Basti');
  const [pkDays, setPkDays] = useState(7);
  const [pkTimeSlot, setPkTimeSlot] = useState('09:30 AM - 11:00 AM');
  const [pkRoom, setPkRoom] = useState('Dhanwanthari Therapy Suite #1');
  const [pkTherapist, setPkTherapist] = useState('Kalyani S. (Lead Panchakarma Specialist)');
  const [pkStatus, setPkStatus] = useState('Scheduled');
  const [pkDispatchedToast, setPkDispatchedToast] = useState(null);
  // Most repeated medicines for 1-click fast prescribe
  const MOST_REPEATED_MEDICINES = [
    {
      name: 'Maharasnadi Kwatham',
      brand: 'Kottakkal Arya Vaidya Sala',
      form: 'Kashaya / Kwatha',
      dosage: '15ml with 45ml warm water',
      frequency: '1-0-1',
      timing: 'Empty stomach (Morning & Evening)',
      anupana: 'Lukewarm water',
      durationDays: 30,
    },
    {
      name: 'Yogaraja Guggulu',
      brand: 'Baidyanath',
      form: 'Guggulu',
      dosage: '2 Tablets',
      frequency: '1-0-1',
      timing: 'After meals',
      anupana: 'Warm water',
      durationDays: 30,
    },
    {
      name: 'Avipattikar Churna',
      brand: 'Dabur',
      form: 'Churna',
      dosage: '3 grams',
      frequency: '0-0-1',
      timing: 'Bedtime',
      anupana: 'Warm water or honey',
      durationDays: 15,
    },
    {
      name: 'Triphala Guggulu',
      brand: 'Dhootapapeshwar',
      form: 'Guggulu',
      dosage: '2 Tablets',
      frequency: '1-0-1',
      timing: 'After food',
      anupana: 'Warm water',
      durationDays: 30,
    },
    {
      name: 'Ashwagandharishta',
      brand: 'Baidyanath',
      form: 'Arishta',
      dosage: '20 ml',
      frequency: '1-0-1',
      timing: 'After food with equal water',
      anupana: 'Equal quantity water',
      durationDays: 30,
    },
    {
      name: 'Kaisore Guggulu',
      brand: 'Kerala Ayurveda',
      form: 'Guggulu',
      dosage: '2 Tablets',
      frequency: '1-0-1',
      timing: 'After food',
      anupana: 'Warm water',
      durationDays: 30,
    },
    {
      name: 'Dasamoolarishtam',
      brand: 'Kottakkal Arya Vaidya Sala',
      form: 'Arishta',
      dosage: '20 ml',
      frequency: '1-0-1',
      timing: 'After food',
      anupana: 'Equal quantity water',
      durationDays: 30,
    },
    {
      name: 'Gandharvahastadi Tailam',
      brand: 'AVP Coimbatore',
      form: 'Taila (Oil)',
      dosage: '10 ml',
      frequency: '0-0-1',
      timing: 'Bedtime',
      anupana: 'Warm cow milk',
      durationDays: 14,
    },
    {
      name: 'Brahmi Vati (Gold)',
      brand: 'Dhootapapeshwar',
      form: 'Vati / Guti (Tablet)',
      dosage: '1 Tablet',
      frequency: '1-0-1',
      timing: 'After meals',
      anupana: 'Cow milk with sugar candy',
      durationDays: 30,
    },
    {
      name: 'Kanchanar Guggulu',
      brand: 'Baidyanath',
      form: 'Guggulu',
      dosage: '2 Tablets',
      frequency: '1-0-1',
      timing: 'After food',
      anupana: 'Warm ginger water',
      durationDays: 30,
    },
    {
      name: 'Chitrakadi Vati',
      brand: 'Zandu Ayurveda',
      form: 'Vati / Guti (Tablet)',
      dosage: '2 Tablets',
      frequency: '1-0-1',
      timing: 'Before meals (Deepana)',
      anupana: 'Warm water',
      durationDays: 15,
    },
    {
      name: 'Hingwashtak Churna',
      brand: 'Dabur',
      form: 'Churna',
      dosage: '3 grams',
      frequency: '1-0-1',
      timing: 'With first morsel of food',
      anupana: 'Cow Ghee',
      durationDays: 21,
    },
  ];
  // Clinical Combo Kits for 1-click addition
  const CLINICAL_COMBO_KITS = [
    {
      id: 'kit-agni',
      name: 'Agni Deepana & Pachana Kit',
      category: 'Metabolic & Digestion',
      medicines: [
        {
          medicineName: 'Chitrakadi Vati',
          brand: 'Zandu Ayurveda',
          form: 'Vati / Guti (Tablet)',
          dosage: '2 Tablets',
          frequency: '1-0-1',
          timing: '15 mins before meals',
          anupana: 'Warm water',
          durationDays: 15,
        },
        {
          medicineName: 'Hingwashtak Churna',
          brand: 'Dabur',
          form: 'Churna',
          dosage: '3 grams',
          frequency: '1-0-1',
          timing: 'With first morsel of meal',
          anupana: 'Cow Ghee',
          durationDays: 21,
        },
        {
          medicineName: 'Avipattikar Churna',
          brand: 'Dabur',
          form: 'Churna',
          dosage: '3 grams',
          frequency: '0-0-1',
          timing: 'Bedtime',
          anupana: 'Lukewarm water',
          durationDays: 15,
        },
      ],
    },
    {
      id: 'kit-joint',
      name: 'Joint Care & Amavata Kit',
      category: 'Musculoskeletal & Arthritis',
      medicines: [
        {
          medicineName: 'Maharasnadi Kwatham',
          brand: 'Kottakkal Arya Vaidya Sala',
          form: 'Kashaya / Kwatha',
          dosage: '15ml with 45ml warm water',
          frequency: '1-0-1',
          timing: 'Empty stomach (Morning & Evening)',
          anupana: 'Lukewarm water',
          durationDays: 30,
        },
        {
          medicineName: 'Yogaraja Guggulu',
          brand: 'Baidyanath',
          form: 'Guggulu',
          dosage: '2 Tablets',
          frequency: '1-0-1',
          timing: 'After food',
          anupana: 'Warm water',
          durationDays: 30,
        },
        {
          medicineName: 'Dhanwantharam Taila 101',
          brand: 'AVP Coimbatore',
          form: 'Taila (Oil)',
          dosage: '10 drops / External',
          frequency: '1-0-1',
          timing: 'Bedtime & External gentle massage',
          anupana: 'Warm water',
          durationDays: 30,
        },
      ],
    },
    {
      id: 'kit-acid',
      name: 'Amlapitta & Acidity Relief Kit',
      category: 'Acid Reflux & GERD',
      medicines: [
        {
          medicineName: 'Kamadudha Rasa (Moti Yukta)',
          brand: 'Dhootapapeshwar',
          form: 'Vati / Guti (Tablet)',
          dosage: '1 Tablet',
          frequency: '1-0-1',
          timing: 'Before meals',
          anupana: 'Cow milk or cold water',
          durationDays: 21,
        },
        {
          medicineName: 'Avipattikar Churna',
          brand: 'Dabur',
          form: 'Churna',
          dosage: '3 grams',
          frequency: '1-0-1',
          timing: 'Before meals with honey',
          anupana: 'Honey or lukewarm water',
          durationDays: 21,
        },
        {
          medicineName: 'Sutashekhar Rasa',
          brand: 'Baidyanath',
          form: 'Vati / Guti (Tablet)',
          dosage: '1 Tablet',
          frequency: '1-0-1',
          timing: 'After food',
          anupana: 'Pomegranate juice or milk',
          durationDays: 21,
        },
      ],
    },
    {
      id: 'kit-kshara',
      name: 'Kshara Sutra Post-Op Kit',
      category: 'Anorectal Healing (Shalya)',
      medicines: [
        {
          medicineName: 'Triphala Guggulu',
          brand: 'Dhootapapeshwar',
          form: 'Guggulu',
          dosage: '2 Tablets',
          frequency: '1-0-1',
          timing: 'After food',
          anupana: 'Warm water',
          durationDays: 30,
        },
        {
          medicineName: 'Gandhak Rasayan',
          brand: 'Baidyanath',
          form: 'Vati / Guti (Tablet)',
          dosage: '1 Tablet',
          frequency: '1-0-1',
          timing: 'After food',
          anupana: 'Cow milk or water',
          durationDays: 21,
        },
        {
          medicineName: 'Jatyadi Taila',
          brand: 'Kerala Ayurveda',
          form: 'Taila (Oil)',
          dosage: '5-10 ml',
          frequency: '0-0-1',
          timing: 'Local application & Sitz bath',
          anupana: 'External',
          durationDays: 30,
        },
      ],
    },
    {
      id: 'kit-pcod',
      name: 'PCOD & Hormonal Balance Kit',
      category: 'Gynecology (Stri Roga)',
      medicines: [
        {
          medicineName: 'Kanchanar Guggulu',
          brand: 'Baidyanath',
          form: 'Guggulu',
          dosage: '2 Tablets',
          frequency: '1-0-1',
          timing: 'After food',
          anupana: 'Warm ginger water',
          durationDays: 30,
        },
        {
          medicineName: 'Ashokarishta',
          brand: 'Dabur',
          form: 'Arishta',
          dosage: '20 ml',
          frequency: '1-0-1',
          timing: 'After food with equal water',
          anupana: 'Equal quantity water',
          durationDays: 30,
        },
        {
          medicineName: 'Chandraprabha Vati',
          brand: 'Dhootapapeshwar',
          form: 'Vati / Guti (Tablet)',
          dosage: '2 Tablets',
          frequency: '1-0-1',
          timing: 'After meals',
          anupana: 'Lukewarm water',
          durationDays: 30,
        },
      ],
    },
    {
      id: 'kit-skin',
      name: 'Skin Detox & Rakta Shodhana Kit',
      category: 'Dermatology & Psoriasis',
      medicines: [
        {
          medicineName: 'Maha Manjishtadi Kwatham',
          brand: 'Kottakkal Arya Vaidya Sala',
          form: 'Kashaya / Kwatha',
          dosage: '15ml with 45ml warm water',
          frequency: '1-0-1',
          timing: 'Empty stomach (Morning & Evening)',
          anupana: 'Warm water',
          durationDays: 30,
        },
        {
          medicineName: 'Kaisore Guggulu',
          brand: 'Kerala Ayurveda',
          form: 'Guggulu',
          dosage: '2 Tablets',
          frequency: '1-0-1',
          timing: 'After food',
          anupana: 'Warm water',
          durationDays: 30,
        },
        {
          medicineName: 'Khadirarishta',
          brand: 'Baidyanath',
          form: 'Arishta',
          dosage: '20 ml',
          frequency: '1-0-1',
          timing: 'After meals with water',
          anupana: 'Equal quantity water',
          durationDays: 30,
        },
      ],
    },
  ];
  // 1-Click quick add medicine helper
  const handleQuickAddMedicine = (med) => {
    const newItem = {
      id: `rx-quick-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      medicineName: med.name,
      brand: med.brand,
      form: med.form,
      dosage: med.dosage,
      frequency: med.frequency,
      timing: med.timing,
      anupana: med.anupana,
      durationDays: med.durationDays,
    };
    setPrescriptions((prev) => [...prev, newItem]);
    setPkDispatchedToast(`Added ${med.name} to Rx!`);
    setTimeout(() => setPkDispatchedToast(null), 2500);
  };
  // 1-Click quick add combo kit helper
  const handleQuickAddComboKit = (kit) => {
    const newItems = kit.medicines.map((m, idx) => ({
      id: `rx-kit-${Date.now()}-${idx}`,
      medicineName: m.medicineName,
      brand: m.brand,
      form: m.form,
      dosage: m.dosage,
      frequency: m.frequency,
      timing: m.timing,
      anupana: m.anupana,
      durationDays: m.durationDays,
    }));
    setPrescriptions((prev) => [...prev, ...newItems]);
    setPkDispatchedToast(`Added ${kit.name} (3 medicines) to Rx!`);
    setTimeout(() => setPkDispatchedToast(null), 2500);
  };
  // Prescribed Medicines list
  const [prescriptions, setPrescriptions] = useState([
    {
      id: 'rx-init-1',
      medicineName: 'Yogaraja Guggulu',
      brand: 'Baidyanath',
      form: 'Guggulu',
      dosage: '2 Tablets',
      frequency: '1-0-1',
      timing: 'After meals',
      anupana: 'Warm water or Dashamula Kwatha',
      durationDays: 30,
      specialInstructions: 'Swallow with lukewarm water',
    },
    {
      id: 'rx-init-2',
      medicineName: 'Maharasnadi Kwatham',
      brand: 'Kottakkal Arya Vaidya Sala',
      form: 'Kashaya / Kwatha',
      dosage: '15ml with 45ml lukewarm water',
      frequency: '1-0-1',
      timing: 'Empty stomach (Morning & Evening)',
      anupana: 'Lukewarm water',
      durationDays: 30,
    },
  ]);
  // Form for adding individual medicine
  const [selectedMedId, setSelectedMedId] = useState('');
  const [customMedName, setCustomMedName] = useState('');
  const [customBrand, setCustomBrand] = useState('Kottakkal Arya Vaidya Sala');
  const [customForm, setCustomForm] = useState('Kashaya / Kwatha');
  const [customDosage, setCustomDosage] = useState('15 ml');
  const [customFrequency, setCustomFrequency] = useState('1-0-1');
  const [customTiming, setCustomTiming] = useState('After meals');
  const [customAnupana, setCustomAnupana] = useState('Warm water');
  const [customDuration, setCustomDuration] = useState(15);
  const [customInstructions, setCustomInstructions] = useState('');
  // Print Preview Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const brandColor = config.themeColor || '#0f6240';
  // Apply Classical Pre-made Template
  const handleApplyTemplate = (tmpl) => {
    setSoapSubjective(tmpl.soapSubjective);
    setSoapObjective(tmpl.soapObjective);
    setSoapAssessment(tmpl.soapAssessment);
    setSoapPlan(tmpl.soapPlan);
    setChiefComplaints(tmpl.soapSubjective);
    setNidana(tmpl.soapAssessment);
    setChikitsaPlan(tmpl.soapPlan);
    if (tmpl.pathyaDiet) setPathyaDiet(tmpl.pathyaDiet);
    if (tmpl.apathyaDiet) setApathyaDiet(tmpl.apathyaDiet);
    if (tmpl.recommendedPanchakarma) setPanchakarmaPrescribed(tmpl.recommendedPanchakarma);
    if (tmpl.defaultPrescriptions && tmpl.defaultPrescriptions.length > 0) {
      setPrescriptions([...tmpl.defaultPrescriptions]);
    }
  };
  // Add medicine to prescription list
  const handleAddMedicine = (e) => {
    e.preventDefault();
    let name = customMedName.trim();
    let brand = customBrand;
    let form = customForm;
    let defaultAnup = customAnupana;
    if (selectedMedId) {
      const med = medicines.find((m) => m.id === selectedMedId);
      if (med) {
        name = med.name;
        brand = med.brand;
        form = med.category;
        defaultAnup = med.defaultAnupana || customAnupana;
      }
    }
    if (!name) return;
    const newItem = {
      id: `rx-${Date.now()}`,
      medicineName: name,
      brand: brand,
      form: form,
      dosage: customDosage,
      frequency: customFrequency,
      timing: customTiming,
      anupana: defaultAnup,
      durationDays: customDuration,
      specialInstructions: customInstructions,
    };
    setPrescriptions([...prescriptions, newItem]);
    setSelectedMedId('');
    setCustomMedName('');
    setCustomInstructions('');
  };
  const handleRemoveRx = (id) => {
    setPrescriptions(prescriptions.filter((p) => p.id !== id));
  };
  // Save consultation to patient EMR
  const handleSaveToPatientEMR = () => {
    if (!selectedPatient) return;
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + followUpDays);
    const newVisit = {
      id: `vis-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      doctorName: currentBranch.doctorInCharge,
      chiefComplaints: noteMode === 'soap' ? `[SOAP: ${soapSubjective}]` : chiefComplaints,
      ashtavidhaPariksha: {
        nadi: `${selectedPatient.prakriti} Gathi`,
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
      vikriti: { vata: 60, pitta: 30, kapha: 10 },
      nidanaDiagnosis: noteMode === 'soap' ? soapAssessment : nidana,
      chikitsaPlan: noteMode === 'soap' ? `Objective: ${soapObjective} | Plan: ${soapPlan}` : chikitsaPlan,
      panchakarmaPrescribed: panchakarmaPrescribed,
      prescriptions: prescriptions,
      pathyaDiet: pathyaDiet,
      apathyaDiet: apathyaDiet,
      followUpDate: followUpDate.toISOString().split('T')[0],
    };
    const updatedPatient = {
      ...selectedPatient,
      clinicalVisits: [newVisit, ...(selectedPatient.clinicalVisits || [])],
    };
    AyurStorage.updatePatient(updatedPatient);
    // Automatic Panchakarma Booking synchronization into Department Pipeline
    if (pkReferralActive && pkSelectedTherapy) {
      const existingPK = AyurStorage.getPanchakarma().find(
        (p) => p.patientId === selectedPatient.id && p.therapyName === pkSelectedTherapy && p.status === 'In Progress'
      );
      if (!existingPK) {
        const newProc = {
          id: `pk-rx-${Date.now()}`,
          patientId: selectedPatient.id,
          patientName: selectedPatient.name,
          therapyName: pkSelectedTherapy,
          therapistAssigned: pkTherapist,
          doctorInCharge: currentBranch.doctorInCharge,
          startDate: new Date().toISOString().split('T')[0],
          totalDays: pkDays,
          currentDay: 1,
          dailyTimeSlot: pkTimeSlot,
          roomName: pkRoom,
          medicatedOilsUsed: 'Mahanarayana Taila & Ksheerabala 101',
          status: pkStatus === 'In Progress' ? 'In Progress' : 'Scheduled',
          preProcedureNotes: `Referred from Consultation by ${currentBranch.doctorInCharge}. Nidana: ${nidana || soapAssessment}`,
          branchId: currentBranch.id,
        };
        AyurStorage.addPanchakarma(newProc);
      }
    }
    setReviewSuccessModal({
      show: true,
      patientName: selectedPatient.name,
      phone: selectedPatient.phone,
      uhid: selectedPatient.uhid,
    });
  };
  // Immediate dispatch button for Panchakarma without waiting for full save
  const handleDispatchPanchakarmaOnly = () => {
    if (!selectedPatient || !pkSelectedTherapy) return;
    const newProc = {
      id: `pk-rx-${Date.now()}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      therapyName: pkSelectedTherapy,
      therapistAssigned: pkTherapist,
      doctorInCharge: currentBranch.doctorInCharge,
      startDate: new Date().toISOString().split('T')[0],
      totalDays: pkDays,
      currentDay: 1,
      dailyTimeSlot: pkTimeSlot,
      roomName: pkRoom,
      medicatedOilsUsed: 'Mahanarayana Taila & Ksheerabala 101',
      status: pkStatus === 'In Progress' ? 'In Progress' : 'Scheduled',
      preProcedureNotes: `Referred from Consultation by ${currentBranch.doctorInCharge}. Nidana: ${nidana || soapAssessment}`,
      branchId: currentBranch.id,
    };
    AyurStorage.addPanchakarma(newProc);
    setPkDispatchedToast(`Panchakarma (${pkSelectedTherapy}) scheduled for ${selectedPatient.name}!`);
    setTimeout(() => setPkDispatchedToast(null), 3000);
  };
  const getGoogleReviewWhatsAppText = (patientName) => {
    const reviewUrl =
      config.googleReviewUrl ||
      `https://g.page/r/${encodeURIComponent(config.hospitalName.toLowerCase().replace(/\s+/g, '-'))}/review`;
    return `Namaste ${patientName} ji 🙏\n\nThank you for choosing ${config.hospitalName} for your Ayurvedic consultation today with ${currentBranch.doctorInCharge}.\n\nIf you had a positive experience and found our Vaidya's advice helpful, we would be deeply grateful if you could take 30 seconds to share your review on Google:\n👉 ${reviewUrl}\n\nYour kind words help other seekers discover authentic Ayurvedic healing & wellness.\n\nWishing you vibrant health (Arogya) & Swasthya!\n— ${config.hospitalName}`;
  };
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccessToast(true);
    setTimeout(() => setCopySuccessToast(false), 2500);
  };
  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: brandColor }}
            >
              Doctor's Clinical Station
            </span>
            <span className="text-xs text-stone-500 font-mono">Fast EMR & Rx Documentation</span>
          </div>
          <h2 className="text-2xl font-serif font-black text-stone-900 tracking-tight">
            Ayurvedic Rx Builder & Clinical Note Templates
          </h2>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl">
            Save and load pre-configured clinical note templates (Arthritis SOAP, Panchakarma Consultation,
            Skin/Psoriasis), customize classical formulations, and print hospital-branded prescriptions with your clinic
            logo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold border border-stone-300 flex items-center gap-1.5 transition-all"
            title="Browse or save clinical note templates"
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>Note Templates Library</span>
          </button>

          {onNavigateToDietChart && selectedPatient && (
            <button
              onClick={() => onNavigateToDietChart(selectedPatient.id)}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-300 flex items-center gap-1.5 transition-all"
              title="Open personalized diet and pathya chart for this patient"
            >
              <Utensils className="w-4 h-4 text-emerald-600" />
              <span>Diet & Pathya Chart</span>
            </button>
          )}

          <button
            onClick={handleSaveToPatientEMR}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Save to Patient EMR</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="px-4 py-2 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
            style={{ backgroundColor: brandColor }}
          >
            <Printer className="w-4 h-4" />
            <span>Print Branded Rx</span>
          </button>
        </div>
      </div>

      {/* QUICK CLINICAL NOTE TEMPLATES CHIPS BAR */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-card space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: brandColor }} />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
              ⚡ Quick Clinical Note Templates (1-Click Load into EMR)
            </span>
          </div>
          <button
            onClick={() => setShowTemplateModal(true)}
            className="text-xs font-semibold text-stone-600 hover:text-stone-900 underline"
          >
            Manage / Save Current as Template →
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {savedTemplates.slice(0, 6).map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => handleApplyTemplate(tmpl)}
              className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-stone-300 text-stone-800 text-xs font-medium shrink-0 transition-all flex items-center gap-1.5 text-left active:scale-95"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: brandColor }}></span>
              <span className="font-semibold">{tmpl.name}</span>
              <span className="text-[10px] text-stone-400">({tmpl.category.split(' ')[0]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* TOAST FOR QUICK ACTIONS */}
      {pkDispatchedToast && (
        <div className="fixed top-20 right-6 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce border border-stone-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{pkDispatchedToast}</span>
        </div>
      )}

      {/* 1-CLICK QUICK PRESCRIBE: DOCTOR'S MOST REPEATED MEDICINES */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-900">
              ⭐ Doctor's Most Repeated Medicines (1-Click Instant Prescribe)
            </span>
          </div>
          <span className="text-[11px] text-stone-500 font-medium">
            Click any pill to add to prescription immediately
          </span>
        </div>

        {/* Pill carousel */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {MOST_REPEATED_MEDICINES.map((med, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickAddMedicine(med)}
              className="group px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/80 hover:bg-emerald-50 hover:border-emerald-300 text-stone-800 text-xs font-medium shrink-0 transition-all flex flex-col text-left active:scale-95 shadow-sm"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform" />
                <span className="font-bold text-stone-900 group-hover:text-emerald-900">{med.name}</span>
                <span className="text-[10px] text-stone-400 font-normal">({med.form.split(' ')[0]})</span>
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5 group-hover:text-emerald-700">
                {med.dosage} • {med.frequency} • {med.durationDays}d
              </div>
            </button>
          ))}
        </div>

        {/* 1-CLICK CLINICAL COMBO KITS */}
        <div className="pt-2 border-t border-stone-100">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Fast Clinical Combo Kits (Add entire 3-medicine protocol in 1 click):</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {CLINICAL_COMBO_KITS.map((kit) => (
              <button
                key={kit.id}
                type="button"
                onClick={() => handleQuickAddComboKit(kit)}
                className="p-2.5 rounded-xl border border-stone-200 bg-stone-50/60 hover:bg-amber-50 hover:border-amber-300 text-left transition-all active:scale-95 group shadow-sm"
              >
                <div className="text-xs font-bold text-stone-900 group-hover:text-amber-900 line-clamp-1">
                  ⚡ {kit.name}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">{kit.category}</div>
                <div className="text-[9px] font-mono font-semibold text-emerald-700 mt-1">+3 classical medicines</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PATIENT SELECTOR & NOTE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Clinical Evaluation & Note Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Patient Selection Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-stone-500" />
                Select Patient for Consultation
              </label>
              {selectedPatient && (
                <span className="text-xs font-mono font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-lg">
                  UHID: {selectedPatient.uhid}
                </span>
              )}
            </div>

            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-400"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.uhid}) — {p.age}y/{p.gender} · {p.prakriti} · {p.primaryCondition}
                </option>
              ))}
            </select>

            {selectedPatient && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-stone-500 block">Prakriti</span>
                  <span className="font-bold text-stone-800">{selectedPatient.prakriti}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Primary Concern</span>
                  <span className="font-bold text-stone-800 line-clamp-1">{selectedPatient.primaryCondition}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Admission</span>
                  <span className="font-bold text-stone-800">{selectedPatient.admissionStatus.split(' ')[0]}</span>
                </div>
              </div>
            )}
          </div>

          {/* Clinical Note Format Selector & Inputs */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                <FileSignature className="w-4 h-4" style={{ color: brandColor }} />
                Consultation Record & Diagnostics
              </h4>
              <div className="flex bg-stone-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setNoteMode('classical')}
                  className={`px-3 py-1 rounded-md transition-all ${noteMode === 'classical' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'}`}
                >
                  Classical Nidana
                </button>
                <button
                  type="button"
                  onClick={() => setNoteMode('soap')}
                  className={`px-3 py-1 rounded-md transition-all ${noteMode === 'soap' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'}`}
                >
                  SOAP Note Mode
                </button>
              </div>
            </div>

            {noteMode === 'classical' ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Chief Complaints (Lakshana & Roga Vrittanta)
                  </label>
                  <textarea
                    rows={2}
                    value={chiefComplaints}
                    onChange={(e) => setChiefComplaints(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Ayurvedic Nidana (Diagnostic Formulation)
                  </label>
                  <input
                    type="text"
                    value={nidana}
                    onChange={(e) => setNidana(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-semibold focus:outline-none focus:ring-1 focus:ring-stone-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Chikitsa Sutra (Ayurvedic Treatment Line)
                  </label>
                  <textarea
                    rows={2}
                    value={chikitsaPlan}
                    onChange={(e) => setChikitsaPlan(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-400"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center gap-1.5 font-bold text-stone-800 mb-1">
                    <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-mono flex items-center justify-center font-bold">
                      S
                    </span>
                    <span>Subjective (Patient History & Symptoms)</span>
                  </div>
                  <textarea
                    rows={2}
                    value={soapSubjective}
                    onChange={(e) => setSoapSubjective(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center gap-1.5 font-bold text-stone-800 mb-1">
                    <span className="w-5 h-5 rounded bg-blue-100 text-blue-800 text-[11px] font-mono flex items-center justify-center font-bold">
                      O
                    </span>
                    <span>Objective (Ashtavidha Pariksha, Vitals, Range of Motion)</span>
                  </div>
                  <textarea
                    rows={2}
                    value={soapObjective}
                    onChange={(e) => setSoapObjective(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center gap-1.5 font-bold text-stone-800 mb-1">
                    <span className="w-5 h-5 rounded bg-amber-100 text-amber-800 text-[11px] font-mono flex items-center justify-center font-bold">
                      A
                    </span>
                    <span>Assessment (Nidana & Doshic Diagnosis)</span>
                  </div>
                  <textarea
                    rows={2}
                    value={soapAssessment}
                    onChange={(e) => setSoapAssessment(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-200 rounded-lg text-stone-900 font-semibold focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center gap-1.5 font-bold text-stone-800 mb-1">
                    <span className="w-5 h-5 rounded bg-purple-100 text-purple-800 text-[11px] font-mono flex items-center justify-center font-bold">
                      P
                    </span>
                    <span>Plan (Chikitsa, Panchakarma & Medications)</span>
                  </div>
                  <textarea
                    rows={2}
                    value={soapPlan}
                    onChange={(e) => setSoapPlan(e.target.value)}
                    className="w-full p-2 bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Diet & Lifestyle Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                  Pathya (Recommended Diet & Regimen)
                </label>
                <textarea
                  rows={2}
                  value={pathyaDiet}
                  onChange={(e) => setPathyaDiet(e.target.value)}
                  className="w-full p-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs text-stone-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-red-800 mb-1">
                  Apathya (Foods & Habits to Avoid)
                </label>
                <textarea
                  rows={2}
                  value={apathyaDiet}
                  onChange={(e) => setApathyaDiet(e.target.value)}
                  className="w-full p-2 bg-red-50/50 border border-red-200 rounded-xl text-xs text-stone-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Follow-up Days */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
              <span className="text-stone-600 font-medium">Follow-up Consultation Review in:</span>
              <div className="flex items-center gap-2">
                {[7, 14, 21, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFollowUpDays(d)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      followUpDays === d ? 'bg-stone-900 text-white' : 'bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    {d} Days
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PANCHAKARMA DEPARTMENT REFERRAL & SLOT BOOKING PIPELINE */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                  Panchakarma Referral & Slot Booking Pipeline
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                Auto-Syncs to Dept Schedule
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800">
                <input
                  type="checkbox"
                  checked={pkReferralActive}
                  onChange={(e) => setPkReferralActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Schedule & Prescribe Panchakarma for this Patient</span>
              </label>
              <span className="text-[11px] text-stone-500 font-medium">
                {pkReferralActive ? 'Active Referral' : 'Medication Only'}
              </span>
            </div>

            {pkReferralActive && (
              <div className="space-y-3 text-xs animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Prescribed Procedure</label>
                    <select
                      value={pkSelectedTherapy}
                      onChange={(e) => setPkSelectedTherapy(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    >
                      <option value="Januvasthi / Janu Basti">Januvasthi / Janu Basti</option>
                      <option value="Abhyanga & Swedana">Abhyanga & Swedana (Full Body Snehana)</option>
                      <option value="Shirodhara">Shirodhara (Medicated Oil Stream)</option>
                      <option value="Kativasthi / Januvasthi">Kativasthi (Lumbar Spine Retention)</option>
                      <option value="Elakizhi / Podikizhi">Elakizhi / Podikizhi (Leaf/Powder Bolus)</option>
                      <option value="Virechana Karma">Virechana Karma (Therapeutic Purgation)</option>
                      <option value="Vamana Karma">Vamana Karma (Therapeutic Emesis)</option>
                      <option value="Sneha Basti / Matra Basti">Sneha Basti / Matra Basti</option>
                      <option value="Kashaya Basti">Kashaya Basti (Decoction Enema)</option>
                      <option value="Nasya Karma">Nasya Karma (Nasal Errhine)</option>
                      <option value="Takradhara">Takradhara (Medicated Buttermilk Stream)</option>
                      <option value="Netra Tarpana">Netra Tarpana (Eye Nourishment Ghee)</option>
                      <option value="Udwarthanam">Udwarthanam (Herbal Powder Dry Rub)</option>
                      <option value="Raktamokshana (Jalaukavacharana)">Raktamokshana (Leech Therapy)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Prescribed Duration</label>
                    <div className="flex gap-1.5">
                      {[5, 7, 14, 21].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setPkDays(d)}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            pkDays === d
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                              : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          {d} Days
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Available Daily Time Slot</label>
                    <select
                      value={pkTimeSlot}
                      onChange={(e) => setPkTimeSlot(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                    >
                      <option value="07:30 AM - 09:00 AM">07:30 AM - 09:00 AM (Early Morning Slot)</option>
                      <option value="09:30 AM - 11:00 AM">09:30 AM - 11:00 AM (Mid-Morning Slot)</option>
                      <option value="11:30 AM - 01:00 PM">11:30 AM - 01:00 PM (Pre-Noon Slot)</option>
                      <option value="02:30 PM - 04:00 PM">02:30 PM - 04:00 PM (Afternoon Slot)</option>
                      <option value="05:00 PM - 06:30 PM">05:00 PM - 06:30 PM (Evening Relaxation)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Therapy Suite / Room</label>
                    <select
                      value={pkRoom}
                      onChange={(e) => setPkRoom(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                    >
                      <option value="Dhanwanthari Therapy Suite #1">Dhanwanthari Suite #1</option>
                      <option value="Dhanwanthari Therapy Suite #2">Dhanwanthari Suite #2</option>
                      <option value="Shirodhara Chamber Alpha">Shirodhara Chamber Alpha</option>
                      <option value="Panchakarma Hall B (Male Wing)">Panchakarma Hall B (Male)</option>
                      <option value="Panchakarma Hall C (Female Wing)">Panchakarma Hall C (Female)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Assigned Therapist</label>
                    <select
                      value={pkTherapist}
                      onChange={(e) => setPkTherapist(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                    >
                      <option value="Kalyani S. (Lead Panchakarma Specialist)">Kalyani S. (Lead Specialist)</option>
                      <option value="Manoj Kumar (Panchakarma Tech)">Manoj Kumar (Panchakarma Tech)</option>
                      <option value="Sujatha P. (Female Wing)">Sujatha P. (Female Wing)</option>
                      <option value="Anand V. (Senior Therapist)">Anand V. (Senior Therapist)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Booking Status</label>
                    <select
                      value={pkStatus}
                      onChange={(e) => setPkStatus(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                    >
                      <option value="Scheduled">Scheduled / Waiting (Starts Soon)</option>
                      <option value="In Progress">In Progress (Starting Today)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-stone-500">
                    Saves automatically on consultation save or click dispatch now
                  </span>
                  <button
                    type="button"
                    onClick={handleDispatchPanchakarmaOnly}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Dispatch to Panchakarma Dept</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Ayurvedic Formulary & Medicine Builder (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Add Medicine to Prescription */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-card space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center justify-between">
              <span>℞ Prescribe Classical Formulations</span>
              <button
                type="button"
                onClick={onNavigateToPharmacy}
                className="text-[11px] text-stone-500 hover:text-stone-800 underline font-normal"
              >
                Pharmacy Stock →
              </button>
            </h4>

            <form onSubmit={handleAddMedicine} className="space-y-3 text-xs">
              {/* Select from Inventory or Custom */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Select from Pharmacy Stock</label>
                <select
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="">-- Choose from Pharmacy or enter custom below --</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.brand}) · {m.category} · Stock: {m.stock}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedMedId && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <label className="block font-semibold text-stone-700 mb-1">Custom Herb / Medicine Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Kaishore Guggulu / Dashamularishta"
                      value={customMedName}
                      onChange={(e) => setCustomMedName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Brand</label>
                    <input
                      type="text"
                      value={customBrand}
                      onChange={(e) => setCustomBrand(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Ayurvedic Form</label>
                    <select
                      value={customForm}
                      onChange={(e) => setCustomForm(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2 py-1.5 text-xs"
                    >
                      <option value="Churna">Churna</option>
                      <option value="Vati / Guti (Tablet)">Vati / Tablet</option>
                      <option value="Kashaya / Kwatha">Kashaya / Kwatha</option>
                      <option value="Arishta">Arishta</option>
                      <option value="Asava">Asava</option>
                      <option value="Guggulu">Guggulu</option>
                      <option value="Taila (Oil)">Taila (Oil)</option>
                      <option value="Ghrita (Medicated Ghee)">Ghrita (Ghee)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Dosage, Timing & Anupana */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Dosage</label>
                  <input
                    type="text"
                    value={customDosage}
                    onChange={(e) => setCustomDosage(e.target.value)}
                    placeholder="e.g. 2 Tablets / 15ml"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Frequency (Kala)</label>
                  <select
                    value={customFrequency}
                    onChange={(e) => setCustomFrequency(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2 py-1.5 text-xs"
                  >
                    <option value="1-0-1">1-0-1 (Morning & Night)</option>
                    <option value="1-1-1">1-1-1 (Thrice Daily)</option>
                    <option value="0-0-1">0-0-1 (Bedtime / Nishi)</option>
                    <option value="1-0-0">1-0-0 (Morning Empty Stomach)</option>
                    <option value="SOS">SOS (As needed for pain)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Anupana (Vehicle)</label>
                  <input
                    type="text"
                    value={customAnupana}
                    onChange={(e) => setCustomAnupana(e.target.value)}
                    placeholder="Warm water, Honey, Milk"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(Number(e.target.value))}
                    min={1}
                    max={180}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Instructions (Meal Timing)</label>
                <input
                  type="text"
                  value={customTiming}
                  onChange={(e) => setCustomTiming(e.target.value)}
                  placeholder="After meals with lukewarm water"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5"
                style={{ backgroundColor: brandColor }}
              >
                <Plus className="w-4 h-4" />
                <span>Add to Prescription Form</span>
              </button>
            </form>
          </div>

          {/* Prescribed Items Table */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Current Prescription List ({prescriptions.length})
              </span>
              <span className="text-[11px] text-stone-400">Review before printing</span>
            </div>

            {prescriptions.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400">
                No medicines added yet. Use form above or click a template.
              </div>
            ) : (
              <div className="space-y-2">
                {prescriptions.map((rx, idx) => (
                  <div
                    key={rx.id}
                    className="p-3 bg-stone-50/70 border border-stone-200/80 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-stone-900 flex items-center gap-1.5">
                        <span className="text-stone-400 font-mono text-[10px]">{idx + 1}.</span>
                        <span>{rx.medicineName}</span>
                        <span className="text-[10px] text-stone-500 font-normal">({rx.form})</span>
                      </div>
                      <div className="text-[11px] text-stone-600 mt-0.5">
                        <strong style={{ color: brandColor }}>{rx.dosage}</strong> [{rx.frequency}] · {rx.timing}
                      </div>
                      <div className="text-[10px] text-stone-500">
                        Anupana: {rx.anupana} · Duration: {rx.durationDays} days
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveRx(rx.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-stone-200 rounded-lg transition-colors"
                      title="Remove from Rx"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: PRINT PREVIEW BRANDED PRESCRIPTION */}
      {showPrintModal && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-3xl w-full text-stone-900 shadow-2xl overflow-hidden my-6">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4" style={{ color: brandColor }} />
                <h3 className="font-bold text-sm text-stone-900">Hospital Branded Prescription Letterhead</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                  style={{ backgroundColor: brandColor }}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button onClick={() => setShowPrintModal(false)} className="text-stone-400 hover:text-stone-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Prescription Body */}
            <div className="p-8 bg-white font-sans text-xs space-y-6">
              {/* Header Letterhead */}
              <div className="border-b-2 pb-4 flex items-center justify-between" style={{ borderColor: brandColor }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-serif font-black text-2xl shadow-sm shrink-0 overflow-hidden"
                    style={{ backgroundColor: brandColor }}
                  >
                    {config.logoUrl ? (
                      <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      'AA'
                    )}
                  </div>
                  <div>
                    <h2 className="font-serif font-black text-xl text-stone-900">{config.hospitalName}</h2>
                    <p className="text-xs text-stone-600">{config.tagline}</p>
                    <p className="text-[10px] text-stone-500">
                      {currentBranch.address} · Phone: {currentBranch.phone}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      Reg No: {config.registrationNumber} · GST: {config.gstNumber}
                    </p>
                  </div>
                </div>

                <div className="text-right text-[11px] space-y-0.5">
                  <div className="font-serif font-bold text-sm text-stone-800">{currentBranch.doctorInCharge}</div>
                  <div className="text-stone-500">Senior Ayurvedic Physician & Vaidya</div>
                  <div className="font-mono font-bold text-stone-700 mt-1">
                    Rx Date: {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Patient Banner */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 grid grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-stone-500 block">Patient Name</span>
                  <strong className="text-stone-900">{selectedPatient.name}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">UHID & Age / Gender</span>
                  <span className="font-mono font-bold text-stone-800">{selectedPatient.uhid}</span> (
                  {selectedPatient.age}y/{selectedPatient.gender})
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Prakriti</span>
                  <strong className="text-stone-800">{selectedPatient.prakriti}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Phone</span>
                  <span className="text-stone-700">{selectedPatient.phone}</span>
                </div>
              </div>

              {/* Diagnosis & Findings */}
              <div className="space-y-1.5 text-xs">
                <div>
                  <strong className="text-stone-700 uppercase text-[10px] tracking-wider">
                    Clinical Evaluation / Complaints:
                  </strong>
                  <p className="text-stone-800 mt-0.5">{chiefComplaints}</p>
                </div>
                <div>
                  <strong className="uppercase text-[10px] tracking-wider" style={{ color: brandColor }}>
                    Ayurvedic Nidana (Diagnosis):
                  </strong>
                  <p className="text-stone-900 font-bold mt-0.5">{nidana}</p>
                </div>
              </div>

              {/* Prescriptions Table */}
              <div>
                <div className="font-serif font-black text-lg text-stone-900 mb-2 flex items-center gap-1">
                  <span style={{ color: brandColor }}>℞</span>
                  <span className="text-xs uppercase font-sans font-bold tracking-wider text-stone-600">
                    Prescribed Ayurvedic Formulations
                  </span>
                </div>

                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b-2 border-stone-300 text-stone-700 bg-stone-50">
                      <th className="py-1.5 px-2">#</th>
                      <th className="py-1.5 px-2">Medicine Formulation</th>
                      <th className="py-1.5 px-2">Brand & Form</th>
                      <th className="py-1.5 px-2">Dosage & Kala</th>
                      <th className="py-1.5 px-2">Anupana (Vehicle)</th>
                      <th className="py-1.5 px-2 text-right">Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {prescriptions.map((rx, idx) => (
                      <tr key={rx.id}>
                        <td className="py-2 px-2 font-bold">{idx + 1}</td>
                        <td className="py-2 px-2 font-bold text-stone-900">{rx.medicineName}</td>
                        <td className="py-2 px-2 text-stone-600">
                          {rx.brand} ({rx.form})
                        </td>
                        <td className="py-2 px-2">
                          <strong style={{ color: brandColor }}>{rx.dosage}</strong> [{rx.frequency}]<br />
                          <span className="text-[10px] text-stone-500">{rx.timing}</span>
                        </td>
                        <td className="py-2 px-2 font-medium text-amber-900">{rx.anupana}</td>
                        <td className="py-2 px-2 text-right font-bold">{rx.durationDays}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pathya & Apathya */}
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <strong className="text-emerald-900 uppercase block mb-0.5">Pathya (Diet to Follow):</strong>
                  <p className="text-stone-800 leading-relaxed">{pathyaDiet}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200">
                  <strong className="text-red-900 uppercase block mb-0.5">Apathya (Diet to Avoid):</strong>
                  <p className="text-stone-800 leading-relaxed">{apathyaDiet}</p>
                </div>
              </div>

              {/* Signature Line */}
              <div className="pt-8 border-t border-stone-200 flex justify-between items-end text-xs">
                <div>
                  <div className="text-stone-600">
                    Review Date: <strong>{new Date(Date.now() + followUpDays * 86400000).toLocaleDateString()}</strong>
                  </div>
                  <div className="text-stone-400 mt-1 font-mono text-[10px]">EMR-QR-SECURE-{selectedPatient.uhid}</div>
                </div>

                <div className="text-center">
                  <div className="font-serif font-bold text-stone-900 text-sm">{currentBranch.doctorInCharge}</div>
                  <div className="text-[10px] text-stone-500">Authorized Ayurvedic Physician</div>
                  <div className="text-[9px] text-stone-400 mt-1">Hospital Seal & Signature</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLINICAL NOTE TEMPLATES MODAL */}
      <ClinicalNoteTemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        config={config}
        onApplyTemplate={handleApplyTemplate}
        currentDraft={{
          soapSubjective: soapSubjective || chiefComplaints,
          soapObjective: soapObjective || 'Vitals normal, pulse steady.',
          soapAssessment: soapAssessment || nidana,
          soapPlan: soapPlan || chikitsaPlan,
          doshaPredominance: selectedPatient?.prakriti || 'Vata',
          pathyaDiet: pathyaDiet,
          apathyaDiet: apathyaDiet,
          recommendedPanchakarma: panchakarmaPrescribed,
          prescriptions: prescriptions,
        }}
      />

      {/* POST-CONSULTATION EMR SAVED & GOOGLE REVIEW DISPATCH MODAL */}
      {reviewSuccessModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-stone-900">Consultation Saved</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      EMR Updated
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {reviewSuccessModal.patientName} · {reviewSuccessModal.uhid}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReviewSuccessModal(null)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Google Review Invite Card */}
            <div className="mt-5 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span>Send Google Review Link via WhatsApp</span>
                </div>
                <span className="text-[10px] text-amber-700 font-semibold">Immediate Post-Visit</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Invite <strong className="text-stone-800">{reviewSuccessModal.patientName}</strong> (
                {reviewSuccessModal.phone}) to rate their experience at{' '}
                <strong className="text-stone-800">{config.hospitalName}</strong> on Google Reviews while their
                consultation is fresh in mind.
              </p>

              {/* Message preview */}
              <div className="p-3 bg-white rounded-2xl border border-amber-200 text-stone-700 font-mono text-[11px] leading-relaxed max-h-28 overflow-y-auto whitespace-pre-wrap select-all shadow-card">
                {getGoogleReviewWhatsAppText(reviewSuccessModal.patientName)}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={`https://wa.me/${reviewSuccessModal.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(getGoogleReviewWhatsAppText(reviewSuccessModal.patientName))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send WhatsApp Review Link</span>
                </a>

                <button
                  onClick={() => copyToClipboard(getGoogleReviewWhatsAppText(reviewSuccessModal.patientName))}
                  className="py-2.5 px-3 bg-white hover:bg-stone-100 text-stone-700 rounded-xl text-xs font-semibold border border-stone-300 flex items-center gap-1.5 transition-all"
                  title="Copy text to clipboard"
                >
                  <Copy className="w-4 h-4 text-stone-500" />
                  <span>Copy Text</span>
                </button>
              </div>

              {copySuccessToast && (
                <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Review invitation text copied to clipboard!</span>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-5 pt-4 border-t border-stone-200 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setReviewSuccessModal(null);
                  setShowPrintModal(true);
                }}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-all"
                style={{ backgroundColor: brandColor }}
              >
                <Printer className="w-4 h-4" />
                <span>Print Branded Prescription Now</span>
              </button>

              <button
                onClick={() => setReviewSuccessModal(null)}
                className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
