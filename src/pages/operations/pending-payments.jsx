import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, 
  Grid, TextField, FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress 
} from '@mui/material';
import EnterpriseTable from 'components/ui/EnterpriseTable';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import { PlusOutlined, FileDoneOutlined, WalletOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from 'api/client';
import useAuth from 'hooks/useAuth';

const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
};

export default function PaymentsAdmin() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [selectedDealer, setSelectedDealer] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [reference, setReference] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [ledgerRes, dealersRes] = await Promise.all([
        api.get('/wallet/ledger/'),
        api.get('/dealers/').catch(() => ({ data: [] }))
      ]);

      const ledgerData = Array.isArray(ledgerRes.data) ? ledgerRes.data : [];
      const mapped = ledgerData.map((item, idx) => ({
        id: item.id || idx + 1,
        dealer: item.dealer_name || 'Dealer',
        invoice: item.reference || `TXN-${String(item.id).slice(0, 6)}`,
        amount: Math.abs(parseFloat(item.amount || 0)),
        method: item.payment_method || 'Direct',
        date: item.created_at ? new Date(item.created_at).toLocaleDateString() : '-',
        outstanding: parseFloat(item.balance_after || 0),
        status: item.type === 'Collection' ? 'Completed' : (item.type === 'Debit' ? 'Debited' : 'Processed'),
        type: item.type
      }));

      setData(mapped);
      setDealers(Array.isArray(dealersRes.data) ? dealersRes.data : []);
    } catch (err) {
      console.error('Failed to fetch payments data:', err);
      setErrorMsg('Failed to load ledger records from the server.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const totalCollected = useMemo(() => {
    return data
      .filter(d => d.type === 'Collection')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [data]);

  const totalDebited = useMemo(() => {
    return data
      .filter(d => d.type === 'Debit')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [data]);

  const handleSavePayment = async () => {
    if (!selectedDealer || !amount || parseFloat(amount) <= 0) {
      setErrorMsg('Please select a dealer and enter a valid positive amount.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await api.post('/wallet/ledger/', {
        dealer_id: selectedDealer,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        reference: reference || `REF-${Date.now()}`,
        remarks: remarks || 'Recorded via Payments Admin'
      });

      setSuccessMsg('Payment successfully recorded and wallet ledger updated.');
      setOpenDialog(false);
      setSelectedDealer('');
      setAmount('');
      setReference('');
      setRemarks('');
      await fetchPayments();
    } catch (err) {
      const serverErr = err.response?.data?.error || err.response?.data?.detail || 'Failed to record payment.';
      setErrorMsg(serverErr);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { field: 'dealer', headerName: 'Dealer', flex: 1.5, minWidth: 200 },
    { field: 'invoice', headerName: 'Reference / ID', flex: 1, minWidth: 140 },
    { 
      field: 'amount', 
      headerName: 'Amount', 
      flex: 1, 
      minWidth: 120, 
      renderCell: (params) => (
        <Typography fontWeight={700} color={params.row.type === 'Collection' ? 'success.main' : 'text.primary'}>
          {formatINR(params.value)}
        </Typography>
      )
    },
    { field: 'method', headerName: 'Method', flex: 1, minWidth: 120 },
    { field: 'date', headerName: 'Date', flex: 1, minWidth: 120 },
    { 
      field: 'outstanding', 
      headerName: 'Balance After', 
      flex: 1, 
      minWidth: 130, 
      renderCell: (params) => (
        <Typography color={params.value < 0 ? 'error.main' : 'text.secondary'} fontWeight={600}>
          {formatINR(params.value)}
        </Typography>
      )
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      flex: 1, 
      minWidth: 120, 
      renderCell: (params) => {
        let color = 'text.primary';
        if (params.value === 'Completed') color = 'success.main';
        if (params.value === 'Debited') color = 'info.main';
        return <Typography color={color} fontWeight={600}>{params.value}</Typography>;
      }
    }
  ];

  const rowActions = [
    { label: 'View Details', icon: <FileDoneOutlined />, onClick: (row) => alert(`Transaction: ${row.invoice}\nDealer: ${row.dealer}\nAmount: ${formatINR(row.amount)}`), showInMenu: true }
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" mb={3} sx={{ flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5">Payments & Financial Ledger</Typography>
          <Typography variant="body2" color="textSecondary">
            Live database ledger of dealer collections, payments, and balances.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => setOpenDialog(true)}>
          Record Payment
        </Button>
      </Stack>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>
          {errorMsg}
        </Alert>
      )}

      {successMsg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={4}>
          <AnalyticEcommerce title="Total Collections" count={formatINR(totalCollected)} icon={<WalletOutlined />} color="primary" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <AnalyticEcommerce title="Total Order Debits" count={formatINR(totalDebited)} icon={<WalletOutlined />} color="warning" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <AnalyticEcommerce title="Total Ledger Entries" count={String(data.length)} icon={<CheckCircleOutlined />} color="info" />
        </Grid>
      </Grid>

      <Box sx={{ height: 600 }}>
        <EnterpriseTable 
          rows={data} 
          columns={columns} 
          loading={loading} 
          rowActions={rowActions} 
        />
      </Box>

      <Dialog open={openDialog} onClose={() => !submitting && setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment / Collection</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Dealer</InputLabel>
                <Select 
                  label="Dealer" 
                  value={selectedDealer} 
                  onChange={(e) => setSelectedDealer(e.target.value)}
                >
                  {dealers.map(d => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.company_name || d.name || `Dealer #${d.id}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                label="Amount (INR)" 
                type="number" 
                size="small" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Method</InputLabel>
                <Select 
                  label="Payment Method" 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="Bank Transfer">Bank Transfer / NEFT</MenuItem>
                  <MenuItem value="Cheque">Cheque</MenuItem>
                  <MenuItem value="Online">Online Gateway</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Transaction ID / UTR Reference" 
                size="small" 
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth 
                label="Remarks" 
                size="small" 
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="inherit" disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSavePayment} 
            variant="contained" 
            color="primary"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : null}
          >
            {submitting ? 'Saving...' : 'Save Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
