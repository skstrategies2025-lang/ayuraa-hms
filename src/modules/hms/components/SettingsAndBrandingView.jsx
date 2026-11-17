import React, { useState, useRef, useEffect } from 'react';
import { Building2, Download, Upload, Save, Check, Plus, Database, X, Palette, Hash, Sparkles, ImagePlus, Trash2, Loader2 } from 'lucide-react';
import { AyurStorage } from '../services/storage';
import { THEME_PRESETS, applyDynamicTheme, extractDominantColorFromImage } from '../utils/theme';
import { ThemeColorPicker } from './ThemeColorPicker';
import { getImageUrl } from '../../../common/index'; // same path you used in Sidebar
export const SettingsAndBrandingView = ({ config, currentBranch, branches, patients, medicines }) => {
  // Form states for branding
  const [hospitalName, setHospitalName] = useState(config.hospitalName);
  const [tagline, setTagline] = useState(config.tagline);
  const [regNo, setRegNo] = useState(config.registrationNumber);
  const [gstNo, setGstNo] = useState(config.gstNumber);
  const [phone, setPhone] = useState(config.supportPhone);
  const [email, setEmail] = useState(config.supportEmail);
  const [address, setAddress] = useState(config.address);
  const [logoUrl, setLogoUrl] = useState(config.logoUrl || '');
  // Theme state
  const [themeColor, setThemeColor] = useState(config.themeColor || '#0f6240');
  // UHID Sequence state
  const [uhidPrefix, setUhidPrefix] = useState(config.uhidPrefix || 'AYUR-');
  const [uhidStartSequence, setUhidStartSequence] = useState(config.uhidStartSequence || 1001);
  const [uhidCurrentSequence, setUhidCurrentSequence] = useState(config.uhidCurrentSequence || 1004);
  // Revenue Leakage Defense Policy States
  const [shieldOilConsumables, setShieldOilConsumables] = useState(true);
  const [consultationValidityDays, setConsultationValidityDays] = useState(14);
  const [autoFollowUpReminders, setAutoFollowUpReminders] = useState(true);
  const [deadStockAlertDays, setDeadStockAlertDays] = useState(90);
  const [bundleParasurgicalDressing, setBundleParasurgicalDressing] = useState(true);
  const [advanceDepositForPanchakarma, setAdvanceDepositForPanchakarma] = useState(true);
  const [notificationMsg, setNotificationMsg] = useState(null);
  const fileInputRef = useRef(null);
  const [logoBusy, setLogoBusy] = useState(false);
  // New branch modal
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchCity, setNewBranchCity] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [newBranchDoctor, setNewBranchDoctor] = useState('Dr. S. K. Varier, BAMS');
  const [newBranchBeds, setNewBranchBeds] = useState(20);
  // Colours are previewed live. If the user leaves without saving, go back to the saved clinic colour.
  useEffect(
    () => () => {
      const saved = AyurStorage.getConfig()?.themeColor;
      if (saved) applyDynamicTheme(saved);
    },
    []
  );

  const showNotification = (text, type = 'success') => {
    setNotificationMsg({ text, type });
    setTimeout(() => setNotificationMsg(null), 4000);
  };
  const handleSelectTheme = (color) => {
    setThemeColor(color);
    applyDynamicTheme(color);
  };
  // Shrinks a picked image to at most 512px so it saves quickly and stays sharp on screen / print.
  const resizeLogo = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read'));
      reader.onload = () => {
        if (file.type === 'image/svg+xml') return resolve(reader.result);
        const img = new Image();
        img.onerror = () => reject(new Error('decode'));
        img.onload = () => {
          const scale = Math.min(1, 512 / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

  // Saves the logo (and matching colour) straight away - no need to press the big Save button.
  const persistLogo = (nextLogo, nextColor) => {
    AyurStorage.saveConfig({ ...AyurStorage.getConfig(), logoUrl: nextLogo, themeColor: nextColor });
  };

  const handleLogoFileUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showNotification('Please choose an image file (PNG, JPG or SVG).', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showNotification('That image is larger than 5 MB. Please choose a smaller one.', 'error');
      return;
    }
    setLogoBusy(true);
    try {
      const dataUrl = await resizeLogo(file);
      setLogoUrl(dataUrl);
      extractDominantColorFromImage(dataUrl, (extractedHex) => {
        setThemeColor(extractedHex);
        applyDynamicTheme(extractedHex);
        persistLogo(dataUrl, extractedHex);
        showNotification('Logo saved. Theme colour matched to your logo.');
      });
      // if no colour could be read (e.g. a grey logo) keep the current colour but still save the logo
      setTimeout(() => {
        if (AyurStorage.getConfig().logoUrl !== dataUrl) {
          persistLogo(dataUrl, themeColor);
          showNotification('Logo saved.');
        }
      }, 800);
    } catch {
      showNotification('Could not read that image. Please try another file.', 'error');
    } finally {
      setLogoBusy(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    persistLogo('', themeColor);
    showNotification('Logo removed.');
  };

  const handleSaveAllSettings = (e) => {
    e.preventDefault();
    const updated = {
      ...config,
      hospitalName,
      tagline,
      registrationNumber: regNo,
      gstNumber: gstNo,
      supportPhone: phone,
      supportEmail: email,
      address,
      logoUrl,
      themeColor,
      uhidPrefix: uhidPrefix.trim(),
      uhidStartSequence: Number(uhidStartSequence),
      uhidCurrentSequence: Number(uhidCurrentSequence),
    };
    AyurStorage.saveConfig(updated);
    applyDynamicTheme(themeColor);
    showNotification('Settings, brand theme, and UHID configuration saved successfully!');
  };
  const handleDownloadBackup = () => {
    const jsonStr = AyurStorage.exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AyurSutra_HMS_SecureBackup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Backup archive exported successfully.');
  };
  const handleRestoreBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      const success = AyurStorage.restoreBackupJSON(content);
      if (success) {
        showNotification('Backup restored successfully! All clinic records are synced.');
      } else {
        showNotification('Failed to restore backup: Invalid JSON file structure.', 'error');
      }
    };
    reader.readAsText(file);
  };
  const handleExportPatientsCSV = () => {
    const headers = ['UHID', 'Name', 'Age', 'Gender', 'Phone', 'Prakriti', 'AdmissionStatus', 'PrimaryCondition'];
    const rows = patients.map((p) => [
      `"${p.uhid}"`,
      `"${p.name}"`,
      p.age,
      `"${p.gender}"`,
      `"${p.phone}"`,
      `"${p.prakriti}"`,
      `"${p.admissionStatus}"`,
      `"${p.primaryCondition.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AyurSutra_Patients_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Patient directory exported as CSV.');
  };
  const handleExportMedicinesCSV = () => {
    const headers = [
      'MedicineName',
      'ClassicalName',
      'Brand',
      'Category',
      'BatchNo',
      'ExpiryDate',
      'Stock',
      'Unit',
      'MRP',
    ];
    const rows = medicines.map((m) => [
      `"${m.name}"`,
      `"${m.classicalName || ''}"`,
      `"${m.brand}"`,
      `"${m.category}"`,
      `"${m.batchNo}"`,
      `"${m.expiryDate}"`,
      m.stock,
      `"${m.unit}"`,
      m.sellingPrice,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AyurSutra_PharmacyStock_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Pharmacy inventory exported as CSV.');
  };
  const handleAddNewBranch = (e) => {
    e.preventDefault();
    const newBranch = {
      id: `branch-${Date.now()}`,
      name: newBranchName,
      code: newBranchCode.toUpperCase() || 'AS-UNIT',
      city: newBranchCity,
      address: newBranchAddress,
      phone: newBranchPhone,
      email: `${newBranchCode.toLowerCase()}@ayursutra-hms.com`,
      doctorInCharge: newBranchDoctor,
      bedCapacity: Number(newBranchBeds),
      activePanchakarmaRooms: 4,
    };
    const currentBranches = AyurStorage.getBranches();
    AyurStorage.saveBranches([...currentBranches, newBranch]);
    setShowAddBranch(false);
    setNewBranchName('');
    setNewBranchCity('');
    showNotification(`Branch "${newBranch.name}" created successfully.`);
  };
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: themeColor }}
            >
              Master Clinic Control
            </span>
            <span className="text-xs text-stone-500 font-mono">Branding & Global Architecture</span>
          </div>
          <h2 className="text-2xl font-serif font-black text-stone-900 tracking-tight">
            Clinic Settings & Branding
          </h2>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl">
            Logo and theme colour, patient ID numbers, hospital details, branches and backups.
          </p>
        </div>
      </div>

      {notificationMsg && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 max-w-sm text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2 shadow-lg border ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-red-50 text-red-800 border-red-300'
          }`}
        >
          {notificationMsg.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <X className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{notificationMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSaveAllSettings} className="space-y-6">
        {/* ROW 1: LOGO & DYNAMIC THEME COLOR ENGINE + PATIENT UHID SEQUENCER */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Logo & Theme Color Engine */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5" style={{ color: themeColor }} />
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Clinic Logo & Dynamic Theme Color</h3>
                  <p className="text-xs text-stone-500">Upload your logo or pick a colour. The whole website follows it.</p>
                </div>
              </div>
              <span
                className="w-4 h-4 rounded-full border border-stone-300 shadow-sm"
                style={{ backgroundColor: themeColor }}
              ></span>
            </div>

            {/* Logo Upload Section */}
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Logo Preview */}
                <div
                  className="w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-white shrink-0 self-center sm:self-auto"
                  style={{ borderColor: logoUrl ? themeColor : '#d6d3d1' }}
                >
                  {logoBusy ? (
                    <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
                  ) : logoUrl ? (
                    <img src={getImageUrl(logoUrl)} alt="Clinic logo" className="w-full h-full object-contain p-1.5" />
                  ) : (
                    <div className="text-center text-stone-400">
                      <ImagePlus className="w-6 h-6 mx-auto" />
                      <span className="text-[10px] font-medium">No logo</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                  <div>
                    <p className="text-sm font-bold text-stone-900">Clinic Logo</p>
                    <p className="text-xs text-stone-500">
                      Saved automatically. Shown in the sidebar and on prescriptions.
                    </p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoFileUpload}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                  />
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={logoBusy}
                      className="px-4 py-2 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-60"
                      style={{ backgroundColor: themeColor }}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                    </button>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-3 py-2 bg-white border border-stone-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-400">PNG, JPG, WebP or SVG, up to 5 MB. Your theme colour is picked from the logo.</p>
                </div>
              </div>
            </div>

            {/* Classical Ayurvedic Theme Presets */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Classical Palette Presets:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {THEME_PRESETS.map((p) => {
                  const isSelected = themeColor.toLowerCase() === p.color.toLowerCase();
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectTheme(p.color)}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        isSelected
                          ? 'border-2 shadow-sm bg-stone-50'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                      style={{
                        borderColor: isSelected ? p.color : undefined,
                      }}
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: p.color }}
                      ></span>
                      <div className="overflow-hidden">
                        <div className="text-[11px] font-bold text-stone-900 truncate">{p.name.split(' ')[0]}</div>
                        <div className="text-[9px] text-stone-400 font-mono truncate">{p.color}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colour range sliders (hue, saturation, lightness) + hex code + eyedropper */}
            <div className="pt-2 border-t border-stone-100">
              <ThemeColorPicker value={themeColor} onChange={handleSelectTheme} />
            </div>
          </div>

          {/* Patient UHID Sequencer */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
              <Hash className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Patient Unique ID (UHID) Sequencer</h3>
                <p className="text-xs text-stone-500">Configure your clinic's starting sequence number and prefix</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Clinic UHID Prefix</label>
                <input
                  type="text"
                  placeholder="e.g. AYUR-, KOT-, CLINIC-"
                  value={uhidPrefix}
                  onChange={(e) => setUhidPrefix(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-bold font-mono focus:outline-none"
                  required
                />
                <span className="text-[10px] text-stone-400">e.g. AYUR-, KOT-, SRI-</span>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Starting Sequence Number</label>
                <input
                  type="number"
                  placeholder="e.g. 1001, 5000"
                  value={uhidStartSequence}
                  onChange={(e) => setUhidStartSequence(Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-bold font-mono focus:outline-none"
                  required
                />
                <span className="text-[10px] text-stone-400">Clinic starting sequence</span>
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-stone-700 font-bold mb-1">Next Number to be Issued</label>
              <input
                type="number"
                value={uhidCurrentSequence}
                onChange={(e) => setUhidCurrentSequence(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-bold font-mono focus:outline-none"
                required
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Auto-increments every time a new patient is registered via Intake, Clinic CRM, or Camps.
              </p>
            </div>

            {/* Live Preview Box */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
                Live Generated UHID Preview:
              </span>
              <div className="flex items-center gap-3">
                <span
                  className="text-2xl font-bold px-3.5 py-1.5 rounded-xl border bg-white shadow-xs"
                  style={{ color: themeColor, borderColor: `${themeColor}40` }}
                >
                  {uhidPrefix}
                  {uhidCurrentSequence}
                </span>
                <span className="text-stone-600 text-xs leading-tight">
                  Next registered patient receives this exact unique hospital identification number.
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setUhidCurrentSequence(Number(uhidStartSequence));
                  showNotification(`Next sequence reset to starting number ${uhidStartSequence}.`);
                }}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
              >
                Reset to Start Number ({uhidStartSequence})
              </button>
            </div>
          </div>
        </div>

        {/* ROW 2: CLINIC DETAILS & ADDRESS */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Hospital & Prescription Branding Details</h3>
              <p className="text-xs text-stone-500">
                Official hospital registration, GSTIN, and letterhead credentials
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">Hospital / Clinic Official Name</label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-serif font-bold text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Tagline & Accreditation</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">AYUSH / Clinical Registration Number</label>
              <input
                type="text"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">GSTIN Tax Registration</label>
              <input
                type="text"
                value={gstNo}
                onChange={(e) => setGstNo(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Support Phone / Helpdesk</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900"
                required
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Official Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900"
                required
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-stone-700 font-semibold mb-1">Primary Campus Physical Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900"
                required
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-2"
              style={{ backgroundColor: themeColor }}
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* ROW 3: MULTI-BRANCH NETWORK */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-stone-900 text-sm">
                  Multi-Branch Hospital Network ({branches.length} Units)
                </h3>
                <p className="text-xs text-stone-500">
                  Centralized control with per-branch patient records, beds & Panchakarma rooms
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAddBranch(true)}
              className="px-3.5 py-1.5 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
              style={{ backgroundColor: themeColor }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Branch</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {branches.map((b) => (
              <div
                key={b.id}
                className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  b.id === currentBranch.id ? 'bg-stone-50 border-2 shadow-sm' : 'bg-white border-stone-200'
                }`}
                style={{
                  borderColor: b.id === currentBranch.id ? themeColor : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-stone-900">{b.name}</span>
                  <span className="font-mono text-[10px] bg-stone-200 px-1.5 py-0.5 rounded text-stone-700 font-bold">
                    {b.code}
                  </span>
                </div>
                <div className="text-stone-500">{b.address}</div>
                <div className="pt-2 border-t border-stone-100 flex justify-between items-center text-stone-600">
                  <span>
                    Vaidya: <strong>{b.doctorInCharge}</strong>
                  </span>
                  <span>{b.bedCapacity} Beds</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ROW 3.5: CLINICAL RESEARCH - AYURVEDIC REVENUE LEAKAGE AUDIT & DEFENSE SUITE */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                  Vaidya Financial Health & ERP Defense
                </span>
                <span className="text-xs text-stone-500 font-mono">Evidence-Based Clinical Practice Audit</span>
              </div>
              <h3 className="font-serif font-black text-lg text-stone-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                Ayurvedic Hospital Revenue Leakage Defense Suite
              </h3>
              <p className="text-xs text-stone-500 max-w-3xl mt-0.5">
                Deep research into clinical pain points where small clinics to multi-bed hospitals silently lose 18% to
                32% of operational revenue. Configure automated defensive safeguards below.
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-right shrink-0">
              <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider block">
                Estimated Monthly Revenue Saved
              </span>
              <span className="text-xl font-black text-emerald-700">₹42,500 – ₹1,35,000</span>
            </div>
          </div>

          {/* 6 Core Leakage Research Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* LEAK 1: PANCHAKARMA OILS & GHRITAS */}
            <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  1. Panchakarma Oil & Consumable Creep
                </span>
                <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded">
                  High Leakage
                </span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                <strong>Clinical Pain Point:</strong> Therapists use 200ml–450ml of premium medicated oils (Ksheerabala
                101, Mahanarayana, Sahacharadi) per Abhyanga or Shirodhara session, plus linen laundry costs. When
                hospitals charge a flat package fee, oil price inflation silently eats up to 28% of procedure margins.
              </p>
              <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-700">Auto-Buffer Consumables (+15%)</span>
                <input
                  type="checkbox"
                  checked={shieldOilConsumables}
                  onChange={(e) => {
                    setShieldOilConsumables(e.target.checked);
                    showNotification(
                      e.target.checked ? 'Panchakarma oil consumable shield enabled.' : 'Oil buffer disabled.'
                    );
                  }}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            {/* LEAK 2: PATIENT FOLLOW-UP CHURN */}
            <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  2. Patient Follow-Up Churn & Drop-Out
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                  38% Loss Rate
                </span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                <strong>Clinical Pain Point:</strong> Ayurvedic treatments take 14 to 45 days for full Dhatu
                pacification. Without automated date-based reminders, up to 40% of patients discontinue herbal courses
                after mild symptom relief, losing repeat visits and pharmacy renewals.
              </p>
              <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-700">1-Click WhatsApp Follow-Up Engine</span>
                <input
                  type="checkbox"
                  checked={autoFollowUpReminders}
                  onChange={(e) => {
                    setAutoFollowUpReminders(e.target.checked);
                    showNotification(
                      e.target.checked ? 'Automated follow-up calling desk active.' : 'Follow-up reminders deactivated.'
                    );
                  }}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            {/* LEAK 3: CONSULTATION VALIDITY WINDOW */}
            <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  3. Free Consultation Validity Creep
                </span>
                <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-1.5 py-0.5 rounded">
                  OPD Drain
                </span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                <strong>Clinical Pain Point:</strong> Patients return 3 to 6 weeks later demanding free review
                consultations. Front desk staff hesitate to ask for re-registration fees without a clear
                software-enforced validity cutoff rule.
              </p>
              <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-700">Validity Limit:</span>
                <select
                  value={consultationValidityDays}
                  onChange={(e) => {
                    setConsultationValidityDays(Number(e.target.value));
                    showNotification(`Consultation validity set to ${e.target.value} days.`);
                  }}
                  className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold text-stone-800"
                >
                  <option value={7}>7 Days (Strict)</option>
                  <option value={14}>14 Days (Standard)</option>
                  <option value={21}>21 Days (Relaxed)</option>
                </select>
              </div>
            </div>

            {/* LEAK 4: DEAD STOCK & EXPIRY WRITE-OFFS */}
            <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  4. Botanical Expiry & Arishta Sedimentation
                </span>
                <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded">Dead Stock</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                <strong>Clinical Pain Point:</strong> Unsold herbal churnas clump up, and Arishta bottles sediment on
                back shelves without staff realizing. Small clinics lose ₹30,000–₹80,000 annually discarding expired
                botanical batches that could have been prescribed or returned.
              </p>
              <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-700">Proactive Expiry Alert Days:</span>
                <select
                  value={deadStockAlertDays}
                  onChange={(e) => {
                    setDeadStockAlertDays(Number(e.target.value));
                    showNotification(`Pharmacy expiry warning set to ${e.target.value} days in advance.`);
                  }}
                  className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold text-stone-800"
                >
                  <option value={30}>30 Days Ahead</option>
                  <option value={60}>60 Days Ahead</option>
                  <option value={90}>90 Days Ahead (Recommended)</option>
                </select>
              </div>
            </div>

            {/* LEAK 5: PARASURGICAL & DRESSING UNDERBILLING */}
            <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  5. Parasurgical & Ksharasutra Dressing
                </span>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">
                  Unbilled Items
                </span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                <strong>Clinical Pain Point:</strong> Kshara Sutra weekly thread changes, Agnikarma points, Jalauka
                (Leech) dressings, and Panchavalkala sitz packs require sterile gauze, Jatyadi Taila, and specialized
                doctor skill, but are often bundled into a nominal ₹200 fee.
              </p>
              <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-700">Auto-Itemize Parasurgical Pack</span>
                <input
                  type="checkbox"
                  checked={bundleParasurgicalDressing}
                  onChange={(e) => {
                    setBundleParasurgicalDressing(e.target.checked);
                    showNotification(
                      e.target.checked ? 'Parasurgical dressing bundle auto-applied.' : 'Bundle disabled.'
                    );
                  }}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            {/* LEAK 6: ROOM NO-SHOW & THERAPIST IDLE WASTE */}
            <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  6. Therapy Suite No-Shows & Idle Slots
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                  Slot Waste
                </span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                <strong>Clinical Pain Point:</strong> When a Shirodhara or Vasti patient doesn't show up without 2
                hours' notice, the therapy room, warm decoctions, and dedicated therapist remain idle and cannot be
                reallocated to walk-in patients.
              </p>
              <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-700">Require Booking Token Deposit</span>
                <input
                  type="checkbox"
                  checked={advanceDepositForPanchakarma}
                  onChange={(e) => {
                    setAdvanceDepositForPanchakarma(e.target.checked);
                    showNotification(
                      e.target.checked
                        ? 'Panchakarma advance booking token policy active.'
                        : 'Advance token policy disabled.'
                    );
                  }}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ROW 4: DATA EXPORT & CLOUD BACKUP */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
            <Database className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Secure Cloud Backup & Data Export</h3>
              <p className="text-xs text-stone-500">
                Export complete JSON database archives or CSV files for clinical auditing
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <span className="font-bold text-stone-800 block">Complete Hospital JSON Backup</span>
              <p className="text-[11px] text-stone-500">
                Exports all patient records, EMR visits, lab reports, pharmacy stock, invoices, and camps.
              </p>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Backup</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <span className="font-bold text-stone-800 block">Restore Database from Backup</span>
              <p className="text-[11px] text-stone-500">
                Upload a previously saved AyurSutra JSON backup archive to restore all records.
              </p>
              <label className="w-full py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Select Backup JSON File</span>
                <input type="file" accept=".json" onChange={handleRestoreBackup} className="hidden" />
              </label>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <span className="font-bold text-stone-800 block">Clinical & Stock CSV Reports</span>
              <p className="text-[11px] text-stone-500">
                Download spreadsheet files for accountants, auditors, and pharmacy stock verification.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleExportPatientsCSV}
                  className="flex-1 py-2 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-xl text-[11px] font-semibold"
                >
                  Patients CSV
                </button>
                <button
                  type="button"
                  onClick={handleExportMedicinesCSV}
                  className="flex-1 py-2 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-xl text-[11px] font-semibold"
                >
                  Pharmacy CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* MODAL: ADD NEW HOSPITAL BRANCH */}
      {showAddBranch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 text-stone-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-stone-900">Add New Hospital Branch / Unit</h3>
                <p className="text-xs text-stone-500">Extend your Ayurvedic hospital network</p>
              </div>
              <button onClick={() => setShowAddBranch(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewBranch} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Branch Name</label>
                <input
                  type="text"
                  placeholder="e.g. AyurSutra Mysore Heritage Centre"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Branch Code</label>
                  <input
                    type="text"
                    placeholder="e.g. MYS-01"
                    value={newBranchCode}
                    onChange={(e) => setNewBranchCode(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">City / Region</label>
                  <input
                    type="text"
                    placeholder="e.g. Mysore, Karnataka"
                    value={newBranchCity}
                    onChange={(e) => setNewBranchCity(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Complete Address</label>
                <input
                  type="text"
                  placeholder="e.g. 14 Chamundi Hill Road, Mysore"
                  value={newBranchAddress}
                  onChange={(e) => setNewBranchAddress(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newBranchPhone}
                    onChange={(e) => setNewBranchPhone(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Bed Capacity</label>
                  <input
                    type="number"
                    value={newBranchBeds}
                    onChange={(e) => setNewBranchBeds(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddBranch(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white rounded-xl font-bold shadow-sm"
                  style={{ backgroundColor: themeColor }}
                >
                  Register Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
