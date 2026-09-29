import React, { useState } from 'react';
import { User } from '../../types';

interface MonthlySalesPlanViewProps {
  currentUser?: User;
}

interface SalesPlanItem {
  id: string;
  category: string;
  monthlyTarget: number;
  achieved: number;
  targetUnits: number;
  achievedUnits: number;
  status: 'On Track' | 'Achieved' | 'Behind' | 'Exceeded';
}

export const MonthlySalesPlanView: React.FC<MonthlySalesPlanViewProps> = ({ currentUser }) => {
  const [selectedMonth, setSelectedMonth] = useState('Current Month (September 2026)');

  const [planItems] = useState<SalesPlanItem[]>([
    {
      id: 'sp-1',
      category: 'Speciality Fertilizers & Nutrients',
      monthlyTarget: 1200000,
      achieved: 980000,
      targetUnits: 450,
      achievedUnits: 380,
      status: 'On Track',
    },
    {
      id: 'sp-2',
      category: 'Insecticides & Crop Protection',
      monthlyTarget: 850000,
      achieved: 910000,
      targetUnits: 320,
      achievedUnits: 345,
      status: 'Exceeded',
    },
    {
      id: 'sp-3',
      category: 'Bio-Fungicides & Soil Enhancers',
      monthlyTarget: 600000,
      achieved: 420000,
      targetUnits: 200,
      achievedUnits: 140,
      status: 'Behind',
    },
    {
      id: 'sp-4',
      category: 'Plant Growth Regulators (PGR)',
      monthlyTarget: 450000,
      achieved: 460000,
      targetUnits: 150,
      achievedUnits: 155,
      status: 'Achieved',
    },
    {
      id: 'sp-5',
      category: 'Hybrid Seeds & Treatment',
      monthlyTarget: 400000,
      achieved: 290000,
      targetUnits: 180,
      achievedUnits: 130,
      status: 'Behind',
    },
  ]);

  const totalTarget = planItems.reduce((s, i) => s + i.monthlyTarget, 0);
  const totalAchieved = planItems.reduce((s, i) => s + i.achieved, 0);
  const totalPercentage = Math.round((totalAchieved / totalTarget) * 100);

  const getStatusBadge = (status: SalesPlanItem['status']) => {
    switch (status) {
      case 'Exceeded':
        return 'bg-[#dcfce7] text-[#15803d] border-[#86efac]';
      case 'Achieved':
        return 'bg-[#e0f2fe] text-[#0369a1] border-[#7dd3fc]';
      case 'On Track':
        return 'bg-[#fef9c3] text-[#a16207] border-[#fde047]';
      case 'Behind':
        return 'bg-[#fee2e2] text-[#b91c1c] border-[#fca5a5]';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="space-y-6 font-body text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#14532d]">Monthly Sales Plan</h1>
            <span className="px-2 py-0.5 bg-[#dcfce7] text-[#14532d] font-bold text-[10px] border border-[#86efac] rounded uppercase">
              SALES TARGET
            </span>
          </div>
          <p className="text-xs text-[#64748b] mt-0.5">
            Planned monthly sales target, product category allocations, and progress metrics for {currentUser?.name || 'Sales Officer'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 bg-white border border-[#cbd5e1] rounded-md text-xs font-semibold text-[#0f172a] focus:outline-none focus:border-[#16a34a]"
          >
            <option>Current Month (September 2026)</option>
            <option>August 2026</option>
            <option>July 2026</option>
            <option>Q2 Target Overview</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#e2e8f0] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748b] uppercase">Monthly Sales Plan</span>
            <span className="material-symbols-outlined text-[#16a34a] text-xl">trending_up</span>
          </div>
          <p className="text-xl font-bold text-[#0f172a] mt-2">₹{(totalTarget).toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-[#64748b]">Total targeted sales value</span>
        </div>

        <div className="p-4 bg-white border border-[#e2e8f0] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748b] uppercase">Achieved Sales</span>
            <span className="material-symbols-outlined text-[#0284c7] text-xl">check_circle</span>
          </div>
          <p className="text-xl font-bold text-[#0f172a] mt-2">₹{(totalAchieved).toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-[#16a34a] font-bold">{totalPercentage}% of monthly plan reached</span>
        </div>

        <div className="p-4 bg-white border border-[#e2e8f0] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748b] uppercase">Gap to Plan</span>
            <span className="material-symbols-outlined text-[#dc2626] text-xl">pending</span>
          </div>
          <p className="text-xl font-bold text-[#dc2626] mt-2">₹{(Math.max(0, totalTarget - totalAchieved)).toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-[#64748b]">Remaining target this cycle</span>
        </div>

        <div className="p-4 bg-white border border-[#e2e8f0] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748b] uppercase">Run-Rate Required</span>
            <span className="material-symbols-outlined text-[#d97706] text-xl">speed</span>
          </div>
          <p className="text-xl font-bold text-[#0f172a] mt-2">₹{Math.round((totalTarget - totalAchieved) / 23).toLocaleString('en-IN')}/day</p>
          <span className="text-[10px] text-[#64748b]">Based on 23 field working days</span>
        </div>
      </div>

      {/* Plan Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#e2e8f0] flex justify-between items-center bg-[#f8fafc]">
          <h2 className="font-bold text-sm text-[#0f172a]">Category-Wise Monthly Sales Targets</h2>
          <span className="text-xs text-[#64748b]">5 Active Categories</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#f8fafc] text-[#64748b] border-b border-[#e2e8f0] uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="p-3">Product Category</th>
                <th className="p-3 text-right">Target Units</th>
                <th className="p-3 text-right">Achieved Units</th>
                <th className="p-3 text-right">Monthly Sales Plan</th>
                <th className="p-3 text-right">Sales Achieved</th>
                <th className="p-3 text-center min-w-[140px]">Progress</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {planItems.map((item) => {
                const pct = Math.round((item.achieved / item.monthlyTarget) * 100);
                return (
                  <tr key={item.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="p-3 font-bold text-[#0f172a]">{item.category}</td>
                    <td className="p-3 text-right text-[#475569]">{item.targetUnits} Cases</td>
                    <td className="p-3 text-right font-semibold text-[#0f172a]">{item.achievedUnits} Cases</td>
                    <td className="p-3 text-right font-bold text-[#14532d]">
                      ₹{item.monthlyTarget.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right font-bold text-[#0f172a]">
                      ₹{item.achieved.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#e2e8f0] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct >= 100 ? 'bg-[#16a34a]' : pct >= 80 ? 'bg-[#0284c7]' : 'bg-[#eab308]'
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[#475569] w-8 text-right">{pct}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
