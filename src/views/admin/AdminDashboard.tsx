import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { KpiCard } from '../../components/common/KpiCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import type { Order, Dealer, Product, FieldActivity } from '../../types/stitchTypes';

interface AdminDashboardProps {
  orders?: Order[];
  dealers?: Dealer[];
  products?: Product[];
  fieldActivities?: FieldActivity[];
  distributors?: any[];
  expenses?: any[];
  kpiData?: any;
  onSelectOrder?: (order: Order) => void;
  onNavigate?: (view: string) => void;
  onCreateOrder?: () => void;
}

const SALES_GRAPH_DATA = [
  { month: 'May', sales: 62 },
  { month: 'Jun', sales: 85 },
  { month: 'Jul', sales: 94 },
  { month: 'Aug', sales: 112 },
  { month: 'Sep', sales: 105 },
  { month: 'Oct', sales: 120 },
];

const ORDER_STATUS_PIE = [
  { name: 'Delivered', value: 45, color: '#1B5E20' },
  { name: 'Processing', value: 25, color: '#2E7D32' },
  { name: 'Dispatched', value: 18, color: '#81C784' },
  { name: 'Pending', value: 8, color: '#F57F17' },
  { name: 'Cancelled', value: 4, color: '#C62828' },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders = [],
  dealers = [],
  products = [],
  fieldActivities = [],
  distributors = [],
  expenses: _expenses = [],
  kpiData,
  onSelectOrder,
  onNavigate,
}) => {
  const [timeFilter, setTimeFilter] = useState('This Month');

  const lowStockCount = products.filter((p) => p.status === 'Low Stock' || p.status === 'Out of Stock').length;

  const totalSalesVal = kpiData?.total_sales_display
    ?? (orders.length > 0 ? '₹' + orders.reduce((s, o) => s + (o.grandTotal || 0), 0).toLocaleString('en-IN') : '₹0');
  const todayOrdersVal = kpiData?.today_orders_count ?? 0;
  const pendingOrdersVal = kpiData?.pending_orders_count ?? orders.filter((o) => o.status === 'Pending Approval').length;
  const totalDealersVal = kpiData?.total_dealers_count ?? dealers.length;
  const totalDistributorsVal = kpiData?.total_distributors_count ?? distributors?.length ?? 0;
  const activeStaffVal = kpiData?.active_field_staff_count ?? fieldActivities?.length ?? 0;
  const totalProductsVal = kpiData?.total_products_count ?? products.length;
  const lowStockVal = kpiData?.low_stock_count ?? lowStockCount;

  const salesGraph = kpiData?.sales_graph_data && kpiData.sales_graph_data.length > 0
    ? kpiData.sales_graph_data
    : SALES_GRAPH_DATA;

  const orderStatusPie = kpiData?.order_status_distribution && kpiData.order_status_distribution.length > 0
    ? kpiData.order_status_distribution
    : ORDER_STATUS_PIE;

  return (
    <div className="space-y-6 font-body bg-[#F5FBF6] p-2 md:p-4 rounded-2xl">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#A5D6A7]/30 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1B5E20] tracking-tight">
            Admin Command Dashboard
          </h1>
          <p className="text-xs text-[#525252] mt-1 font-medium">
            Company-wide operational oversight for Chitra Crop Science Pvt. Ltd.
          </p>
        </div>

        {/* Header CTA Action Buttons */}
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate && onNavigate('products')}
            className="px-4 py-2 text-xs font-bold border border-[#2E7D32] text-[#2E7D32] bg-white hover:bg-[#E8F5E9] rounded-lg transition-all cursor-pointer shadow-xs"
          >
            + Add Product
          </button>
          <button
            onClick={() => onNavigate && onNavigate('dealers')}
            className="px-4 py-2 text-xs font-bold border border-[#2E7D32] text-[#2E7D32] bg-white hover:bg-[#E8F5E9] rounded-lg transition-all cursor-pointer shadow-xs"
          >
            + Add Dealer
          </button>
          <button
            onClick={() => onNavigate && onNavigate('orders')}
            className="px-5 py-2 text-xs font-bold bg-[#2E7D32] text-white hover:bg-[#1B5E20] rounded-lg transition-all cursor-pointer shadow-md"
          >
            + Create Order
          </button>
        </div>
      </div>

      {/* KPI 8-Card Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="TOTAL SALES"
          value={totalSalesVal}
          icon="trending_up"
          trend="up"
          onClick={() => onNavigate && onNavigate('orders')}
        />
        <KpiCard
          label="TODAY'S ORDERS"
          value={todayOrdersVal}
          icon="shopping_bag"
          trend="up"
          onClick={() => onNavigate && onNavigate('orders')}
        />
        <KpiCard
          label="PENDING ORDERS"
          value={pendingOrdersVal}
          icon="pending_actions"
          accentBorder="yellow"
          onClick={() => onNavigate && onNavigate('orders')}
        />
        <KpiCard
          label="TOTAL DEALERS"
          value={totalDealersVal}
          icon="storefront"
          trend="up"
          onClick={() => onNavigate && onNavigate('dealers')}
        />

        <KpiCard
          label="TOTAL DISTRIBUTORS"
          value={totalDistributorsVal}
          icon="groups"
          trend="up"
          onClick={() => onNavigate && onNavigate('distributors')}
        />
        <KpiCard
          label="ACTIVE FIELD STAFF"
          value={activeStaffVal}
          icon="directions_run"
          trend="up"
          onClick={() => onNavigate && onNavigate('field-ops')}
        />
        <KpiCard
          label="TOTAL PRODUCTS"
          value={totalProductsVal}
          icon="inventory_2"
          onClick={() => onNavigate && onNavigate('products')}
        />
        <KpiCard
          label="LOW STOCK"
          value={lowStockVal}
          icon="warning"
          accentBorder="red"
          onClick={() => onNavigate && onNavigate('inventory')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Overview Line/Area Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
          <div className="flex justify-between items-center mb-4 border-b border-[#e2e8f0] pb-3">
            <h3 className="text-xs font-bold text-[#1B5E20] uppercase tracking-wider">
              Sales Overview (₹ Lakhs)
            </h3>
            <div className="flex gap-1.5">
              {['7 Days', '30 Days', 'This Month', 'This Year'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeFilter(tf)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    timeFilter === tf
                      ? 'bg-[#2E7D32] text-white border border-[#2E7D32]'
                      : 'bg-[#E8F5E9] text-[#1B5E20] border border-[#A5D6A7] hover:bg-[#C8E6C9]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesGraph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2E7D32" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8F5E9" />
                <XAxis dataKey="month" stroke="#1B5E20" fontSize={11} fontWeight={600} />
                <YAxis stroke="#1B5E20" fontSize={11} fontWeight={600} />
                <Tooltip
                  formatter={(val: any) => [`₹${val} Lakhs`, 'Sales']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#2E7D32', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#2E7D32" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Donut Chart */}
        <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
          <h3 className="text-xs font-bold text-[#1B5E20] uppercase tracking-wider mb-2 border-b border-[#e2e8f0] pb-3">
            Order Status Breakdown
          </h3>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {orderStatusPie.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [val, 'Orders']} />
                <Legend iconSize={8} layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables / Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs overflow-x-auto">
          <div className="flex justify-between items-center mb-4 border-b border-[#e2e8f0] pb-3">
            <h3 className="text-xs font-bold text-[#1B5E20] uppercase tracking-wider">Recent Orders</h3>
            <button
              onClick={() => onNavigate && onNavigate('orders')}
              className="text-[#2E7D32] text-xs font-bold hover:underline cursor-pointer"
            >
              View All Orders ➔
            </button>
          </div>

          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#E8F5E9] text-[#1B5E20] border-b border-[#A5D6A7]">
              <tr>
                <th className="px-4 py-3 font-bold">Order ID</th>
                <th className="px-4 py-3 font-bold">Dealer</th>
                <th className="px-4 py-3 font-bold">Amount</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {orders.map((ord) => (
                <tr
                  key={ord.id}
                  onClick={() => onSelectOrder && onSelectOrder(ord)}
                  className="hover:bg-[#F5FBF6] transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 font-bold text-[#2E7D32]">{ord.orderNumber}</td>
                  <td className="px-4 py-3 font-semibold text-[#161616]">{ord.dealerName}</td>
                  <td className="px-4 py-3 font-bold text-[#1B5E20]">
                    ₹{ord.grandTotal.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ord.status} />
                  </td>
                  <td className="px-4 py-3 text-[#525252] font-medium">{ord.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Field Activity Timeline */}
        <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs">
          <h3 className="text-xs font-bold text-[#1B5E20] uppercase tracking-wider mb-4 border-b border-[#e2e8f0] pb-3">
            Field Activity Log
          </h3>

          <div className="space-y-3">
            {fieldActivities.map((fa) => (
              <div key={fa.id} className="p-3 bg-[#F5FBF6] rounded-xl border border-[#A5D6A7]/40 hover:border-[#2E7D32] transition-all">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs text-[#1B5E20]">{fa.employeeName}</span>
                  <span className="text-[10px] text-[#525252] font-bold">{fa.time}</span>
                </div>
                <p className="text-xs text-[#525252] font-medium">{fa.action}</p>
                <div className="text-xs text-[#2E7D32] mt-1 font-bold">📍 {fa.location}</div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate && onNavigate('field-ops')}
            className="w-full mt-4 text-[#2E7D32] text-xs font-bold hover:underline text-center cursor-pointer block"
          >
            View Full Activity Log ➔
          </button>
        </div>
      </div>
    </div>
  );
};

