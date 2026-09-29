import React, { useState } from 'react';
import { Distributor } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { adminApi } from '../../api/client';

interface AdminDistributorsProps {
  distributors?: Distributor[];
  onAddDistributor?: (distributor: any) => void;
  onRefresh?: () => void;
}

export const AdminDistributors: React.FC<AdminDistributorsProps> = ({
  distributors = [],
  onAddDistributor,
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'distributors' | 'employees'>('distributors');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // KM Rate edit state
  const [editingEmpKm, setEditingEmpKm] = useState<{ id: string; name: string; kmRate: number } | null>(null);
  const [editRateInput, setEditRateInput] = useState<string>('5.00');
  const [savingKm, setSavingKm] = useState<boolean>(false);
  const [kmSuccessMsg, setKmSuccessMsg] = useState<string>('');

  // New Distributor Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [territory, setTerritory] = useState('');
  const [phone, setPhone] = useState('');
  const [monthlySalesPlan, setMonthlySalesPlan] = useState('');
  const [monthlyCollectionPlan, setMonthlyCollectionPlan] = useState('');
  const [kmRateInput, setKmRateInput] = useState('5.00');

  const handleSaveKmRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmpKm) return;
    const parsed = parseFloat(editRateInput);
    if (isNaN(parsed) || parsed < 0) {
      alert('Please enter a valid non-negative KM rate.');
      return;
    }
    setSavingKm(true);
    try {
      await adminApi.updateEmployeeKmRate(editingEmpKm.id, parsed);
      setKmSuccessMsg(`Successfully updated KM rate for ${editingEmpKm.name} to ₹${parsed}/KM`);
      setEditingEmpKm(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Failed to update KM rate: ' + (err?.message || 'Error occurred'));
    } finally {
      setSavingKm(false);
      setTimeout(() => setKmSuccessMsg(''), 4000);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ownerName || !territory) return;
    if (onAddDistributor) {
      onAddDistributor({
        id: `dist-${Date.now()}`,
        code: code || `DIST-${Math.floor(100 + Math.random() * 900)}`,
        name,
        ownerName,
        territory,
        phone: phone || '+91 98000 11122',
        dealersCount: 0,
        monthlySales: 0,
        monthlySalesPlan: parseFloat(monthlySalesPlan) || 0,
        monthlyCollectionPlan: parseFloat(monthlyCollectionPlan) || 0,
        outstandingBalance: 0,
        status: 'Active',
        kmRate: parseFloat(kmRateInput) || 5.0,
      });
    }
    setCode('');
    setName('');
    setOwnerName('');
    setTerritory('');
    setPhone('');
    setMonthlySalesPlan('');
    setMonthlyCollectionPlan('');
    setKmRateInput('5.00');
    setShowAddModal(false);
  };

  const filteredDistributors = (distributors || []).filter((d) => {
    const s = search.toLowerCase();
    return (
      (d.name || '').toLowerCase().includes(s) ||
      (d.code || '').toLowerCase().includes(s) ||
      (d.territory || '').toLowerCase().includes(s)
    );
  });

  const filteredEmployees = (distributors || []).map(d => ({
    id: d.id,
    code: d.code,
    name: d.ownerName || d.name,
    designation: 'Sales Executive / Distributor',
    territory: d.territory || 'General Territory',
    phone: d.phone,
    email: d.email || `${d.code.toLowerCase()}@ccs.com`,
    assignedDistributor: d.name,
    assignedDealersCount: d.dealersCount || 0,
    status: d.status || 'Active',
    kmRate: d.kmRate !== undefined && d.kmRate !== null ? Number(d.kmRate) : 5.0,
    monthlyTarget: `₹${((d.monthlySales || 100000) / 100000).toFixed(1)} Lakhs`,
    monthlySalesPlan: d.monthlySalesPlan ? `₹${(d.monthlySalesPlan / 100000).toFixed(1)} Lakhs` : `₹${((d.monthlySales || 100000) / 100000).toFixed(1)} Lakhs`,
    monthlyCollectionPlan: d.monthlyCollectionPlan ? `₹${(d.monthlyCollectionPlan / 100000).toFixed(1)} Lakhs` : `₹${(((d.monthlySales || 100000) * 0.85) / 100000).toFixed(1)} Lakhs`,
    achievement: '90%',
  })).filter((emp) => {
    const s = search.toLowerCase();
    return (
      emp.name.toLowerCase().includes(s) ||
      emp.code.toLowerCase().includes(s) ||
      emp.territory.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-5 font-body text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#14532d]">Distributor & Field Staff Operations</h1>
            <span className="px-2 py-0.5 bg-[#dcfce7] text-[#14532d] font-bold text-[10px] border border-[#86efac] rounded uppercase">
              NETWORK DIRECTORY
            </span>
          </div>
          <p className="text-xs text-[#64748b] mt-0.5">
            Manage territory distributors, B2B depot partners, field sales executives, employee KM travel rates, and territory assignments
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs rounded-md shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Add New {activeSubTab === 'distributors' ? 'Distributor' : 'Field Employee'}
        </button>
      </div>

      {kmSuccessMsg && (
        <div className="p-3 bg-[#dcfce7] text-[#15803d] border border-[#86efac] rounded-md font-bold text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {kmSuccessMsg}
        </div>
      )}

      {/* Sub-Tab Navigation Bar & Search */}
      <div className="bg-white p-3.5 border border-[#e2e8f0] rounded-lg shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Toggle Tabs */}
        <div className="flex items-center gap-1 bg-[#f8fafc] p-1 border border-[#cbd5e1] rounded-md">
          <button
            onClick={() => setActiveSubTab('distributors')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'distributors'
                ? 'bg-[#16a34a] text-white shadow-2xs'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">storefront</span>
            Territory Distributors ({distributors.length})
          </button>
          <button
            onClick={() => setActiveSubTab('employees')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'employees'
                ? 'bg-[#16a34a] text-white shadow-2xs'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">badge</span>
            Field Sales Staff ({filteredEmployees.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeSubTab === 'distributors' ? 'distributors, codes, territories...' : 'employees, design, region...'}`}
            className="w-full pl-8 pr-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-md text-xs text-[#0f172a] focus:outline-none focus:border-[#16a34a]"
          />
        </div>
      </div>

      {/* Distributors Table View */}
      {activeSubTab === 'distributors' && (
        <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#f8fafc] text-[#64748b] border-b border-[#e2e8f0] uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-3">Distributor Code</th>
                  <th className="p-3">Distributor Firm Name</th>
                  <th className="p-3">Proprietor / Owner</th>
                  <th className="p-3">Territory / Region</th>
                  <th className="p-3 text-center">Dealers Network</th>
                  <th className="p-3 text-right">Monthly Sales</th>
                  <th className="p-3 text-right">Monthly Sales Plan</th>
                  <th className="p-3 text-right">Monthly Collection Plan</th>
                  <th className="p-3 text-right">Ledger Balance</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {filteredDistributors.map((d) => (
                  <tr key={d.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="p-3 font-bold text-[#14532d]">{d.code}</td>
                    <td className="p-3 font-bold text-[#0f172a]">{d.name}</td>
                    <td className="p-3 text-[#64748b]">{d.ownerName}</td>
                    <td className="p-3 text-[#64748b] font-medium">{d.territory}</td>
                    <td className="p-3 text-center font-extrabold text-[#0f172a]">{d.dealersCount} Dealers</td>
                    <td className="p-3 text-right font-bold text-[#16a34a]">
                      ₹{(d.monthlySales || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right font-bold text-[#14532d]">
                      ₹{(d.monthlySalesPlan || (d.monthlySales || 0)).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right font-bold text-[#15803d]">
                      ₹{(d.monthlyCollectionPlan || Math.round((d.monthlySales || 0) * 0.85)).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right font-bold text-[#dc2626]">
                      ₹{(d.outstandingBalance || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={d.status} />
                    </td>
                  </tr>
                ))}
                {filteredDistributors.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-[#64748b]">
                      No distributor records found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Field Sales Staff View */}
      {activeSubTab === 'employees' && (
        <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#f8fafc] text-[#64748b] border-b border-[#e2e8f0] uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-3">Employee Code</th>
                  <th className="p-3">Sales Officer Name</th>
                  <th className="p-3">Designation</th>
                  <th className="p-3">Assigned Territory</th>
                  <th className="p-3">Parent Depot / Distributor</th>
                  <th className="p-3 text-center">Dealers Covered</th>
                  <th className="p-3 text-right">KM Rate (₹/KM)</th>
                  <th className="p-3 text-right">Target (Monthly)</th>
                  <th className="p-3 text-right">Monthly Sales Plan</th>
                  <th className="p-3 text-right">Monthly Collection Plan</th>
                  <th className="p-3 text-right">Achieved</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="p-3 font-bold text-[#14532d]">{emp.code}</td>
                    <td className="p-3">
                      <div className="font-bold text-[#0f172a]">{emp.name}</div>
                      <div className="text-[10px] text-[#64748b]">{emp.phone} • {emp.email}</div>
                    </td>
                    <td className="p-3 text-[#475569] font-medium">{emp.designation}</td>
                    <td className="p-3 text-[#15803d] font-bold">{emp.territory}</td>
                    <td className="p-3 text-[#64748b]">{emp.assignedDistributor}</td>
                    <td className="p-3 text-center font-bold text-[#0f172a]">{emp.assignedDealersCount}</td>
                    <td className="p-3 text-right font-mono font-bold text-[#14532d]">
                      ₹{emp.kmRate}/KM
                    </td>
                    <td className="p-3 text-right font-bold text-[#0f172a]">{emp.monthlyTarget}</td>
                    <td className="p-3 text-right font-bold text-[#14532d]">{emp.monthlySalesPlan}</td>
                    <td className="p-3 text-right font-bold text-[#16a34a]">{emp.monthlyCollectionPlan}</td>
                    <td className="p-3 text-right font-extrabold text-[#16a34a]">{emp.achievement}</td>
                    <td className="p-3">
                      <StatusBadge status={emp.status} />
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          setEditingEmpKm({ id: emp.id, name: emp.name, kmRate: emp.kmRate });
                          setEditRateInput(String(emp.kmRate));
                        }}
                        className="px-2 py-1 bg-[#f0fdf4] hover:bg-[#dcfce7] text-[#15803d] border border-[#86efac] rounded text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                        title="Edit Admin Assigned Travel KM Rate"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                        Set KM Rate
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={13} className="p-8 text-center text-[#64748b]">
                      No field staff records found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit KM Rate Modal */}
      {editingEmpKm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-[#cbd5e1] rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex justify-between items-center">
              <h3 className="font-bold text-sm text-[#14532d] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#16a34a]">directions_car</span>
                Set Employee KM Rate
              </h3>
              <button onClick={() => setEditingEmpKm(null)} className="text-[#64748b] hover:text-[#0f172a] cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveKmRate} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">Employee / Sales Officer</label>
                <div className="p-2 bg-[#f1f5f9] rounded text-xs font-bold text-[#0f172a]">
                  {editingEmpKm.name}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">
                  KM Rate (₹ per KM) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  required
                  value={editRateInput}
                  onChange={(e) => setEditRateInput(e.target.value)}
                  placeholder="e.g. 5.00"
                  className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs font-bold text-[#0f172a] focus:outline-none focus:border-[#16a34a]"
                />
                <p className="text-[10px] text-[#64748b] mt-1">
                  This rate is controlled only by Admin. Employee cannot edit or override this rate.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setEditingEmpKm(null)}
                  className="px-3 py-1.5 bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1] font-bold text-xs rounded hover:bg-[#e2e8f0] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingKm}
                  className="px-4 py-1.5 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs rounded shadow-2xs cursor-pointer"
                >
                  {savingKm ? 'Saving...' : 'Save KM Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbd5e1] rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex justify-between items-center">
              <h3 className="font-bold text-sm text-[#14532d]">
                Add New {activeSubTab === 'distributors' ? 'Distributor Partner' : 'Field Sales Officer'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#64748b] hover:text-[#0f172a] cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">
                  {activeSubTab === 'distributors' ? 'Distributor Code' : 'Employee Code'}
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={activeSubTab === 'distributors' ? 'DIST-301 (Auto-generated if empty)' : 'EMP-201'}
                  className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#16a34a]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">
                  {activeSubTab === 'distributors' ? 'Firm / Enterprise Name *' : 'Employee Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={activeSubTab === 'distributors' ? 'e.g. Kisan Agro Agency' : 'e.g. Rahul Sharma'}
                  className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#16a34a]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">
                  {activeSubTab === 'distributors' ? 'Proprietor / Contact Person *' : 'Role / Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder={activeSubTab === 'distributors' ? 'e.g. Ramesh Chandra' : 'e.g. Senior Sales Officer'}
                  className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#16a34a]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">Territory / Area *</label>
                <input
                  type="text"
                  required
                  value={territory}
                  onChange={(e) => setTerritory(e.target.value)}
                  placeholder="e.g. Nashik Rural, MH"
                  className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#16a34a]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98220 00000"
                  className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#16a34a]"
                />
              </div>

              {activeSubTab === 'employees' && (
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">KM Rate (₹ per KM)</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={kmRateInput}
                    onChange={(e) => setKmRateInput(e.target.value)}
                    placeholder="e.g. 5.00"
                    className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#16a34a]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">Monthly Sales Plan</label>
                <input
                  type="number"
                  value={monthlySalesPlan}
                  onChange={(e) => setMonthlySalesPlan(e.target.value)}
                  placeholder="e.g. 500000"
                  className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#16a34a]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">Monthly Collection Plan</label>
                <input
                  type="number"
                  value={monthlyCollectionPlan}
                  onChange={(e) => setMonthlyCollectionPlan(e.target.value)}
                  placeholder="e.g. 400000"
                  className="w-full px-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded text-xs text-[#0f172a] focus:outline-none focus:border-[#16a34a]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1] font-bold text-xs rounded hover:bg-[#e2e8f0] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs rounded shadow-2xs cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
