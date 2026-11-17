import React from 'react';
import { TrendingUp, Building2, BarChart3, PieChart, ArrowUpRight } from 'lucide-react';
export const AnalyticsView = ({ invoices, patients, medicines, camps, branches, currentBranch }) => {
  // Aggregate revenue across all invoices
  const totalRevenue = invoices.reduce((acc, curr) => acc + curr.grandTotal, 0);
  // Departmental breakdown
  let opdRevenue = 0;
  let panchakarmaRevenue = 0;
  let pharmacyRevenue = 0;
  let ipdRevenue = 0;
  let labRevenue = 0;
  invoices.forEach((inv) => {
    inv.items.forEach((item) => {
      if (item.category === 'Consultation') opdRevenue += item.total;
      else if (item.category === 'Panchakarma') panchakarmaRevenue += item.total;
      else if (item.category === 'Pharmacy') pharmacyRevenue += item.total;
      else if (item.category === 'IPD Room') ipdRevenue += item.total;
      else if (item.category === 'Lab Tests') labRevenue += item.total;
    });
  });
  // Branch breakdown
  const branchRevenueMap = {};
  branches.forEach((b) => {
    branchRevenueMap[b.name] = invoices
      .filter((i) => i.branchId === b.id)
      .reduce((sum, curr) => sum + curr.grandTotal, 0);
  });
  // Patient Acquisition Source breakdown
  const sourceCounts = {
    'Medical Outreach Camps': 0,
    'Google & Meta Online Ads': 0,
    'Doctor & Hospital Referrals': 0,
    'Direct Walk-ins': 0,
  };
  patients.forEach((p) => {
    if (p.referredBy?.includes('Camp')) sourceCounts['Medical Outreach Camps']++;
    else if (p.referredBy?.includes('Ads') || p.referredBy?.includes('Google'))
      sourceCounts['Google & Meta Online Ads']++;
    else if (p.referredBy?.includes('Referral')) sourceCounts['Doctor & Hospital Referrals']++;
    else sourceCounts['Direct Walk-ins']++;
  });
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <h2 className="text-xl font-serif font-black text-stone-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-700" />
            Hospital Financial Analytics & Executive KPI Dashboard
          </h2>
          <p className="text-xs text-stone-500">
            Real-time revenue metrics, departmental yields, Panchakarma ROI, and multi-branch performance
          </p>
        </div>

        <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200 font-mono font-bold">
          All-Branch Consolidated View
        </span>
      </div>

      {/* Top Level Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-card">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
            Total Hospital Collections
          </span>
          <div className="text-2xl font-bold text-emerald-700">₹{totalRevenue.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +18.4% vs last quarter
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-card">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
            Panchakarma Department Yield
          </span>
          <div className="text-2xl font-bold text-amber-700">₹{panchakarmaRevenue.toLocaleString()}</div>
          <div className="text-[11px] text-stone-500 mt-1">High-margin core therapy courses</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-card">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
            Ayurvedic Pharmacy Turnover
          </span>
          <div className="text-2xl font-bold text-indigo-700">₹{pharmacyRevenue.toLocaleString()}</div>
          <div className="text-[11px] text-stone-500 mt-1">Across 9 authentic brands</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-card">
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block mb-1">
            IPD Room & Cottage Yield
          </span>
          <div className="text-2xl font-bold text-purple-700">₹{ipdRevenue.toLocaleString()}</div>
          <div className="text-[11px] text-stone-500 mt-1">Deluxe cottage admissions</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Revenue Breakdown */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div>
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-700" />
                Revenue Share by Clinical Department
              </h3>
              <p className="text-xs text-stone-500">
                Contribution of therapies, medicines, consultations, and cottages
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Panchakarma Therapies', amount: panchakarmaRevenue, color: 'bg-amber-500' },
              { label: 'IPD Cottage Admissions', amount: ipdRevenue, color: 'bg-purple-500' },
              { label: 'Ayurvedic Pharmacy Sales', amount: pharmacyRevenue, color: 'bg-indigo-500' },
              { label: 'OPD Consultations & Nadi Pariksha', amount: opdRevenue, color: 'bg-emerald-500' },
              { label: 'Pathology & Diagnostic Tests', amount: labRevenue, color: 'bg-blue-500' },
            ].map((d, idx) => {
              const safeTotal = Math.max(totalRevenue, 1);
              const pct = Math.round((d.amount / safeTotal) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-700 font-semibold">{d.label}</span>
                    <span className="font-mono text-stone-900 font-bold">
                      ₹{d.amount.toLocaleString()} <span className="text-stone-500 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`${d.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Branch-by-Branch Performance */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div>
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-700" />
                Branch-by-Branch Hospital Collections
              </h3>
              <p className="text-xs text-stone-500">Centralized comparison of regional units</p>
            </div>
          </div>

          <div className="space-y-3">
            {branches.map((b) => {
              const rev = branchRevenueMap[b.name] || 0;
              const safeTotal = Math.max(totalRevenue, 1);
              const pct = Math.round((rev / safeTotal) * 100);
              return (
                <div key={b.id} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-stone-900">{b.name}</span>
                      <div className="text-[11px] text-stone-500">
                        {b.city} • Beds: {b.bedCapacity}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-emerald-700">₹{rev.toLocaleString()}</span>
                      <span className="text-[10px] text-stone-500 block">{pct}% of network</span>
                    </div>
                  </div>

                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.max(pct, 5)}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Patient Acquisition Funnel Sources */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-lg space-y-4">
        <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
          <PieChart className="w-4 h-4 text-purple-700" />
          Patient Acquisition Channels & Medical Camp Effectiveness
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Object.entries(sourceCounts).map(([src, count]) => {
            const pct = Math.round((count / Math.max(patients.length, 1)) * 100);
            return (
              <div key={src} className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-center">
                <span className="text-[11px] font-bold text-stone-500 block mb-1">{src}</span>
                <div className="text-2xl font-bold font-serif text-amber-700">{count}</div>
                <div className="text-xs text-emerald-700 font-mono mt-0.5">{pct}% of registrations</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
