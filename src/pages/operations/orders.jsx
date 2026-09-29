import { useState, useMemo } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';

import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import api from 'api/client';
import CircularProgress from '@mui/material/CircularProgress';

const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
};

import SearchOutlined from '@ant-design/icons/SearchOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import ExportOutlined from '@ant-design/icons/ExportOutlined';
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import PrinterOutlined from '@ant-design/icons/PrinterOutlined';
import FilePdfOutlined from '@ant-design/icons/FilePdfOutlined';
import ShopOutlined from '@ant-design/icons/ShopOutlined';
import ScheduleOutlined from '@ant-design/icons/ScheduleOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import SendOutlined from '@ant-design/icons/SendOutlined';
import TruckOutlined from '@ant-design/icons/TruckOutlined';
import ShoppingOutlined from '@ant-design/icons/ShoppingOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';

const ORDER_STATUSES = [
  'All',
  'Draft',
  'Submitted',
  'Pending Approval',
  'Approved',
  'Packing',
  'Ready Dispatch',
  'Dispatched',
  'Delivered',
  'Completed'
];

const statusColorMap = {
  'Draft': 'default',
  'Submitted': 'secondary',
  'Pending Approval': 'warning',
  'Approved': 'info',
  'Packing': 'warning',
  'Ready Dispatch': 'info',
  'Dispatched': 'primary',
  'Delivered': 'success',
  'Invoice Generated': 'info',
  'Payment Pending': 'warning',
  'Completed': 'success',
  'Cancelled': 'error',
  'Returned': 'error'
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tabValue, setTabValue] = useState('All');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await api.get('/orders/orders/');
        const data = Array.isArray(res.data) ? res.data : [];
        setOrders(data.map(o => ({
          id: String(o.id),
          orderNo: o.order_number || `ORD-${o.id}`,
          dealerName: o.dealer_name || 'Dealer',
          shopName: o.dealer_name || 'Agro Shop',
          distributorName: o.created_by_name || 'Central CCS',
          employeeName: o.created_by_name || 'Staff',
          status: o.status || 'Pending Approval',
          createdAt: o.created_at ? o.created_at.split('T')[0] : '',
          itemsCount: (o.items && Array.isArray(o.items)) ? o.items.length : 1,
          grandTotal: parseFloat(o.total_amount || o.grand_total || 0),
          paymentStatus: o.payment_status || 'Pending'
        })));
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const kpis = useMemo(() => ({
    today: orders.length,
    pending: orders.filter(o => ['Draft', 'Submitted', 'Pending Approval'].includes(o.status)).length,
    approved: orders.filter(o => ['Approved', 'Packing', 'Ready Dispatch'].includes(o.status)).length,
    dispatched: orders.filter(o => o.status === 'Dispatched').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    completed: orders.filter(o => ['Completed', 'Invoice Generated', 'Payment Pending'].includes(o.status)).length
  }), [orders]);

  const orderCountsByStatus = useMemo(() => {
    const m = {};
    ORDER_STATUSES.forEach(s => { m[s] = 0; });
    orders.forEach(o => {
      if (m[o.status] !== undefined) m[o.status]++;
      m['All']++;
    });
    return m;
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchesTab = tabValue === 'All' || o.status === tabValue;
      if (!matchesTab) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        (o.orderNo && o.orderNo.toLowerCase().includes(s)) ||
        (o.dealerName && o.dealerName.toLowerCase().includes(s)) ||
        (o.shopName && o.shopName.toLowerCase().includes(s)) ||
        (o.distributorName && o.distributorName.toLowerCase().includes(s)) ||
        (o.employeeName && o.employeeName.toLowerCase().includes(s))
      );
    });
  }, [orders, search, tabValue]);

  const pagedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  return (
    <Grid container rowSpacing={3} columnSpacing={2.75}>
      <Grid sx={{ mb: -1 }} size={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5">Orders</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Manage dealer orders, approvals, and fulfillment
            </Typography>
          </Box>
          <Stack direction="row" sx={{ gap: 1.25 }}>
            <Button size="small" variant="outlined" startIcon={<ExportOutlined />}>Export</Button>
            <Button size="small" variant="contained" startIcon={<PlusOutlined />}>New Order</Button>
          </Stack>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
        <AnalyticEcommerce title="Today" count={kpis.today} icon={<ShopOutlined />} color="primary" extra="New orders" />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
        <AnalyticEcommerce title="Pending" count={kpis.pending} icon={<ScheduleOutlined />} color="warning" extra="Awaiting action" />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
        <AnalyticEcommerce title="Approved" count={kpis.approved} icon={<CheckCircleOutlined />} color="info" extra="For packing" />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
        <AnalyticEcommerce title="Dispatched" count={kpis.dispatched} icon={<SendOutlined />} color="primary" extra="In transit" />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
        <AnalyticEcommerce title="Delivered" count={kpis.delivered} icon={<TruckOutlined />} color="success" extra="Reached dealer" />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
        <AnalyticEcommerce title="Completed" count={kpis.completed} icon={<ShoppingOutlined />} color="success" extra="Order closed" />
      </Grid>

      <Grid size={12}>
        <MainCard>
          <Stack sx={{ gap: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2, justifyContent: 'space-between', alignItems: { md: 'center' } }}>
              <TextField
                size="small"
                placeholder="Search order no, dealer, distributor..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                sx={{ width: { xs: '100%', md: 380 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined style={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }}
              />
              <Stack direction="row" sx={{ gap: 1 }}>
                <Button size="small" variant="outlined" startIcon={<ExportOutlined />}>Export CSV</Button>
                <Button size="small" variant="contained" startIcon={<PlusOutlined />}>Create Order</Button>
              </Stack>
            </Stack>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabValue}
                onChange={(e, v) => { setTabValue(v); setPage(0); }}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
              >
                {ORDER_STATUSES.map(s => (
                  <Tab
                    key={s}
                    label={
                      <Stack direction="row" sx={{ gap: 0.75, alignItems: 'center' }}>
                        {s}
                        <Badge
                          badgeContent={orderCountsByStatus[s] || 0}
                          color={s === 'All' ? 'primary' : s === 'Completed' || s === 'Delivered' ? 'success' : s === 'Pending Approval' ? 'warning' : 'info'}
                          max={999}
                          sx={{ '& .MuiBadge-badge': { fontWeight: 700, minWidth: 20, height: 18, fontSize: '0.65rem' } }}
                        >
                          <Box sx={{ width: 0, height: 0 }} />
                        </Badge>
                      </Stack>
                    }
                    value={s}
                  />
                ))}
              </Tabs>
            </Box>

            <Divider sx={{ display: { xs: 'none', sm: 'block' } }} />

            <TableContainer sx={{ width: '100%', overflowX: 'auto', '& td, & th': { whiteSpace: 'nowrap' } }}>
              <Table size="small" aria-label="orders table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Order No.</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Dealer / Shop</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Distributor</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Items</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Subtotal</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedData.map((row) => (
                    <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main', fontSize: '0.75rem' }}>
                          {row.orderNo}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" sx={{ gap: 1.25, alignItems: 'center' }}>
                          <Avatar sx={{ width: 34, height: 34, borderRadius: 1.5, bgcolor: 'primary.lighter', color: 'primary.dark', fontSize: '0.75rem', fontWeight: 700 }}>
                            {row.dealerName.split(' ').map(x => x[0]).slice(0, 2).join('')}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{row.shopName}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.dealerName}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{row.distributorName}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={`${row.items.length} items`} size="small" variant="outlined"
                          sx={{ height: 22, '& .MuiChip-label': { fontSize: '0.7rem' } }} />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{formatINR(row.subtotal)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatINR(row.total)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.status}
                          size="small"
                          color={statusColorMap[row.status]}
                          sx={{ height: 22, '& .MuiChip-label': { px: 1, py: 0.25, fontSize: '0.7rem', fontWeight: 600 } }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{row.createdAt}</Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" sx={{ gap: 0.75, alignItems: 'center' }}>
                          <UserOutlined style={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{row.employeeName}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 0.25 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" sx={{ color: 'primary.main' }}><EyeOutlined style={{ fontSize: '0.9rem' }} /></IconButton>
                          </Tooltip>
                          <Tooltip title="Print Invoice">
                            <IconButton size="small" sx={{ color: 'text.secondary' }}><PrinterOutlined style={{ fontSize: '0.9rem' }} /></IconButton>
                          </Tooltip>
                          <Tooltip title="Export PDF">
                            <IconButton size="small" sx={{ color: 'text.secondary' }}><FilePdfOutlined style={{ fontSize: '0.9rem' }} /></IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ mt: -0.5 }} />
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={filtered.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              sx={{ mt: 1 }}
            />
          </Stack>
        </MainCard>
      </Grid>
    </Grid>
  );
}
