import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Stack, List, ListItemButton, ListItemText, Divider, TextField, InputAdornment, Button, Chip, Grid, Alert, CircularProgress } from '@mui/material';
import MasterDetailLayout from 'components/ui/MasterDetailLayout';
import { SearchOutlined, DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import api from 'api/client';
import { formatINR } from 'data/ccsMock';
import MainCard from 'components/MainCard';

export default function DealerInvoices() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/invoices/');
        const raw = res.data?.results || res.data;
        if (Array.isArray(raw)) {
          const formatted = raw.map(i => ({
            id: String(i.id),
            invoiceNumber: i.invoice_number,
            orderNumber: i.order_number || '-',
            totalAmount: parseFloat(i.total_amount || 0),
            pendingAmount: parseFloat(i.balance_due || 0),
            status: i.status || 'Pending',
            date: new Date(i.created_at || i.generated_at).toLocaleDateString(),
            lrNumber: i.lr_number || '-',
            biltyNo: i.bilty_no || '-',
            pdf: i.pdf
          }));
          setData(formatted);
          if (formatted.length > 0) setSelectedId(formatted[0].id);
        } else {
          setData([]);
        }
      } catch (err) {
        console.error('Failed to fetch dealer invoices', err);
        setError('Failed to load your invoices from server. Please verify backend connection.');
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    return data.filter(i =>
      i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (i.orderNumber && i.orderNumber.toLowerCase().includes(search.toLowerCase()))
    );
  }, [data, search]);

  const selectedInvoice = data.find(i => i.id === selectedId) || (data.length > 0 ? data[0] : null);

  const handleDownloadFile = async (type, inv) => {
    if (!inv) return;
    if (inv.pdf) {
      window.open(inv.pdf, '_blank');
      return;
    }
    try {
      const res = await api.get(`/invoices/${inv.id}/generate_pdf/`);
      if (res.data?.download_url) {
        window.open(res.data.download_url, '_blank');
      } else {
        alert(`Invoice ${inv.invoiceNumber} PDF download initiated.`);
      }
    } catch (e) {
      alert(`Could not download ${type} for invoice ${inv.invoiceNumber}`);
    }
  };

  const masterContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, bgcolor: '#F9FAFB', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>My Invoices</Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by invoice number..."
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
        {error && (
          <Alert severity="error" sx={{ m: 1.5 }}>{error}</Alert>
        )}
      </Box>
      <List sx={{ p: 0, flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <Box p={4} textAlign="center">
            <CircularProgress size={28} />
          </Box>
        ) : filteredInvoices.length === 0 ? (
          <Box p={3} textAlign="center">
            <Typography variant="body2" color="textSecondary">No invoices found for your account.</Typography>
          </Box>
        ) : (
          filteredInvoices.map((i) => (
            <React.Fragment key={i.id}>
              <ListItemButton
                selected={selectedId === i.id}
                onClick={() => setSelectedId(i.id)}
                sx={{
                  py: 2,
                  px: 2,
                  bgcolor: selectedId === i.id ? 'primary.lighter' : 'transparent',
                  borderLeft: '4px solid',
                  borderColor: selectedId === i.id ? 'primary.main' : 'transparent',
                  '&:hover': { bgcolor: selectedId === i.id ? 'primary.lighter' : 'grey.100' }
                }}
              >
                <ListItemText
                  primary={<Typography variant="subtitle1" fontWeight={600}>{i.invoiceNumber}</Typography>}
                  secondary={
                    <Box mt={0.5}>
                      <Stack direction="row" justifyContent="space-between" mt={1}>
                        <Typography variant="body2" fontWeight={600} color="primary.main">{formatINR(i.totalAmount)}</Typography>
                        <Typography variant="caption" color="textSecondary">{i.date}</Typography>
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

  const detailContent = selectedInvoice ? (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>{selectedInvoice.invoiceNumber}</Typography>
          <Typography variant="body1" color="textSecondary">Issued Date: {selectedInvoice.date}</Typography>
        </Box>
        <Chip
          label={selectedInvoice.status}
          color={selectedInvoice.status === 'Paid' ? 'success' : selectedInvoice.status === 'Partial' ? 'warning' : 'error'}
          sx={{ px: 1, height: 32, fontSize: '0.875rem', fontWeight: 600 }}
        />
      </Stack>

      {/* Download Action Buttons */}
      <Stack direction="row" spacing={2} mb={4} flexWrap="wrap" gap={1}>
        <Button variant="contained" startIcon={<DownloadOutlined />} onClick={() => handleDownloadFile('Invoice PDF', selectedInvoice)}>
          Download Invoice PDF
        </Button>
        <Button variant="outlined" startIcon={<DownloadOutlined />} onClick={() => handleDownloadFile('Bill Receipt', selectedInvoice)}>
          Download Bill
        </Button>
        <Button variant="outlined" color="secondary" startIcon={<DownloadOutlined />} onClick={() => handleDownloadFile('LR / Bilty', selectedInvoice)}>
          Download LR / Bilty ({selectedInvoice.lrNumber})
        </Button>
      </Stack>

      <MainCard title="Invoice & Payment Breakdown" sx={{ mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="textSecondary">Invoice Number</Typography>
            <Typography variant="body1" fontWeight={600}>{selectedInvoice.invoiceNumber}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="textSecondary">Issue Date</Typography>
            <Typography variant="body1" fontWeight={600}>{selectedInvoice.date}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="textSecondary">Total Bill Amount</Typography>
            <Typography variant="h6" fontWeight={700}>{formatINR(selectedInvoice.totalAmount)}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="textSecondary">Balance Due</Typography>
            <Typography variant="h6" fontWeight={700} color="error.main">{formatINR(selectedInvoice.pendingAmount)}</Typography>
          </Grid>
        </Grid>
      </MainCard>

      <MainCard title="Transport & Logistics (LR Details)">
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary">LR (Lorry Receipt) Number</Typography>
            <Typography variant="body1" fontWeight={600}>{selectedInvoice.lrNumber}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary">Bilty Number</Typography>
            <Typography variant="body1" fontWeight={600}>{selectedInvoice.biltyNo}</Typography>
          </Grid>
        </Grid>
      </MainCard>
    </Box>
  ) : (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
      <Typography>Select an invoice to view details</Typography>
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
