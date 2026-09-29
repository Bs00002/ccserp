import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

interface AdminOrdersProps {
  orders?: Order[];
  onSelectOrder?: (order: Order) => void;
  onCreateOrder?: () => void;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({
  orders = [],
  onSelectOrder,
  onCreateOrder,
  onUpdateStatus,
}) => {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const filteredOrders = (orders || []).filter((o) => {
    const s = (search || '').toLowerCase();
    const matchesSearch =
      (o.orderNumber || '').toLowerCase().includes(s) ||
      (o.dealerName || '').toLowerCase().includes(s) ||
      (o.dealerCode || '').toLowerCase().includes(s);

    const matchesStatus = selectedStatus === 'ALL' || o.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e0e0e0] pb-4">
        <div>
          <h1 className="text-2xl font-light text-[#161616]">Order Management</h1>
          <p className="text-xs text-[#525252] mt-0.5">
            Manage company-wide B2B orders, dispatch approvals, invoices, and shipment tracking
          </p>
        </div>
        <button onClick={onCreateOrder} className="carbon-btn-primary text-xs h-9 px-4 cursor-pointer">
          <span className="material-symbols-outlined text-[16px] mr-1.5">add</span> Create New Order
        </button>
      </div>

      {/* Filter & Controls Bar */}
      <div className="bg-white p-4 border border-[#e0e0e0] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#525252] text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by Order ID, Dealer Name, Code..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#f4f4f4] border border-[#e0e0e0] text-xs text-[#161616] focus:outline-none focus:border-[#0f62fe]"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {['ALL', 'Pending Approval', 'Approved', 'Bilty Uploaded', 'Ready to Dispatch', 'Dispatched', 'Delivered', 'Rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 text-xs font-semibold whitespace-nowrap cursor-pointer border ${
                  selectedStatus === st
                    ? 'bg-[#0f62fe] text-white border-[#0f62fe]'
                    : 'bg-[#f4f4f4] text-[#525252] border-[#e0e0e0] hover:bg-[#e0e0e0]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => alert('Exporting Orders to Excel...')}
          className="carbon-btn-ghost text-xs h-8 px-3 border border-[#0f62fe] bg-white cursor-pointer self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[16px] mr-1.5">download</span> Export Excel
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[#e0e0e0] overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#f4f4f4] text-[#525252] border-b border-[#e0e0e0] uppercase text-[11px] tracking-wider">
            <tr>
              <th className="p-3 font-semibold">Order ID</th>
              <th className="p-3 font-semibold">Date</th>
              <th className="p-3 font-semibold">Distributor Name</th>
              <th className="p-3 font-semibold">Created By</th>
              <th className="p-3 font-semibold text-right">Items</th>
              <th className="p-3 font-semibold text-right">Amount</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Payment</th>
              <th className="p-3 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e0e0e0]">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-[#8d8d8d]">
                  No orders found matching search criteria.
                </td>
              </tr>
            ) : (
              filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[#f4f4f4] transition-colors">
                  <td
                    onClick={() => onSelectOrder && onSelectOrder(ord)}
                    className="p-3 font-bold text-[#0f62fe] cursor-pointer hover:underline"
                  >
                    {ord.orderNumber}
                  </td>
                  <td className="p-3 text-[#525252]">{ord.date}</td>
                  <td className="p-3">
                    <div className="font-bold text-[#161616]">{ord.dealerName}</div>
                    <div className="text-[10px] text-[#525252]">{ord.dealerCode} • {ord.dealerCity}</div>
                  </td>
                  <td className="p-3 text-[#525252]">{ord.distributorName}</td>
                  <td className="p-3 text-right font-medium">{(ord.items || []).length} SKUs</td>
                  <td className="p-3 text-right font-bold text-[#161616]">
                    ₹{(ord.grandTotal || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={ord.status} />
                  </td>
                  <td className="p-3">
                    <StatusBadge status={ord.paymentStatus} />
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onSelectOrder && onSelectOrder(ord)}
                        className="p-1 text-[#0f62fe] hover:bg-[#e5f0ff] cursor-pointer"
                        title="View Order Invoice & Detail"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                      <select
                        value={ord.status}
                        onChange={(e) => onUpdateStatus && onUpdateStatus(ord.id, e.target.value as OrderStatus)}
                        className="bg-[#f4f4f4] border border-[#e0e0e0] text-[10px] font-semibold text-[#161616] p-1 focus:outline-none"
                      >
                        <option value="Pending Approval">Pending Approval</option>
                        <option value="Approved">Approved</option>
                        <option value="Bilty Uploaded">Bilty Uploaded</option>
                        <option value="Ready to Dispatch">Ready to Dispatch</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
