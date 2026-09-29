import React, { useState, useEffect } from 'react';
import {
  Grid, Typography, Box, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress, Chip
} from '@mui/material';
import EnterpriseTable from 'components/ui/EnterpriseTable';
import { PlusOutlined, WalletOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from 'api/client';

const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
};

export default function FieldCollections() {
  const [collections, setCollections] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Dialog
  const [open, setOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState('');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('Cash');
  const [notes, setNotes] = useState('');

  const fetchCollections = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.get('/wallet/ledger/');
      const data = Array.isArray(res.data) ? res.data : [];
      const mapped = data.map(c => ({
        id: c.id,
        dealer: c.dealer_name || 'Dealer',
        dealerEmail: c.dealer_email || '',
        reference: c.reference || c.transaction_id || '-',
        amount: parseFloat(c.amount || 0),
        mode: c.payment_method || (c.payment_details ? c.payment_details.method : 'Cash'),
        date: new Date(c.created_at).toLocaleDateString(),
        status: c.payment_status || 'Completed',
        notes: c.notes || ''
      }));
      setCollections(mapped);
    } catch (err) {
      console.error('Failed to load employee collections:', err);
      setErrorMessage('Unable to load collections from server. Please verify network connectivity.');
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDealers = async () => {
    try {
      const res = await api.get('/admin/dealers/');
      if (Array.isArray(res.data)) {
        setDealers(res.data);
      }
    } catch (err) {
      console.warn('Dealers list error:', err);
    }
  };

  useEffect(() => {
    fetchCollections();
    fetchDealers();
  }, []);

  const handleSubmit = async () => {
    if (!selectedDealer || !amount || !mode) {
      setErrorMessage("Please select a dealer and enter an amount.");
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await api.post('/wallet/ledger/', {
        dealer: selectedDealer,
        amount: parseFloat(amount),
        payment_method: mode,
        reference: reference || `COL-${Date.now().toString().slice(-6)}`,
        notes: notes
      });

      setSuccessMessage("Payment collection recorded in database and credited to dealer ledger.");
      setOpen(false);
      setSelectedDealer('');
      setReference('');
      setAmount('');
      setMode('Cash');
      setNotes('');
      await fetchCollections();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.error || 'Failed to submit collection.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { field: 'date', headerName: 'Date', flex: 1, minWidth: 110 },
    { field: 'dealer', headerName: 'Dealer', flex: 1.5, minWidth: 150 },
    { 
      field: 'amount', 
      headerName: 'Amount', 
      flex: 1.2, 
      minWidth: 120, 
      renderCell: (params) => (
        <Typography fontWeight={700} color="success.main">{formatINR(params.value)}</Typography>
      )
    },
    { 
      field: 'mode', 
      headerName: 'Mode', 
      flex: 1, 
      minWidth: 100,
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" color="primary" />
      )
    },
    { field: 'reference', headerName: 'Reference / Receipt', flex: 1.3, minWidth: 130 },
    { 
      field: 'status', 
      headerName: 'Status', 
      flex: 1, 
      minWidth: 110,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color="success" />
      )
    },
    { field: 'notes', headerName: 'Notes', flex: 1.5, minWidth: 150, renderCell: (params) => params.value || '-' }
  ];

  return (
    <Grid container rowSpacing={3} columnSpacing={2.75}>
      <Grid item xs={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4">Field Collections</Typography>
            <Typography variant="body2" color="textSecondary">Record and verify field payment collections directly to dealer ledger</Typography>
          </Box>
          <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => { setErrorMessage(''); setOpen(true); }}>
            Collect Payment
          </Button>
        </Stack>
      </Grid>

      {/* Alerts */}
      {errorMessage && (
        <Grid item xs={12}>
          <Alert severity="error" onClose={() => setErrorMessage('')}>{errorMessage}</Alert>
        </Grid>
      )}
      {successMessage && (
        <Grid item xs={12}>
          <Alert severity="success" onClose={() => setSuccessMessage('')}>{successMessage}</Alert>
        </Grid>
      )}
      
      <Grid item xs={12}>
        <Box sx={{ height: 600 }}>
          <EnterpriseTable rows={collections} columns={columns} loading={loading} />
        </Box>
      </Grid>

      {/* Collect Payment Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Dealer Payment Collection</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Dealer</InputLabel>
              <Select
                value={selectedDealer}
                label="Select Dealer"
                onChange={e => setSelectedDealer(e.target.value)}
              >
                {dealers.map(d => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name || d.username} ({d.email || d.code || 'Dealer'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Amount (₹)"
              type="number"
              fullWidth
              size="small"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 25000"
            />

            <FormControl fullWidth size="small">
              <InputLabel>Payment Mode</InputLabel>
              <Select
                value={mode}
                label="Payment Mode"
                onChange={e => setMode(e.target.value)}
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="UPI">UPI / GPay / PhonePe</MenuItem>
                <MenuItem value="NEFT">NEFT / NetBanking</MenuItem>
                <MenuItem value="RTGS">RTGS</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Reference / Cheque / UTR No"
              fullWidth
              size="small"
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="e.g. UTR-9820194820 or Cheque #49201"
            />

            <TextField
              label="Remarks / Notes"
              fullWidth
              multiline
              rows={2}
              size="small"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Collection details, invoice references, etc."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={submitting} onClick={handleSubmit}>
            {submitting ? <CircularProgress size={20} /> : 'Save & Submit Collection'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
