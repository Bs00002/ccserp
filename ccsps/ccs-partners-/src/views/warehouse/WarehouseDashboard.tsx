import React from 'react';
import { Order } from '../../types';

interface WarehouseDashboardProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onNavigateToOrders: (filterTab: 'ready' | 'dispatched') => void;
}

export const WarehouseDashboard: React.FC<WarehouseDashboardProps> = ({
  orders,
  onSelectOrder,
  onNavigateToOrders,
}) => {
  const readyToDispatchOrders = orders.filter(o => o.status === 'Ready to Dispatch');
  const dispatchedOrders = orders.filter(o => o.status === 'Dispatched' || o.status === 'Delivered');
  const totalLrGenerated = orders.filter(o => !!o.lrNumber || o.status === 'Dispatched' || o.status === 'Delivered').length;
  const dispatchInProgressCount = orders.filter(o => o.status === 'Ready to Dispatch' || o.status === 'Bilty Uploaded').length;

  return (
    <div className="space-y-6 font-body text-xs">
      {/* Header Banner */}
      <div className="bg-[#0f172a] text-white p-6 shadow-sm border border-[#1e293b] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-[#38bdf8]">warehouse</span>
            <h1 className="text-xl font-bold tracking-tight">Warehouse Dispatch Command Center</h1>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1">
            Physical order fulfillment, LR number generation, vehicle dispatch & transit logs.
          </p>
        </div>
        <button
          onClick={() => onNavigateToOrders('ready')}
          className="bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold px-4 py-2 text-xs cursor-pointer transition flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">local_shipping</span>
          <span>View Dispatch Queue ({readyToDispatchOrders.length})</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ready to Dispatch */}
        <div
          onClick={() => onNavigateToOrders('ready')}
          className="bg-white border border-[#e2e8f0] p-4 hover:border-[#0284c7] cursor-pointer transition shadow-2xs group"
        >
          <div className="flex justify-between items-center text-[#64748b] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">1. Ready to Dispatch</span>
            <span className="material-symbols-outlined text-[20px] text-[#0284c7] group-hover:scale-110 transition-transform">
              pending_actions
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#0f172a]">{readyToDispatchOrders.length}</div>
          <div className="text-[11px] text-[#0284c7] font-semibold mt-1 flex items-center gap-1">
            <span>Orders awaiting Warehouse LR</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </div>
        </div>

        {/* KPI 2: Dispatch In Progress */}
        <div
          onClick={() => onNavigateToOrders('ready')}
          className="bg-white border border-[#e2e8f0] p-4 hover:border-[#eab308] cursor-pointer transition shadow-2xs group"
        >
          <div className="flex justify-between items-center text-[#64748b] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">2. Dispatch In Progress</span>
            <span className="material-symbols-outlined text-[20px] text-[#ca8a04] group-hover:scale-110 transition-transform">
              forklift
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#0f172a]">{dispatchInProgressCount}</div>
          <div className="text-[11px] text-[#ca8a04] font-semibold mt-1">
            <span>Prepared at depot / office</span>
          </div>
        </div>

        {/* KPI 3: Dispatched */}
        <div
          onClick={() => onNavigateToOrders('dispatched')}
          className="bg-white border border-[#e2e8f0] p-4 hover:border-[#16a34a] cursor-pointer transition shadow-2xs group"
        >
          <div className="flex justify-between items-center text-[#64748b] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">3. Dispatched</span>
            <span className="material-symbols-outlined text-[20px] text-[#16a34a] group-hover:scale-110 transition-transform">
              local_shipping
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#0f172a]">{dispatchedOrders.length}</div>
          <div className="text-[11px] text-[#16a34a] font-semibold mt-1 flex items-center gap-1">
            <span>View dispatched history</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </div>
        </div>

        {/* KPI 4: Total LR Generated */}
        <div
          onClick={() => onNavigateToOrders('dispatched')}
          className="bg-white border border-[#e2e8f0] p-4 hover:border-[#475569] cursor-pointer transition shadow-2xs group"
        >
          <div className="flex justify-between items-center text-[#64748b] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">4. Total LR Generated</span>
            <span className="material-symbols-outlined text-[20px] text-[#475569] group-hover:scale-110 transition-transform">
              receipt_long
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#0f172a]">{totalLrGenerated}</div>
          <div className="text-[11px] text-[#475569] font-semibold mt-1">
            <span>Verified LR Transport Records</span>
          </div>
        </div>
      </div>

      {/* Ready for Dispatch Priority Table */}
      <div className="bg-white border border-[#e2e8f0] shadow-2xs">
        <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#0284c7] rounded-full animate-pulse" />
            <h2 className="font-bold text-xs text-[#0f172a] uppercase tracking-wider">
              High Priority Dispatch Queue (Ready to Dispatch)
            </h2>
          </div>
          <button
            onClick={() => onNavigateToOrders('ready')}
            className="text-[11px] text-[#0284c7] hover:underline font-bold"
          >
            View All ({readyToDispatchOrders.length})
          </button>
        </div>

        {readyToDispatchOrders.length === 0 ? (
          <div className="p-8 text-center text-[#64748b] space-y-2">
            <span className="material-symbols-outlined text-[36px] text-[#cbd5e1]">task_alt</span>
            <p className="font-semibold">No pending orders in Ready to Dispatch status.</p>
            <p className="text-[11px]">New orders handed over by Office will automatically appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#f1f5f9] text-[#475569] border-b border-[#e2e8f0] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 font-bold">Order ID</th>
                  <th className="p-3 font-bold">Date</th>
                  <th className="p-3 font-bold">Employee</th>
                  <th className="p-3 font-bold">Distributor</th>
                  <th className="p-3 font-bold">Bilty No.</th>
                  <th className="p-3 font-bold text-right">Grand Total</th>
                  <th className="p-3 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {readyToDispatchOrders.slice(0, 5).map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="p-3 font-bold text-[#0284c7]">{ord.orderNumber || ord.id}</td>
                    <td className="p-3 text-[#475569]">{ord.date}</td>
                    <td className="p-3 font-medium text-[#0f172a]">{ord.createdByName || 'Sales Employee'}</td>
                    <td className="p-3 font-bold text-[#0f172a]">{ord.dealerName}</td>
                    <td className="p-3 text-[#0f172a] font-mono">{ord.biltyNumber || 'BILTY-OK'}</td>
                    <td className="p-3 text-right font-bold text-[#0f172a]">₹{ord.grandTotal.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => onSelectOrder(ord)}
                        className="bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold px-3 py-1 text-[11px] cursor-pointer shadow-2xs transition"
                      >
                        Process Dispatch
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
