import React, { useState, useEffect } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';
import api from 'api/client';
import { AdminProducts as StitchAdminProducts } from '../../views/admin/AdminProducts';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/products/products/');
      if (Array.isArray(res.data)) {
        const mappedProducts = res.data.map((p) => ({
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
    } catch (err) {
      console.error('Error fetching products API:', err);
      setError(err?.response?.data?.error || 'Failed to load products from database.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = (newProd) => {
    setProducts((prev) => [newProd, ...prev]);
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
            <Button color="inherit" size="small" startIcon={<ReloadOutlined />} onClick={fetchProducts}>
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
    <StitchAdminProducts
      products={products}
      onAddProduct={handleAddProduct}
    />
  );
}
