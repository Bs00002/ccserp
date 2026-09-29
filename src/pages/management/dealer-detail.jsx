import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';

import ArrowLeftOutlined from '@ant-design/icons/ArrowLeftOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import PhoneOutlined from '@ant-design/icons/PhoneOutlined';
import MailOutlined from '@ant-design/icons/MailOutlined';
import EnvironmentOutlined from '@ant-design/icons/EnvironmentOutlined';
import FileTextOutlined from '@ant-design/icons/FileTextOutlined';
import ShoppingCartOutlined from '@ant-design/icons/ShoppingCartOutlined';
import ShopOutlined from '@ant-design/icons/ShopOutlined';
import WarningOutlined from '@ant-design/icons/WarningOutlined';
import RiseOutlined from '@ant-design/icons/RiseOutlined';
import CreditCardOutlined from '@ant-design/icons/CreditCardOutlined';

import api from 'api/client';

const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
};

const statusColor = (status) => {
  switch (status) {
    case 'Active':
    case 'Approved':
    case 'Paid':
    case 'Completed':
    case 'Delivered':
    case 'Cleared':
    case 'Deposited':
    case 'Received': return 'success';
    case 'Inactive': return 'default';
    case 'Pending':
    case 'Prospect':
    case 'On Leave':
    case 'Suspended':
    case 'Packing':
    case 'Ready to Dispatch':
    case 'Ready Dispatch':
    case 'Dispatched':
    case 'Partial':
    case 'Unpaid':
    case 'Submitted':
    case 'Pending Approval': return 'warning';
    case 'Rejected':
    case 'Overdue':
    case 'Bounced': return 'error';
    case 'Invoice Generated':
    case 'Payment Pending': return 'info';
    default: return 'default';
  }
};

export default function DealerDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [dealer, setDealer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tabValue, setTabValue] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const rowsPerPage = 5;

  const fetchDealerData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch dealer details
      let dealerData = null;
      try {
        const res = await api.get(`/crm/dealers/${id}/`);
        dealerData = res.data;
      } catch {
        // Fallback to admin users
        const userRes = await api.get(`/admin/users/${id}/`);
        if (userRes.data) {
          const u = userRes.data;
          dealerData = {
            id: String(u.id),
            code: u.ccs_id || `DLR-${u.id}`,
            name: u.company_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
            company_name: u.company_name || u.username,
            shopName: u.company_name || u.username,
            ownerName: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
            phone: u.phone || '—',
            email: u.email || '—',
            city: u.city || u.dealer_profile?.city || 'Depot',
            district: u.district || u.dealer_profile?.district || '',
            state: u.state || u.dealer_profile?.state || 'Gujarat',
            address: u.address || u.dealer_profile?.address || '',
            gstin: u.gstin || u.dealer_profile?.gstin || '—',
            pan: u.pan || u.dealer_profile?.pan || '—',
            credit_limit: parseFloat(u.credit_limit || u.dealer_profile?.credit_limit || 500000),
            outstanding_balance: parseFloat(u.outstanding_amount || 0),
            status: u.is_active ? 'Active' : 'Inactive',
            created_at: u.created_at
          };
        }
      }

      if (!dealerData) {
        setError('Dealer record not found in database.');
        setDealer(null);
        return;
      }

      setDealer(dealerData);

      // 2. Fetch related orders, invoices, and ledger records
      const [ordersRes, invoicesRes, ledgerRes] = await Promise.all([
        api.get('/orders/orders/').catch(() => ({ data: [] })),
        api.get('/orders/invoices/').catch(() => ({ data: [] })),
        api.get('/wallet/ledger/').catch(() => ({ data: [] }))
      ]);

      const allOrders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const filteredOrders = allOrders.filter(o => 
        String(o.dealer) === String(id) || 
        String(o.dealer_id) === String(id) || 
        o.dealer_name === dealerData.company_name || 
        o.dealer_name === dealerData.name
      );
      setOrders(filteredOrders.map(o => ({
        id: String(o.id),
        orderNumber: o.order_number || `ORD-${o.id}`,
        date: o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN') : '—',
        amount: parseFloat(o.total_amount || o.grand_total || 0),
        status: o.status || 'Pending Approval',
        itemsCount: (o.items && Array.isArray(o.items)) ? o.items.length : 1
      })));

      const allInvoices = Array.isArray(invoicesRes.data) ? invoicesRes.data : [];
      const filteredInvoices = allInvoices.filter(inv =>
        String(inv.order?.dealer) === String(id) ||
        inv.dealer_name === dealerData.company_name ||
        inv.dealer_name === dealerData.name
      );
      setInvoices(filteredInvoices.map((inv, idx) => ({
        id: inv.id || idx + 1,
        invoiceNo: inv.invoice_number || `INV-${inv.id}`,
        issueDate: inv.generated_at || inv.created_at || new Date().toISOString(),
        amount: parseFloat(inv.order?.grand_total || inv.grand_total || inv.order?.total_amount || 0),
        status: inv.order?.payment_status || 'Unpaid'
      })));

      const allLedger = Array.isArray(ledgerRes.data) ? ledgerRes.data : [];
      const filteredLedger = allLedger.filter(c =>
        String(c.dealer_id) === String(id) ||
        c.dealer_name === dealerData.company_name ||
        c.dealer_name === dealerData.name
      );
      setPayments(filteredLedger.map((c, idx) => ({
        id: c.id || idx + 1,
        receiptNo: `REC-${String(c.id).slice(0, 8).toUpperCase()}`,
        date: c.created_at || new Date().toISOString(),
        mode: c.payment_method || 'UPI',
        amount: Math.abs(parseFloat(c.amount || 0)),
        reference: c.reference || '—',
        status: c.type === 'Collection' ? 'Completed' : 'Processed'
      })));

    } catch (err) {
      console.error('Failed to fetch dealer details:', err);
      setError(err?.response?.data?.error || 'Failed to load dealer details from database.');
      setDealer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealerData();
  }, [id]);

  const orderRows = useMemo(() => {
    return orders.slice((ordersPage - 1) * rowsPerPage, ordersPage * rowsPerPage);
  }, [orders, ordersPage]);
  const orderPageCount = Math.max(1, Math.ceil(orders.length / rowsPerPage));

  const invRows = useMemo(() => {
    return invoices.slice((invoicesPage - 1) * rowsPerPage, invoicesPage * rowsPerPage);
  }, [invoices, invoicesPage]);
  const invPageCount = Math.max(1, Math.ceil(invoices.length / rowsPerPage));

  const payRows = useMemo(() => {
    return payments.slice((paymentsPage - 1) * rowsPerPage, paymentsPage * rowsPerPage);
  }, [payments, paymentsPage]);
  const payPageCount = Math.max(1, Math.ceil(payments.length / rowsPerPage));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !dealer) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Dealer not found.'}
        </Alert>
        <Button variant="contained" startIcon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/dealers')}>
          Back to Dealers
        </Button>
      </Box>
    );
  }

  const creditLimit = dealer.credit_limit || 500000;
  const outstanding = dealer.outstanding_balance || 0;
  const totalPurchase = orders.reduce((s, o) => s + o.amount, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const creditUtilPct = creditLimit > 0 ? Math.min(Math.round((outstanding / creditLimit) * 100), 100) : 0;

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid item size={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" sx={{ gap: 2 }}>
          <Stack direction="row" alignItems="flex-start" sx={{ gap: 2 }}>
            <IconButton color="primary" onClick={() => navigate('/admin/dealers')} sx={{ border: 1, borderColor: 'divider' }}>
              <ArrowLeftOutlined style={{ fontSize: 18 }} />
            </IconButton>
            <Stack direction="row" alignItems="center" sx={{ gap: 2.5 }} flexWrap="wrap">
              <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.lighter', color: 'primary.dark', fontWeight: 700, fontSize: '1.5rem' }}>
                {(dealer.company_name || dealer.name)?.charAt(0) || 'D'}
              </Avatar>
              <Box>
                <Stack direction="row" alignItems="center" sx={{ gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="h5">{dealer.company_name || dealer.name}</Typography>
                  <Chip label={dealer.status || 'Active'} color={statusColor(dealer.status || 'Active')} size="small" sx={{ fontWeight: 500 }} />
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  Owner: {dealer.contact_person || dealer.ownerName || '—'} • {dealer.code || dealer.dealer_code} • {dealer.city}, {dealer.state}
                </Typography>
              </Box>
            </Stack>
          </Stack>
          <Stack direction="row" sx={{ gap: 1.5 }}>
            <Button variant="outlined" startIcon={<EditOutlined />} size="medium" sx={{ height: 40 }} onClick={() => alert('Dealer profile is managed via Admin Management.')}>
              Edit Dealer
            </Button>
          </Stack>
        </Stack>
      </Grid>

      <Grid item size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce title="Total Order Volume" count={formatINR(totalPurchase).replace('₹', '')} prefix="₹" icon={<ShoppingCartOutlined />} color="primary" extra={`${orders.length} orders total`} />
      </Grid>
      <Grid item size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce title="Outstanding Balance" count={formatINR(outstanding).replace('₹', '')} prefix="₹" icon={<WarningOutlined />} color={outstanding > 0 ? 'warning' : 'success'} extra={`${formatINR(Math.max(0, creditLimit - outstanding))} credit available`} />
      </Grid>
      <Grid item size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce title="Orders Recorded" count={orders.length} icon={<ShopOutlined />} color="info" extra={`${orders.filter(o => o.status === 'Dispatched' || o.status === 'Delivered').length} fulfilled`} />
      </Grid>
      <Grid item size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce title="Total Paid" count={formatINR(totalPaid).replace('₹', '')} prefix="₹" icon={<RiseOutlined />} color="success" extra="Verified via wallet ledger" />
      </Grid>

      <Grid item size={12}>
        <MainCard contentSX={{ p: 0 }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="scrollable" scrollButtons sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            {['Overview', 'Orders', 'Invoices', 'Payments'].map((t, i) => (
              <Tab key={t} label={t} value={i} sx={{ minHeight: 56, textTransform: 'none', fontWeight: 600, px: 2.5 }} />
            ))}
          </Tabs>

          <Box sx={{ p: 3 }}>
            {tabValue === 0 && (
              <Grid container spacing={3}>
                <Grid item size={{ xs: 12, lg: 6 }}>
                  <MainCard title="Contact Information">
                    <Grid container spacing={2.5}>
                      <Grid item size={{ xs: 12, sm: 6 }}>
                        <Stack direction="row" sx={{ gap: 1.5 }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.lighter', color: 'primary.main' }}><PhoneOutlined style={{ fontSize: 16 }} /></Avatar>
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Phone</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>{dealer.phone || '—'}</Typography>
                          </Box>
                        </Stack>
                      </Grid>
                      <Grid item size={{ xs: 12, sm: 6 }}>
                        <Stack direction="row" sx={{ gap: 1.5 }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: 'success.lighter', color: 'success.main' }}><MailOutlined style={{ fontSize: 16 }} /></Avatar>
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Email</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>{dealer.email || '—'}</Typography>
                          </Box>
                        </Stack>
                      </Grid>
                      <Grid item size={12}>
                        <Stack direction="row" sx={{ gap: 1.5 }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: 'warning.lighter', color: 'warning.main' }}><EnvironmentOutlined style={{ fontSize: 16 }} /></Avatar>
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Address</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                              {dealer.address || '—'}, {dealer.city}, {dealer.state}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                      <Grid item size={{ xs: 12, sm: 6 }}>
                        <Stack direction="row" sx={{ gap: 1.5 }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: 'info.lighter', color: 'info.main' }}><FileTextOutlined style={{ fontSize: 16 }} /></Avatar>
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>GSTIN</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>{dealer.gstin || '—'}</Typography>
                          </Box>
                        </Stack>
                      </Grid>
                      <Grid item size={{ xs: 12, sm: 6 }}>
                        <Stack direction="row" sx={{ gap: 1.5 }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.lighter', color: 'secondary.main' }}><CreditCardOutlined style={{ fontSize: 16 }} /></Avatar>
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>PAN</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>{dealer.pan || '—'}</Typography>
                          </Box>
                        </Stack>
                      </Grid>
                    </Grid>
                  </MainCard>
                </Grid>

                <Grid item size={{ xs: 12, lg: 6 }}>
                  <MainCard title="Credit Utilization">
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="body2">{formatINR(outstanding)} Outstanding</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{formatINR(creditLimit)} Limit</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={creditUtilPct} color={creditUtilPct > 80 ? 'warning' : 'primary'} sx={{ height: 12, borderRadius: 6, mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item size={6}>
                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent sx={{ py: 2 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Available Credit</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>{formatINR(Math.max(0, creditLimit - outstanding))}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item size={6}>
                        <Card variant="outlined" sx={{ borderRadius: 2 }}>
                          <CardContent sx={{ py: 2 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Utilization %</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: creditUtilPct > 80 ? 'warning.main' : 'primary.main' }}>{creditUtilPct}%</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </MainCard>
                </Grid>
              </Grid>
            )}

            {tabValue === 1 && (
              <MainCard content={false} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Order ID</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Items</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Total Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderRows.map(row => (
                        <TableRow key={row.id} hover>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>{row.orderNumber}</TableCell>
                          <TableCell>{row.date}</TableCell>
                          <TableCell>{row.itemsCount} SKUs</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{formatINR(row.amount)}</TableCell>
                          <TableCell><Chip label={row.status} color={statusColor(row.status)} size="small" sx={{ fontWeight: 500 }} /></TableCell>
                        </TableRow>
                      ))}
                      {orderRows.length === 0 && (
                        <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><Typography variant="body2" sx={{ color: 'text.secondary' }}>No orders recorded for this dealer</Typography></TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Stack direction="row" justifyContent="flex-end" sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Pagination count={orderPageCount} page={ordersPage} onChange={(_, p) => setOrdersPage(p)} color="primary" size="small" />
                </Stack>
              </MainCard>
            )}

            {tabValue === 2 && (
              <MainCard content={false} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Invoice No</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invRows.map(row => (
                        <TableRow key={row.id} hover>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>{row.invoiceNo}</TableCell>
                          <TableCell>{new Date(row.issueDate).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{formatINR(row.amount)}</TableCell>
                          <TableCell><Chip label={row.status} color={statusColor(row.status)} size="small" sx={{ fontWeight: 500 }} /></TableCell>
                        </TableRow>
                      ))}
                      {invRows.length === 0 && (
                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><Typography variant="body2" sx={{ color: 'text.secondary' }}>No invoices recorded for this dealer</Typography></TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Stack direction="row" justifyContent="flex-end" sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Pagination count={invPageCount} page={invoicesPage} onChange={(_, p) => setInvoicesPage(p)} color="primary" size="small" />
                </Stack>
              </MainCard>
            )}

            {tabValue === 3 && (
              <MainCard content={false} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Receipt No</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Mode</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Reference</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payRows.map(row => (
                        <TableRow key={row.id} hover>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>{row.receiptNo}</TableCell>
                          <TableCell>{new Date(row.date).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell><Chip label={row.mode} variant="outlined" size="small" /></TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>{row.reference}</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: 'success.main' }}>{formatINR(row.amount)}</TableCell>
                          <TableCell><Chip label={row.status} color={statusColor(row.status)} size="small" sx={{ fontWeight: 500 }} /></TableCell>
                        </TableRow>
                      ))}
                      {payRows.length === 0 && (
                        <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><Typography variant="body2" sx={{ color: 'text.secondary' }}>No payment records for this dealer</Typography></TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Stack direction="row" justifyContent="flex-end" sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Pagination count={payPageCount} page={paymentsPage} onChange={(_, p) => setPaymentsPage(p)} color="primary" size="small" />
                </Stack>
              </MainCard>
            )}
          </Box>
        </MainCard>
      </Grid>
    </Grid>
  );
}
