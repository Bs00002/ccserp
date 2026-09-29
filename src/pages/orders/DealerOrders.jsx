import React, { useState, useEffect, useMemo } from 'react';
import { Typography, Box, List, ListItem, ListItemText, ListItemButton, Divider, TextField, InputAdornment, Stack, Chip, Grid, Paper } from '@mui/material';
import MasterDetailLayout from 'components/ui/MasterDetailLayout';
import { SearchOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import api from 'api/client';
import useRealtime from 'hooks/useRealtime';
import { formatINR } from 'data/ccsMock';
import MainCard from 'components/MainCard';

export default function DealerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/orders/');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(o => ({
          id: String(o.id),
          orderNo: o.order_number || `ORD-2026-${o.id}`,
          orderDate: new Date(o.created_at || Date.now()).toLocaleDateString(),
          status: o.status || 'Approved',
          totalAmount: parseFloat(o.total_amount || o.total || 0),
          items: (o.items && Array.isArray(o.items)) ? o.items.map(item => ({
            productName: item.product_name || 'Agri Product',
            quantity: item.quantity || 1,
            unitPrice: parseFloat(item.rate || item.unit_price || 0),
            total: parseFloat(item.total || 0)
          })) : [
            { productName: 'Agri Product', quantity: 1, unitPrice: parseFloat(o.total || 0), total: parseFloat(o.total || 0) }
          ]
        }));
        setOrders(mapped);
        setSelectedId(mapped[0]?.id || null);
      } else {
        setOrders([]);
        setSelectedId(null);
      }
    } catch (err) {
      console.error('Failed to fetch dealer orders', err);
      setOrders([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Real-time listener: auto-refresh dealer orders on order events
  useRealtime(
    ['order.created', 'order.updated', 'order.approved', 'order.bilty_created', 'order.lr_created', 'order.dispatched'],
    () => {
      fetchOrders();
    }
  );

  const filteredOrders = useMemo(() => {
    return orders.filter(o =>
      o.orderNo.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some(i => i.productName.toLowerCase().includes(search.toLowerCase()))
    );
  }, [orders, search]);

  const selectedOrder = orders.find(o => o.id === selectedId) || orders[0];

  const masterContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, bgcolor: '#F9FAFB', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>My Orders</Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by order no or product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined style={{ color: '#9CA3AF' }} />
              </InputAdornment>
            ),
            sx: { bgcolor: '#fff', borderRadius: 1.5 }
          }}
        />
      </Box>
      <List sx={{ p: 0, flex: 1, overflowY: 'auto' }}>
        {filteredOrders.length === 0 ? (
          <Box p={3} textAlign="center">
            <Typography variant="body2" color="textSecondary">No orders found.</Typography>
          </Box>
        ) : (
          filteredOrders.map((o) => (
            <React.Fragment key={o.id}>
              <ListItemButton
                selected={selectedId === o.id}
                onClick={() => setSelectedId(o.id)}
                sx={{
                  py: 2,
                  px: 2,
                  bgcolor: selectedId === o.id ? 'primary.lighter' : 'transparent',
                  borderLeft: '4px solid',
                  borderColor: selectedId === o.id ? 'primary.main' : 'transparent',
                  '&:hover': { bgcolor: selectedId === o.id ? 'primary.lighter' : 'grey.100' }
                }}
              >
                <ListItemText
                  primary={<Typography variant="subtitle1" fontWeight={600}>{o.orderNo}</Typography>}
                  secondary={
                    <Box mt={0.5}>
                      <Typography variant="body2" color="textSecondary">Date: {o.orderDate}</Typography>
                      <Stack direction="row" justifyContent="space-between" mt={1}>
                        <Typography variant="body2" fontWeight={600} color="primary.main">{formatINR(o.totalAmount)}</Typography>
                        <Chip label={o.status} size="small" color={o.status === 'Delivered' ? 'success' : 'primary'} />
                      </Stack>
                    </Box>
                  }
                />
              </ListItemButton>
              <Divider />
            </React.Fragment>
          ))
        )}
      </List>
    </Box>
  );

  const detailContent = selectedOrder ? (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>Order #{selectedOrder.orderNo}</Typography>
          <Typography variant="body1" color="textSecondary">Order Date: {selectedOrder.orderDate}</Typography>
        </Box>
        <Chip
          icon={<ShoppingCartOutlined style={{ fontSize: '1rem' }} />}
          label={selectedOrder.status}
          color="success"
          sx={{ px: 1, height: 32, fontSize: '0.875rem', fontWeight: 600 }}
        />
      </Stack>

      <MainCard title="Order Summary" sx={{ mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={6} sm={4}>
            <Typography variant="caption" color="textSecondary">Order Number</Typography>
            <Typography variant="body1" fontWeight={600}>{selectedOrder.orderNo}</Typography>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Typography variant="caption" color="textSecondary">Order Date</Typography>
            <Typography variant="body1" fontWeight={600}>{selectedOrder.orderDate}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="textSecondary">Total Amount</Typography>
            <Typography variant="h5" color="primary.main" fontWeight={700}>{formatINR(selectedOrder.totalAmount)}</Typography>
          </Grid>
        </Grid>
      </MainCard>

      <MainCard title="Ordered Product List">
        <Stack spacing={2}>
          {selectedOrder.items?.map((item, idx) => (
            <Paper key={idx} sx={{ p: 2, bgcolor: 'grey.50', border: '1px solid #e2e8f0' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>{item.productName}</Typography>
                  <Typography variant="body2" color="textSecondary">Quantity: {item.quantity}</Typography>
                </Box>
                <Typography variant="h6" fontWeight={700} color="success.main">{formatINR(item.total)}</Typography>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </MainCard>
    </Box>
  ) : (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
      <Typography>Select an order to view details</Typography>
    </Box>
  );

  return (
    <MasterDetailLayout
      masterContent={masterContent}
      detailContent={detailContent}
      masterWidth={350}
    />
  );
}
