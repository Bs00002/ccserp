import React, { useState } from 'react';
import { User } from '../../types';

interface MonthlyCollectionPlanViewProps {
  currentUser?: User;
}

interface CollectionPlanItem {
  id: string;
  distributorName: string;
  territory: string;
  plannedRecovery: number;
  collectedAmount: number;
  paymentMode: 'Cheque' | 'NEFT/RTGS' | 'UPI' | 'Direct Deposit';
  dueDate: string;
  status: 'Collected' | 'In Process' | 'Pending';
}

export const MonthlyCollectionPlanView: React.FC<MonthlyCollectionPlanViewProps> = ({ currentUser }) => {
  const [selectedMonth, setSelectedMonth] = useState('Current Month (September 2026)');

  const [collectionPlans] = useState<CollectionPlanItem[]>([
    {
      id: 'cp-1',
      distributorName: 'Chitra Sales Corporation',
      territory: 'Pune Market Yard',
      plannedRecovery: 450000,
      collectedAmount: 450000,
      paymentMode: 'NEFT/RTGS',
      dueDate: '10 Sep 2026',
      status: 'Collected',
    },
    {
      id: 'cp-2',
      distributorName: 'Swastik Agri Distributors',
      territory: 'Vidarbha Central',
      plannedRecovery: 600000,
      collectedAmount: 420000,
      paymentMode: 'Cheque',
      dueDate: '15 Sep 2026',
      status: 'In Process',
    },
    {
      id: 'cp-3',
      distributorName: 'Kisan Seva Agri Center',
      territory: 'Nashik Agro Zone',
      plannedRecovery: 350000,
      collectedAmount: 350000,
      paymentMode: 'UPI',
      dueDate: '08 Sep 2026',
      status: 'Collected',
    },
    {
      id: 'cp-4',
      distributorName: 'Marathwada Fertilizers Depot',
      territory: 'Aurangabad East',
      plannedRecovery: 500000,
      collectedAmount: 200000,
      paymentMode: 'Direct Deposit',
      dueDate: '22 Sep 2026',
      status: 'In Process',
    },
    {
      id: 'cp-5',
      distributorName: 'Jay Kisan Agro Agency',
      territory: 'Kolhapur South',
      plannedRecovery: 300000,
      collectedAmount: 0,
      paymentMode: 'Cheque',
      dueDate: '28 Sep 2026',
      status: 'Pending',
    },
  ]);

  const totalPlanned = collectionPlans.reduce((s, i) => s + i.plannedRecovery, 0);
  const totalCollected = collectionPlans.reduce((s, i) => s + i.collectedAmount, 0);
  const totalRemaining = totalPlanned - totalCollected;
  const collectionEfficiency = Math.round((totalCollected / totalPlanned) * 100);

  const getStatusBadge = (status: CollectionPlanItem['status']) => {
    switch (status) {
      case 'Collected':
        return 'bg-[#dcfce7] text-[#15803d] border-[#86efac]';
      case 'In Process':
        return 'bg-[#e0f2fe] text-[#0369a1] border-[#7dd3fc]';
      case 'Pending':
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
            <h1 className="text-xl font-bold text-[#14532d]">Monthly Collection Plan</h1>
            <span className="px-2 py-0.5 bg-[#dcfce7] text-[#14532d] font-bold text-[10px] border border-[#86efac] rounded uppercase">
              RECOVERY TARGET
            </span>
          </div>
          <p className="text-xs text-[#64748b] mt-0.5">
            Planned monthly payment collections, overdue recoveries, and distributor ledger receivables for {currentUser?.name || 'Sales Officer'}
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
            <option>Q2 Receivables Summary</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#e2e8f0] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748b] uppercase">Monthly Collection Plan</span>
            <span className="material-symbols-outlined text-[#16a34a] text-xl">payments</span>
          </div>
          <p className="text-xl font-bold text-[#0f172a] mt-2">₹{totalPlanned.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-[#64748b]">Total planned recovery target</span>
        </div>

        <div className="p-4 bg-white border border-[#e2e8f0] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748b] uppercase">Total Collected</span>
            <span className="material-symbols-outlined text-[#0284c7] text-xl">account_balance</span>
          </div>
          <p className="text-xl font-bold text-[#0f172a] mt-2">₹{totalCollected.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-[#16a34a] font-bold">{collectionEfficiency}% recovery efficiency</span>
        </div>

        <div className="p-4 bg-white border border-[#e2e8f0] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748b] uppercase">Pending Recovery</span>
            <span className="material-symbols-outlined text-[#dc2626] text-xl">hourglass_top</span>
          </div>
          <p className="text-xl font-bold text-[#dc2626] mt-2">₹{totalRemaining.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-[#64748b]">Balance to collect before month-end</span>
        </div>

        <div className="p-4 bg-white border border-[#e2e8f0] rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748b] uppercase">Efficiency Status</span>
            <span className="material-symbols-outlined text-[#16a34a] text-xl">verified</span>
          </div>
          <p className="text-xl font-bold text-[#14532d] mt-2">{collectionEfficiency}%</p>
          <span className="text-[10px] text-[#64748b]">On track against credit terms</span>
        </div>
      </div>

      {/* Plan Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#e2e8f0] flex justify-between items-center bg-[#f8fafc]">
          <h2 className="font-bold text-sm text-[#0f172a]">Distributor Payment Collection Schedule</h2>
          <span className="text-xs text-[#64748b]">5 Assigned Accounts</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#f8fafc] text-[#64748b] border-b border-[#e2e8f0] uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="p-3">Distributor Account</th>
                <th className="p-3">Territory</th>
                <th className="p-3 text-right">Monthly Collection Plan</th>
                <th className="p-3 text-right">Collected Amount</th>
                <th className="p-3 text-right">Balance Due</th>
                <th className="p-3">Payment Mode</th>
                <th className="p-3">Target Due Date</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {collectionPlans.map((item) => {
                const bal = Math.max(0, item.plannedRecovery - item.collectedAmount);
                return (
                  <tr key={item.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="p-3 font-bold text-[#0f172a]">{item.distributorName}</td>
                    <td className="p-3 text-[#64748b]">{item.territory}</td>
                    <td className="p-3 text-right font-bold text-[#14532d]">
                      ₹{item.plannedRecovery.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right font-bold text-[#16a34a]">
                      ₹{item.collectedAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right font-bold text-[#dc2626]">
                      ₹{bal.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-[#475569] font-medium">{item.paymentMode}</td>
                    <td className="p-3 text-[#64748b]">{item.dueDate}</td>
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
