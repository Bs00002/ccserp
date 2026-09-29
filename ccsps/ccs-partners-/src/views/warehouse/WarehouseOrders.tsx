import React, { useState } from 'react';
import { Order } from '../../types';

interface WarehouseOrdersProps {
  orders: Order[];
  initialMode?: 'ready' | 'dispatched';
  onSelectOrder: (order: Order) => void;
}

export const WarehouseOrders: React.FC<WarehouseOrdersProps> = ({
  orders,
  initialMode = 'ready',
  onSelectOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'ready' | 'dispatched'>(initialMode);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter orders by active queue & search query
  const filteredOrders = orders.filter((ord) => {
    // Mode Filter
    if (activeTab === 'ready') {
      if (ord.status !== 'Ready to Dispatch') return false;
    } else {
      if (ord.status !== 'Dispatched' && ord.status !== 'Delivered') return false;
    }

    // Search query filter (Order ID, Distributor, Employee, Bilty Number, LR Number)
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const orderId = (ord.orderNumber || ord.id).toLowerCase();
    const dist = (ord.dealerName || '').toLowerCase();
    const emp = (ord.createdByName || '').toLowerCase();
    const bilty = (ord.biltyNumber || '').toLowerCase();
    const lr = (ord.lrNumber || '').toLowerCase();
    const transporter = (ord.transporter || '').toLowerCase();

    return (
      orderId.includes(q) ||
      dist.includes(q) ||
      emp.includes(q) ||
      bilty.includes(q) ||
      lr.includes(q) ||
      transporter.includes(q)
    );
  });

  return (
    <div className="space-y-4 font-body text-xs">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 border border-[#e2e8f0] shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-[#0f172a]">Warehouse Fulfillment & Logistics Orders</h1>
          <p className="text-xs text-[#64748b] mt-0.5">
            Process Ready-to-Dispatch queue and search historical LR transportation records
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-[#f1f5f9] p-1 border border-[#e2e8f0] rounded-md">
          <button
            onClick={() => setActiveTab('ready')}
            className={`px-3 py-1.5 font-bold text-xs cursor-pointer transition rounded-sm flex items-center gap-1.5 ${
              activeTab === 'ready'
                ? 'bg-[#0284c7] text-white shadow-2xs'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">pending_actions</span>
            <span>Ready to Dispatch ({orders.filter(o => o.status === 'Ready to Dispatch').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('dispatched')}
            className={`px-3 py-1.5 font-bold text-xs cursor-pointer transition rounded-sm flex items-center gap-1.5 ${
              activeTab === 'dispatched'
                ? 'bg-[#16a34a] text-white shadow-2xs'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">local_shipping</span>
            <span>Dispatched / LR Records ({orders.filter(o => o.status === 'Dispatched' || o.status === 'Delivered').length})</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="bg-white p-3 border border-[#e2e8f0] shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#94a3b8] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Order ID, Distributor, Employee, Bilty or LR..."
            className="w-full pl-9 pr-3 py-2 border border-[#cbd5e1] text-xs bg-[#f8fafc] focus:bg-white focus:outline-none focus:border-[#0284c7] rounded-md"
          />
        </div>

        <div className="text-[11px] text-[#64748b] font-medium">
          Showing <strong>{filteredOrders.length}</strong> {activeTab === 'ready' ? 'Ready to Dispatch' : 'Dispatched'} records
        </div>
      </div>

      {/* Main Orders Table */}
      <div className="bg-white border border-[#e2e8f0] shadow-2xs overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#f8fafc] text-[#475569] border-b border-[#e2e8f0] uppercase text-[10px] tracking-wider font-bold">
            <tr>
              <th className="p-3">Order ID</th>
              <th className="p-3">Order Date</th>
              <th className="p-3">Employee</th>
              <th className="p-3">Distributor</th>
              <th className="p-3">Products / Items</th>
              <th className="p-3 text-center">Qty</th>
              <th className="p-3 text-right">Order Amount</th>
              <th className="p-3">Payment Term</th>
              {activeTab === 'ready' ? (
                <>
                  <th className="p-3">Bilty Number</th>
                  <th className="p-3">Bilty Date</th>
                </>
              ) : (
                <>
                  <th className="p-3">LR Number</th>
                  <th className="p-3">Transporter</th>
                </>
              )}
              <th className="p-3">Status</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-8 text-center text-[#64748b]">
                  <span className="material-symbols-outlined text-[32px] text-[#cbd5e1] block mb-1">
                    search_off
                  </span>
                  <p className="font-semibold text-xs">No matching orders found.</p>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">
                    {activeTab === 'ready'
                      ? 'No orders are currently waiting for Warehouse dispatch.'
                      : 'No dispatched LR history matches your search query.'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredOrders.map((ord) => {
                const totalQty = ord.items.reduce((acc, i) => acc + i.quantity, 0);
                const itemsSummary = ord.items.map(i => `${i.productName} (${i.quantity})`).join(', ');

                return (
                  <tr key={ord.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="p-3 font-bold text-[#0284c7]">{ord.orderNumber || ord.id}</td>
                    <td className="p-3 text-[#475569]">{ord.date}</td>
                    <td className="p-3 font-medium text-[#0f172a]">{ord.createdByName || 'Employee User'}</td>
                    <td className="p-3 font-bold text-[#0f172a]">{ord.dealerName}</td>
                    <td className="p-3 text-[#475569] max-w-xs truncate" title={itemsSummary}>
                      {ord.items[0]?.productName || 'Crop Protection Product'}
                      {ord.items.length > 1 && ` +${ord.items.length - 1} more`}
                    </td>
                    <td className="p-3 text-center font-bold text-[#0f172a]">{totalQty}</td>
                    <td className="p-3 text-right font-bold text-[#0f172a]">
                      ₹{ord.grandTotal.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-[#475569]">{ord.paymentTerms || 'Cash (15 Days)'}</td>

                    {activeTab === 'ready' ? (
                      <>
                        <td className="p-3 font-mono font-bold text-[#0f172a]">{ord.biltyNumber || 'BILTY-001'}</td>
                        <td className="p-3 text-[#475569]">{ord.biltyDate?.split('T')[0] || ord.date}</td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 font-mono font-bold text-[#16a34a]">{ord.lrNumber || 'LR-VRL-99210'}</td>
                        <td className="p-3 text-[#475569]">{ord.transporter || 'VRL Express Freight'}</td>
                      </>
                    )}

                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${
                          ord.status === 'Ready to Dispatch'
                            ? 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]'
                            : ord.status === 'Dispatched'
                            ? 'bg-[#dcfce7] text-[#15803d] border-[#86efac]'
                            : 'bg-[#f1f5f9] text-[#475569] border-[#cbd5e1]'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => onSelectOrder(ord)}
                        className={`font-bold px-3 py-1 text-[11px] cursor-pointer shadow-2xs transition rounded ${
                          activeTab === 'ready'
                            ? 'bg-[#0284c7] hover:bg-[#0369a1] text-white'
                            : 'bg-white hover:bg-[#f1f5f9] text-[#0f172a] border border-[#cbd5e1]'
                        }`}
                      >
                        {activeTab === 'ready' ? 'Process Dispatch' : 'View Order & LR'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
