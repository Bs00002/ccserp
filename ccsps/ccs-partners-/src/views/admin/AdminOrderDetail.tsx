import React, { useState } from 'react';
import { Order, OrderStatus, User } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { OrderTimeline } from '../../components/common/OrderTimeline';

interface AdminOrderDetailProps {
  order?: Order | null;
  currentUser?: User | null;
  onBack?: () => void;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void;
  onUploadBilty?: (orderId: string, biltyNumber: string, biltyFileName?: string) => void;
  onMarkReadyDispatch?: (orderId: string) => void;
  onGenerateLr?: (orderId: string, lrNumber: string, transporter: string) => void;
}

export const AdminOrderDetail: React.FC<AdminOrderDetailProps> = ({
  order,
  currentUser,
  onBack,
  onUpdateStatus,
  onUploadBilty,
  onMarkReadyDispatch,
  onGenerateLr,
}) => {
  const [showBiltyModal, setShowBiltyModal] = useState(false);
  const [biltyNumber, setBiltyNumber] = useState('');
  const [biltyFileName, setBiltyFileName] = useState('');

  const [showLrModal, setShowLrModal] = useState(false);
  const [lrNumber, setLrNumber] = useState('');
  const [transporter, setTransporter] = useState('VRL Logistics Freight');

  if (!order) {
    return (
      <div className="p-8 text-center text-[#525252]">
        <p className="mb-4 text-sm font-semibold">No order selected or order details unavailable.</p>
        <button onClick={onBack} className="carbon-btn-primary text-xs h-8 px-4 cursor-pointer">
          Go Back
        </button>
      </div>
    );
  }

  const items = order.items || [];
  const subtotal = order.subtotal || 0;
  const discount = order.discount || 0;
  const tax = order.tax || 0;
  const grandTotal = order.grandTotal || 0;

  // Role checks for restricted Bilty & LR document visibility
  const isAdmin = !currentUser || currentUser.role === 'ADMIN';
  const isEmployee = currentUser?.role === 'DISTRIBUTOR'; // Sales / Employee role
  const isDealer = currentUser?.role === 'DEALER';

  const handleBiltySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!biltyNumber) return;
    if (onUploadBilty) {
      onUploadBilty(order.id, biltyNumber, biltyFileName || `${biltyNumber}.pdf`);
    } else if (onUpdateStatus) {
      onUpdateStatus(order.id, 'Bilty Uploaded');
    }
    setShowBiltyModal(false);
  };

  const handleLrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (order.status !== 'Ready to Dispatch') {
      alert('LR Generation is locked until the order is in Ready to Dispatch status!');
      return;
    }
    if (!lrNumber) return;
    if (onGenerateLr) {
      onGenerateLr(order.id, lrNumber, transporter);
    } else if (onUpdateStatus) {
      onUpdateStatus(order.id, 'Dispatched');
    }
    setShowLrModal(false);
  };

  return (
    <div className="space-y-6 font-body text-xs">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e0e0e0] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 border border-[#e0e0e0] bg-white hover:bg-[#f4f4f4] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#161616]">Order {order.orderNumber}</h1>
              <StatusBadge status={order.status} />
              <StatusBadge status={order.paymentStatus} />
            </div>
            <p className="text-[11px] text-[#525252] mt-0.5">
              Created on {order.date} by {order.createdByName || 'Field Employee'}
            </p>
          </div>
        </div>

        {/* Dynamic Workflow Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => window.print()}
            className="carbon-btn-ghost text-xs h-8 px-3 border border-[#0f62fe] bg-white cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] mr-1.5">print</span> Print Invoice
          </button>

          {/* Step 1: Admin Approval / Rejection */}
          {order.status === 'Pending Approval' && isAdmin && (
            <>
              <button
                onClick={() => onUpdateStatus && onUpdateStatus(order.id, 'Rejected')}
                className="px-3 py-1 bg-[#da1e28] hover:bg-[#b81921] text-white font-bold rounded-none cursor-pointer flex items-center gap-1 text-xs"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span> Reject Order
              </button>
              <button
                onClick={() => onUpdateStatus && onUpdateStatus(order.id, 'Approved')}
                className="carbon-btn-primary text-xs h-8 px-3 cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span> Approve Order
              </button>
            </>
          )}

          {/* Step 2: Office Bilty Upload */}
          {order.status === 'Approved' && isAdmin && (
            <button
              onClick={() => setShowBiltyModal(true)}
              className="px-3 py-1 bg-[#0f62fe] hover:bg-[#0043ce] text-white font-bold rounded-none cursor-pointer flex items-center gap-1 text-xs"
            >
              <span className="material-symbols-outlined text-[16px]">upload_file</span> Upload Office Bilty
            </button>
          )}

          {/* Step 3: Set Ready to Dispatch */}
          {order.status === 'Bilty Uploaded' && isAdmin && (
            <button
              onClick={() => onMarkReadyDispatch ? onMarkReadyDispatch(order.id) : onUpdateStatus && onUpdateStatus(order.id, 'Ready to Dispatch')}
              className="px-3 py-1 bg-[#198038] hover:bg-[#116327] text-white font-bold rounded-none cursor-pointer flex items-center gap-1 text-xs"
            >
              <span className="material-symbols-outlined text-[16px]">inventory_2</span> Mark Ready to Dispatch
            </button>
          )}

          {/* Step 4: Warehouse LR Queue Indicator */}
          {order.status === 'Ready to Dispatch' && (
            <span className="px-3 py-1 bg-[#fff8e1] border border-[#ffe082] text-[#8f6b00] font-semibold flex items-center gap-1 text-xs">
              <span className="material-symbols-outlined text-[16px]">hourglass_top</span> Queued for Warehouse LR
            </span>
          )}
        </div>
      </div>

      {/* Visual Workflow Timeline */}
      <OrderTimeline currentStatus={order.status} />

      {/* Locked / Notice Banners */}
      {order.status === 'Pending Approval' && (
        <div className="p-3 bg-[#f0f7ff] border border-[#a6c8ff] text-[#001d6c] text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#0f62fe]">info</span>
            <span>Order is currently <strong>Pending Admin Approval</strong>. Employee is waiting for verification.</span>
          </div>
        </div>
      )}

      {order.status === 'Approved' && (
        <div className="p-3 bg-[#e8f8ee] border border-[#6fdc8c] text-[#0e6027] text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#198038]">task_alt</span>
            <span>Order is <strong>Approved</strong>. Next step: Office upload Bilty PDF document.</span>
          </div>
          {isAdmin && (
            <button onClick={() => setShowBiltyModal(true)} className="underline cursor-pointer font-bold">
              Upload Bilty Now →
            </button>
          )}
        </div>
      )}

      {order.status === 'Ready to Dispatch' && (
        <div className="p-3 bg-[#fff8e1] border border-[#ffe082] text-[#8f6b00] text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            <span>Order is <strong>Ready to Dispatch</strong>. Available in Warehouse portal for LR Generation.</span>
          </div>
        </div>
      )}

      {/* 2-Column Overview (Dealer Info & Distributor / Logistics Info) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Distributor Card */}
        <div className="bg-white p-4 border border-[#e0e0e0] shadow-xs">
          <h3 className="font-bold text-xs text-[#161616] uppercase tracking-wider mb-3 border-b border-[#e0e0e0] pb-1.5 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-[#0f62fe]">domain</span>
            <span>Distributor & Recipient Details</span>
          </h3>
          <div className="space-y-1.5 text-xs">
            <div className="font-bold text-[#161616] text-sm">{order.dealerName}</div>
            <div className="text-[#525252]">Distributor Code: {order.dealerCode} • City: {order.dealerCity}</div>
            <div className="text-[#525252]">Created By: {order.createdByName || 'Employee User'}</div>
            <div className="text-[#525252]">Payment Terms / Instructions: {order.remarks || 'Standard B2B Order'}</div>
          </div>
        </div>

        {/* Distributor & Logistics Card */}
        <div className="bg-white p-4 border border-[#e0e0e0] shadow-xs">
          <h3 className="font-bold text-xs text-[#161616] uppercase tracking-wider mb-3 border-b border-[#e0e0e0] pb-1.5 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-[#0f62fe]">local_shipping</span>
            <span>Distributor & Logistics Details</span>
          </h3>
          <div className="space-y-1.5 text-xs">
            <div className="font-bold text-[#161616] text-sm">{order.distributorName}</div>
            <div className="text-[#525252]">Order Status: <strong>{order.status}</strong></div>
            <div className="text-[#525252]">Transporter: {order.transporter || 'Pending Warehouse LR'}</div>
          </div>
        </div>
      </div>

      {/* Role-Scoped Bilty & LR Document Cards */}
      {(order.biltyNumber || order.lrNumber || order.status === 'Bilty Uploaded' || order.status === 'Dispatched') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Office Bilty Card (Visible only to Admin, Concerned Employee, Concerned Dealer) */}
          {(isAdmin || isEmployee || isDealer) && (
            <div className="bg-[#f0f7ff] p-4 border border-[#a6c8ff] shadow-xs space-y-2">
              <div className="flex items-center justify-between border-b border-[#a6c8ff] pb-2">
                <h4 className="font-bold text-xs text-[#001d6c] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#0f62fe]">description</span>
                  <span>Office Bilty Document (PDF)</span>
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#0f62fe] text-white rounded-none">
                  RESTRICTED ACCESS
                </span>
              </div>
              <div className="text-xs space-y-1 text-[#001d6c]">
                <div><strong>Bilty Number:</strong> {order.biltyNumber || `BILTY-${order.orderNumber}`}</div>
                <div><strong>Uploaded On:</strong> {order.biltyDate || 'Today'}</div>
                <div><strong>Uploaded By:</strong> {order.biltyUploadedByName || 'Office Admin'}</div>
                <div className="pt-2">
                  <a
                    href="#download-bilty"
                    onClick={(e) => { e.preventDefault(); alert(`Downloading Bilty PDF: ${order.biltyNumber || 'BILTY-' + order.orderNumber}.pdf`); }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0f62fe] hover:bg-[#0043ce] text-white font-bold text-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span> Download Bilty PDF
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Warehouse LR Card (Visible only to Admin, Concerned Employee, Concerned Dealer, Warehouse) */}
          {(isAdmin || isEmployee || isDealer) && (
            <div className="bg-[#fff8e1] p-4 border border-[#ffe082] shadow-xs space-y-2">
              <div className="flex items-center justify-between border-b border-[#ffe082] pb-2">
                <h4 className="font-bold text-xs text-[#8f6b00] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                  <span>Warehouse LR Receipt</span>
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#8f6b00] text-white rounded-none">
                  {order.status === 'Dispatched' ? 'DISPATCHED' : 'READY TO DISPATCH'}
                </span>
              </div>
              <div className="text-xs space-y-1 text-[#8f6b00]">
                <div><strong>LR Number:</strong> {order.lrNumber || (order.status === 'Dispatched' ? 'LR-88201-PNE' : 'Pending LR Generation')}</div>
                <div><strong>Transporter:</strong> {order.transporter || 'VRL Freight'}</div>
                <div><strong>Generated By:</strong> {order.lrGeneratedByName || 'Warehouse Logistics Officer'}</div>
                <div className="pt-2">
                  {order.lrNumber || order.status === 'Dispatched' ? (
                    <a
                      href="#download-lr"
                      onClick={(e) => { e.preventDefault(); alert(`Downloading LR Document: ${order.lrNumber || 'LR-88201'}.pdf`); }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#8a3800] hover:bg-[#6e2c00] text-white font-bold text-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">receipt_long</span> Download LR Receipt
                    </a>
                  ) : (
                    <span className="text-[11px] font-bold text-[#b28900] italic">
                      🔒 Locked: LR generation unlocks when status is 'Ready to Dispatch'
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Line Items Table */}
      <div className="bg-white border border-[#e0e0e0] overflow-x-auto shadow-xs">
        <div className="p-3 bg-[#f4f4f4] border-b border-[#e0e0e0] font-bold text-xs text-[#161616] uppercase tracking-wider">
          Ordered Products Catalog ({items.length} SKUs)
        </div>
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#f4f4f4] text-[#525252] border-b border-[#e0e0e0]">
            <tr>
              <th className="p-3 font-semibold">Product Name</th>
              <th className="p-3 font-semibold">SKU Code</th>
              <th className="p-3 font-semibold">Pack Size</th>
              <th className="p-3 font-semibold text-right">Dealer Price</th>
              <th className="p-3 font-semibold text-center">Quantity</th>
              <th className="p-3 font-semibold text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e0e0e0]">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-[#f4f4f4]">
                <td className="p-3 font-bold text-[#161616]">{item.productName}</td>
                <td className="p-3 text-[#525252]">{item.productCode}</td>
                <td className="p-3 text-[#525252]">{item.packSize}</td>
                <td className="p-3 text-right font-medium">₹{item.dealerPrice}</td>
                <td className="p-3 text-center font-bold">{item.quantity}</td>
                <td className="p-3 text-right font-bold text-[#161616]">
                  ₹{(item.subtotal || 0).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Order Subtotal Breakdown */}
        <div className="p-4 bg-[#f4f4f4] border-t border-[#e0e0e0] flex justify-end">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-[#525252]">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-[#198038]">
              <span>Discount</span>
              <span>-₹{discount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-[#525252]">
              <span>GST (18%)</span>
              <span>₹{tax.toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t border-[#e0e0e0] pt-2 flex justify-between font-bold text-sm text-[#161616]">
              <span>Grand Total</span>
              <span>₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Office Bilty Upload Modal */}
      {showBiltyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#e0e0e0] w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-2">
              <h3 className="text-sm font-bold text-[#161616] uppercase">
                Upload Office Bilty PDF ({order.orderNumber})
              </h3>
              <button onClick={() => setShowBiltyModal(false)} className="text-gray-500 hover:text-black">
                ✕
              </button>
            </div>
            <form onSubmit={handleBiltySubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#525252] mb-1">Bilty Number / Reference</label>
                <input
                  type="text"
                  required
                  value={biltyNumber}
                  onChange={(e) => setBiltyNumber(e.target.value)}
                  placeholder="e.g. BILTY-2026-8801"
                  className="w-full p-2 border border-[#e0e0e0] bg-[#f4f4f4] text-xs font-medium focus:outline-none focus:border-[#0f62fe]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#525252] mb-1">Bilty Document (PDF File)</label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => setBiltyFileName(e.target.files?.[0]?.name || '')}
                  className="w-full p-1.5 border border-[#e0e0e0] bg-[#f4f4f4] text-xs"
                />
                <span className="text-[10px] text-[#525252] mt-0.5 block">
                  Only visible to Admin, Employee ({order.createdByName || 'Staff'}), and Dealer ({order.dealerName}).
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e0e0e0]">
                <button
                  type="button"
                  onClick={() => setShowBiltyModal(false)}
                  className="px-3 py-1.5 border border-[#e0e0e0] text-[#161616]"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#0f62fe] text-white font-bold cursor-pointer">
                  Save & Attach Bilty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warehouse LR Generation Modal */}
      {showLrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#e0e0e0] w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-2">
              <h3 className="text-sm font-bold text-[#161616] uppercase">
                Generate Warehouse LR ({order.orderNumber})
              </h3>
              <button onClick={() => setShowLrModal(false)} className="text-gray-500 hover:text-black">
                ✕
              </button>
            </div>
            <form onSubmit={handleLrSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#525252] mb-1">LR Receipt Number</label>
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
                <label className="block text-[11px] font-bold text-[#525252] mb-1">Transporter / Fleet Agency</label>
                <input
                  type="text"
                  required
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                  placeholder="e.g. VRL Logistics / TCI Freight"
                  className="w-full p-2 border border-[#e0e0e0] bg-[#f4f4f4] text-xs font-medium focus:outline-none focus:border-[#0f62fe]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e0e0e0]">
                <button
                  type="button"
                  onClick={() => setShowLrModal(false)}
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
