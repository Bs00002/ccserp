import React, { useState } from 'react';
import { Product } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

interface AdminProductsProps {
  products?: Product[];
  onAddProduct?: (product: any) => void;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({ products = [], onAddProduct }) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [techName, setTechName] = useState('');
  const [category, setCategory] = useState<'Fertilizers' | 'Pesticides' | 'Seeds' | 'Bio Products' | 'Fungicides'>('Fertilizers');
  const [packSize, setPackSize] = useState('5 Ltr');
  const [dealerPrice, setDealerPrice] = useState('1200');
  const [mrp, setMrp] = useState('1500');
  const [stock, setStock] = useState('100');

  const filtered = (products || []).filter((p) => {
    const s = (search || '').toLowerCase();
    const matchesSearch =
      (p.name || '').toLowerCase().includes(s) ||
      (p.code || '').toLowerCase().includes(s) ||
      (p.technicalName || '').toLowerCase().includes(s);

    const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;

    return matchesSearch && matchesCat;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (onAddProduct) {
      onAddProduct({
        code: `PROD-${Math.floor(100 + Math.random() * 900)}`,
        name,
        technicalName: techName || 'Bio Formulated Solution',
        category,
        packSize,
        mrp: parseFloat(mrp) || 1500,
        dealerPrice: parseFloat(dealerPrice) || 1200,
        distributorPrice: (parseFloat(dealerPrice) || 1200) * 0.88,
        stock: parseInt(stock, 10) || 100,
        reservedStock: 0,
        warehouse: 'Pune Central Warehouse',
        recommendedCrops: ['Cotton', 'Sugarcane'],
        dosage: '2 ml per Ltr',
        description: 'High performance agricultural input formulation.',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRaORDeQL1yJWnsuZaA7182MmMwWgFCn5swxKYj5afnL8sIu94UEh3Rq_u4E1KtUt-MNPaVTaQf170pVV8zIefECo10sUDtPTcac_51VqXsp05I1ENfVljdQ_y6awyb53Mx7tXuBoaplfloqBfCUTckhSLUWZSjvoUB4H98HHu-rXCsd2YkUKJvsjW7WevYxDX-HB1T1PgJxte1FH0yjgOEiNbYx_mt-UUxFFvLAWs1dRiuid10u6yLg',
        status: parseInt(stock, 10) > 10 ? 'In Stock' : 'Low Stock',
      });
    }

    setName('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 font-body text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e0e0e0] pb-4">
        <div>
          <h1 className="text-2xl font-light text-[#161616]">Product Master Catalog</h1>
          <p className="text-xs text-[#525252] mt-0.5">
            Chitra Crop Science formulation catalog, SKUs, pack sizes, B2B dealer rates, and warehouse stock
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="carbon-btn-primary text-xs h-9 px-4 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px] mr-1.5">add</span> Add New Product
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 border border-[#e0e0e0] flex flex-col md:flex-row justify-between gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product name, SKU, or technical chemical name..."
          className="flex-1 p-1.5 bg-[#f4f4f4] border border-[#e0e0e0] text-xs text-[#161616] focus:outline-none focus:border-[#0f62fe]"
        />

        <div className="flex gap-1 overflow-x-auto">
          {['ALL', 'Fertilizers', 'Pesticides', 'Seeds', 'Bio Products', 'Fungicides'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 text-xs font-semibold whitespace-nowrap cursor-pointer border ${
                categoryFilter === cat
                  ? 'bg-[#0f62fe] text-white border-[#0f62fe]'
                  : 'bg-[#f4f4f4] text-[#525252] border-[#e0e0e0] hover:bg-[#e0e0e0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white border border-[#e0e0e0] overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#f4f4f4] text-[#525252] border-b border-[#e0e0e0] uppercase text-[11px] tracking-wider">
            <tr>
              <th className="p-3 font-semibold">SKU Code</th>
              <th className="p-3 font-semibold">Product Name</th>
              <th className="p-3 font-semibold">Technical Formulation</th>
              <th className="p-3 font-semibold">Category</th>
              <th className="p-3 font-semibold">Pack Size</th>
              <th className="p-3 font-semibold text-right">MRP</th>
              <th className="p-3 font-semibold text-right">Dealer Price</th>
              <th className="p-3 font-semibold text-right">Warehouse Stock</th>
              <th className="p-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e0e0e0]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-[#64748b]">
                  No products available in the database.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-[#f4f4f4]">
                  <td className="p-3 font-bold text-[#0f62fe]">{p.code}</td>
                  <td className="p-3 font-bold text-[#161616]">{p.name}</td>
                  <td className="p-3 text-[#525252] max-w-xs truncate">{p.technicalName}</td>
                  <td className="p-3 text-[#525252]">{p.category}</td>
                  <td className="p-3 text-[#525252]">{p.packSize}</td>
                  <td className="p-3 text-right text-[#525252]">₹{p.mrp}</td>
                  <td className="p-3 text-right font-bold text-[#161616]">₹{p.dealerPrice}</td>
                  <td className="p-3 text-right font-bold text-[#161616]">{p.stock} Units</td>
                  <td className="p-3">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#e0e0e0] w-full max-w-md p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-[#161616] uppercase border-b border-[#e0e0e0] pb-2 mb-4">
              Add New Product Formulation
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#525252]">Product Brand Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. SuperGro Ultra"
                  className="w-full p-2 border border-[#e0e0e0] bg-[#f4f4f4] text-xs font-medium focus:outline-none focus:border-[#0f62fe]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#525252]">Technical Chemical Name</label>
                <input
                  type="text"
                  value={techName}
                  onChange={(e) => setTechName(e.target.value)}
                  placeholder="e.g. Emamectin Benzoate 5% SG"
                  className="w-full p-2 border border-[#e0e0e0] bg-[#f4f4f4] text-xs font-medium focus:outline-none focus:border-[#0f62fe]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#525252]">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-2 border border-[#e0e0e0] bg-[#f4f4f4] text-xs font-medium focus:outline-none focus:border-[#0f62fe]"
                  >
                    <option value="Fertilizers">Fertilizers</option>
                    <option value="Pesticides">Pesticides</option>
                    <option value="Seeds">Seeds</option>
                    <option value="Bio Products">Bio Products</option>
                    <option value="Fungicides">Fungicides</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#525252]">Pack Size</label>
                  <input
                    type="text"
                    value={packSize}
                    onChange={(e) => setPackSize(e.target.value)}
                    placeholder="e.g. 5 Ltr / 1 Kg"
                    className="w-full p-2 border border-[#e0e0e0] bg-[#f4f4f4] text-xs font-medium focus:outline-none focus:border-[#0f62fe]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#525252]">MRP (₹)</label>
                  <input
                    type="number"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    className="w-full p-2 border border-[#e0e0e0] bg-[#f4f4f4] text-xs font-medium focus:outline-none focus:border-[#0f62fe]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#525252]">Dealer Rate (₹)</label>
                  <input
                    type="number"
                    value={dealerPrice}
                    onChange={(e) => setDealerPrice(e.target.value)}
                    className="w-full p-2 border border-[#e0e0e0] bg-[#f4f4f4] text-xs font-medium focus:outline-none focus:border-[#0f62fe]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#525252]">Initial Stock</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full p-2 border border-[#e0e0e0] bg-[#f4f4f4] text-xs font-medium focus:outline-none focus:border-[#0f62fe]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-[#e0e0e0] text-[#161616]"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#0f62fe] text-white font-bold">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
