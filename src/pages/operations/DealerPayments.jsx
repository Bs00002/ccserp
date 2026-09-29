import React, { useState, useEffect, useMemo } from 'react';
import { 
  Grid, Typography, Box, Stack, Chip, TextField, InputAdornment, Paper, Alert, 
  CircularProgress, Button 
} from '@mui/material';
import DataTable from 'components/DataTable';
import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import api from 'api/client';
import useAuth from 'hooks/useAuth';
import useRealtime from 'hooks/useRealtime';
import { SearchOutlined, CheckCircleOutlined, WalletOutlined } from '@ant-design/icons';
import { IndianRupee, CreditCard, Landmark, CheckCircle2, Clock } from 'lucide-react';

const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
};

export default function DealerPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [search, setSearch] = useState('');

  const fetchPaymentData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      // 1. Fetch Dealer's Ledger Entries
      const ledgerRes = await api.get('/wallet/ledger/');
      const ledgerData = Array.isArray(ledgerRes.data) ? ledgerRes.data : [];
      
      const mapped = ledgerData.map(p => ({
        id: p.id,
        date: new Date(p.created_at).toLocaleDateString(),
        amount: parseFloat(p.amount || 0),
        type: p.type,
        mode: p.payment_method || (p.payment_details ? p.payment_details.method : 'Cash'),
        status: p.payment_status || 'Completed',
        refNo: p.reference || p.transaction_id || '-',
        bank: p.payment_details?.transaction_id ? 'Bank / Online' : 'Standard Counter',
        remarks: p.notes || (p.type === 'Collection' ? 'Credit against ledger' : 'Order billing')
      }));
      setPayments(mapped);

      // 2. Fetch Dealer's Wallet Summary
      try {
        const walletRes = await api.get('/wallet/wallets/my_wallet/');
        setWallet(walletRes.data);
      } catch (we) {
        console.warn('Personal wallet summary fallback:', we);
      }
    } catch (err) {
      console.error('Failed to load dealer payments:', err);
      setErrorMessage('Unable to load payment history from database. Please verify connectivity.');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, []);

  // Real-time listener: auto-refresh payments when dealer payment is recorded
  useRealtime('payment.created', () => {
    fetchPaymentData();
  });

  const completedTotal = useMemo(() => {
    return payments
      .filter(p => p.type === 'Collection' || p.status === 'Completed')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const outstandingDue = useMemo(() => {
    if (wallet && wallet.outstanding_amount !== undefined) {
      return parseFloat(wallet.outstanding_amount);
    }
    return 0;
  }, [wallet]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p =>
      p.mode.toLowerCase().includes(search.toLowerCase()) ||
      p.refNo.toLowerCase().includes(search.toLowerCase()) ||
      p.remarks.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase())
    );
  }, [payments, search]);

  const columns = [
    { field: 'date', headerName: 'Payment Date', flex: 1, minWidth: 110 },
    {
      field: 'amount',
      headerName: 'Amount',
      flex: 1.2,
      minWidth: 120,
      renderCell: (params) => (
        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
          <Typography fontWeight={700} color={params.row.type === 'Collection' ? 'success.main' : 'text.primary'}>
            {formatINR(params.value)}
          </Typography>
        </Box>
      )
    },
    { field: 'type', headerName: 'Type', flex: 1, minWidth: 100 },
    {
      field: 'mode',
      headerName: 'Payment Method',
      flex: 1.3,
      minWidth: 130,
      renderCell: (params) => (
        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
          <Chip label={params.value} size="small" color="primary" variant="outlined" />
        </Box>
      )
    },
    { field: 'refNo', headerName: 'Reference / UTR No', flex: 1.5, minWidth: 150 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1.2,
      minWidth: 120,
      renderCell: (params) => (
        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
          <Chip
            label={params.value}
            size="small"
            color={params.value === 'Completed' ? 'success' : 'warning'}
          />
        </Box>
      )
    },
    { field: 'remarks', headerName: 'Remarks / Notes', flex: 2, minWidth: 200 }
  ];

  return (
    <Grid container rowSpacing={3} columnSpacing={2.75}>
      <Grid item xs={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Payment Ledger & Transaction History</Typography>
            <Typography variant="body2" color="textSecondary">
              Live statement of credits, payments made, and current balance with CCS Connect
            </Typography>
          </Box>
          <Chip icon={<CheckCircleOutlined />} label={`Dealer: ${user?.name || user?.email || 'Authenticated'}`} color="success" sx={{ fontWeight: 600 }} />
        </Stack>
      </Grid>

      {/* Error alert */}
      {errorMessage && (
        <Grid item xs={12}>
          <Alert severity="error" onClose={() => setErrorMessage('')} action={
            <Button color="inherit" size="small" onClick={fetchPaymentData}>Retry</Button>
          }>
            {errorMessage}
          </Alert>
        </Grid>
      )}

      {/* KPI Cards */}
      <Grid item xs={12} sm={6}>
        <AnalyticEcommerce title="Total Payments Credited" count={formatINR(completedTotal)} icon={<CheckCircle2 size={20} />} color="success" />
      </Grid>
      <Grid item xs={12} sm={6}>
        <AnalyticEcommerce title="Current Outstanding Balance" count={formatINR(outstandingDue)} icon={<WalletOutlined />} color={outstandingDue > 0 ? "warning" : "primary"} />
      </Grid>

      {/* Filter Toolbar */}
      <Grid item xs={12}>
        <MainCard content={false} sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by Mode, UTR No, or Remarks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={8}>
              <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                <Typography variant="caption" color="textSecondary">
                  Showing {filteredPayments.length} ledger transactions
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </MainCard>
      </Grid>

      {/* Payments Table */}
      <Grid item xs={12}>
        <MainCard content={false}>
          <DataTable
            rows={filteredPayments}
            columns={columns}
            loading={loading}
          />
        </MainCard>
      </Grid>
    </Grid>
  );
}
