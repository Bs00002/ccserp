import React from 'react';
import type { Distributor } from '../../types/stitchTypes';
import { StatusBadge } from '../../components/common/StatusBadge';

interface AdminDistributorsProps {
  distributors?: Distributor[];
  onAddDistributor?: (distributor: any) => void;
}

export const AdminDistributors: React.FC<AdminDistributorsProps> = ({ distributors = [] }) => {
  return (
    <div className="space-y-6 font-body text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e0e0e0] pb-4">
        <div>
          <h1 className="text-2xl font-light text-[#161616]">Distributor Network</h1>
          <p className="text-xs text-[#525252] mt-0.5">
            Territory distributors, regional sales depots, assigned dealer networks, and monthly turnover
          </p>
        </div>
        <button
          onClick={() => alert('Add Distributor form opened')}
          className="px-4 py-1.5 text-xs font-bold bg-[#0f62fe] text-white hover:bg-[#0043ce] cursor-pointer"
        >
          + Add Distributor
        </button>
      </div>

      {/* Distributor Table */}
      <div className="bg-white border border-[#e0e0e0] overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#f4f4f4] text-[#525252] border-b border-[#e0e0e0] uppercase text-[11px] tracking-wider">
            <tr>
              <th className="p-3 font-semibold">Distributor Code</th>
              <th className="p-3 font-semibold">Distributor Name</th>
              <th className="p-3 font-semibold">Owner Name</th>
              <th className="p-3 font-semibold">Territory</th>
              <th className="p-3 font-semibold text-center">Dealers</th>
              <th className="p-3 font-semibold text-right">Monthly Sales</th>
              <th className="p-3 font-semibold text-right">Monthly Sales Plan</th>
              <th className="p-3 font-semibold text-right">Monthly Collection Plan</th>
              <th className="p-3 font-semibold text-right">Outstanding</th>
              <th className="p-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e0e0e0]">
            {(distributors || []).map((d) => (
              <tr key={d.id} className="hover:bg-[#f4f4f4]">
                <td className="p-3 font-bold text-[#0f62fe]">{d.code}</td>
                <td className="p-3 font-bold text-[#161616]">{d.name}</td>
                <td className="p-3 text-[#525252]">{d.ownerName}</td>
                <td className="p-3 text-[#525252]">{d.territory}</td>
                <td className="p-3 text-center font-bold text-[#161616]">{d.dealersCount}</td>
                <td className="p-3 text-right font-bold text-[#198038]">
                  ₹{(d.monthlySales || 0).toLocaleString('en-IN')}
                </td>
                <td className="p-3 text-right font-bold text-[#0f62fe]">
                  ₹{(d.monthlySalesPlan || 0).toLocaleString('en-IN')}
                </td>
                <td className="p-3 text-right font-bold text-[#8a3ffc]">
                  ₹{(d.monthlyCollectionPlan || 0).toLocaleString('en-IN')}
                </td>
                <td className="p-3 text-right font-bold text-[#da1e28]">
                  ₹{(d.outstandingBalance || 0).toLocaleString('en-IN')}
                </td>
                <td className="p-3">
                  <StatusBadge status={d.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
