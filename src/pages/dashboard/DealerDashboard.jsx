import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';
import useAuth from 'hooks/useAuth';
import api from 'api/client';
import { DealerDashboard as CanonicalDealerDashboard } from '../../views/dealer/DealerDashboard';

export default function DealerDashboardPage({ data: dashboardData }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUser = {
    id: user?.id || 'dealer-id',
    name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'Dealer',
    email: user?.email || 'dealer@chitracropscience.com',
    role: 'DEALER',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    phone: user?.phone || '—',
    code: user?.ccs_id || `DLR-${(user?.id || '01').slice(0, 6)}`,
    businessName: user?.company_name || 'Kisan Agro Center',
    city: user?.city || 'Depot',
  };

  const fetchDealerData = async () => {
    setLoading(true);
    setError(null);
    try {
      const ordersRes = await api.get('/orders/orders/');

      if (Array.isArray(ordersRes.data)) {
        const mappedOrders = ordersRes.data.map((o) => ({
          id: String(o.id),
          orderNumber: o.order_number || `ORD-${o.id}`,
          date: new Date(o.created_at || Date.now()).toISOString().split('T')[0],
          dealerName: currentUser.businessName,
          dealerCode: currentUser.code,
          dealerCity: currentUser.city,
          distributorName: o.created_by_name || 'CCS Logistics',
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
    } catch (err) {
      console.error('Error fetching dealer data:', err);
      setError(err?.response?.data?.error || 'Failed to connect to backend orders database.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealerData();
  }, [currentUser.businessName, currentUser.city, currentUser.code]);

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
            <Button color="inherit" size="small" startIcon={<ReloadOutlined />} onClick={fetchDealerData}>
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
    <CanonicalDealerDashboard
      currentUser={currentUser}
      orders={orders}
      onCreateOrder={() => navigate('/dealer/orders')}
      onOpenInvoices={() => navigate('/dealer/invoices')}
      onSelectOrder={() => navigate('/dealer/orders')}
    />
  );
}
