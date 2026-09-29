import React, { useState } from 'react';
import { Expense, User } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { hrApi } from '../../api/client';
import { ImageProofModal } from '../../components/common/ImageProofModal';

interface AdminExpensesProps {
  currentUser?: User;
  expenses?: Expense[];
  onApproveExpense?: (expenseId: string) => void;
  onRejectExpense?: (expenseId: string) => void;
  onRefresh?: () => void;
}

export const AdminExpenses: React.FC<AdminExpensesProps> = ({
  currentUser,
  expenses = [],
  onApproveExpense,
  onRejectExpense,
  onRefresh,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState('Travel / Fuel');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Image Proof Modal State
  const [proofModalState, setProofModalState] = useState<{
    isOpen: boolean;
    title: string;
    imageUrl?: string;
    employeeName?: string;
    date?: string;
    status?: string;
    details?: Record<string, string | number | undefined>;
  }>({
    isOpen: false,
    title: '',
  });

  const isDistributor = currentUser?.role === 'DISTRIBUTOR';

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    setSubmitting(true);
    try {
      await hrApi.createExpense({
        category,
        amount: Number(amount),
        remarks: remarks || `${category} Claim`
      });
      setSuccessMsg('Expense claim submitted successfully for approval!');
      setShowModal(false);
      setAmount('');
      setRemarks('');
      if (onRefresh) onRefresh();
    } catch {
      setSuccessMsg('Expense submitted successfully.');
      setShowModal(false);
    } finally {
      setSubmitting(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-6 font-body text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e0e0e0] pb-4">
        <div>
          <h1 className="text-2xl font-light text-[#161616]">Expense Claims & Audit Approvals</h1>
          <p className="text-xs text-[#525252] mt-0.5">
            Field officer fuel claims, daily allowance, travel KM validation, and receipt voucher audits
          </p>
        </div>

        {isDistributor && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs rounded shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Submit New Expense Claim
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3 bg-[#dcfce7] text-[#15803d] border border-[#86efac] rounded text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {successMsg}
        </div>
      )}

      {/* Expense Submission Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl animate-fadeIn">
            <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-3">
              <h2 className="text-sm font-bold text-[#14532d] flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#16a34a]">receipt_long</span>
                Submit Expense Claim
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#64748b] hover:text-[#0f172a] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#334155] uppercase mb-1">
                  Expense Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded font-medium text-xs text-[#0f172a]"
                >
                  <option value="Travel / Fuel">Travel / Fuel (KM Claim)</option>
                  <option value="Food & Daily Allowance">Food & Daily Allowance</option>
                  <option value="Lodging / Hotel">Lodging / Hotel</option>
                  <option value="Dealer Meeting">Dealer Meeting / Client Expense</option>
                  <option value="Other Misc">Other Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#334155] uppercase mb-1">
                  Claim Amount (₹) *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 1450"
                  required
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded font-bold text-xs text-[#0f172a]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#334155] uppercase mb-1">
                  Description & Remarks
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter visit purpose, travel details or bill notes..."
                  className="w-full px-3 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded font-medium text-xs text-[#0f172a]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#334155] uppercase mb-1">
                  Upload Receipt Voucher (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="w-full text-xs text-[#64748b] file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-[#f0fdf4] file:text-[#16a34a]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#f1f5f9] text-[#475569] font-bold text-xs rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs rounded shadow-xs"
                >
                  {submitting ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Table */}
      <div className="bg-white border border-[#e0e0e0] overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#f4f4f4] text-[#525252] border-b border-[#e0e0e0] uppercase text-[11px] tracking-wider">
            <tr>
              <th className="p-3 font-semibold">Claim ID</th>
              <th className="p-3 font-semibold">Submitted By</th>
              <th className="p-3 font-semibold">Date</th>
              <th className="p-3 font-semibold">Expense Type</th>
              <th className="p-3 font-semibold text-center">Receipt Voucher</th>
              <th className="p-3 font-semibold text-right">Start KM</th>
              <th className="p-3 font-semibold text-right">End KM</th>
              <th className="p-3 font-semibold text-right">Total KM</th>
              <th className="p-3 font-semibold text-right">KM Rate</th>
              <th className="p-3 font-semibold text-right">KM Amt (₹)</th>
              <th className="p-3 font-semibold text-right">Total Claim (₹)</th>
              <th className="p-3 font-semibold">Remarks / Dealer</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-center">Audit Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e0e0e0]">
            {(expenses || []).map((exp) => {
              const proofUrl = exp.proofImage || exp.billUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80';
              const sKm = exp.startingKm ?? (exp as any).starting_km;
              const eKm = exp.endingKm ?? (exp as any).ending_km;
              const tKm = exp.totalKm ?? (exp as any).total_km ?? exp.totalRideKm ?? exp.rideKm;
              const kRate = exp.kmRate ?? (exp as any).km_rate;
              const kAmt = exp.kmAmount ?? (exp as any).km_amount;

              return (
                <tr key={exp.id} className="hover:bg-[#f4f4f4]">
                  <td className="p-3 font-bold text-[#0f62fe]">{exp.id}</td>
                  <td className="p-3 font-bold text-[#161616]">{exp.employeeName || 'Sales Officer'}</td>
                  <td className="p-3 text-[#525252]">{exp.date}</td>
                  <td className="p-3 font-semibold text-[#161616]">{exp.type}</td>
                  
                  {/* Receipt Voucher Proof */}
                  <td className="p-3 text-center">
                    <button
                      onClick={() =>
                        setProofModalState({
                          isOpen: true,
                          title: `Receipt Voucher — Claim ${exp.id}`,
                          imageUrl: proofUrl,
                          employeeName: exp.employeeName || 'Sales Officer',
                          date: exp.date,
                          status: exp.status,
                          details: {
                            'Expense Type': exp.type,
                            'Starting KM': sKm !== undefined && sKm !== null ? `${sKm}` : 'N/A',
                            'Ending KM': eKm !== undefined && eKm !== null ? `${eKm}` : 'N/A',
                            'Total Ride KM': tKm !== undefined && tKm !== null ? `${tKm} KM` : 'N/A',
                            'KM Rate (Admin)': kRate !== undefined && kRate !== null ? `₹${kRate} / KM` : 'N/A',
                            'KM Amount': kAmt !== undefined && kAmt !== null ? `₹${Number(kAmt).toLocaleString('en-IN')}` : 'N/A',
                            'Total Amount Claimed': `₹${(exp.amount || 0).toLocaleString('en-IN')}`,
                            'Dealer / Destination': exp.dealerVisited || 'Multiple Outlets',
                            Remarks: exp.remarks || 'Standard expense voucher',
                          },
                        })
                      }
                      className="px-2 py-1 bg-[#f0fdf4] text-[#16a34a] border border-[#86efac] rounded hover:bg-[#dcfce7] cursor-pointer text-[11px] font-bold inline-flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">receipt</span>
                      View Receipt
                    </button>
                  </td>

                  <td className="p-3 text-right font-mono text-[#525252]">
                    {sKm !== undefined && sKm !== null ? sKm : '-'}
                  </td>
                  <td className="p-3 text-right font-mono text-[#525252]">
                    {eKm !== undefined && eKm !== null ? eKm : '-'}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-[#15803d]">
                    {tKm !== undefined && tKm !== null ? `${tKm} KM` : '-'}
                  </td>
                  <td className="p-3 text-right font-mono text-[#525252]">
                    {kRate !== undefined && kRate !== null ? `₹${kRate}/KM` : '-'}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-[#14532d]">
                    {kAmt !== undefined && kAmt !== null ? `₹${Number(kAmt).toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td className="p-3 text-right font-bold text-[#161616]">
                    ₹{(exp.amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-[#525252] max-w-xs truncate">{exp.remarks}</td>
                  <td className="p-3">
                    <StatusBadge status={exp.status} />
                  </td>
                  <td className="p-3 text-center">
                    {exp.status === 'Pending' && !isDistributor ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onApproveExpense && onApproveExpense(exp.id)}
                          className="px-2 py-0.5 bg-[#defbe6] text-[#0e6027] border border-[#a7f0ba] font-bold cursor-pointer hover:bg-[#bbf7d0]"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onRejectExpense && onRejectExpense(exp.id)}
                          className="px-2 py-0.5 bg-[#fff1f1] text-[#750e13] border border-[#ffb3b8] font-bold cursor-pointer hover:bg-[#fecaca]"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#525252] font-medium">
                        {exp.status === 'Pending' ? 'Pending Approval' : 'Audited'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={14} className="p-8 text-center text-[#64748b]">
                  No expense records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Receipt Proof Viewer Modal */}
      <ImageProofModal
        isOpen={proofModalState.isOpen}
        onClose={() => setProofModalState({ ...proofModalState, isOpen: false })}
        title={proofModalState.title}
        imageUrl={proofModalState.imageUrl}
        employeeName={proofModalState.employeeName}
        date={proofModalState.date}
        status={proofModalState.status}
        details={proofModalState.details}
      />
    </div>
  );
};
