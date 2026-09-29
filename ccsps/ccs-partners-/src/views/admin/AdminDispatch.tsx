import React, { useState } from 'react';
import { Order } from '../../types';

interface AdminDispatchProps {
  orders: Order[];
  onSelectOrder?: (order: Order) => void;
  onGenerateLr?: (orderId: string, lrNumber: string, transporter: string) => void;
}

export const AdminDispatch: React.FC<AdminDispatchProps> = ({ orders = [], onSelectOrder, onGenerateLr }) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Ready' | 'Dispatched' | 'Delivered'>('All');
  const [selectedOrderForLr, setSelectedOrderForLr] = useState<Order | null>(null);
  const [lrNumber, setLrNumber] = useState('');
  const [transporter, setTransporter] = useState('VRL Logistics Ltd');

  const dispatchOrders = (orders || []).filter((o) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Ready') return o.status === 'Ready to Dispatch';
    if (activeTab === 'Dispatched') return o.status === 'Dispatched' || o.status === 'In Transit';
    if (activeTab === 'Delivered') return o.status === 'Delivered';
    return true;
  });

  const handleGenerateLrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForLr || !lrNumber) return;

    if (selectedOrderForLr.status !== 'Ready to Dispatch') {
      alert("LR Generation is LOCKED! The order must be in 'Ready to Dispatch' status.");
      return;
    }

    if (onGenerateLr) {
      onGenerateLr(selectedOrderForLr.id, lrNumber, transporter);
    }
    setSelectedOrderForLr(null);
    setLrNumber('');
  };

  return (
    <div className="space-y-6 font-body text-xs">
      {/* Header Banner */}
      <div className="bg-white border border-[#e2e8f0] p-5 rounded-lg shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#14532d] tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-[#16a34a]">local_shipping</span>
            Warehouse Dispatch & LR Management
          </h1>
          <p className="text-xs text-[#64748b] mt-0.5">
            Warehouse Portal: Generate LR Receipts only for orders marked <strong>Ready to Dispatch</strong> by Office.
          </p>
        </div>

        {/* Filters */}
        <div className="flex bg-[#f1f5f9] p-1 rounded-lg border border-[#cbd5e1] overflow-x-auto">
          {(['All', 'Ready', 'Dispatched', 'Delivered'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md font-bold text-xs whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab ? 'bg-[#16a34a] text-white shadow-xs' : 'text-[#475569] hover:text-[#0f172a]'
              }`}
            >
              {tab === 'Ready' ? 'Ready to Dispatch' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Dispatch Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#f8fafc] text-[#475569] border-b border-[#e2e8f0] uppercase text-[11px] tracking-wider">
              <tr>
                <th className="p-3.5 font-bold">Order Ref</th>
                <th className="p-3.5 font-bold">Dealer</th>
                <th className="p-3.5 font-bold">Destination</th>
                <th className="p-3.5 font-bold">Transporter Agency</th>
                <th className="p-3.5 font-bold font-mono">LR Number</th>
                <th className="p-3.5 font-bold">Status</th>
                <th className="p-3.5 font-bold text-center">Warehouse LR Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {dispatchOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#64748b]">
                    No dispatch records found for selection.
                  </td>
                </tr>
              ) : (
                dispatchOrders.map((ord) => {
                  const isReadyToDispatch = ord.status === 'Ready to Dispatch';
                  const isDispatched = ord.status === 'Dispatched' || ord.status === 'Delivered';

                  return (
                    <tr key={ord.id} className="hover:bg-[#f0fdf4] transition-colors">
                      <td
                        onClick={() => onSelectOrder && onSelectOrder(ord)}
                        className="p-3.5 font-mono font-bold text-[#16a34a] cursor-pointer hover:underline"
                      >
                        {ord.orderNumber}
                      </td>
                      <td className="p-3.5 font-bold text-[#0f172a]">{ord.dealerName}</td>
                      <td className="p-3.5 text-[#475569]">{ord.dealerCity}</td>
                      <td className="p-3.5 font-semibold text-[#334155]">{ord.transporter || 'Pending Assignment'}</td>
                      <td className="p-3.5 font-mono text-[#15803d] font-bold">
                        {ord.lrNumber || (isDispatched ? 'LR-8899102' : '--')}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 font-bold text-[10px] border rounded-full ${
                            isReadyToDispatch
                              ? 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]'
                              : isDispatched
                              ? 'bg-[#dcfce7] text-[#14532d] border-[#86efac]'
                              : 'bg-[#f1f5f9] text-[#64748b] border-[#cbd5e1]'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        {isReadyToDispatch ? (
                          <button
                            onClick={() => {
                              setSelectedOrderForLr(ord);
                              setLrNumber(`LR-VRL-${Math.floor(10000 + Math.random() * 90000)}`);
                            }}
                            className="px-3 py-1 bg-[#8a3800] hover:bg-[#6e2c00] text-white font-bold text-xs rounded-none cursor-pointer flex items-center justify-center gap-1 mx-auto"
                          >
                            <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                            Generate LR
                          </button>
                        ) : isDispatched ? (
                          <span className="text-xs font-bold text-[#16a34a] flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">task_alt</span>
                            LR Generated
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-[#64748b] bg-[#f1f5f9] px-2 py-1 rounded border border-[#cbd5e1] inline-flex items-center gap-1 cursor-not-allowed">
                            <span>🔒 Locked</span>
                            <span className="hidden lg:inline">(Needs Ready to Dispatch)</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warehouse Generate LR Modal */}
      {selectedOrderForLr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#e0e0e0] w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-2">
              <h3 className="text-sm font-bold text-[#161616] uppercase">
                Generate Warehouse LR ({selectedOrderForLr.orderNumber})
              </h3>
              <button onClick={() => setSelectedOrderForLr(null)} className="text-gray-500 hover:text-black">
                ✕
              </button>
            </div>

            <div className="p-2.5 bg-[#fef3c7] border border-[#fde68a] text-[#92400e] text-xs font-bold">
              ✔ Verified: Order is in 'Ready to Dispatch' stage. You may generate the LR.
            </div>

            <form onSubmit={handleGenerateLrSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#525252] mb-1">LR Number / Receipt Code</label>
                <input
                  type="text"
                  required
                  value={lrNumber}
                  onChange={(e) => setLrNumber(e.target.value)}
                  placeholder="e.g. LR-VRL-99210"
                  className="w-full p-2 border border-[#e0e0e0] bg-[#f4f4f4] text-xs font-medium focus:outline-none focus:border-[#0f62fe]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#525252] mb-1">Transporter / Transport Partner</label>
                <input
                  type="text"
                  required
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                  placeholder="e.g. VRL Freight / TCI Express"
                  className="w-full p-2 border border-[#e0e0e0] bg-[#f4f4f4] text-xs font-medium focus:outline-none focus:border-[#0f62fe]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e0e0e0]">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForLr(null)}
                  className="px-3 py-1.5 border border-[#e0e0e0] text-[#161616]"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#8a3800] text-white font-bold cursor-pointer">
                  Generate LR & Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
