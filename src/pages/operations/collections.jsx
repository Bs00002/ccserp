import { useMemo, useState, useEffect } from 'react';
import { 
  Grid, Box, Stack, Typography, Button, Tabs, Tab, Chip, Divider, Drawer, IconButton, 
  Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  FormControl, InputLabel, Select, MenuItem 
} from '@mui/material';

import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import DataTable from 'components/DataTable';
import api from 'api/client';
import useAuth from 'hooks/useAuth';
import useRealtime from 'hooks/useRealtime';
import { 
  WalletOutlined, CloudSyncOutlined, CloseOutlined, FileTextOutlined, PlusOutlined,
  CheckCircleOutlined, SyncOutlined 
} from '@ant-design/icons';
import { IndianRupee, Eye, CheckCircle2 } from 'lucide-react';

const TABS = ['All', 'Collection', 'Invoice'];

const MODE_COLOR = {
  Cash: 'success',
  Cheque: 'warning',
  NEFT: 'primary',
  RTGS: 'info',
  UPI: 'secondary',
  'Credit Note': 'default',
  'N/A': 'default'
};

const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
};

export default function CollectionsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [collections, setCollections] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // New Collection Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDealerId, setSelectedDealerId] = useState('');
  const [collectionAmount, setCollectionAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  const fetchCollections = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.get('/wallet/ledger/');
      const data = Array.isArray(res.data) ? res.data : [];
      const mapped = data.map(c => ({
        id: c.id,
        receiptNo: `REC-${String(c.id).slice(0, 8).toUpperCase()}`,
        date: new Date(c.created_at).toLocaleDateString(),
        amount: parseFloat(c.amount || 0),
        type: c.type,
        dealerName: c.dealer_name || 'Dealer',
        dealerEmail: c.dealer_email || '',
        referenceNo: c.reference || c.transaction_id || '-',
        collectedBy: c.created_by_name || 'System',
        mode: c.payment_method || (c.payment_details ? c.payment_details.method : 'Cash'),
        status: c.payment_status || 'Completed',
        notes: c.notes || ''
      }));
      setCollections(mapped);
    } catch (err) {
      console.error('Failed to load collections:', err);
      setErrorMessage('Failed to connect to wallet ledger. Please check backend connection.');
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
    } catch (e) {
      console.warn('Dealers list fallback:', e);
    }
  };

  useEffect(() => {
    fetchCollections();
    fetchDealers();
  }, []);

  // Real-time listener: auto-refresh collections when payments or ledger entries are recorded
  useRealtime('payment.created', () => {
    fetchCollections();
  });

  const filtered = useMemo(() => {
    if (tab === 0) return collections;
    return collections.filter((c) => c.type === TABS[tab]);
  }, [tab, collections]);

  const kpis = useMemo(() => {
    const totalCollected = collections.reduce((s, c) => s + (c.amount || 0), 0);
    const byMode = { Cash: 0, Cheque: 0, NEFT: 0, RTGS: 0, UPI: 0, 'Credit Note': 0, 'N/A': 0 };
    collections.forEach((c) => { 
      const m = c.mode || 'Cash';
      if (byMode[m] !== undefined) byMode[m] += c.amount; 
      else byMode['N/A'] += c.amount;
    });
    return { totalCollected, byMode };
  }, [collections]);

  const openDrawer = (record) => {
    setSelectedRecord(record);
    setDrawerOpen(true);
  };

  const handleRecordCollection = async () => {
    if (!selectedDealerId || !collectionAmount) {
      setErrorMessage("Please select a dealer and enter collection amount.");
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      await api.post('/wallet/ledger/', {
        dealer: selectedDealerId,
        amount: parseFloat(collectionAmount),
        payment_method: paymentMode,
        reference: referenceNo || `TXN-${Date.now().toString().slice(-6)}`,
        notes: notes
      });

      setSuccessMessage("Collection recorded and credited to dealer ledger successfully!");
      setDialogOpen(false);
      setSelectedDealerId('');
      setCollectionAmount('');
      setReferenceNo('');
      setNotes('');
      await fetchCollections();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.error || 'Failed to record collection.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { 
      field: 'receiptNo', 
      headerName: 'Receipt No', 
      flex: 1, 
      minWidth: 120, 
      renderCell: (params) => (
        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
          <Typography color="primary" fontWeight={600} sx={{ cursor: 'pointer' }} onClick={() => openDrawer(params.row)}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    { field: 'date', headerName: 'Date', flex: 1, minWidth: 110 },
    { field: 'dealerName', headerName: 'Dealer', flex: 1.5, minWidth: 150 },
    { field: 'type', headerName: 'Type', flex: 1, minWidth: 110 },
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
    { 
      field: 'mode', 
      headerName: 'Payment Mode', 
      flex: 1.2, 
      minWidth: 130, 
      renderCell: (params) => (
        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
          <Chip label={params.value} color={MODE_COLOR[params.value] || 'info'} size="small" variant="outlined" />
        </Box>
      )
    },
    { 
      field: 'referenceNo', 
      headerName: 'Reference', 
      flex: 1.3, 
      minWidth: 140, 
      renderCell: (params) => (
        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <Typography variant="caption" fontFamily="monospace">{params.value}</Typography>
        </Box>
      )
    },
    { field: 'collectedBy', headerName: 'Recorded By', flex: 1.3, minWidth: 140 },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      width: 90,
      align: 'center',
      renderCell: (params) => (
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ height: '100%' }}>
          <IconButton size="small" color="primary" onClick={() => openDrawer(params.row)}>
            <Eye size={18} />
          </IconButton>
        </Stack>
      )
    }
  ];

  return (
    <Stack spacing={3}>
      <Grid container rowSpacing={3} columnSpacing={2.75}>
        <Grid item xs={12}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>Collections & Payments</Typography>
              <Typography variant="body2" color="textSecondary">
                Live SQLite wallet ledger, verified receipts, and dealer balance management
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => setDialogOpen(true)}>
                Record Collection
              </Button>
            </Stack>
          </Stack>
        </Grid>
      </Grid>

      {/* Messages */}
      {errorMessage && (
        <Alert severity="error" onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <AnalyticEcommerce
            title="Total Processed"
            count={formatINR(kpis.totalCollected).replace('₹', '')}
            prefix="₹"
            color="success"
            icon={<IndianRupee size={20} />}
          />
        </Grid>
        
        <Grid item xs={12} md={9}>
          <MainCard title="Mode-wise Real Ledger Distribution">
            <Grid container spacing={2}>
              {Object.entries(kpis.byMode).filter(([_, amt]) => amt > 0).map(([mode, amt]) => (
                <Grid key={mode} item xs={6} sm={4} md={2.4}>
                  <Box sx={{ p: 2, bgcolor: `${MODE_COLOR[mode] || 'info'}.lighter`, borderRadius: 1.5, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: `${MODE_COLOR[mode] || 'info'}.dark`, fontWeight: 600 }}>{mode}</Typography>
                    <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 700, color: `${MODE_COLOR[mode] || 'info'}.dark` }}>
                      {formatINR(amt)}
                    </Typography>
                  </Box>
                </Grid>
              ))}
              {Object.values(kpis.byMode).every(amt => amt === 0) && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary" sx={{ p: 1, display: 'block', textAlign: 'center' }}>
                    No collections recorded in ledger yet.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </MainCard>
        </Grid>
      </Grid>

      <MainCard content={false}>
        <Box sx={{ px: 2, pt: 2 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
            >
              {TABS.map((t) => (
                <Tab key={t} label={t} />
              ))}
            </Tabs>
            <Chip label={`${filtered.length} records`} variant="outlined" size="small" />
          </Stack>
        </Box>
        <Divider />
        <DataTable 
          rows={filtered}
          columns={columns}
          loading={loading}
        />
      </MainCard>

      {/* Record Collection Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment Collection</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Dealer</InputLabel>
              <Select
                value={selectedDealerId}
                label="Select Dealer"
                onChange={e => setSelectedDealerId(e.target.value)}
              >
                {dealers.map(d => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name || d.username} ({d.email || d.code || 'Dealer'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Collection Amount (₹)"
              type="number"
              fullWidth
              size="small"
              value={collectionAmount}
              onChange={e => setCollectionAmount(e.target.value)}
              placeholder="e.g. 50000"
            />

            <FormControl fullWidth size="small">
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentMode}
                label="Payment Method"
                onChange={e => setPaymentMode(e.target.value)}
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="UPI">UPI / QR</MenuItem>
                <MenuItem value="NEFT">NEFT</MenuItem>
                <MenuItem value="RTGS">RTGS</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
                <MenuItem value="Credit Note">Credit Note</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Reference / Cheque / UTR No"
              fullWidth
              size="small"
              value={referenceNo}
              onChange={e => setReferenceNo(e.target.value)}
              placeholder="e.g. UTR-9820491829"
            />

            <TextField
              label="Remarks / Notes"
              fullWidth
              multiline
              rows={2}
              size="small"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional collection notes"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={submitting} onClick={handleRecordCollection}>
            {submitting ? <CircularProgress size={20} /> : 'Save Collection'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 500 }, bgcolor: '#F8FAFC' } }}
      >
        {selectedRecord && (
          <Box sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Box>
                  <Typography variant="h5">{selectedRecord.receiptNo}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>{selectedRecord.date}</Typography>
                </Box>
                <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: 'white' }}><CloseOutlined /></IconButton>
              </Stack>
            </Box>

            <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                  <MainCard content={false} sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.lighter', borderColor: 'primary.light' }}>
                    <Typography variant="subtitle2" color="primary.main" textTransform="uppercase">Amount</Typography>
                    <Typography variant="h3" fontWeight={700} color="primary.main" mt={1}>{formatINR(selectedRecord.amount)}</Typography>
                    <Chip label={selectedRecord.mode} color={MODE_COLOR[selectedRecord.mode] || 'info'} sx={{ mt: 2 }} />
                  </MainCard>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Dealer</Typography>
                  <Typography variant="body1" fontWeight={600}>{selectedRecord.dealerName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Recorded By</Typography>
                  <Typography variant="body1" fontWeight={600}>{selectedRecord.collectedBy}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Transaction Type</Typography>
                  <Typography variant="body1" fontWeight={600}>{selectedRecord.type}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Status</Typography>
                  <Typography variant="body1" fontWeight={600} color="success.main">{selectedRecord.status}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">Reference / Transaction No</Typography>
                  <Typography variant="body1" fontFamily="monospace" sx={{ p: 1, bgcolor: 'grey.100', borderRadius: 1, mt: 0.5 }}>
                    {selectedRecord.referenceNo}
                  </Typography>
                </Grid>
                {selectedRecord.notes && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">Notes</Typography>
                    <Typography variant="body2" sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1, mt: 0.5 }}>
                      {selectedRecord.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Box>
        )}
      </Drawer>
    </Stack>
  );
}
