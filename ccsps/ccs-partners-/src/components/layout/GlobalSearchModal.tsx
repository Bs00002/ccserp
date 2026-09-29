import React, { useState, useEffect } from 'react';
import { Order, Dealer, Product, Distributor } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  dealers: Dealer[];
  products: Product[];
  distributors?: Distributor[];
  onSelectOrder?: (order: Order) => void;
  onSelectDealer?: (dealer: Dealer) => void;
  onSelectProduct?: (product: Product) => void;
  onSelectTab?: (tab: string) => void;
  onSelectResult?: (type: string, item: any) => void;
}

const MOCK_FIELD_STAFF: any[] = [];
const MOCK_REGISTRATIONS: any[] = [];

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  orders,
  dealers,
  products,
  distributors = [],
  onSelectOrder,
  onSelectDealer,
  onSelectProduct,
  onSelectTab,
  onSelectResult,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const term = (searchTerm || '').toLowerCase().trim();

  const handleChooseOrder = (ord: Order) => {
    if (onSelectOrder) onSelectOrder(ord);
    if (onSelectTab) onSelectTab('orders');
    if (onSelectResult) onSelectResult('order', ord);
    onClose();
  };

  const handleChooseDealer = (dlr: Dealer) => {
    if (onSelectDealer) onSelectDealer(dlr);
    if (onSelectTab) onSelectTab('dealers');
    if (onSelectResult) onSelectResult('dealer', dlr);
    onClose();
  };

  const handleChooseProduct = (prd: Product) => {
    if (onSelectProduct) onSelectProduct(prd);
    if (onSelectTab) onSelectTab('products');
    if (onSelectResult) onSelectResult('product', prd);
    onClose();
  };

  const handleChooseTab = (tab: string) => {
    if (onSelectTab) onSelectTab(tab);
    onClose();
  };

  const matchedOrders = term
    ? orders.filter(
        (o) =>
          (o.orderNumber || '').toLowerCase().includes(term) ||
          (o.dealerName || '').toLowerCase().includes(term) ||
          (o.dealerCode || '').toLowerCase().includes(term)
      )
    : orders.slice(0, 2);

  const matchedDealers = term
    ? dealers.filter(
        (d) =>
          (d.name || '').toLowerCase().includes(term) ||
          (d.code || '').toLowerCase().includes(term) ||
          (d.city || '').toLowerCase().includes(term)
      )
    : dealers.slice(0, 2);

  const matchedProducts = term
    ? products.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(term) ||
          (p.code || '').toLowerCase().includes(term) ||
          (p.category || '').toLowerCase().includes(term)
      )
    : products.slice(0, 2);

  const matchedDistributors = term
    ? distributors.filter(
        (d) =>
          (d.name || '').toLowerCase().includes(term) ||
          (d.code || '').toLowerCase().includes(term) ||
          (d.territory || '').toLowerCase().includes(term)
      )
    : (distributors || []).slice(0, 2);

  const matchedStaff = term
    ? MOCK_FIELD_STAFF.filter(
        (e) =>
          e.name.toLowerCase().includes(term) ||
          e.code.toLowerCase().includes(term) ||
          e.territory.toLowerCase().includes(term)
      )
    : MOCK_FIELD_STAFF.slice(0, 2);

  const matchedRegs = term
    ? MOCK_REGISTRATIONS.filter(
        (r) =>
          r.applicantName.toLowerCase().includes(term) ||
          r.businessName.toLowerCase().includes(term) ||
          r.city.toLowerCase().includes(term)
      )
    : MOCK_REGISTRATIONS.slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/50 p-4">
      <div className="bg-white border border-[#cbd5e1] w-full max-w-2xl shadow-2xl rounded-lg overflow-hidden animate-fadeIn font-body text-xs">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-[#e2e8f0] bg-[#f8fafc]">
          <span className="material-symbols-outlined text-[#16a34a] text-[22px] mr-3">search</span>
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Dealers, Distributors, Field Staff, Products, Orders, Registrations... (ESC to close)"
            className="w-full bg-transparent text-sm font-medium text-[#0f172a] focus:outline-none placeholder-[#94a3b8]"
          />
          <button
            onClick={onClose}
            className="text-[11px] font-bold px-2 py-1 bg-[#e2e8f0] text-[#475569] rounded hover:bg-[#cbd5e1] cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Search Results Container */}
        <div className="max-h-[440px] overflow-y-auto p-4 space-y-4 divide-y divide-[#e2e8f0]">
          {/* Dealers Section */}
          {matchedDealers.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-[#14532d] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#16a34a]">storefront</span>
                Dealers ({matchedDealers.length})
              </div>
              <div className="space-y-1">
                {matchedDealers.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => handleChooseDealer(d)}
                    className="p-2 hover:bg-[#f0fdf4] rounded cursor-pointer transition-colors flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-[#0f172a]">{d.name}</span>
                      <span className="text-[10px] text-[#64748b] ml-2">({d.code} • {d.city})</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#16a34a]">View Dealer →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Distributors & Staff Section */}
          {(matchedDistributors.length > 0 || matchedStaff.length > 0) && (
            <div className="pt-3">
              <div className="text-[10px] font-bold text-[#14532d] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#16a34a]">badge</span>
                Distributors & Field Staff
              </div>
              <div className="space-y-1">
                {matchedDistributors.map((dist) => (
                  <div
                    key={dist.id}
                    onClick={() => handleChooseTab('distributors')}
                    className="p-2 hover:bg-[#f0fdf4] rounded cursor-pointer transition-colors flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-[#0f172a]">{dist.name}</span>
                      <span className="px-1.5 py-0.5 bg-[#dcfce7] text-[#14532d] text-[9px] font-bold rounded ml-2 uppercase">Distributor</span>
                      <span className="text-[10px] text-[#64748b] ml-2">({dist.territory})</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#16a34a]">Open Network →</span>
                  </div>
                ))}
                {matchedStaff.map((staff) => (
                  <div
                    key={staff.id}
                    onClick={() => handleChooseTab('distributors')}
                    className="p-2 hover:bg-[#f0fdf4] rounded cursor-pointer transition-colors flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-[#0f172a]">{staff.name}</span>
                      <span className="px-1.5 py-0.5 bg-[#e0f2fe] text-[#0369a1] text-[9px] font-bold rounded ml-2 uppercase">Field Staff</span>
                      <span className="text-[10px] text-[#64748b] ml-2">({staff.designation} • {staff.territory})</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#16a34a]">Open Directory →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders Section */}
          {matchedOrders.length > 0 && (
            <div className="pt-3">
              <div className="text-[10px] font-bold text-[#14532d] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#16a34a]">shopping_cart</span>
                Orders ({matchedOrders.length})
              </div>
              <div className="space-y-1">
                {matchedOrders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => handleChooseOrder(ord)}
                    className="p-2 hover:bg-[#f0fdf4] rounded cursor-pointer transition-colors flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-[#14532d]">{ord.orderNumber}</span>
                      <span className="text-[#0f172a] font-medium ml-2">— {ord.dealerName}</span>
                      <span className="text-[10px] text-[#64748b] ml-2">(₹{(ord.grandTotal || 0).toLocaleString('en-IN')})</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#16a34a]">View Order →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products Section */}
          {matchedProducts.length > 0 && (
            <div className="pt-3">
              <div className="text-[10px] font-bold text-[#14532d] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#16a34a]">inventory_2</span>
                Products ({matchedProducts.length})
              </div>
              <div className="space-y-1">
                {matchedProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleChooseProduct(p)}
                    className="p-2 hover:bg-[#f0fdf4] rounded cursor-pointer transition-colors flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-[#0f172a]">{p.name}</span>
                      <span className="text-[10px] text-[#64748b] ml-2">({p.code} • {p.category})</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#16a34a]">Catalog Details →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registration Approvals Section */}
          {matchedRegs.length > 0 && (
            <div className="pt-3">
              <div className="text-[10px] font-bold text-[#14532d] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#16a34a]">how_to_reg</span>
                Registration Approvals ({matchedRegs.length})
              </div>
              <div className="space-y-1">
                {matchedRegs.map((reg) => (
                  <div
                    key={reg.id}
                    onClick={() => handleChooseTab('registration-approval')}
                    className="p-2 hover:bg-[#f0fdf4] rounded cursor-pointer transition-colors flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-[#0f172a]">{reg.applicantName}</span>
                      <span className="text-[10px] text-[#64748b] ml-2">({reg.businessName} • {reg.role} • {reg.city})</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#16a34a]">Audit Registration →</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
