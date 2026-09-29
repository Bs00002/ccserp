import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Grid, Typography, Box, Stack, Button, Chip, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Paper, Divider
} from '@mui/material';
import MainCard from 'components/MainCard';
import api from 'api/client';
import useAuth from 'hooks/useAuth';
import { formatINR } from 'data/ccsMock'; 
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined, CarOutlined, HomeOutlined, PrinterOutlined } from '@ant-design/icons';

const statusColorMap = {
  Draft: 'default',
  Pending: 'warning',
  Approved: 'info',
  Packed: 'info',
  Dispatched: 'primary',
  Delivered: 'success',
  Rejected: 'error',
  Cancelled: 'error'
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [transportDetails, setTransportDetails] = useState('');
  const [lrNumber, setLrNumber] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/orders/${id}/`);
      setOrder(res.data);
      
      const tlRes = await api.get(`/orders/orders/${id}/timeline/`);
      setTimeline(tlRes.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load order');
      navigate('/orders');
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      if (action === 'approve') {
        await api.post(`/orders/orders/${id}/approve/`);
      } else if (action === 'cancel') {
        await api.post(`/orders/orders/${id}/reject/`);
      } else {
        await api.post(`/orders/orders/${id}/update_status/`, { status: action });
      }
      fetchOrder();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateBilty = async () => {
    setActionLoading(true);
    try {
      await api.post(`/orders/orders/${id}/generate_bilty/`, {
        bilty_number: `BILTY-${order.order_number}`
      });
      fetchOrder();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to generate Bilty');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleDispatch = async () => {
    setActionLoading(true);
    try {
      await api.post(`/orders/orders/${id}/generate_lr/`, {
        transport_details: transportDetails,
        lr_number: lrNumber
      });
      setDispatchOpen(false);
      fetchOrder();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Dispatch failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (!order) return <Typography>Loading...</Typography>;

  const isAdmin = ['Super Admin', 'Admin'].includes(user.role);
  const isPending = order.status === 'Pending' || order.status === 'Pending Approval';
  const isApproved = order.status === 'Approved';
  const isReadyDispatch = order.status === 'Ready to Dispatch' || order.status === 'Ready Dispatch';
  const isDispatched = order.status === 'Dispatched';

  return (
    <Grid container rowSpacing={3} columnSpacing={2.75}>
      <Grid item xs={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
          <Stack direction="row" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate(-1)}><ArrowLeftOutlined /></IconButton>
            <Box>
              <Typography variant="h4">{order.order_number}</Typography>
              <Typography variant="body2" color="textSecondary">
                Placed on {new Date(order.created_at).toLocaleString()} by {order.created_by_name || 'System'}
              </Typography>
            </Box>
            <Chip label={order.status} color={statusColorMap[order.status] || 'default'} />
          </Stack>
          
          <Stack direction="row" gap={1}>
            <Button variant="outlined" startIcon={<PrinterOutlined />}>Print Invoice</Button>
            
            {isAdmin && isPending && (
              <>
                <Button variant="contained" color="success" startIcon={<CheckOutlined />} onClick={() => handleAction('approve')}>Approve</Button>
                <Button variant="contained" color="error" startIcon={<CloseOutlined />} onClick={() => handleAction('cancel')}>Reject</Button>
              </>
            )}
            
            {isAdmin && isApproved && (
              <Button variant="contained" color="secondary" onClick={handleGenerateBilty}>Generate Bilty</Button>
            )}

            {(isAdmin || user.role === 'Warehouse') && isReadyDispatch && (
              <Button variant="contained" color="primary" startIcon={<CarOutlined />} onClick={() => navigate('/admin/dispatch')}>Manage Dispatch</Button>
            )}
            
            {isAdmin && isDispatched && (
              <Button variant="contained" color="success" startIcon={<HomeOutlined />} onClick={() => handleAction('Delivered')}>Mark Delivered</Button>
            )}
            
            {user.role === 'Dealer' && isPending && (
              <Button variant="contained" color="error" startIcon={<CloseOutlined />} onClick={() => handleAction('cancel')}>Cancel Order</Button>
            )}
          </Stack>
        </Stack>
      </Grid>

      <Grid item xs={12} md={8}>
        <MainCard title="Order Items">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Rate</TableCell>
                  <TableCell align="right">Disc.</TableCell>
                  <TableCell align="right">GST %</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{item.product_name}</Typography>
                    </TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">{formatINR(item.rate)}</TableCell>
                    <TableCell align="right">{formatINR(item.discount)}</TableCell>
                    <TableCell align="right">{item.gst_percent}%</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{formatINR(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {order.remarks && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2">Remarks / Notes</Typography>
              <Typography variant="body2">{order.remarks}</Typography>
            </Box>
          )}
        </MainCard>
      </Grid>

      <Grid item xs={12} md={4}>
        <Stack spacing={3}>
          <MainCard title="Dealer Information">
            <Typography variant="subtitle1" fontWeight={600}>{order.dealer_name}</Typography>
          </MainCard>
          
          <MainCard title="Order Summary">
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="textSecondary">Subtotal</Typography>
                <Typography fontWeight={600}>{formatINR(order.subtotal)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="textSecondary">Total Discount</Typography>
                <Typography fontWeight={600}>{formatINR(order.discount)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="textSecondary">GST Tax</Typography>
                <Typography fontWeight={600}>{formatINR(order.gst_total)}</Typography>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="h6">Grand Total</Typography>
                <Typography variant="h6" color="primary">{formatINR(order.grand_total)}</Typography>
              </Stack>
            </Stack>
          </MainCard>
          
          <MainCard title="Order Timeline">
            <Stack spacing={2}>
              {timeline.map((item) => (
                <Box key={item.id} sx={{ p: 1.5, borderLeft: '2px solid', borderColor: 'primary.main', bgcolor: 'grey.50' }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="subtitle2">{item.status}</Typography>
                    <Typography variant="caption" color="textSecondary">{new Date(item.created_at).toLocaleString()}</Typography>
                  </Stack>
                  {item.remarks && <Typography variant="body2" sx={{ mt: 0.5 }}>{item.remarks}</Typography>}
                  <Typography variant="caption" color="textSecondary">By: {item.created_by_name}</Typography>
                </Box>
              ))}
              {timeline.length === 0 && <Typography variant="body2" color="textSecondary">No timeline events yet.</Typography>}
            </Stack>
          </MainCard>
        </Stack>
      </Grid>
      
      <Dialog open={dispatchOpen} onClose={() => setDispatchOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Dispatch Order</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>Transport Details</Typography>
              <input 
                type="text" 
                value={transportDetails} 
                onChange={(e) => setTransportDetails(e.target.value)} 
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                placeholder="e.g. VRL Logistics"
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>LR Number</Typography>
              <input 
                type="text" 
                value={lrNumber} 
                onChange={(e) => setLrNumber(e.target.value)} 
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                placeholder="LR Number"
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDispatchOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleDispatch} disabled={actionLoading}>Confirm Dispatch</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
