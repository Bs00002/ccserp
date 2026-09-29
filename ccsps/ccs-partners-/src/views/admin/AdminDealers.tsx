import React, { useState } from 'react';
import { Dealer } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

interface AdminDealersProps {
  dealers?: Dealer[];
  onAddDealer?: (dealer: any) => void;
  onSelectDealer?: (dealer: Dealer) => void;
  onSwitchToDealerPortal?: (dealer: Dealer) => void;
}

export const AdminDealers: React.FC<AdminDealersProps> = ({
  dealers = [],
  onAddDealer,
  onSelectDealer,
  onSwitchToDealerPortal,
}) => {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeDealerDetail, setActiveDealerDetail] = useState<Dealer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [creditLimit, setCreditLimit] = useState('200000');

  const s = (search || '').toLowerCase();
  const filtered = (dealers || []).filter(
    (d) =>
      (d.name || '').toLowerCase().includes(s) ||
      (d.code || '').toLowerCase().includes(s) ||
      (d.city || '').toLowerCase().includes(s)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ownerName || !city) return;

    if (onAddDealer) {
      onAddDealer({
        code: `DLR-${Math.floor(100 + Math.random() * 900)}`,
        name,
        ownerName,
        city,
        phone: phone || '+91 98000 00000',
        distributorName: 'Chitra Sales Corp',
        creditLimit: parseFloat(creditLimit) || 200000,
        outstandingBalance: 0,
        status: 'Active',
        totalOrdersCount: 0,
        totalSalesValue: 0,
        loyaltyPoints: 100,
      });
    }

    setName('');
    setOwnerName('');
    setCity('');
    setPhone('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 font-body text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#14532d]">Dealer Network Directory</h1>
            <span className="px-2 py-0.5 bg-[#dcfce7] text-[#14532d] font-bold text-[10px] border border-[#86efac] rounded uppercase">
              B2B RETAIL PARTNERS
            </span>
          </div>
          <p className="text-xs text-[#64748b] mt-0.5">
            Registered agriculture dealers, credit limit terms, outstanding ledger balances, and assigned territory distributors
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs rounded-md shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Add New Dealer
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 border border-[#e2e8f0] rounded-lg shadow-2xs">
          <div className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider">Total Dealers</div>
          <div className="text-xl font-extrabold text-[#0f172a] mt-1">{dealers.length}</div>
        </div>
        <div className="bg-white p-3 border border-[#e2e8f0] rounded-lg shadow-2xs">
          <div className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider">Active Network</div>
          <div className="text-xl font-extrabold text-[#16a34a] mt-1">
            {dealers.filter((d) => d.status === 'Active').length}
          </div>
        </div>
        <div className="bg-white p-3 border border-[#e2e8f0] rounded-lg shadow-2xs">
          <div className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider">Total Ledger Outstanding</div>
          <div className="text-xl font-extrabold text-[#dc2626] mt-1">
            ₹
            {dealers
              .reduce((acc, curr) => acc + curr.outstandingBalance, 0)
              .toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-white p-3 border border-[#e2e8f0] rounded-lg shadow-2xs">
          <div className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider">Avg Credit Terms</div>
          <div className="text-xl font-extrabold text-[#0284c7] mt-1">₹2.00 Lakhs</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 border border-[#e2e8f0] rounded-lg shadow-2xs flex items-center gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Dealer Code, Store Name, Proprietor, City..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-md text-xs text-[#0f172a] focus:outline-none focus:border-[#16a34a]"
          />
        </div>
      </div>

      {/* Dealer Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#f8fafc] text-[#64748b] border-b border-[#e2e8f0] uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="p-3">Dealer Code</th>
                <th className="p-3">Dealer Firm Name</th>
                <th className="p-3">Proprietor</th>
                <th className="p-3">City / Hub</th>
                <th className="p-3">Parent Distributor</th>
                <th className="p-3 text-right">Credit Limit</th>
                <th className="p-3 text-right">Outstanding Balance</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-[#64748b]">
                    {dealers.length === 0 ? "No dealers found in the database." : "No dealer records found matching your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="p-3 font-bold text-[#14532d]">{d.code}</td>
                    <td className="p-3 font-bold text-[#0f172a]">
                      <button
                        onClick={() => setActiveDealerDetail(d)}
                        className="hover:underline text-left text-[#14532d] font-bold cursor-pointer"
                      >
                        {d.name}
                      </button>
                    </td>
                    <td className="p-3 text-[#64748b]">{d.ownerName}</td>
                    <td className="p-3 text-[#64748b]">{d.city}</td>
                    <td className="p-3 text-[#64748b]">{d.distributorName}</td>
                    <td className="p-3 text-right font-semibold text-[#0f172a]">
                      ₹{d.creditLimit.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right font-bold text-[#dc2626]">
                      ₹{d.outstandingBalance.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setActiveDealerDetail(d)}
                          className="px-2 py-1 bg-[#f0fdf4] text-[#14532d] border border-[#86efac] text-[11px] font-bold rounded hover:bg-[#dcfce7] flex items-center gap-1 cursor-pointer"
                          title="View Detailed Record"
                        >
                          <span className="material-symbols-outlined text-[14px]">info</span>
                          Details
                        </button>
                        <button
                          onClick={() => onSwitchToDealerPortal && onSwitchToDealerPortal(d)}
                          className="px-2 py-1 bg-[#e0f2fe] text-[#0369a1] border border-[#7dd3fc] text-[11px] font-bold rounded hover:bg-[#bae6fd] flex items-center gap-1 cursor-pointer"
                          title="View Dealer Portal"
                        >
                          <span className="material-symbols-outlined text-[14px]">login</span>
                          Portal
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dealer Details Drawer / Modal */}
      {activeDealerDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-lg shadow-2xl max-w-lg w-full overflow-hidden animate-fadeIn">
            <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-[#14532d]">{activeDealerDetail.name}</h3>
                <p className="text-[10px] text-[#64748b]">
                  Dealer Code: {activeDealerDetail.code} • City: {activeDealerDetail.city}
                </p>
              </div>
              <button onClick={() => setActiveDealerDetail(null)} className="text-[#64748b] hover:text-[#0f172a]">
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0]">
                <div>
                  <span className="text-[10px] font-bold text-[#64748b] uppercase block">Proprietor Name</span>
                  <span className="font-bold text-[#0f172a]">{activeDealerDetail.ownerName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#64748b] uppercase block">Contact Phone</span>
                  <span className="font-bold text-[#0f172a]">{activeDealerDetail.phone || '+91 98220 11223'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#64748b] uppercase block">Assigned Distributor</span>
                  <span className="font-bold text-[#14532d]">{activeDealerDetail.distributorName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#64748b] uppercase block">Account Status</span>
                  <StatusBadge status={activeDealerDetail.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#f0fdf4] border border-[#86efac] rounded-lg">
                  <span className="text-[10px] font-bold text-[#15803d] uppercase block">Credit Limit Approved</span>
                  <span className="text-base font-extrabold text-[#14532d]">
                    ₹{activeDealerDetail.creditLimit.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3 bg-[#fef2f2] border border-[#fca5a5] rounded-lg">
                  <span className="text-[10px] font-bold text-[#dc2626] uppercase block">Ledger Outstanding</span>
                  <span className="text-base font-extrabold text-[#b91c1c]">
                    ₹{activeDealerDetail.outstandingBalance.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#e2e8f0]">
                <button
                  onClick={() => {
                    if (onSelectDealer) onSelectDealer(activeDealerDetail);
                    setActiveDealerDetail(null);
                  }}
                  className="px-4 py-1.5 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs rounded cursor-pointer"
                >
                  View Complete Profile & Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Dealer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#cbd5e1] w-full max-w-md p-5 rounded-lg shadow-2xl">
            <h3 className="text-sm font-bold text-[#14532d] uppercase border-b border-[#e2e8f0] pb-2 mb-4 flex items-center justify-between">
              <span>Add New Dealer Record</span>
              <button onClick={() => setShowAddModal(false)} className="text-[#64748b] hover:text-[#0f172a]">✕</button>
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">Business Store Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kisan Agro Agencies"
                  className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">Proprietor Name *</label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Ramesh Patil"
                  className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">City / Market Yard *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Satara Market Depot"
                  className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">Approved Credit Limit (₹)</label>
                <input
                  type="number"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  placeholder="200000"
                  className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-[#f1f5f9] text-[#475569] font-bold text-xs rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs rounded"
                >
                  Save Dealer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
