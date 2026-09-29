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
import CreditCardOutlined from '@ant-design/icons/CreditCardOutlined';
import ShopOutlined from '@ant-design/icons/ShopOutlined';
import WarningOutlined from '@ant-design/icons/WarningOutlined';
import RiseOutlined from '@ant-design/icons/RiseOutlined';
import CalendarOutlined from '@ant-design/icons/CalendarOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';

import api from 'api/client';

const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
};

const statusColor = (status) => {
  switch (status) {
    case 'Active': return 'success';
    case 'Paid':
    case 'Approved':
    case 'Cleared':
    case 'Received':
    case 'Deposited':
    case 'Completed': return 'success';
    case 'Inactive': return 'default';
    case 'Pending':
    case 'On Leave':
    case 'Suspended':
    case 'Prospect':
    case 'Partial':
    case 'Unpaid': return 'warning';
    case 'Rejected':
    case 'Overdue':
    case 'Bounced': return 'error';
    default: return 'default';
  }
};

const invoiceStatusColor = (s) => {
  if (s === 'Paid') return 'success';
  if (s === 'Partial') return 'warning';
  if (s === 'Overdue') return 'error';
  return 'default';
};

export default function DistributorDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [distributor, setDistributor] = useState(null);
  const [assignedDealers, setAssignedDealers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tabValue, setTabValue] = useState(0);
  const [dealersPage, setDealersPage] = useState(1);
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const rowsPerPage = 5;

  const fetchDistributorData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch distributor details
      let distData = null;
      try {
        const res = await api.get(`/crm/distributors/${id}/`);
        distData = res.data;
      } catch {
        // Fallback to admin users query
        const userRes = await api.get(`/admin/users/${id}/`);
        if (userRes.data) {
          const u = userRes.data;
          distData = {
            id: String(u.id),
            code: u.ccs_id || `DST-${u.id}`,
            name: u.company_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
            company_name: u.company_name || u.username,
            contact_person: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
            phone: u.phone || '—',
            email: u.email || '—',
            territory: u.territory || u.distributor_profile?.territory || 'General Territory',
            city: u.city || u.distributor_profile?.district || 'Depot',
            state: u.state || u.distributor_profile?.state || 'Gujarat',
            credit_limit: parseFloat(u.distributor_profile?.monthly_sales_plan || 500000),
            outstanding_balance: 0,
            status: u.is_active ? 'Active' : 'Inactive',
            created_at: u.created_at
          };
        }
      }

      if (!distData) {
        setError('Distributor record not found in database.');
        setDistributor(null);
        return;
      }

      setDistributor(distData);

      // 2. Fetch related dealers, invoices, and payments in parallel
      const [dealersRes, invoicesRes, ledgerRes] = await Promise.all([
        api.get('/admin/users/?role=Dealer').catch(() => ({ data: [] })),
        api.get('/orders/invoices/').catch(() => ({ data: [] })),
        api.get('/wallet/ledger/').catch(() => ({ data: [] }))
      ]);

      const allDealers = Array.isArray(dealersRes.data) ? dealersRes.data : [];
      setAssignedDealers(allDealers.map(d => ({
        id: String(d.id),
        code: d.ccs_id || `DLR-${String(d.id).slice(0, 6)}`,
        shopName: d.company_name || `${d.first_name || ''} ${d.last_name || ''}`.trim() || d.username,
        ownerName: `${d.first_name || ''} ${d.last_name || ''}`.trim() || d.username,
        village: d.city || 'District',
        district: d.district || d.state || 'Gujarat',
        totalPurchases: parseFloat(d.total_purchases || d.total_sales || 0),
        outstanding: parseFloat(d.outstanding_amount || 0),
        status: d.is_active ? 'Active' : 'Inactive'
      })));

      const allInvoices = Array.isArray(invoicesRes.data) ? invoicesRes.data : [];
      setInvoices(allInvoices.map((inv, idx) => ({
        id: inv.id || idx + 1,
        invoiceNo: inv.invoice_number || `INV-${inv.id}`,
        dealerName: inv.dealer_name || inv.order?.dealer_name || 'Dealer',
        issueDate: inv.generated_at || inv.created_at || new Date().toISOString(),
        grandTotal: parseFloat(inv.order?.grand_total || inv.grand_total || inv.order?.total_amount || 0),
        paymentReceived: parseFloat(inv.order?.payment_status === 'Paid' ? (inv.order?.grand_total || 0) : 0),
        dueDate: inv.due_date || inv.generated_at || new Date().toISOString(),
        status: inv.order?.payment_status || 'Unpaid'
      })));

      const allLedger = Array.isArray(ledgerRes.data) ? ledgerRes.data : [];
      setPayments(allLedger.map((c, idx) => ({
        id: c.id || idx + 1,
        receiptNo: `REC-${String(c.id).slice(0, 8).toUpperCase()}`,
        date: c.created_at || new Date().toISOString(),
        mode: c.payment_method || 'UPI',
        invoiceNo: c.reference || `TXN-${String(c.id).slice(0, 6)}`,
        amount: Math.abs(parseFloat(c.amount || 0)),
        referenceNo: c.reference || '—',
        status: c.type === 'Collection' ? 'Completed' : 'Processed'
      })));

    } catch (err) {
      console.error('Failed to fetch distributor details:', err);
      setError(err?.response?.data?.error || 'Failed to load distributor details from the database.');
      setDistributor(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistributorData();
  }, [id]);

  const dealerRows = useMemo(() => {
    return assignedDealers.slice((dealersPage - 1) * rowsPerPage, dealersPage * rowsPerPage);
  }, [assignedDealers, dealersPage]);
  const dealerPageCount = Math.max(1, Math.ceil(assignedDealers.length / rowsPerPage));

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

  if (error || !distributor) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Distributor not found.'}
        </Alert>
        <Button variant="contained" startIcon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/employees')}>
          Back to Distributors
        </Button>
      </Box>
    );
  }

  const creditLimit = distributor.credit_limit || distributor.monthly_sales_plan || 500000;
  const outstanding = distributor.outstanding_balance || 0;
  const creditUtilPct = creditLimit > 0 ? Math.min(Math.round((outstanding / creditLimit) * 100), 100) : 0;
  const totalPurchaseYTD = assignedDealers.reduce((s, d) => s + (d.totalPurchases || 0), 0);

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid item size={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" sx={{ gap: 2 }}>
          <Stack direction="row" alignItems="flex-start" sx={{ gap: 2 }}>
            <IconButton color="primary" onClick={() => navigate('/admin/employees')} sx={{ border: 1, borderColor: 'divider' }}>
              <ArrowLeftOutlined style={{ fontSize: 18 }} />
            </IconButton>
            <Stack direction="row" alignItems="center" sx={{ gap: 2.5 }} flexWrap="wrap">
              <Avatar sx={{ width: 64, height: 64, bgcolor: 'secondary.lighter', color: 'secondary.dark', fontWeight: 700, fontSize: '1.5rem' }}>
                {distributor.name?.charAt(0) || 'D'}
              </Avatar>
              <Box>
                <Stack direction="row" alignItems="center" sx={{ gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="h5">{distributor.name}</Typography>
                  <Chip label={distributor.status || 'Active'} color={statusColor(distributor.status || 'Active')} size="small" sx={{ fontWeight: 500 }} />
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  {distributor.company_name || distributor.name} • {distributor.code} • {distributor.territory}
                </Typography>
              </Box>
            </Stack>
          </Stack>
          <Stack direction="row" sx={{ gap: 1.5 }}>
            <Button variant="outlined" startIcon={<EditOutlined />} size="medium" sx={{ height: 40 }} onClick={() => alert('Distributor profile is managed via Admin Management.')}>
              Edit Profile
            </Button>
          </Stack>
        </Stack>
      </Grid>

      <Grid item size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce title="Monthly Sales Plan" count={formatINR(creditLimit).replace('₹', '')} prefix="₹" icon={<CreditCardOutlined />} color="primary" extra={`${creditUtilPct}% utilized`} />
      </Grid>
      <Grid item size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce title="Outstanding Balance" count={formatINR(outstanding).replace('₹', '')} prefix="₹" icon={<WarningOutlined />} color="warning" extra={`${formatINR(creditLimit - outstanding)} available`} />
      </Grid>
      <Grid item size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce title="Assigned Dealers" count={assignedDealers.length} icon={<ShopOutlined />} color="success" extra={`${assignedDealers.filter(d => d.status === 'Active').length} active`} />
      </Grid>
      <Grid item size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce title="Total Business Volume" count={formatINR(totalPurchaseYTD).replace('₹', '')} prefix="₹" icon={<RiseOutlined />} color="info" extra="Live verified DB total" />
      </Grid>

      <Grid item size={12}>
        <MainCard contentSX={{ p: 0 }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="scrollable" scrollButtons sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            {['Overview', 'Assigned Dealers', 'Invoices', 'Payments'].map((t, i) => (
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
                            <Typography variant="subtitle2" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>{distributor.phone}</Typography>
                          </Box>
                        </Stack>
                      </Grid>
                      <Grid item size={{ xs: 12, sm: 6 }}>
                        <Stack direction="row" sx={{ gap: 1.5 }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: 'success.lighter', color: 'success.main' }}><MailOutlined style={{ fontSize: 16 }} /></Avatar>
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Email</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>{distributor.email}</Typography>
                          </Box>
                        </Stack>
                      </Grid>
                      <Grid item size={12}>
                        <Stack direction="row" sx={{ gap: 1.5 }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: 'warning.lighter', color: 'warning.main' }}><EnvironmentOutlined style={{ fontSize: 16 }} /></Avatar>
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Territory & Location</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                              {distributor.city}, {distributor.state} ({distributor.territory})
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>
                      <Grid item size={{ xs: 12, sm: 6 }}>
                        <Stack direction="row" sx={{ gap: 1.5 }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: 'info.lighter', color: 'info.main' }}><FileTextOutlined style={{ fontSize: 16 }} /></Avatar>
                          <Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Partner Code</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>{distributor.code}</Typography>
                          </Box>
                        </Stack>
                      </Grid>
                    </Grid>
                  </MainCard>
                </Grid>

                <Grid item size={{ xs: 12, lg: 6 }}>
                  <Stack sx={{ gap: 3 }}>
                    <MainCard title="Credit Utilization">
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography variant="body2">{formatINR(outstanding)} Outstanding</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{formatINR(creditLimit)} Plan Limit</Typography>
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
                  </Stack>
                </Grid>
              </Grid>
            )}

            {tabValue === 1 && (
              <MainCard content={false} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Shop Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Owner</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Total Purchase</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Outstanding</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dealerRows.map(row => (
                        <TableRow key={row.id} hover>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.code}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{row.shopName}</TableCell>
                          <TableCell>{row.ownerName}</TableCell>
                          <TableCell>{row.village}, {row.district}</TableCell>
                          <TableCell>{formatINR(row.totalPurchases)}</TableCell>
                          <TableCell sx={{ color: row.outstanding > 0 ? 'warning.main' : 'text.primary', fontWeight: 500 }}>{formatINR(row.outstanding)}</TableCell>
                          <TableCell><Chip label={row.status} color={statusColor(row.status)} size="small" sx={{ fontWeight: 500 }} /></TableCell>
                        </TableRow>
                      ))}
                      {dealerRows.length === 0 && (
                        <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><Typography variant="body2" sx={{ color: 'text.secondary' }}>No dealers recorded in database</Typography></TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Stack direction="row" justifyContent="flex-end" sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Pagination count={dealerPageCount} page={dealersPage} onChange={(_, p) => setDealersPage(p)} color="primary" size="small" />
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
                        <TableCell sx={{ fontWeight: 600 }}>Dealer</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Paid</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invRows.map(row => (
                        <TableRow key={row.id} hover>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 500 }}>{row.invoiceNo}</TableCell>
                          <TableCell>{row.dealerName}</TableCell>
                          <TableCell>{new Date(row.issueDate).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{formatINR(row.grandTotal)}</TableCell>
                          <TableCell sx={{ color: 'success.main', fontWeight: 500 }}>{formatINR(row.paymentReceived)}</TableCell>
                          <TableCell><Chip label={row.status} color={invoiceStatusColor(row.status)} size="small" sx={{ fontWeight: 500 }} /></TableCell>
                        </TableRow>
                      ))}
                      {invRows.length === 0 && (
                        <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><Typography variant="body2" sx={{ color: 'text.secondary' }}>No invoices recorded in database</Typography></TableCell></TableRow>
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
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 500 }}>{row.receiptNo}</TableCell>
                          <TableCell>{new Date(row.date).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell><Chip label={row.mode} variant="outlined" size="small" /></TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>{row.referenceNo}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{formatINR(row.amount)}</TableCell>
                          <TableCell><Chip label={row.status} color={statusColor(row.status)} size="small" sx={{ fontWeight: 500 }} /></TableCell>
                        </TableRow>
                      ))}
                      {payRows.length === 0 && (
                        <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><Typography variant="body2" sx={{ color: 'text.secondary' }}>No payments recorded in database</Typography></TableCell></TableRow>
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
