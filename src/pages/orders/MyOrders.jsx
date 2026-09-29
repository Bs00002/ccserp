import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Stack, Button, Chip, Grid, Paper, IconButton } from '@mui/material';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import EnterpriseTable from 'components/ui/EnterpriseTable';
import MainCard from 'components/MainCard';
import api from 'api/client';
import { formatINR } from 'data/ccsMock';
import useAuth from 'hooks/useAuth';
import useRealtime from 'hooks/useRealtime';

export default function MyOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders/orders/');
      const myOrders = (Array.isArray(res.data) ? res.data : []).map((o, idx) => ({
        id: o.id || idx + 1,
        orderCode: o.order_number || `ORD-${o.id}`,
        dealerName: o.dealer_name || (o.dealer?.company_name || o.dealer?.name) || 'Direct Dealer',
        product: o.items?.[0]?.product_name || (o.items && o.items.length > 0 ? `${o.items.length} Products` : 'No Products'),
        quantity: o.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0,
        gst: '18%',
        totalAmount: parseFloat(o.total_amount || 0),
        date: o.created_at ? new Date(o.created_at).toLocaleDateString() : '-',
        remarks: o.remarks || '-',
        status: o.status || 'Pending Approval'
      }));
      setOrders(myOrders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  // Real-time listener: auto-update on order status changes (approved, rejected, bilty, dispatched)
  useRealtime(
    ['order.created', 'order.updated', 'order.approved', 'order.bilty_created', 'order.lr_created', 'order.dispatched'],
    () => {
      fetchMyOrders();
    }
  );

  const columns = [
    { field: 'orderCode', headerName: 'Order ID', flex: 1, minWidth: 120, renderCell: (params) => <Typography fontWeight={700} color="#1a237e">{params.value}</Typography> },
    { field: 'dealerName', headerName: 'Dealer Name', flex: 1.5, minWidth: 150, renderCell: (params) => <Typography fontWeight={700} color="#101828">{params.value}</Typography> },
    { field: 'product', headerName: 'Products', flex: 1.5, minWidth: 150 },
    { field: 'quantity', headerName: 'Qty', flex: 0.8, minWidth: 80, renderCell: (params) => <Typography fontWeight={700}>{params.value} Units</Typography> },
    {
      field: 'totalAmount',
      headerName: 'Amount',
      flex: 1.3,
      minWidth: 120,
      renderCell: (params) => (
        <Typography fontWeight={800} color="#2e7d32">
          {formatINR(params.value)}
        </Typography>
      )
    },
    { field: 'date', headerName: 'Date', flex: 1, minWidth: 100, renderCell: (params) => <Typography variant="body2" color="textSecondary">{params.value}</Typography> },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1.2,
      minWidth: 130,
      renderCell: (params) => {
        const color = params.value === 'Pending Approval' ? 'warning' : 
                      params.value === 'Approved' ? 'success' : 
                      params.value === 'Cancelled' ? 'error' : 'success';
        return <Chip label={params.value} color={color} size="small" sx={{ fontWeight: 700, height: 24, fontSize: '0.72rem' }} />;
      }
    },
    {
      field: 'action',
      headerName: 'Action',
      flex: 0.8,
      minWidth: 90,
      renderCell: () => (
        <IconButton size="small" color="success">
          <EyeOutlined />
        </IconButton>
      )
    }
  ];

  return (
    <Grid container rowSpacing={3} columnSpacing={2.75}>
      {/* Header */}
      <Grid item xs={12}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
          <Box>
            <Typography variant="h4" fontWeight={800} color="#101828" sx={{ letterSpacing: '-0.5px' }}>
              My Created Orders
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.2 }}>
              View and track all orders created for your assigned dealers.
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            color="success"
            startIcon={<PlusOutlined />} 
            onClick={() => navigate('/field/orders/create')}
            sx={{ fontWeight: 800, px: 3, py: 1, boxShadow: 'none' }}
          >
            + Create New Order
          </Button>
        </Stack>
      </Grid>

      {/* KPI Cards Row */}
      <Grid item xs={12} sm={6} md={3}>
        <Paper elevation={0} sx={{ p: 2, border: '1px solid #eaecf0', borderRadius: 2 }}>
          <Typography variant="caption" fontWeight={700} color="textSecondary">TOTAL CREATED ORDERS</Typography>
          <Typography variant="h4" fontWeight={800} color="#101828" sx={{ mt: 0.5 }}>12 Orders</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Paper elevation={0} sx={{ p: 2, border: '1px solid #ffe0b2', bgcolor: '#fff8e1', borderRadius: 2 }}>
          <Typography variant="caption" fontWeight={700} color="#f57f17">PENDING APPROVAL</Typography>
          <Typography variant="h4" fontWeight={800} color="#e65100" sx={{ mt: 0.5 }}>3 Orders</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Paper elevation={0} sx={{ p: 2, border: '1px solid #c8e6c9', bgcolor: '#e8f5e9', borderRadius: 2 }}>
          <Typography variant="caption" fontWeight={700} color="#2e7d32">APPROVED ORDERS</Typography>
          <Typography variant="h4" fontWeight={800} color="#1b5e20" sx={{ mt: 0.5 }}>8 Orders</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Paper elevation={0} sx={{ p: 2, border: '1px solid #c5cae9', bgcolor: '#e8eaf6', borderRadius: 2 }}>
          <Typography variant="caption" fontWeight={700} color="#283593">DELIVERED TO DEALER</Typography>
          <Typography variant="h4" fontWeight={800} color="#1a237e" sx={{ mt: 0.5 }}>1 Order</Typography>
        </Paper>
      </Grid>

      {/* Table Section */}
      <Grid item xs={12}>
        <MainCard title="Orders Management Table" content={false}>
          <EnterpriseTable 
            rows={orders}
            columns={columns}
            loading={loading}
          />
        </MainCard>
      </Grid>
    </Grid>
  );
}


