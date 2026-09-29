import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';
import api from 'api/client';
import { CreateOrderWizard as StitchCreateOrderWizard } from '../../views/orders/CreateOrderWizard';

export default function OrderCreate() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrderCreateData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, dealersRes] = await Promise.all([
        api.get('/products/products/'),
        api.get('/admin/users/?role=Dealer'),
      ]);

      if (Array.isArray(productsRes.data)) {
        const mappedProducts = productsRes.data.map((p) => ({
          id: String(p.id),
          name: p.name,
          code: `PRD-${p.id}`,
          category: p.category_name || 'Bio Products',
          technicalName: p.technical_name || 'Active Formulation',
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
    } catch (err) {
      console.error('Error fetching order create data:', err);
      setError(err?.response?.data?.error || 'Failed to load products or dealers from database.');
      setProducts([]);
      setDealers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderCreateData();
  }, []);

  const handleOrderSubmitted = () => {
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
            <Button color="inherit" size="small" startIcon={<ReloadOutlined />} onClick={fetchOrderCreateData}>
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
    <StitchCreateOrderWizard
      dealers={dealers}
      products={products}
      onOrderSubmitted={handleOrderSubmitted}
      onCancel={() => navigate('/admin/orders')}
    />
  );
}
