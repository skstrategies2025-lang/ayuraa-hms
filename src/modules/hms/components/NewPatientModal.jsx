import React, { useState } from 'react';
import { Users, X, Hash } from 'lucide-react';
import { AyurStorage } from '../services/storage';
export const NewPatientModal = ({ isOpen, onClose, currentBranch, config, onPatientCreated }) => {
  if (!isOpen) return null;
  const [name, setName] = useState('');
  const [age, setAge] = useState(45);
  const [gender, setGender] = useState('Female');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('B +ve');
  const [occupation, setOccupation] = useState('');
  const [prakriti, setPrakriti] = useState('Vata-Pitta');
  const [primaryCondition, setPrimaryCondition] = useState('');
  const [allergies, setAllergies] = useState('None reported');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Spouse');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [admissionStatus, setAdmissionStatus] = useState('OPD (Outpatient)');
  const [assignedRoom, setAssignedRoom] = useState('');
  const [referredBy, setReferredBy] = useState('Direct Walk-in');
  // Preview next UHID using clinic owner's configured starting sequence
  const nextSeq = config.uhidCurrentSequence || config.uhidStartSequence || 1001;
  const previewUHID = `${config.uhidPrefix || 'AYUR-'}${nextSeq}`;
  const handleSubmit = (e) => {
    e.preventDefault();
    // Auto-generate UHID from sequence
    const generatedUHID = AyurStorage.generateAndIncrementUHID();
    const newPat = {
      id: `pat-${Date.now()}`,
      uhid: generatedUHID,
      name: name.trim(),
      age: Number(age),
      gender: gender,
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim() || currentBranch.city,
      bloodGroup: bloodGroup,
      occupation: occupation.trim(),
      registeredDate: new Date().toISOString().split('T')[0],
      branchId: currentBranch.id,
      prakriti: prakriti,
      primaryCondition: primaryCondition.trim() || 'General Ayurvedic Evaluation',
      allergies: allergies,
      emergencyContact: {
        name: emergencyName.trim() || 'Next of Kin',
        relation: emergencyRelation,
        phone: emergencyPhone.trim() || phone.trim(),
      },
      admissionStatus: admissionStatus,
      assignedRoom: admissionStatus.includes('IPD') ? assignedRoom || 'Deluxe Cottage 102' : undefined,
      referredBy: referredBy,
      bloodReports: [],
      clinicalImages: [],
      clinicalVisits: [
        {
          id: `vis-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          doctorName: currentBranch.doctorInCharge,
          chiefComplaints: primaryCondition,
          ashtavidhaPariksha: {
            nadi: `${prakriti} Gathi`,
            mutra: 'Prakruta',
            mala: 'Mala pravritti samanya',
            jihwa: 'Alpa Sama',
            shabda: 'Prakruta',
            sparsha: 'Sheeta-Ruksha',
            druk: 'Prakruta',
            aakruti: 'Madhyama',
          },
          agni: 'Visham (Irregular)',
          koshtha: 'Madhyama (Moderate)',
          vikriti: { vata: 50, pitta: 30, kapha: 20 },
          nidanaDiagnosis: primaryCondition,
          chikitsaPlan: 'Initial consultation & Panchakarma assessment scheduled',
          prescriptions: [],
          pathyaDiet: 'Warm freshly cooked food, seasonal vegetables and cow ghee',
          apathyaDiet: 'Cold refrigerate items, deep fried foods, night wakefulness',
        },
      ],
    };
    AyurStorage.addPatient(newPat);
    onPatientCreated(newPat);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-2xl w-full p-6 sm:p-8 text-stone-900 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-5">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl text-white shadow-sm"
              style={{ backgroundColor: config.themeColor || '#0f6240' }}
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-stone-900">New Patient Registration</h3>
              <p className="text-xs text-stone-500">Hospital Intake & Baseline Ayurvedic Pariksha Dossier</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-xs font-mono font-bold border"
              style={{
                borderColor: `${config.themeColor}50` || '#0f624050',
                backgroundColor: `${config.themeColor}10` || '#0f624010',
                color: config.themeColor || '#0f6240',
              }}
            >
              UHID: {previewUHID}
            </span>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-700 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Row 1: Name, Age, Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-stone-700 font-semibold mb-1">Patient Full Name</label>
              <input
                type="text"
                placeholder="e.g. Smt. Gayatri Devi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-bold focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Age (Years)</label>
              <input
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 text-center font-bold focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Row 2: Phone, Email, Blood Group */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Mobile Number (SMS Enabled)</label>
              <input
                type="tel"
                placeholder="+91 98450..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-mono focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Email Address</label>
              <input
                type="email"
                placeholder="patient@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-bold focus:outline-none"
              >
                <option value="A +ve">A +ve</option>
                <option value="A -ve">A -ve</option>
                <option value="B +ve">B +ve</option>
                <option value="B -ve">B -ve</option>
                <option value="O +ve">O +ve</option>
                <option value="O -ve">O -ve</option>
                <option value="AB +ve">AB +ve</option>
                <option value="AB -ve">AB -ve</option>
              </select>
            </div>
          </div>

          {/* Row 3: Prakriti Constitution & Admission Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Prakriti Constitution</label>
              <select
                value={prakriti}
                onChange={(e) => setPrakriti(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-bold focus:outline-none"
              >
                <option value="Vata">Vata Pradhana (Vata dominant)</option>
                <option value="Pitta">Pitta Pradhana (Pitta dominant)</option>
                <option value="Kapha">Kapha Pradhana (Kapha dominant)</option>
                <option value="Vata-Pitta">Vata-Pitta (Dual dosha)</option>
                <option value="Pitta-Kapha">Pitta-Kapha (Dual dosha)</option>
                <option value="Vata-Kapha">Vata-Kapha (Dual dosha)</option>
                <option value="Tridosha">Tridosha (Balanced)</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Admission Category</label>
              <select
                value={admissionStatus}
                onChange={(e) => setAdmissionStatus(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-bold focus:outline-none"
              >
                <option value="OPD (Outpatient)">OPD (Outpatient Consultation)</option>
                <option value="IPD (Admitted in Ward)">IPD (Admitted in Deluxe Ayurvedic Cottage)</option>
                <option value="Daycare Panchakarma">Daycare Panchakarma Session</option>
              </select>
            </div>
          </div>

          {/* If IPD Cottage */}
          {admissionStatus.includes('IPD') && (
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Assigned Ayurvedic Cottage / Room</label>
              <input
                type="text"
                placeholder="e.g. Deluxe Cottage #104 (Panchakarma Suite)"
                value={assignedRoom}
                onChange={(e) => setAssignedRoom(e.target.value)}
                className="w-full bg-stone-50 border border-amber-400 rounded-xl px-3 py-2 text-stone-900 font-bold focus:outline-none"
              />
            </div>
          )}

          {/* Primary Condition & Address */}
          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Primary Ayurvedic Condition / Chief Complaints
            </label>
            <input
              type="text"
              placeholder="e.g. Bilateral knee stiffness (Sandhigata Vata) or Chronic Plaque Psoriasis"
              value={primaryCondition}
              onChange={(e) => setPrimaryCondition(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Residential Address</label>
              <input
                type="text"
                placeholder="City, State"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Patient Referral Source</label>
              <select
                value={referredBy}
                onChange={(e) => setReferredBy(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none"
              >
                <option value="Direct Walk-in">Direct Walk-in</option>
                <option value="Clinic Website Inquiry">Clinic Website Inquiry</option>
                <option value="Medical Camp - Outreach">Medical Camp Outreach</option>
                <option value="Google Search & SEO">Google Search & SEO</option>
                <option value="Meta / Instagram Healthcare Ads">Meta / Instagram Healthcare Ads</option>
                <option value="Ayurvedic Doctor Referral">Ayurvedic Vaidya Referral</option>
              </select>
            </div>
          </div>

          {/* Sequence info note */}
          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-600 text-[11px] flex items-center gap-2">
            <Hash className="w-4 h-4 text-stone-400 shrink-0" />
            <span>
              Unique Patient UHID auto-incremented sequentially based on clinic starting sequence:{' '}
              <strong className="font-mono text-stone-900">{previewUHID}</strong>. You can customize the starting number
              in Clinic Settings.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl hover:bg-stone-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-white font-bold rounded-xl shadow transition-all active:scale-95"
              style={{ backgroundColor: config.themeColor || '#0f6240' }}
            >
              Admit & Open Patient Dossier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
