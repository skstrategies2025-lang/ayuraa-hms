import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Bell,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  LogOut,
  Menu,
  Pill,
  Plus,
  Search,
  X,
  Building2,
} from 'lucide-react';
import { hmsTabLabel } from './Sidebar';

const initialsOf = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'U';

const prettyRole = (role = '') =>
  role
    .replace('hms_', '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Staff';

export const Header = ({
  config,
  currentBranch,
  branches,
  onSelectBranch,
  onNavigate,
  onMenu,
  sidebarCollapsed = false,
  onToggleSidebar,
  activeTab,
  medicines,
  patients,
  onOpenNewPatient,
  user,
  staffRole,
  onLogout,
  canWrite = { patients: true, prescriptions: true },
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const searchRef = useRef(null);

  const today = new Date();
  const alertThresholdDays = 60;

  // Calculate expiry alerts
  const expiringMedicines = medicines.filter((m) => {
    const exp = new Date(m.expiryDate);
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= alertThresholdDays;
  });

  // Calculate low-stock alerts
  const lowStockMedicines = medicines.filter(
    (m) => m.stock <= m.minReorderLevel
  );

  const totalAlerts =
    expiringMedicines.length + lowStockMedicines.length;

  // Ctrl/Cmd + K focuses search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener('keydown', onKey);

    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Search logic
  const q = searchQuery.trim().toLowerCase();

  const filteredPatients = q
    ? patients.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.uhid.toLowerCase().includes(q) ||
          p.phone.includes(searchQuery.trim())
      )
    : [];

  const filteredMeds = q
    ? medicines.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.classicalName &&
            m.classicalName.toLowerCase().includes(q)) ||
          m.brand.toLowerCase().includes(q) ||
          m.indication.toLowerCase().includes(q)
      )
    : [];

  const brandColor = config.themeColor || '#0f6240';
  const pageTitle = hmsTabLabel(activeTab);
  const userName = user?.name || 'User';

  return (
    <header className="sticky top-0 z-30 border-b border-[#e3ede7] bg-white">
      <div className="flex items-center gap-3 px-4 py-3 lg:px-6">

        {/* Mobile Menu */}
        <button
          onClick={onMenu}
          aria-label="Open menu"
          className="rounded-lg border border-brand-100 p-2 text-brand-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop: collapse / expand the sidebar (icons stay visible when collapsed) */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-100 bg-white text-brand-800 shadow-sm transition-colors hover:bg-brand-50 lg:flex"
        >
          {sidebarCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
        </button>

        {/* Breadcrumb */}
        <p className="hidden shrink-0 text-[15px] text-slate-500 sm:block">
          {config.hospitalName ? 'Hospital' : 'HMS'}
          <span className="mx-1.5 text-slate-300">/</span>

          <button
            onClick={() => onNavigate(activeTab)}
            className="font-bold text-brand-900 hover:underline"
          >
            {pageTitle}
          </button>
        </p>

        {/* Global Search */}
        <div className="relative mx-auto hidden w-full max-w-[520px] md:block">
          <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-brand-700" />

          <input
            ref={searchRef}
            type="text"
            placeholder="Search UHID, patient, phone or medicine..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="w-full rounded-xl border border-[#dbe7df] bg-white py-2.5 pl-10 pr-20 text-sm outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />

          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-[#dbe7df] bg-[#f5f9f6] px-2 py-0.5 text-[11px] font-medium text-slate-500">
              Ctrl&nbsp;&nbsp;K
            </kbd>
          )}

          {/* Quick Search Results */}
          {showSearchResults && searchQuery.trim() && (
            <div
              className="absolute left-0 right-0 z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-[#dbe7df] bg-white text-xs text-stone-900 shadow-xl"
              onMouseLeave={() => setShowSearchResults(false)}
            >
              <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 p-2.5 text-[11px] font-semibold text-stone-500">
                <span>Search results for "{searchQuery}"</span>

                <button
                  onClick={() => setShowSearchResults(false)}
                  className="hover:text-stone-900"
                >
                  Close
                </button>
              </div>

              {/* Patients */}
              {filteredPatients.length > 0 && (
                <div className="p-2">
                  <div className="mb-1 px-2 text-[10px] font-bold uppercase text-stone-400">
                    Patients ({filteredPatients.length})
                  </div>

                  {filteredPatients.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setShowSearchResults(false);
                        onNavigate('patients');
                      }}
                      className="flex cursor-pointer items-center justify-between rounded-xl p-2 transition-colors hover:bg-stone-50"
                    >
                      <div>
                        <div className="font-semibold text-stone-900">
                          {p.name}
                          <span className="font-mono text-[11px] text-stone-500">
                            {' '}({p.uhid})
                          </span>
                        </div>

                        <div className="text-[11px] text-stone-500">
                          {p.phone} · Prakriti: {p.prakriti} · {p.primaryCondition}
                        </div>
                      </div>

                      <span
                        className="rounded-lg px-2 py-0.5 text-[10px] font-medium text-white"
                        style={{ backgroundColor: brandColor }}
                      >
                        View EMR
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Medicines */}
              {filteredMeds.length > 0 && (
                <div className="border-t border-stone-100 p-2">
                  <div className="mb-1 px-2 text-[10px] font-bold uppercase text-stone-400">
                    Medicines ({filteredMeds.length})
                  </div>

                  {filteredMeds.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => {
                        setShowSearchResults(false);
                        onNavigate('pharmacy');
                      }}
                      className="flex cursor-pointer items-center justify-between rounded-xl p-2 transition-colors hover:bg-stone-50"
                    >
                      <div>
                        <div className="font-semibold text-stone-900">
                          {m.name}
                          {m.classicalName && (
                            <span className="text-stone-500">
                              {' '}({m.classicalName})
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-stone-500">
                          {m.brand} · {m.category} · Stock:{' '}
                          <span
                            className={
                              m.stock <= m.minReorderLevel
                                ? 'font-bold text-red-600'
                                : 'text-stone-800'
                            }
                          >
                            {m.stock} {m.unit}
                          </span>
                        </div>
                      </div>

                      <span className="rounded-lg bg-stone-100 px-2 py-0.5 text-[10px] text-stone-700">
                        Pharmacy
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* No Results */}
              {filteredPatients.length === 0 &&
                filteredMeds.length === 0 && (
                  <div className="p-6 text-center text-stone-400">
                    No matching patients or medicines found.
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Right Side */}
        <div className="ml-auto flex items-center gap-2.5 md:ml-0">

          {/* Branch Switcher */}
          <div className="hidden items-center gap-2 rounded-xl border border-[#dbe7df] px-3 py-2 text-xs xl:flex">
            <Building2 className="h-4 w-4 shrink-0 text-brand-700" />

            <select
              value={currentBranch?.id || ''}
              onChange={(e) => onSelectBranch(e.target.value)}
              aria-label="Branch"
              className="max-w-[170px] cursor-pointer truncate bg-transparent pr-1 text-[13px] font-bold text-brand-900 focus:outline-none"
            >
              {branches.map((b) => (
                <option
                  key={b.id}
                  value={b.id}
                  className="text-stone-900"
                >
                  {b.name} ({b.city})
                </option>
              ))}
            </select>
          </div>

          {/* Notifications */}
          <button
            onClick={() => setShowAlertModal(true)}
            title="View urgent expiry & stock alerts"
            aria-label="Notifications"
            className="relative rounded-xl border border-[#dbe7df] p-2.5 text-brand-800 hover:bg-brand-50"
          >
            <Bell className="h-[18px] w-[18px]" />

            {totalAlerts > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {totalAlerts}
              </span>
            )}
          </button>

          {/* New Patient */}
          <button
            onClick={onOpenNewPatient}
            style={
              !canWrite.patients
                ? { display: 'none' }
                : { backgroundColor: brandColor }
            }
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>New Patient</span>
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 hover:bg-brand-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-900 text-xs font-bold text-white ring-2 ring-brand-100">
                {initialsOf(userName)}
              </span>

              <span className="hidden text-left leading-tight xl:block">
                <span className="block max-w-[140px] truncate text-[14px] font-bold text-brand-900">
                  {userName}
                </span>

                <span className="block text-[12px] text-slate-500">
                  {prettyRole(staffRole)}
                </span>
              </span>

              <ChevronDown className="hidden h-4 w-4 text-slate-500 xl:block" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />

                <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-[#dbe7df] bg-white p-1.5 shadow-xl">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onNavigate('settings');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-brand-50"
                  >
                    Clinic & Branding
                  </button>

                  <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pharmacy Alerts Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-6 text-stone-900 shadow-2xl">

            {/* Modal Header */}
            <div className="mb-4 flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="font-serif text-base font-bold text-stone-900">
                    Pharmacy Expiry & Reorder Alerts
                  </h3>

                  <p className="text-xs text-stone-500">
                    Expiring within 60 days or below safety threshold
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAlertModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Alert Content */}
            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">

              {/* Expiring Medicines */}
              {expiringMedicines.length > 0 && (
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-700">
                    <Clock className="h-3.5 w-3.5" />
                    Expiring Soon ({expiringMedicines.length} batches)
                  </h4>

                  <div className="space-y-2">
                    {expiringMedicines.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-2xl border border-red-200/80 bg-red-50/70 p-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-stone-900">
                            {m.name}
                          </div>

                          <div className="text-[11px] text-stone-500">
                            {m.brand} · Batch: {m.batchNo}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono font-bold text-red-700">
                            Expires: {m.expiryDate}
                          </div>

                          <div className="text-[11px] text-stone-500">
                            Stock: {m.stock} {m.unit}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Low Stock Medicines */}
              {lowStockMedicines.length > 0 && (
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
                    <Pill className="h-3.5 w-3.5" />
                    Low Stock Threshold ({lowStockMedicines.length} formulations)
                  </h4>

                  <div className="space-y-2">
                    {lowStockMedicines.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-stone-900">
                            {m.name}
                          </div>

                          <div className="text-[11px] text-stone-500">
                            {m.brand} · Form: {m.category}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-amber-800">
                            Only {m.stock} {m.unit} left
                          </div>

                          <div className="text-[11px] text-stone-500">
                            Min: {m.minReorderLevel}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Alerts */}
              {totalAlerts === 0 && (
                <div className="py-8 text-center text-xs text-stone-400">
                  All pharmacy inventory levels and expiration dates are optimal.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-5 flex justify-end gap-2 border-t border-stone-100 pt-3">
              <button
                onClick={() => {
                  setShowAlertModal(false);
                  onNavigate('pharmacy');
                }}
                className="rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-all"
                style={{ backgroundColor: brandColor }}
              >
                Go to Pharmacy Inventory
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};