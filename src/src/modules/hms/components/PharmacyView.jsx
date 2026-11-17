import React, { useState, useEffect } from 'react';
import {
  Pill,
  Search,
  Plus,
  AlertTriangle,
  Clock,
  ShoppingCart,
  ArrowUpDown,
  PackageCheck,
  Trash2,
  Check,
  Printer,
  X,
  Tag,
  DollarSign,
  Activity,
  Bell,
  BellRing,
  Volume2,
} from 'lucide-react';
import { AyurStorage } from '../services/storage';
export const PharmacyView = ({ medicines, patients, config, currentBranch }) => {
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [alertFilter, setAlertFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('name_asc');
  // View Sub-Tabs: Inventory vs Automated Forecasting
  const [activePharmaTab, setActivePharmaTab] = useState('inventory');
  const [posToast, setPosToast] = useState(null);
  // New Medicine Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedClassical, setNewMedClassical] = useState('');
  const [newMedBrand, setNewMedBrand] = useState('Kottakkal Arya Vaidya Sala');
  const [newMedCategory, setNewMedCategory] = useState('Kashaya / Kwatha');
  const [newMedBatch, setNewMedBatch] = useState('');
  const [newMedExpiry, setNewMedExpiry] = useState('2028-06-30');
  const [newMedStock, setNewMedStock] = useState(50);
  const [newMedUnit, setNewMedUnit] = useState('Bottles (450ml)');
  const [newMedMinStock, setNewMedMinStock] = useState(15);
  const [newMedCost, setNewMedCost] = useState(180);
  const [newMedSelling, setNewMedSelling] = useState(250);
  const [newMedTax, setNewMedTax] = useState(5);
  const [newMedIndication, setNewMedIndication] = useState('');
  const [newMedReference, setNewMedReference] = useState('Sahasrayogam');
  // Quick POS Billing Cart State
  const [cart, setCart] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [paymentMode, setPaymentMode] = useState('UPI / QR');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [showPOSInvoiceModal, setShowPOSInvoiceModal] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  // Purchase Order (PO) Generator Modal State for Forecasting
  const [showPOModal, setShowPOModal] = useState(false);
  const [selectedBrandForPO, setSelectedBrandForPO] = useState('All');
  const today = new Date();
  // Helper for expiry days calculation
  const getDaysToExpiry = (expiryDateStr) => {
    const exp = new Date(expiryDateStr);
    return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };
  // Helper for profit margin calculation
  const calculateMargin = (selling, cost) => {
    const profit = selling - cost;
    const marginPct = selling > 0 ? (profit / selling) * 100 : 0;
    const markupPct = cost > 0 ? (profit / cost) * 100 : 0;
    return { profit, marginPct, markupPct };
  };
  // Helper for Daily Consumption Rate estimation based on unit & stock
  const getForecastMetrics = (med) => {
    // Deterministic daily burn rate derived from seed/reorder level (typical 1-3 units/day for high turnover, 0.4-0.8 for slow turnover)
    const baseDailyBurn = Math.max(0.4, Number((med.minReorderLevel * 0.12 + (med.stock % 3) * 0.3).toFixed(1)));
    const daysRemaining = Math.max(0, Math.floor(med.stock / baseDailyBurn));
    const leadTimeDays =
      med.brand.includes('Kottakkal') || med.brand.includes('Vaidyaratnam') || med.brand.includes('Kerala') ? 10 : 5;
    const safetyStockBuffer = Math.ceil(baseDailyBurn * 7); // 7-day safety buffer
    const targetInventory = Math.ceil(leadTimeDays * baseDailyBurn) + safetyStockBuffer;
    const suggestedReorderQty = Math.max(0, targetInventory - med.stock);
    const estimatedCost = suggestedReorderQty * med.unitCost;
    let urgency = 'Optimal';
    if (daysRemaining <= 7) urgency = 'Critical';
    else if (daysRemaining <= 14 || med.stock <= med.minReorderLevel) urgency = 'Warning';
    else if (daysRemaining >= 60) urgency = 'Overstocked';
    return {
      dailyBurnRate: baseDailyBurn,
      daysRemaining,
      leadTimeDays,
      safetyStockBuffer,
      suggestedReorderQty,
      estimatedCost,
      urgency,
    };
  };
  // Toast trigger
  const triggerToast = (msg) => {
    setPosToast(msg);
    setTimeout(() => setPosToast(null), 3500);
  };
  const brandColor = config.themeColor || '#0f6240';
  // Automated Browser Notification System State
  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });
  const [autoBrowserAlerts, setAutoBrowserAlerts] = useState(() => {
    try {
      const val = localStorage.getItem('ayur_auto_browser_alerts');
      return val !== 'false';
    } catch {
      return true;
    }
  });
  // Calculate critical stock & expiry lists
  const lowStockItems = medicines.filter((m) => m.stock <= m.minReorderLevel);
  const expiring30Items = medicines.filter((m) => getDaysToExpiry(m.expiryDate) <= 30);
  const expiring60Items = medicines.filter((m) => getDaysToExpiry(m.expiryDate) <= 60);
  // Dispatch browser notification safely (with in-app fallback)
  const sendBrowserNotification = (title, body) => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: config.logoUrl || undefined,
          badge: config.logoUrl || undefined,
        });
      } else {
        triggerToast(`[Stock Alert] ${title}: ${body}`);
      }
    } catch (e) {
      console.warn('Native notification failed, fallback toast:', e);
      triggerToast(`[Stock Alert] ${title}: ${body}`);
    }
  };
  // Request browser notification permission
  const handleRequestNotificationPermission = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      triggerToast('Native browser notifications are not supported in this iframe/browser.');
      return;
    }
    Notification.requestPermission()
      .then((perm) => {
        setNotificationPermission(perm);
        if (perm === 'granted') {
          triggerToast('Browser alerts enabled! You will receive push notifications for low stock & expiry.');
          sendBrowserNotification(
            `🔔 ${config.hospitalName} Alerts Activated`,
            `Stock monitor is now active. Critical reorder threshold: ${lowStockItems.length} items.`
          );
        } else {
          triggerToast('Notification permission was denied or dismissed in browser.');
        }
      })
      .catch((e) => {
        triggerToast('Unable to request permission: ' + e.message);
      });
  };
  // Trigger test alert
  const handleTestBrowserAlert = () => {
    sendBrowserNotification(
      `⚠️ [${config.hospitalName}] Stock & Expiry Check`,
      `Live Scan: ${lowStockItems.length} medicines below reorder point & ${expiring60Items.length} expiring within 60 days.`
    );
    triggerToast('Test browser notification dispatched!');
  };
  // Toggle automated browser background notifications
  const handleToggleAutoAlerts = () => {
    const nextVal = !autoBrowserAlerts;
    setAutoBrowserAlerts(nextVal);
    try {
      localStorage.setItem('ayur_auto_browser_alerts', String(nextVal));
    } catch (e) {
      console.warn(e);
    }
    triggerToast(nextVal ? 'Automated push alerts enabled' : 'Automated push alerts disabled');
  };
  // Automated scanner on mount & when inventory updates
  useEffect(() => {
    if (!autoBrowserAlerts) return;
    if (lowStockItems.length > 0 || expiring60Items.length > 0) {
      const currentSignature = `${lowStockItems.length}-${expiring60Items.length}`;
      const lastCheck = sessionStorage.getItem('ayur_last_notification_signature');
      if (lastCheck !== currentSignature) {
        sessionStorage.setItem('ayur_last_notification_signature', currentSignature);
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          const sampleMeds = lowStockItems
            .slice(0, 2)
            .map((m) => m.name)
            .join(', ');
          sendBrowserNotification(
            `⚠️ [${config.hospitalName}] Stock Warning`,
            `${lowStockItems.length} low stock medicines (${sampleMeds}...) & ${expiring60Items.length} near expiry. Reorder recommended!`
          );
        }
      }
    }
  }, [medicines.length, autoBrowserAlerts]);
  // Distinct Brands & Categories for filter tabs
  const allBrands = [
    'Kottakkal Arya Vaidya Sala',
    'Vaidyaratnam Oushadhasala',
    'Kerala Ayurveda',
    'AVP Coimbatore',
    'Baidyanath',
    'Dhootapapeshwar',
    'Dabur',
    'Himalaya Wellness',
    'Patanjali Divya',
  ];
  const allCategories = [
    'Churna',
    'Vati / Guti (Tablet)',
    'Kashaya / Kwatha',
    'Arishta',
    'Asava',
    'Guggulu',
    'Taila (Oil)',
    'Ghrita (Medicated Ghee)',
    'Rasayana / Lehya',
    'Bhasma',
    'Surgical & Kshara Sutra',
  ];
  // Filtering & Sorting
  let filtered = medicines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.classicalName && m.classicalName.toLowerCase().includes(search.toLowerCase())) ||
      m.brand.toLowerCase().includes(search.toLowerCase()) ||
      m.batchNo.toLowerCase().includes(search.toLowerCase()) ||
      m.indication.toLowerCase().includes(search.toLowerCase());
    const matchesBrand = selectedBrand === 'All' || m.brand === selectedBrand;
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    const days = getDaysToExpiry(m.expiryDate);
    const matchesAlert =
      alertFilter === 'All'
        ? true
        : alertFilter === 'LowStock'
          ? m.stock <= m.minReorderLevel
          : alertFilter === 'Expiring30'
            ? days <= 30
            : alertFilter === 'Expiring60'
              ? days <= 60
              : alertFilter === 'Expiring90'
                ? days <= 90
                : true;
    return matchesSearch && matchesBrand && matchesCategory && matchesAlert;
  });
  // Sorting
  filtered.sort((a, b) => {
    if (sortOrder === 'name_asc') return a.name.localeCompare(b.name);
    if (sortOrder === 'name_desc') return b.name.localeCompare(a.name);
    if (sortOrder === 'stock_asc') return a.stock - b.stock;
    if (sortOrder === 'stock_desc') return b.stock - a.stock;
    if (sortOrder === 'expiry_asc') {
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    }
    return 0;
  });
  // Add to POS Cart
  const handleAddToCart = (med) => {
    const existing = cart.find((c) => c.medicine.id === med.id);
    if (existing) {
      if (existing.qty < med.stock) {
        setCart(cart.map((c) => (c.medicine.id === med.id ? { ...c, qty: c.qty + 1 } : c)));
        triggerToast(`Added 1 more ${med.name} to POS cart.`);
      } else {
        triggerToast(`⚠️ Cannot add more than available inventory (${med.stock} ${med.unit})`);
      }
    } else {
      setCart([...cart, { medicine: med, qty: 1 }]);
      triggerToast(`Added ${med.name} to POS cart.`);
    }
  };
  const handleUpdateCartQty = (id, qty) => {
    if (qty <= 0) {
      setCart(cart.filter((c) => c.medicine.id !== id));
    } else {
      setCart(cart.map((c) => (c.medicine.id === id ? { ...c, qty } : c)));
    }
  };
  // Cart totals
  const cartSubTotal = cart.reduce((acc, curr) => acc + curr.medicine.sellingPrice * curr.qty, 0);
  const cartTax = Math.round(cartSubTotal * 0.05); // 5% Ayurvedic tax
  const cartGrandTotal = Math.max(0, cartSubTotal + cartTax - discountAmount);
  // Generate Pharmacy Invoice
  const handleCheckoutPOS = () => {
    if (cart.length === 0) return;
    const pat = patients.find((p) => p.id === selectedPatientId) || patients[0];
    const invoiceItems = cart.map((c, idx) => ({
      id: `pos-${idx}-${Date.now()}`,
      description: `${c.medicine.name} (${c.medicine.brand}) - Batch: ${c.medicine.batchNo}`,
      category: 'Pharmacy',
      quantity: c.qty,
      unitPrice: c.medicine.sellingPrice,
      total: c.medicine.sellingPrice * c.qty,
    }));
    const newInvoice = {
      id: `inv-pharma-${Date.now()}`,
      invoiceNumber: `PHARM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: pat.id,
      patientName: pat.name,
      uhid: pat.uhid,
      date: new Date().toISOString().split('T')[0],
      items: invoiceItems,
      subTotal: cartSubTotal,
      taxAmount: cartTax,
      discount: discountAmount,
      grandTotal: cartGrandTotal,
      paymentMode: paymentMode,
      paymentStatus: 'Paid',
      branchId: currentBranch.id,
    };
    // Deduct stock
    cart.forEach((c) => {
      const updatedMed = {
        ...c.medicine,
        stock: Math.max(0, c.medicine.stock - c.qty),
      };
      AyurStorage.updateMedicine(updatedMed);
    });
    AyurStorage.addInvoice(newInvoice);
    setGeneratedInvoice(newInvoice);
    setShowPOSInvoiceModal(true);
    setCart([]);
  };
  // Add new medicine batch
  const handleAddNewMedicine = (e) => {
    e.preventDefault();
    const newMed = {
      id: `med-${Date.now()}`,
      name: newMedName.trim(),
      classicalName: newMedClassical.trim() || undefined,
      brand: newMedBrand,
      category: newMedCategory,
      batchNo: newMedBatch.trim() || `BAT-${Math.floor(100 + Math.random() * 900)}`,
      manufacturingDate: new Date().toISOString().split('T')[0],
      expiryDate: newMedExpiry,
      stock: newMedStock,
      unit: newMedUnit,
      minReorderLevel: newMedMinStock,
      unitCost: newMedCost,
      sellingPrice: newMedSelling,
      taxPercent: newMedTax,
      indication: newMedIndication.trim() || 'General therapeutic use',
      referenceText: newMedReference.trim(),
      branchId: currentBranch.id,
    };
    AyurStorage.addMedicine(newMed);
    setShowAddModal(false);
    setNewMedName('');
    setNewMedClassical('');
    setNewMedBatch('');
  };
  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {posToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{posToast}</span>
        </div>
      )}

      {/* Module Title & Top Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <h2 className="text-xl font-serif font-black text-stone-900 flex items-center gap-2">
            <Pill className="w-5 h-5 text-amber-700" />
            Ayurvedic Pharmacy, Botanical Inventory & AI Stock Forecasting
          </h2>
          <p className="text-xs text-stone-500">
            Formulations arranged by classical brands & Ayurvedic types with automated consumption forecasting, profit
            margins, and POS counter
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-tab Switcher */}
          <div className="bg-white border border-stone-200 p-1 rounded-2xl flex items-center gap-1 shadow-card">
            <button
              onClick={() => setActivePharmaTab('inventory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePharmaTab === 'inventory'
                  ? 'bg-amber-500 text-stone-950 shadow'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              📦 Inventory & POS
            </button>
            <button
              onClick={() => setActivePharmaTab('forecasting')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePharmaTab === 'forecasting'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              📊 AI Stock Forecasting
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine Batch</span>
          </button>
        </div>
      </div>

      {/* AUTOMATED BROWSER NOTIFICATION & REORDER ALERT CENTER */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-card space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
              style={{ backgroundColor: brandColor }}
            >
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-stone-900">Automated Stock & Expiry Push Notification Monitor</h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                    notificationPermission === 'granted'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : notificationPermission === 'denied'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {notificationPermission === 'granted'
                    ? '● Browser Push Active'
                    : notificationPermission === 'denied'
                      ? '✕ Browser Alerts Blocked'
                      : '○ Permission Needed'}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Automatically pushes system alerts when botanical inventory falls below minimum reorder thresholds or
                medicines approach 30/60 day expiry dates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notificationPermission !== 'granted' ? (
              <button
                type="button"
                onClick={handleRequestNotificationPermission}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
                style={{ backgroundColor: brandColor }}
              >
                <Bell className="w-4 h-4" />
                <span>Enable Browser Alerts</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleTestBrowserAlert}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 flex items-center gap-1.5 transition-all"
              >
                <Volume2 className="w-3.5 h-3.5 text-stone-600" />
                <span>Trigger Test Alert</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleAutoAlerts}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                autoBrowserAlerts
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-stone-100 text-stone-500 border-stone-200'
              }`}
            >
              {autoBrowserAlerts ? '✓ Auto-Alerts ON' : '✕ Auto-Alerts OFF'}
            </button>
          </div>
        </div>

        {/* Live Status Indicators Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div
            onClick={() => setAlertFilter('LowStock')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              alertFilter === 'LowStock'
                ? 'border-amber-400 bg-amber-50 shadow-sm'
                : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Low Stock Reorders Due</span>
              </span>
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                {lowStockItems.length} Formulations
              </span>
            </div>
            <div className="text-[10px] text-stone-500 mt-1 line-clamp-1">
              {lowStockItems.length > 0
                ? `Critical: ${lowStockItems
                    .slice(0, 3)
                    .map((m) => m.name)
                    .join(', ')}`
                : 'All stock levels currently optimal.'}
            </div>
          </div>

          <div
            onClick={() => setAlertFilter('Expiring60')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              alertFilter === 'Expiring60'
                ? 'border-rose-400 bg-rose-50 shadow-sm'
                : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-600" />
                <span>Batches Expiring &lt; 60 Days</span>
              </span>
              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-rose-100 text-rose-900">
                {expiring60Items.length} Batches
              </span>
            </div>
            <div className="text-[10px] text-stone-500 mt-1 line-clamp-1">
              {expiring30Items.length > 0
                ? `🚨 ${expiring30Items.length} critical batches expiring within 30 days!`
                : 'Batches within normal shelf life.'}
            </div>
          </div>

          <div
            onClick={() => {
              setActivePharmaTab('forecasting');
              setShowPOModal(true);
            }}
            className="p-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer transition-all flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>1-Click Restock PO</span>
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5">Auto-generate supplier PO for low items</div>
            </div>
            <span
              className="px-2.5 py-1 text-white rounded-lg text-[10px] font-bold shadow-sm shrink-0"
              style={{ backgroundColor: brandColor }}
            >
              Generate PO →
            </span>
          </div>
        </div>
      </div>

      {/* TAB 1: BOTANICAL STOCK INVENTORY & POS COUNTER */}
      {activePharmaTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Search, Filters & Medicine Inventory (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Controls & Filter Bar */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-lg space-y-3">
              {/* Search + Sort */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search Sanskrit/English name, batch, brand, or indication..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-stone-500" />
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none"
                  >
                    <option value="name_asc">Alphabetical: A to Z</option>
                    <option value="name_desc">Alphabetical: Z to A</option>
                    <option value="expiry_asc">Expiry: Earliest First</option>
                    <option value="stock_asc">Stock: Low to High</option>
                    <option value="stock_desc">Stock: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Expiry & Low Stock Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-200/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mr-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-700" /> Alert Filters:
                </span>
                {[
                  { id: 'All', label: 'All Stock' },
                  { id: 'LowStock', label: '⚠️ Low Stock Reorders' },
                  { id: 'Expiring30', label: '🚨 Expiring < 30 Days' },
                  { id: 'Expiring60', label: '⏳ Expiring < 60 Days' },
                  { id: 'Expiring90', label: '📅 Expiring < 90 Days' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setAlertFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      alertFilter === tab.id
                        ? 'bg-amber-500 text-stone-950 shadow'
                        : 'bg-stone-50 text-stone-500 border border-stone-200 hover:text-stone-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Ayurvedic Brands Filter Carousel */}
              <div className="pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-1.5">
                  Filter by Classical Ayurvedic Brand:
                </span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  <button
                    onClick={() => setSelectedBrand('All')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all ${
                      selectedBrand === 'All'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-stone-50 text-stone-500 border border-stone-200 hover:text-stone-800'
                    }`}
                  >
                    All Brands
                  </button>
                  {allBrands.map((b) => (
                    <button
                      key={b}
                      onClick={() => setSelectedBrand(b)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 transition-all ${
                        selectedBrand === b
                          ? 'bg-emerald-700 text-white font-bold'
                          : 'bg-stone-50 text-stone-500 border border-stone-200 hover:text-stone-800'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ayurvedic Form / Type Filter Carousel */}
              <div className="pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1.5">
                  Filter by Classical Ayurvedic Type / Form:
                </span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all ${
                      selectedCategory === 'All'
                        ? 'bg-amber-600 text-white'
                        : 'bg-stone-50 text-stone-500 border border-stone-200 hover:text-stone-800'
                    }`}
                  >
                    All Types
                  </button>
                  {allCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 transition-all ${
                        selectedCategory === cat
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-stone-50 text-stone-500 border border-stone-200 hover:text-stone-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Medicine Cards List */}
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-xs shadow-card">
                  No formulations found matching current brand or filter criteria.
                </div>
              ) : (
                filtered.map((med) => {
                  const days = getDaysToExpiry(med.expiryDate);
                  const isExpiringSoon = days <= 60;
                  const isCriticalExpiry = days <= 30;
                  const isLowStock = med.stock <= med.minReorderLevel;
                  return (
                    <div
                      key={med.id}
                      className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-emerald-300 transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-stone-900 text-sm">{med.name}</span>
                          {med.classicalName && (
                            <span className="text-amber-800 font-serif text-xs font-semibold">
                              ({med.classicalName})
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {med.brand}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                            {med.category}
                          </span>
                        </div>

                        <div className="text-xs text-stone-500">
                          Indication: <span className="text-stone-700">{med.indication}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 pt-1">
                          <span>
                            Batch: <strong className="font-mono text-stone-700">{med.batchNo}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Cost:{' '}
                            <strong className="text-stone-700 font-mono">
                              ₹{med.unitCost || Math.round(med.sellingPrice * 0.72)}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            MRP: <strong className="text-amber-700 font-mono">₹{med.sellingPrice}</strong>
                          </span>
                          <span>•</span>
                          {(() => {
                            const cost = med.unitCost || Math.round(med.sellingPrice * 0.72);
                            const profit = med.sellingPrice - cost;
                            const marginPct = med.sellingPrice > 0 ? Math.round((profit / med.sellingPrice) * 100) : 0;
                            return (
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                  marginPct >= 30
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : marginPct >= 15
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                              >
                                +{profit >= 0 ? `₹${profit}` : `-₹${Math.abs(profit)}`} ({marginPct}% margin)
                              </span>
                            );
                          })()}
                          <span>•</span>
                          <span>Tax: {med.taxPercent}% GST</span>
                          {med.referenceText && (
                            <>
                              <span>•</span>
                              <span className="italic text-stone-500">Ref: {med.referenceText}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Stock & Expiration Status Badges + Quick Add */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-200">
                        {/* Expiry Badge */}
                        <div className="text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold ${
                              isCriticalExpiry
                                ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                                : isExpiringSoon
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            Exp: {med.expiryDate} ({days}d)
                          </span>
                        </div>

                        {/* Stock Level */}
                        <div>
                          <span
                            className={`text-xs font-bold ${isLowStock ? 'text-red-600 font-mono' : 'text-emerald-700 font-mono'}`}
                          >
                            Stock: {med.stock} {med.unit}
                          </span>
                          {isLowStock && (
                            <span className="block text-[10px] text-red-600 font-semibold">
                              ⚠️ Low Stock Alert (&lt;{med.minReorderLevel})
                            </span>
                          )}
                        </div>

                        {/* Add to POS Cart Button */}
                        <button
                          onClick={() => handleAddToCart(med)}
                          disabled={med.stock <= 0}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-all ${
                            med.stock > 0
                              ? 'bg-emerald-700 hover:bg-emerald-600 text-white active:scale-95'
                              : 'bg-stone-100 text-stone-500 cursor-not-allowed'
                          }`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Dispense / Bill</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Integrated Pharmacy POS Billing Counter (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-stone-200 rounded-2xl p-5 shadow-xl space-y-4 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-sm text-stone-900">Pharmacy POS Billing Counter</h3>
              </div>
              <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-mono border border-emerald-200">
                {cart.length} Items
              </span>
            </div>

            {/* Select Patient for Invoice */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Select Patient for Bill
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:outline-none"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.uhid})
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="p-6 text-center text-stone-500 text-xs bg-stone-50 rounded-xl border border-stone-200">
                  Cart is empty. Click "Dispense / Bill" on any medicine to add to counter.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.medicine.id}
                    className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex-1 pr-2">
                      <div className="font-bold text-stone-900 line-clamp-1">{item.medicine.name}</div>
                      <div className="text-[11px] text-stone-500">
                        ₹{item.medicine.sellingPrice} × {item.qty} ={' '}
                        <span className="font-mono text-amber-700 font-bold">
                          ₹{item.medicine.sellingPrice * item.qty}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUpdateCartQty(item.medicine.id, item.qty - 1)}
                        className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-900 flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-stone-900">{item.qty}</span>
                      <button
                        onClick={() => handleUpdateCartQty(item.medicine.id, item.qty + 1)}
                        className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-900 flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleUpdateCartQty(item.medicine.id, 0)}
                        className="text-stone-500 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Payment Mode Selector */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['Cash', 'UPI / QR', 'Credit / Debit Card', 'Insurance / TPA'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`py-1.5 px-2 rounded-xl text-center font-semibold transition-all ${
                      paymentMode === mode
                        ? 'bg-amber-500 text-stone-950 font-bold shadow'
                        : 'bg-stone-50 text-stone-500 border border-stone-200 hover:text-stone-800'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Discount input */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">Discount (₹):</span>
              <input
                type="number"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="w-24 bg-stone-50 border border-stone-300 rounded-lg px-2 py-1 text-right font-mono text-stone-900"
              />
            </div>

            {/* Financial Totals Box */}
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-500">
                <span>Subtotal:</span>
                <span className="font-mono text-stone-800">₹{cartSubTotal}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Ayurvedic GST (5%):</span>
                <span className="font-mono text-stone-800">₹{cartTax}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount Applied:</span>
                  <span className="font-mono">-₹{discountAmount}</span>
                </div>
              )}
              <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline">
                <span className="font-bold text-stone-900 text-sm">Grand Total:</span>
                <span className="text-lg font-mono font-black text-amber-700">₹{cartGrandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckoutPOS}
              disabled={cart.length === 0}
              className={`w-full py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-2 transition-all ${
                cart.length > 0
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white active:scale-95'
                  : 'bg-stone-100 text-stone-500 cursor-not-allowed'
              }`}
            >
              <DollarSign className="w-4 h-4 text-amber-700" />
              <span>Generate Pharmacy Invoice</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: AUTOMATED AI STOCK FORECASTING & REORDER ENGINE */}
      {activePharmaTab === 'forecasting' && (
        <div className="space-y-6">
          {/* Top Forecasting Summary Cards */}
          {(() => {
            const allForecasts = medicines.map((m) => ({ med: m, forecast: getForecastMetrics(m) }));
            const criticalItems = allForecasts.filter((f) => f.forecast.urgency === 'Critical');
            const warningItems = allForecasts.filter((f) => f.forecast.urgency === 'Warning');
            const totalSuggestedPOValue = allForecasts.reduce((sum, f) => sum + f.forecast.estimatedCost, 0);
            const totalDailyUnitsDispensed = allForecasts.reduce((sum, f) => sum + f.forecast.dailyBurnRate, 0);
            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-red-200 p-4 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                      <span>Stockout Risk (&lt; 7 Days)</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                    </div>
                    <div className="text-2xl font-black text-red-600">
                      {criticalItems.length} Formulations
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Immediate vendor purchase order required to prevent OPD stockout
                    </p>
                  </div>

                  <div className="bg-white border border-amber-200 p-4 rounded-2xl shadow-lg">
                    <div className="text-xs text-stone-500 mb-1">Reorder Alert (&lt; 14 Days)</div>
                    <div className="text-2xl font-black text-amber-700">
                      {warningItems.length} Formulations
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">Approaching classical vendor dispatch buffer</p>
                  </div>

                  <div className="bg-white border border-emerald-200 p-4 rounded-2xl shadow-lg">
                    <div className="text-xs text-stone-500 mb-1">Avg Daily Consumption</div>
                    <div className="text-2xl font-black text-emerald-700">
                      {totalDailyUnitsDispensed.toFixed(1)} units/day
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">Botanical formulation burn rate across branches</p>
                  </div>

                  <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-lg flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-stone-500 mb-1">Total Recommended PO Value</div>
                      <div className="text-2xl font-black text-stone-900">
                        ₹{totalSuggestedPOValue.toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPOModal(true)}
                      className="mt-2 w-full py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Generate Supplier PO Slip</span>
                    </button>
                  </div>
                </div>

                {/* Forecasting Table */}
                <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-700" />
                        Classical Ayurvedic Formulations: Stockout Runway & Reorder Predictions
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        Historical consumption velocity matched against classical manufacturer lead times (Kerala: 10d,
                        Local: 5d) + 7-day safety buffer
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-500">Filter Manufacturer:</span>
                      <select
                        value={selectedBrandForPO}
                        onChange={(e) => setSelectedBrandForPO(e.target.value)}
                        className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-900 focus:outline-none"
                      >
                        <option value="All">All Manufacturers ({allForecasts.length})</option>
                        {allBrands.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-3">Medicine & Brand</th>
                          <th className="py-2.5 px-3">Current Stock</th>
                          <th className="py-2.5 px-3">Daily Burn Rate</th>
                          <th className="py-2.5 px-3">Days Left</th>
                          <th className="py-2.5 px-3">Lead Time & Buffer</th>
                          <th className="py-2.5 px-3">Suggested Reorder Qty</th>
                          <th className="py-2.5 px-3">Profit Margin</th>
                          <th className="py-2.5 px-3 text-right">Est. Reorder Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {allForecasts
                          .filter((f) => selectedBrandForPO === 'All' || f.med.brand === selectedBrandForPO)
                          .sort((a, b) => a.forecast.daysRemaining - b.forecast.daysRemaining)
                          .map(({ med, forecast }) => {
                            const cost = med.unitCost || Math.round(med.sellingPrice * 0.72);
                            const profit = med.sellingPrice - cost;
                            const marginPct = med.sellingPrice > 0 ? Math.round((profit / med.sellingPrice) * 100) : 0;
                            return (
                              <tr key={med.id} className="hover:bg-stone-50 transition-colors">
                                <td className="py-3 px-3">
                                  <div className="font-bold text-stone-900">{med.name}</div>
                                  <div className="text-[10px] text-stone-500">
                                    {med.brand} • {med.category}
                                  </div>
                                </td>

                                <td className="py-3 px-3">
                                  <span className="font-mono font-bold text-stone-800">
                                    {med.stock} {med.unit}
                                  </span>
                                  <div className="text-[10px] text-stone-500">Min: {med.minReorderLevel}</div>
                                </td>

                                <td className="py-3 px-3 font-mono text-emerald-700 font-bold">
                                  {forecast.dailyBurnRate} {med.unit.split(' ')[0]}/day
                                </td>

                                <td className="py-3 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-md font-mono font-bold text-[11px] inline-block ${
                                      forecast.urgency === 'Critical'
                                        ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                                        : forecast.urgency === 'Warning'
                                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    }`}
                                  >
                                    {forecast.daysRemaining} days
                                  </span>
                                </td>

                                <td className="py-3 px-3 text-stone-500 text-[11px]">
                                  <div>Lead: {forecast.leadTimeDays}d</div>
                                  <div className="text-[10px] text-stone-500">+7d safety buffer</div>
                                </td>

                                <td className="py-3 px-3">
                                  {forecast.suggestedReorderQty > 0 ? (
                                    <span className="font-mono font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      +{forecast.suggestedReorderQty} {med.unit}
                                    </span>
                                  ) : (
                                    <span className="text-stone-500 text-[11px]">Sufficient</span>
                                  )}
                                </td>

                                <td className="py-3 px-3">
                                  <span className="text-emerald-700 font-bold text-[11px]">
                                    {marginPct}% (+₹{profit})
                                  </span>
                                </td>

                                <td className="py-3 px-3 text-right font-mono font-bold text-stone-900">
                                  {forecast.suggestedReorderQty > 0 ? (
                                    <span>₹{forecast.estimatedCost.toLocaleString()}</span>
                                  ) : (
                                    <span className="text-stone-600">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* MODAL: PURCHASE ORDER (PO) GENERATOR SLIP */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-2xl max-w-2xl w-full p-6 text-stone-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-base text-stone-900">Ayurvedic Pharmacy Purchase Order (PO)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print PO</span>
                </button>
                <button onClick={() => setShowPOModal(false)} className="text-stone-500 hover:text-stone-900 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable White PO Slip */}
            <div className="bg-white text-stone-900 p-6 rounded-xl font-sans text-xs space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="text-center border-b pb-3">
                <h4 className="font-serif font-black text-lg text-emerald-900">{config.hospitalName}</h4>
                <div className="text-[11px] text-stone-600">
                  Ayurvedic Pharmacy Procurement Wing • {currentBranch.name}
                </div>
                <div className="text-[10px] text-stone-500">
                  GSTIN: {config.gstNumber} • Ph: {currentBranch.phone} • Date: {today.toISOString().split('T')[0]}
                </div>
                <div className="mt-2 text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-50 py-1 rounded">
                  Stock Replenishment Purchase Order (Generated by AI Consumption Forecaster)
                </div>
              </div>

              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b font-bold text-stone-700 bg-stone-50">
                    <th className="py-1.5 px-2">Item Formulation</th>
                    <th className="py-1.5 px-2">Manufacturer</th>
                    <th className="py-1.5 px-2 text-center">Current Stock</th>
                    <th className="py-1.5 px-2 text-center">Suggested PO Qty</th>
                    <th className="py-1.5 px-2 text-right">Unit Buy Price</th>
                    <th className="py-1.5 px-2 text-right">Est. Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {medicines
                    .map((m) => ({ med: m, forecast: getForecastMetrics(m) }))
                    .filter(
                      (f) =>
                        f.forecast.suggestedReorderQty > 0 &&
                        (selectedBrandForPO === 'All' || f.med.brand === selectedBrandForPO)
                    )
                    .map(({ med, forecast }) => (
                      <tr key={med.id}>
                        <td className="py-1.5 px-2 font-medium">{med.name}</td>
                        <td className="py-1.5 px-2 text-stone-600">{med.brand}</td>
                        <td className="py-1.5 px-2 text-center">
                          {med.stock} {med.unit.split(' ')[0]}
                        </td>
                        <td className="py-1.5 px-2 text-center font-bold text-emerald-800">
                          {forecast.suggestedReorderQty} {med.unit}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono">₹{med.unitCost}</td>
                        <td className="py-1.5 px-2 text-right font-mono font-bold">
                          ₹{forecast.estimatedCost.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              <div className="border-t pt-3 flex justify-between items-center text-xs">
                <span className="text-stone-500 italic">Auth Signatory: _________________________</span>
                <span className="font-bold text-sm">
                  Total Order Estimate: ₹
                  {medicines
                    .map((m) => getForecastMetrics(m))
                    .filter((f) => selectedBrandForPO === 'All' || f.suggestedReorderQty > 0)
                    .reduce((sum, f) => sum + f.estimatedCost, 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowPOModal(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW MEDICINE BATCH */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-stone-300 rounded-2xl max-w-xl w-full p-6 text-stone-900 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-base text-stone-900">Add Ayurvedic Formulation / Batch</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-stone-500 hover:text-stone-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewMedicine} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Commercial Medicine Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Mahanarayana Taila"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Classical Sanskrit Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Mahanarayana Taila"
                    value={newMedClassical}
                    onChange={(e) => setNewMedClassical(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-amber-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Manufacturer / Brand</label>
                  <select
                    value={newMedBrand}
                    onChange={(e) => setNewMedBrand(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  >
                    {allBrands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Ayurvedic Form</label>
                  <select
                    value={newMedCategory}
                    onChange={(e) => setNewMedCategory(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  >
                    {allCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Batch Number</label>
                  <input
                    type="text"
                    placeholder="e.g. KOT-2026-081"
                    value={newMedBatch}
                    onChange={(e) => setNewMedBatch(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newMedExpiry}
                    onChange={(e) => setNewMedExpiry(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newMedStock}
                    onChange={(e) => setNewMedStock(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Packaging Unit</label>
                  <input
                    type="text"
                    value={newMedUnit}
                    onChange={(e) => setNewMedUnit(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Reorder Level</label>
                  <input
                    type="number"
                    min="1"
                    value={newMedMinStock}
                    onChange={(e) => setNewMedMinStock(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Cost / Buy Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newMedCost}
                    onChange={(e) => setNewMedCost(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-emerald-700 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Selling / MRP (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={newMedSelling}
                    onChange={(e) => setNewMedSelling(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-amber-700 font-bold"
                    required
                  />
                </div>
              </div>

              {/* LIVE PROFIT MARGIN INDICATOR (Directly beside pricing) */}
              {(() => {
                const profit = newMedSelling - newMedCost;
                const marginPct = newMedSelling > 0 ? ((profit / newMedSelling) * 100).toFixed(1) : '0';
                const markupPct = newMedCost > 0 ? ((profit / newMedCost) * 100).toFixed(1) : '0';
                const totalBatchProfit = profit * newMedStock;
                const isHealthy = profit > 0 && Number(marginPct) >= 25;
                const isHigh = Number(marginPct) >= 35;
                const isLoss = profit <= 0;
                return (
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      isLoss
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : isHigh
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-amber-50 border-amber-300 text-amber-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-stone-800">
                        <Tag className="w-3.5 h-3.5 text-amber-700" />
                        Live Profit Margin & Commercial Potential:
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isLoss
                            ? 'bg-red-100 text-red-200'
                            : isHigh
                              ? 'bg-emerald-700 text-white font-extrabold'
                              : 'bg-amber-700 text-stone-950 font-bold'
                        }`}
                      >
                        {isLoss ? '⚠️ Negative Margin' : isHigh ? '★ High Margin Product' : '✓ Standard Margin'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-stone-50 p-2 rounded-lg border border-stone-200">
                        <div className="text-[10px] text-stone-500">Net Profit / Unit</div>
                        <div
                          className={`font-mono font-bold text-sm ${profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}
                        >
                          {profit >= 0 ? `+₹${profit}` : `-₹${Math.abs(profit)}`}
                        </div>
                      </div>

                      <div className="bg-stone-50 p-2 rounded-lg border border-stone-200">
                        <div className="text-[10px] text-stone-500">Profit Margin %</div>
                        <div
                          className={`font-mono font-bold text-sm ${Number(marginPct) >= 20 ? 'text-emerald-700' : 'text-amber-700'}`}
                        >
                          {marginPct}%
                        </div>
                      </div>

                      <div className="bg-stone-50 p-2 rounded-lg border border-stone-200">
                        <div className="text-[10px] text-stone-500">Markup on Cost</div>
                        <div className="font-mono font-bold text-sm text-stone-800">{markupPct}%</div>
                      </div>

                      <div className="bg-stone-50 p-2 rounded-lg border border-stone-200">
                        <div className="text-[10px] text-stone-500">
                          Batch Profit ({newMedStock} {newMedUnit})
                        </div>
                        <div className="font-mono font-bold text-sm text-amber-700">
                          ₹{totalBatchProfit.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Clinical Indications & Rogadhikara</label>
                <input
                  type="text"
                  placeholder="e.g. Joint pain, Vatavyadhi, Sandhigata Vata"
                  value={newMedIndication}
                  onChange={(e) => setNewMedIndication(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold shadow"
                >
                  Save to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: POS PRINTABLE INVOICE RECEIPT */}
      {showPOSInvoiceModal && generatedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-2xl max-w-xl w-full p-6 text-stone-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <h3 className="font-bold text-base text-stone-900">Pharmacy Bill Receipt Generated</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Bill</span>
                </button>
                <button onClick={() => setShowPOSInvoiceModal(false)} className="text-stone-500 hover:text-stone-900 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Bill Slip White Box */}
            <div className="bg-white text-stone-900 p-6 rounded-xl font-sans text-xs space-y-4">
              <div className="text-center border-b pb-3">
                <h4 className="font-serif font-black text-lg text-emerald-900">{config.hospitalName}</h4>
                <div className="text-[11px] text-stone-600">
                  {currentBranch.name} • {currentBranch.city}
                </div>
                <div className="text-[10px] text-stone-500">
                  GSTIN: {config.gstNumber} • Ph: {currentBranch.phone}
                </div>
              </div>

              <div className="flex justify-between text-[11px] bg-stone-50 p-2 rounded">
                <div>
                  <strong>Bill No: {generatedInvoice.invoiceNumber}</strong>
                  <br />
                  <span>Date: {generatedInvoice.date}</span>
                </div>
                <div className="text-right">
                  <strong>Patient: {generatedInvoice.patientName}</strong>
                  <br />
                  <span>UHID: {generatedInvoice.uhid}</span>
                </div>
              </div>

              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b font-bold text-stone-700">
                    <th className="py-1">Item & Brand</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Price</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {generatedInvoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-1.5 font-medium">{item.description}</td>
                      <td className="py-1.5 text-center font-bold">{item.quantity}</td>
                      <td className="py-1.5 text-right font-mono">₹{item.unitPrice}</td>
                      <td className="py-1.5 text-right font-mono font-bold">₹{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-2 border-t space-y-1 text-right text-[11px]">
                <div>
                  Subtotal: <strong className="font-mono">₹{generatedInvoice.subTotal}</strong>
                </div>
                <div>
                  Ayurvedic GST (5%): <strong className="font-mono">₹{generatedInvoice.taxAmount}</strong>
                </div>
                <div className="text-sm font-bold text-emerald-900 pt-1 border-t">
                  Grand Total Paid ({generatedInvoice.paymentMode}):{' '}
                  <strong className="font-mono">₹{generatedInvoice.grandTotal}</strong>
                </div>
              </div>

              <div className="text-center text-[10px] text-stone-500 pt-3 border-t">
                Medicines once sold cannot be returned. Authentic classical Ayurvedic pharmacy.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
