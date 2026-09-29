import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';
import api from 'api/client';
import { AdminDashboard as StitchAdminDashboard } from '../../views/admin/AdminDashboard';

export default function AdminDashboardPage({ data: dashboardData }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, dealersRes, productsRes] = await Promise.all([
        api.get('/orders/orders/'),
        api.get('/admin/users/?role=Dealer'),
        api.get('/products/products/'),
      ]);

      if (Array.isArray(ordersRes.data)) {
        const mappedOrders = ordersRes.data.map((o) => ({
          id: String(o.id),
          orderNumber: o.order_number || `ORD-${o.id}`,
          date: new Date(o.created_at || Date.now()).toISOString().split('T')[0],
          dealerName: o.dealer_name || 'Agri Store',
          dealerCode: `DLR-${o.dealer || '01'}`,
          dealerCity: 'Depot',
          distributorName: o.created_by_name || 'CCS Depot',
          status: o.status || 'Pending Approval',
          paymentStatus: o.payment_status || 'Pending',
          subtotal: parseFloat(o.subtotal || o.total_amount || 0),
          discount: parseFloat(o.discount || 0),
          tax: parseFloat(o.gst_total || 0),
          grandTotal: parseFloat(o.grand_total || o.total_amount || 0),
          items: (o.items || []).map((i) => ({
            id: String(i.id || Math.random()),
            productId: String(i.product),
            productName: i.product_name || 'Crop Product',
            productCode: 'PRD-01',
            packSize: '1 Ltr',
            quantity: i.quantity || 1,
            dealerPrice: parseFloat(i.rate || 0),
            mrp: parseFloat(i.rate || 0) * 1.2,
            subtotal: parseFloat(i.total || 0),
          })),
        }));
        setOrders(mappedOrders);
      } else {
        setOrders([]);
      }

      if (Array.isArray(dealersRes.data)) {
        const mappedDealers = dealersRes.data.map((d) => ({
          id: String(d.id),
          name: d.company_name || `${d.first_name || ''} ${d.last_name || ''}`.trim() || d.username,
          code: d.ccs_id || `DLR-${d.id.slice(0, 6)}`,
          ownerName: `${d.first_name || ''} ${d.last_name || ''}`.trim() || d.username,
          city: d.city || 'Depot',
          state: d.state || 'Gujarat',
          phone: d.phone || '—',
          email: d.email || '—',
          gstin: d.gstin || '—',
          creditLimit: parseFloat(d.credit_limit || 0),
          outstandingBalance: parseFloat(d.outstanding_amount || 0),
          status: d.is_active ? 'Active' : 'Inactive',
          distributorName: 'CCS Operations',
          territory: d.territory || 'General',
        }));
        setDealers(mappedDealers);
      } else {
        setDealers([]);
      }

      if (Array.isArray(productsRes.data)) {
        const mappedProducts = productsRes.data.map((p) => ({
          id: String(p.id),
          name: p.name,
          code: `PRD-${p.id}`,
          category: p.category_name || 'Crop Protection',
          technicalName: p.technical_name || '',
          packSize: p.packing || '1 Ltr',
          mrp: parseFloat(p.mrp || 0),
          dealerPrice: parseFloat(p.dealer_price || p.mrp || 0),
          distributorPrice: parseFloat(p.distributor_price || p.dealer_price || 0),
          gstRate: parseFloat(p.gst_rate || 18),
          stockQuantity: p.stock || 0,
          status: (p.stock || 0) <= (p.min_stock_level || 10) ? 'Low Stock' : 'In Stock',
        }));
        setProducts(mappedProducts);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard real data:', err);
      setError(err?.response?.data?.error || 'Failed to connect to backend database.');
      setOrders([]);
      setDealers([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleNavigate = (view) => {
    switch (view) {
      case 'products':
        navigate('/admin/products');
        break;
      case 'dealers':
        navigate('/admin/dealers');
        break;
      case 'distributors':
        navigate('/admin/employees');
        break;
      case 'orders':
        navigate('/admin/orders');
        break;
      case 'inventory':
        navigate('/admin/products');
        break;
      case 'field-ops':
        navigate('/admin/tracking');
        break;
      case 'attendance':
        navigate('/admin/attendance');
        break;
      case 'expenses':
        navigate('/admin/expenses');
        break;
      default:
        navigate('/admin/dashboard');
        break;
    }
  };

  const handleSelectOrder = () => {
    navigate('/admin/orders');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, maxWidth: 650, mx: 'auto', mt: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" startIcon={<ReloadOutlined />} onClick={fetchAdminData}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <StitchAdminDashboard
      orders={orders}
      dealers={dealers}
      products={products}
      kpiData={dashboardData}
      fieldActivities={[]}
      distributors={[]}
      expenses={[]}
      onNavigate={handleNavigate}
      onSelectOrder={handleSelectOrder}
    />
  );
}
