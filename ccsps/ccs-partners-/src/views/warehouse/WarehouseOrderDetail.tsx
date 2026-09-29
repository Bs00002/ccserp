import React, { useState } from 'react';
import { Order } from '../../types';

interface WarehouseOrderDetailProps {
  order: Order;
  onUpdateOrder: (updatedOrder: Order) => void;
  onDispatchOrder?: (orderId: string) => void;
  onBack: () => void;
}

export const WarehouseOrderDetail: React.FC<WarehouseOrderDetailProps> = ({
  order,
  onUpdateOrder,
  onDispatchOrder,
  onBack,
}) => {
  const isReadyToDispatch = order.status === 'Ready to Dispatch';
  const isAlreadyDispatched = order.status === 'Dispatched' || order.status === 'Delivered';

  // Dispatch Form State
  const [lrNumber, setLrNumber] = useState(order.lrNumber || '');
  const [lrDate, setLrDate] = useState(order.lrDate?.split('T')[0] || new Date().toISOString().split('T')[0]);
  const [transporter, setTransporter] = useState(order.transporter || '');
  const [vehicleNumber, setVehicleNumber] = useState(order.vehicleNumber || '');
  const [lrPdfName, setLrPdfName] = useState(order.lrReceiptUpload || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [lrSaved, setLrSaved] = useState(Boolean(order.lrNumber));
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [viewingBiltyModal, setViewingBiltyModal] = useState(false);
  const [viewingLrModal, setViewingLrModal] = useState(false);

  const handleSaveLrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReadyToDispatch) {
      alert('LR Generation is LOCKED until Order is Ready to Dispatch!');
      return;
    }

    if (!lrNumber.trim() || !transporter.trim()) {
      alert('Please fill in required LR Number and Transporter details.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const updated: Order = {
        ...order,
        lrNumber: lrNumber.trim(),
        lrDate: new Date(lrDate).toISOString(),
        transporter: transporter.trim(),
        vehicleNumber: vehicleNumber.trim(),
        lrReceiptUpload: lrPdfName,
        lrGeneratedByName: 'Warehouse Dispatch Officer',
        status: order.status, // Order remains Ready to Dispatch until explicitly dispatched
      };

      onUpdateOrder(updated);
      setIsSubmitting(false);
      setLrSaved(true);
    }, 400);
  };

  const handleConfirmDispatch = async () => {
    if (!order.lrNumber && !lrNumber) {
      alert('Please save LR details before confirming dispatch.');
      return;
    }
    if (!window.confirm('Are you sure you want to mark this order as DISPATCHED? This will deduct physical stock from warehouse inventory in the central database.')) {
      return;
    }
    setIsDispatching(true);
    try {
      if (onDispatchOrder) {
        await onDispatchOrder(order.id);
      }
      setShowSuccessBanner(true);
    } catch (e: any) {
      alert(e?.message || 'Failed to dispatch order');
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="space-y-6 font-body text-xs max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex justify-between items-center bg-white p-4 border border-[#e2e8f0] shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 text-[#64748b] hover:text-[#0f172a] border border-[#cbd5e1] hover:bg-[#f8fafc] cursor-pointer rounded transition"
            title="Back to Orders Queue"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#0f172a]">
                Dispatch Processing for Order #{order.orderNumber || order.id}
              </h1>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${
                  order.status === 'Ready to Dispatch'
                    ? 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]'
                    : order.status === 'Dispatched'
                    ? 'bg-[#dcfce7] text-[#15803d] border-[#86efac]'
                    : 'bg-[#f1f5f9] text-[#475569] border-[#cbd5e1]'
                }`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-xs text-[#64748b]">
              Verify items & Office Bilty, record transport details, and submit LR dispatch
            </p>
          </div>
        </div>

        <button
          onClick={onBack}
          className="text-xs font-bold text-[#64748b] hover:text-[#0f172a] border border-[#cbd5e1] px-3 py-1.5 cursor-pointer bg-white"
        >
          Back to List
        </button>
      </div>

      {/* DISPATCH CONFIRMATION BANNER (AFTER LR GENERATION) */}
      {showSuccessBanner && (
        <div className="bg-[#f0fdf4] border-2 border-[#16a34a] p-6 shadow-md rounded-md space-y-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[32px] text-[#16a34a]">check_circle</span>
            <div>
              <h2 className="text-lg font-extrabold text-[#14532d] uppercase tracking-wider">
                DISPATCH COMPLETED
              </h2>
              <p className="text-xs text-[#166534]">
                LR generated successfully. Order status updated to <strong>DISPATCHED</strong>.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 border border-[#bbf7d0] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[11px] font-bold text-[#64748b] block">Order ID</span>
              <span className="font-extrabold text-[#0f172a]">{order.orderNumber || order.id}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#64748b] block">Distributor</span>
              <span className="font-extrabold text-[#0f172a]">{order.dealerName}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#64748b] block">LR Number</span>
              <span className="font-extrabold text-[#16a34a] font-mono">{order.lrNumber || lrNumber}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#64748b] block">Transporter</span>
              <span className="font-extrabold text-[#0f172a]">{order.transporter || transporter}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setViewingLrModal(true)}
              className="bg-[#16a34a] hover:bg-[#15803d] text-white font-bold px-4 py-2 text-xs cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">description</span>
              <span>View Generated LR</span>
            </button>
            <button
              onClick={onBack}
              className="bg-white border border-[#cbd5e1] hover:bg-[#f8fafc] text-[#0f172a] font-bold px-4 py-2 text-xs cursor-pointer"
            >
              Back to Orders Queue
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1 — ORDER INFORMATION (READ-ONLY) */}
      <div className="bg-white border border-[#e2e8f0] shadow-2xs">
        <div className="p-3 bg-[#f8fafc] border-b border-[#e2e8f0] font-bold text-xs text-[#0f172a] uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-[#0284c7]">info</span>
          <span>SECTION 1 — ORDER INFORMATION (Read-only)</span>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-[#64748b] text-[11px] font-bold block mb-0.5">Order ID</span>
            <span className="font-extrabold text-[#0284c7] text-sm">{order.orderNumber || order.id}</span>
          </div>

          <div>
            <span className="text-[#64748b] text-[11px] font-bold block mb-0.5">Order Date</span>
            <span className="font-bold text-[#0f172a]">{order.date}</span>
          </div>

          <div>
            <span className="text-[#64748b] text-[11px] font-bold block mb-0.5">Sales Employee</span>
            <span className="font-bold text-[#0f172a]">{order.createdByName || 'Sales Employee User'}</span>
          </div>

          <div>
            <span className="text-[#64748b] text-[11px] font-bold block mb-0.5">Distributor (Recipient)</span>
            <span className="font-bold text-[#0f172a]">{order.dealerName} ({order.dealerCity})</span>
          </div>

          <div>
            <span className="text-[#64748b] text-[11px] font-bold block mb-0.5">Payment Term & Credit</span>
            <span className="font-bold text-[#0f172a]">{order.paymentTerms || 'Cash (15 Days)'}</span>
          </div>

          <div>
            <span className="text-[#64748b] text-[11px] font-bold block mb-0.5">Order Status</span>
            <span className="font-bold text-[#0284c7]">{order.status}</span>
          </div>
        </div>
      </div>

      {/* SECTION 2 — PRODUCTS BREAKDOWN (READ-ONLY) */}
      <div className="bg-white border border-[#e2e8f0] shadow-2xs">
        <div className="p-3 bg-[#f8fafc] border-b border-[#e2e8f0] font-bold text-xs text-[#0f172a] uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-[#0284c7]">inventory_2</span>
          <span>SECTION 2 — ORDERED PRODUCTS ({order.items.length} SKUs)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#f1f5f9] text-[#475569] border-b border-[#e2e8f0] uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="p-3">Product Name</th>
                <th className="p-3">Pack Size</th>
                <th className="p-3 text-center">Quantity</th>
                <th className="p-3 text-right">Unit Price</th>
                <th className="p-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="p-3 font-bold text-[#0f172a]">{item.productName}</td>
                  <td className="p-3 text-[#475569]">{item.packSize}</td>
                  <td className="p-3 text-center font-bold text-[#0f172a]">{item.quantity}</td>
                  <td className="p-3 text-right text-[#475569]">₹{item.dealerPrice.toLocaleString('en-IN')}</td>
                  <td className="p-3 text-right font-bold text-[#0f172a]">
                    ₹{item.subtotal.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#f8fafc] border-t border-[#e2e8f0] font-bold text-xs">
              <tr>
                <td colSpan={4} className="p-3 text-right text-[#475569]">Subtotal:</td>
                <td className="p-3 text-right text-[#0f172a]">₹{order.subtotal.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td colSpan={4} className="p-3 text-right text-[#475569]">GST (18%):</td>
                <td className="p-3 text-right text-[#0f172a]">₹{order.tax.toLocaleString('en-IN')}</td>
              </tr>
              <tr className="text-sm text-[#0284c7]">
                <td colSpan={4} className="p-3 text-right font-black">Grand Total:</td>
                <td className="p-3 text-right font-black">₹{order.grandTotal.toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* SECTION 3 — OFFICE BILTY (READ-ONLY) */}
      <div className="bg-white border border-[#e2e8f0] shadow-2xs">
        <div className="p-3 bg-[#f8fafc] border-b border-[#e2e8f0] font-bold text-xs text-[#0f172a] uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-[#0284c7]">description</span>
            <span>SECTION 3 — OFFICE BILTY DETAILS (Read-only)</span>
          </div>
          <span className="text-[10px] text-[#64748b] font-semibold">Uploaded by Admin/Office</span>
        </div>

        <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1 text-xs">
            <div>
              <span className="text-[#64748b] font-bold">Bilty Number: </span>
              <span className="font-extrabold text-[#0f172a] font-mono">{order.biltyNumber || 'BILTY-WORKFLOW-99'}</span>
            </div>
            <div>
              <span className="text-[#64748b] font-bold">Bilty Date: </span>
              <span className="text-[#0f172a]">{order.biltyDate?.split('T')[0] || order.date}</span>
            </div>
            <div>
              <span className="text-[#64748b] font-bold">Uploaded By: </span>
              <span className="text-[#0f172a]">{order.biltyUploadedByName || 'Office Authority'}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewingBiltyModal(true)}
              className="bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold px-3 py-1.5 text-xs cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>View Bilty</span>
            </button>

            <button
              onClick={() => alert(`Downloading Bilty document: ${order.biltyNumber || 'BILTY-WORKFLOW-99'}.pdf`)}
              className="bg-white border border-[#cbd5e1] hover:bg-[#f8fafc] text-[#0f172a] font-bold px-3 py-1.5 text-xs cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Download Bilty PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 4 — DISPATCH INFORMATION (WAREHOUSE ENTRY & LR FORM) */}
      <div className="bg-white border border-[#e2e8f0] shadow-2xs">
        <div className="p-3 bg-[#f8fafc] border-b border-[#e2e8f0] font-bold text-xs text-[#0f172a] uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-[#0284c7]">local_shipping</span>
          <span>SECTION 4 — WAREHOUSE DISPATCH & LR ENTRY</span>
        </div>

        <div className="p-4">
          {/* CRITICAL LOCK WARNING */}
          {!isReadyToDispatch && !isAlreadyDispatched && (
            <div className="bg-[#fef2f2] border-2 border-[#ef4444] p-4 text-[#991b1b] space-y-2 mb-4 rounded-md">
              <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider">
                <span className="material-symbols-outlined text-[20px] text-[#dc2626]">lock</span>
                <span>🔒 LR GENERATION IS LOCKED</span>
              </div>
              <p className="text-xs font-semibold">
                LR generation is locked until the order reaches <strong>Ready to Dispatch</strong> status. Current status: <strong>{order.status}</strong>.
              </p>
              <p className="text-[11px] text-[#b91c1c]">
                Backend REST API will reject any premature dispatch attempts with HTTP 400 error.
              </p>
            </div>
          )}

          {isAlreadyDispatched && (
            <div className="bg-[#f0fdf4] border border-[#86efac] p-4 text-[#14532d] space-y-2 mb-4 rounded-md">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px] text-[#16a34a]">check_circle</span>
                <span>DISPATCH COMPLETED & LR RECORD PERSISTED</span>
              </div>
              <p className="text-xs">
                LR Number: <strong>{order.lrNumber || lrNumber}</strong> • Transporter: <strong>{order.transporter || transporter}</strong> • Vehicle: <strong>{order.vehicleNumber || vehicleNumber}</strong>
              </p>
            </div>
          )}

          <form onSubmit={handleSaveLrSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* LR Number */}
              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">
                  LR Number <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!isReadyToDispatch || isAlreadyDispatched}
                  value={lrNumber}
                  onChange={(e) => setLrNumber(e.target.value)}
                  placeholder="e.g., LR-VRL-99210"
                  className="w-full p-2 border border-[#cbd5e1] font-mono font-bold text-xs focus:outline-none focus:border-[#0284c7] disabled:bg-[#f1f5f9]"
                />
              </div>

              {/* LR Date */}
              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">
                  LR Date <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="date"
                  required
                  disabled={!isReadyToDispatch || isAlreadyDispatched}
                  value={lrDate}
                  onChange={(e) => setLrDate(e.target.value)}
                  className="w-full p-2 border border-[#cbd5e1] text-xs focus:outline-none focus:border-[#0284c7] disabled:bg-[#f1f5f9]"
                />
              </div>

              {/* Transporter */}
              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">
                  Transporter Name <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!isReadyToDispatch || isAlreadyDispatched}
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                  placeholder="e.g., VRL Express Freight"
                  className="w-full p-2 border border-[#cbd5e1] text-xs focus:outline-none focus:border-[#0284c7] disabled:bg-[#f1f5f9]"
                />
              </div>

              {/* Vehicle Number */}
              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">
                  Vehicle / Truck Number
                </label>
                <input
                  type="text"
                  disabled={!isReadyToDispatch || isAlreadyDispatched}
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="e.g., MH-12-PQ-9988"
                  className="w-full p-2 border border-[#cbd5e1] font-mono text-xs focus:outline-none focus:border-[#0284c7] disabled:bg-[#f1f5f9]"
                />
              </div>
            </div>

            {/* LR Receipt Upload */}
            <div>
              <label className="block text-[11px] font-bold text-[#475569] mb-1">
                LR Receipt / Transport PDF Upload
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  disabled={!isReadyToDispatch || isAlreadyDispatched}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setLrPdfName(e.target.files[0].name);
                    }
                  }}
                  className="text-xs text-[#475569] file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-bold file:bg-[#0284c7] file:text-white hover:file:bg-[#0369a1] file:cursor-pointer disabled:opacity-50"
                />
                {lrPdfName && (
                  <span className="text-xs text-[#0f172a] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#16a34a]">attach_file</span>
                    <span>{lrPdfName}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Save LR & Explicit Dispatch Actions */}
            <div className="pt-4 border-t border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-[#64748b]">
                {lrSaved || order.lrNumber ? (
                  <span className="text-[#16a34a] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">task_alt</span>
                    LR details attached. Order remains Ready to Dispatch until finalized.
                  </span>
                ) : (
                  <span>Attach LR to prepare order for physical truck dispatch.</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!isReadyToDispatch || isSubmitting || isAlreadyDispatched}
                  className="bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold px-4 py-2 text-xs tracking-wider uppercase cursor-pointer disabled:opacity-50 transition shadow-2xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{isSubmitting ? 'Saving LR...' : 'SAVE / UPDATE LR DETAILS'}</span>
                </button>

                {(lrSaved || order.lrNumber) && isReadyToDispatch && !isAlreadyDispatched && (
                  <button
                    type="button"
                    onClick={handleConfirmDispatch}
                    disabled={isDispatching}
                    className="bg-[#16a34a] hover:bg-[#15803d] text-white font-extrabold px-6 py-2.5 text-xs tracking-wider uppercase cursor-pointer disabled:opacity-50 transition shadow-md flex items-center gap-2 animate-pulse"
                  >
                    <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                    <span>{isDispatching ? 'Deducting Stock & Dispatching...' : 'CONFIRM DISPATCH & DEDUCT INVENTORY'}</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* BILTY MODAL */}
      {viewingBiltyModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl p-6 border border-[#cbd5e1] shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-3">
              <h3 className="font-bold text-sm text-[#0f172a] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0284c7]">description</span>
                <span>Office Bilty Document View</span>
              </h3>
              <button
                onClick={() => setViewingBiltyModal(false)}
                className="text-[#64748b] hover:text-[#0f172a] font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#f8fafc] p-4 border border-[#e2e8f0] space-y-2 text-xs">
              <p><strong>Bilty Number:</strong> {order.biltyNumber || 'BILTY-WORKFLOW-99'}</p>
              <p><strong>Date:</strong> {order.biltyDate?.split('T')[0] || order.date}</p>
              <p><strong>Issued By:</strong> {order.biltyUploadedByName || 'Office Authority'}</p>
              <p className="text-[11px] text-[#64748b] italic pt-2 border-t border-[#e2e8f0]">
                Official consignment note verified for shipment handover.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewingBiltyModal(false)}
                className="bg-[#0284c7] text-white font-bold px-4 py-1.5 text-xs"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LR MODAL */}
      {viewingLrModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl p-6 border border-[#cbd5e1] shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-3">
              <h3 className="font-bold text-sm text-[#0f172a] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#16a34a]">local_shipping</span>
                <span>Generated Warehouse LR Document</span>
              </h3>
              <button
                onClick={() => setViewingLrModal(false)}
                className="text-[#64748b] hover:text-[#0f172a] font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#f0fdf4] p-4 border border-[#86efac] space-y-2 text-xs">
              <p><strong>LR Number:</strong> {order.lrNumber || lrNumber}</p>
              <p><strong>LR Date:</strong> {lrDate}</p>
              <p><strong>Transporter:</strong> {order.transporter || transporter}</p>
              <p><strong>Vehicle Number:</strong> {order.vehicleNumber || vehicleNumber}</p>
              <p><strong>Status:</strong> DISPATCHED</p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewingLrModal(false)}
                className="bg-[#16a34a] text-white font-bold px-4 py-1.5 text-xs"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
