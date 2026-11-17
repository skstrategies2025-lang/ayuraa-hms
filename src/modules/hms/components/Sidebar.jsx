import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileSignature,
  Sparkles,
  Pill,
  Receipt,
  UserCheck2,
  Tent,
  FileText,
  CalendarClock,
  UserCheck,
  TrendingUp,
  Settings,
  PhoneCall,
  Utensils,
  Activity,
  BedDouble,
} from 'lucide-react';
import { LotusMark } from '@/modules/auth/components/Logo';
import { getImageUrl } from '../../../common/index'; // wherever common.js lives

/**
 * Menu of the HMS portal, grouped like the Super Admin sidebar.
 * `id` is the tab id used by the route (/hms/:tab); `badge` is the key of a live counter in `badgeCounts`.
 */
export const HMS_NAV = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', label: 'Hospital Dashboard', icon: LayoutDashboard },
      { id: 'financial_analytics', label: 'Financial Analytics', icon: TrendingUp },
    ],
  },
  {
    title: 'Clinical Care',
    items: [
      { id: 'patients', label: 'Patient Records & EMR', icon: Users },
      { id: 'ipd', label: 'Inpatient (IPD)', icon: BedDouble, badge: 'admittedPatients' },
      { id: 'prescriptions', label: 'Rx & Note Templates', icon: FileSignature },
      { id: 'diet_charts', label: 'Diet & Pathya Charts', icon: Utensils },
      { id: 'panchakarma', label: 'Panchakarma Dept', icon: Sparkles, badge: 'activePanchakarma' },
      { id: 'follow_up_central', label: 'Follow-Up Central', icon: PhoneCall, badge: 'todayFollowUps' },
    ],
  },
  {
    title: 'Pharmacy & Billing',
    items: [
      { id: 'pharmacy', label: 'Ayurvedic Pharmacy', icon: Pill, badge: 'expiringMedicines', alert: true },
      { id: 'billing', label: 'Billing & Insurance', icon: Receipt },
    ],
  },
  {
    title: 'Patient Engagement',
    items: [
      { id: 'appointments', label: 'Appointments & SMS', icon: CalendarClock, badge: 'todayAppointments' },
      { id: 'clinic_crm', label: 'Clinic Patient CRM', icon: UserCheck2, badge: 'newClinicLeads' },
      { id: 'camps_crm', label: 'Medical Camps', icon: Tent, badge: 'pendingCampLeads' },
      { id: 'pamphlets', label: 'Pamphlet Studio', icon: FileText },
    ],
  },
  {
    title: 'Administration',
    items: [
      { id: 'staff_payroll', label: 'Staff & Attendance', icon: UserCheck },
      { id: 'settings', label: 'Clinic & Branding', icon: Settings },
    ],
  },
];

/** Every screen id, in menu order. */
export const ALL_TAB_IDS = HMS_NAV.flatMap((s) => s.items.map((i) => i.id));

/** Title of a tab, used by the top bar breadcrumb. */
export const hmsTabLabel = (id) =>
  HMS_NAV.flatMap((s) => s.items).find((i) => i.id === id)?.label || 'Hospital Dashboard';

const SidebarView = ({ activeTab, onTabChange, config, badgeCounts = {}, onNavigate, collapsed = false }) => {
  const go = (id) => {
    // Don't re-navigate when clicking the already-active menu
    if (id === activeTab) {
      onNavigate?.(); // still close the mobile drawer
      return;
    }
    onTabChange?.(id); // change only the selected screen — no reload, no remount
    onNavigate?.(); // close mobile sidebar if needed
  };

  return (
    <div
      style={{
        backgroundImage:
          'linear-gradient(to bottom, rgb(var(--brand-800)), rgb(var(--brand-900)), rgb(var(--brand-950)))',
      }}
      className={`flex h-full max-h-[100dvh] min-h-0 flex-col pb-[max(1rem,env(safe-area-inset-bottom))] pt-5 ${
        collapsed ? 'px-2' : 'px-3.5'
      }`}
    >
      {/* Brand */}
      {collapsed ? (
        <div className="flex justify-center" title="AYURAAURAA">
          <LotusMark size={36} gold />
        </div>
      ) : (
        <div className="px-1.5">
          <div className="flex items-center gap-3">
            <LotusMark size={38} gold />
            <div className="leading-tight">
              <div className="text-[19px] font-bold tracking-[0.1em] text-white">AYURAAURAA</div>
              <div className="text-[10.5px] tracking-wide text-brand-200">Ancient Wisdom. Better Health.</div>
            </div>
          </div>
        </div>
      )}

      {/* Hospital identity */}
      <div
        className={`mt-5 flex items-center rounded-xl border border-white/10 bg-white/5 ${
          collapsed ? 'justify-center px-0 py-2' : 'gap-3 px-3 py-2.5'
        }`}
        title={collapsed ? config.hospitalName : undefined}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-saffron-400 text-[12px] font-extrabold text-brand-950">
          {config.logoUrl ? (
            <img src={getImageUrl(config.logoUrl)} alt="Logo" className="h-full w-full object-contain bg-white" />
          ) : (
            'AA'
          )}
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13px] font-semibold text-white">{config.hospitalName}</p>
            <p className="truncate text-[11px] text-brand-200/80">Hospital Management System</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        aria-label="HMS screens"
        className="scroll-slim mt-5 min-h-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden overscroll-contain pr-0.5"
      >
        {HMS_NAV.map((section, sIdx) => (
          <div key={section.title}>
            {collapsed ? (
              sIdx > 0 && <div className="mx-3 border-t border-white/10" />
            ) : (
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-saffron-400">
                {section.title}
              </p>
            )}
            <ul className={`space-y-0.5 ${collapsed ? 'mt-3' : 'mt-1.5'}`}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                const count = item.badge ? badgeCounts[item.badge] : 0;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => go(item.id)}
                      aria-current={active ? 'page' : undefined}
                      aria-label={item.label}
                      title={collapsed ? item.label : undefined}
                      className={`relative flex w-full items-center rounded-lg py-2.5 text-left text-[13px] font-medium transition-colors lg:py-2 ${
                        collapsed ? 'justify-center px-0' : 'gap-3 px-3'
                      } ${
                        active
                          ? 'bg-white/10 text-white ring-1 ring-white/15'
                          : 'text-brand-100/90 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className={collapsed ? 'h-5 w-5 shrink-0' : 'h-[18px] w-[18px] shrink-0'} strokeWidth={1.75} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {count > 0 &&
                        (collapsed ? (
                          <span
                            className={`absolute right-1.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9.5px] font-bold leading-none ${
                              item.alert ? 'bg-saffron-400 text-brand-950' : 'bg-emerald-400 text-brand-950'
                            }`}
                          >
                            {count > 99 ? '99+' : count}
                          </span>
                        ) : (
                          <span
                            className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              item.alert ? 'bg-saffron-400 text-brand-950' : 'bg-white/10 text-brand-100'
                            }`}
                          >
                            {count}
                          </span>
                        ))}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Status */}
      {collapsed ? (
        <div className="mt-3 flex justify-center py-2" title="System Online">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
      ) : (
        <div className="mt-3 hidden rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 [@media(min-height:640px)]:block">
          <div className="flex items-center justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold text-white">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> System Online
              </p>
              <p className="mt-0.5 text-[11px] text-brand-200/70">All services running smoothly</p>
            </div>
            <Activity className="h-5 w-5 text-brand-300/70" />
          </div>
        </div>
      )}
    </div>
  );
};

// Re-renders only when its props really change (active tab, brand, badge numbers, collapsed)
export const Sidebar = React.memo(SidebarView);