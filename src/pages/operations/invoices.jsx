import React, { useState, useEffect, useMemo } from 'react';
import { Grid, Typography, Box, Stack, Drawer, Divider, Chip, IconButton, Button, Alert } from '@mui/material';
import DataTable from 'components/DataTable';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import MainCard from 'components/MainCard';
import { formatINR } from 'data/ccsMock';
import api from 'api/client';
import { 
  FileTextOutlined, CheckCircleOutlined, WarningOutlined, 
  PrinterOutlined, DownloadOutlined, UploadOutlined, ShareAltOutlined,
  EyeOutlined, CloseOutlined
} from '@ant-design/icons';
import { FileText, CheckCircle2, AlertTriangle, IndianRupee } from 'lucide-react';
import StatusBadge from 'components/ui/StatusBadge';

const statusColorMap = {
  'Paid': 'success',
  'Unpaid': 'error',
  'Pending': 'warning',
  'Partial': 'warning'
};

export default function InvoicesAdmin() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/invoices/');
      const data = res.data?.results || res.data;
      if (Array.isArray(data)) {
        const mapped = data.map(i => {
          const total = parseFloat(i.total_amount || 0);
          const pending = parseFloat(i.balance_due || 0);
          return {
            id: i.id,
            invoiceNumber: i.invoice_number,
            orderNumber: i.order_number || '-',
            date: new Date(i.created_at || i.generated_at).toLocaleDateString(),
            dealer: i.dealer_name || i.dealer || 'Dealer',
            total: total,
            paid: total - pending,
            pending: pending,
            status: i.status || 'Pending',
            pdf: i.pdf
          };
        });
        setInvoices(mapped);
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.error('Failed to fetch invoices', err);
      setError('Failed to load invoices from server. Please verify backend connection.');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (inv) => {
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
      alert(`Could not download PDF for invoice ${inv.invoiceNumber}`);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const kpis = useMemo(() => ({
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'Paid').length,
    pending: invoices.filter(i => i.status === 'Unpaid' || i.status === 'Partial').length,
    pendingAmount: invoices.reduce((acc, i) => acc + i.pending, 0)
  }), [invoices]);

  const columns = [
    { field: 'invoiceNumber', headerName: 'Invoice No.', flex: 1, minWidth: 120, renderCell: (params) => (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
        <Typography color="primary" fontWeight={600} sx={{ cursor: 'pointer' }} onClick={() => openInvoiceDetail(params.row)}>
          {params.value}
        </Typography>
      </Box>
    )},
    { field: 'dealer', headerName: 'Dealer', flex: 1.5, minWidth: 200 },
    { field: 'date', headerName: 'Date', flex: 1, minWidth: 120 },
    { field: 'total', headerName: 'Amount', flex: 1, minWidth: 120, renderCell: (params) => (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
        <Typography fontWeight={600}>{formatINR(params.value)}</Typography>
      </Box>
    )},
    { field: 'pending', headerName: 'Pending', flex: 1, minWidth: 120, renderCell: (params) => (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
        <Typography fontWeight={600} color={params.value > 0 ? 'error.main' : 'textSecondary'}>{formatINR(params.value || 0)}</Typography>
      </Box>
    )},
    { field: 'status', headerName: 'Status', flex: 1, minWidth: 120, renderCell: (params) => (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
        <Chip label={params.value} size="small" color={statusColorMap[params.value] || 'default'} />
      </Box>
    )},
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      width: 150,
      align: 'center',
      renderCell: (params) => (
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ height: '100%' }}>
          <IconButton size="small" color="primary" onClick={() => openInvoiceDetail(params.row)}>
            <EyeOutlined />
          </IconButton>
          <IconButton size="small" color="secondary" onClick={() => handleDownloadPdf(params.row)}>
            <DownloadOutlined />
          </IconButton>
        </Stack>
      )
    }
  ];

  const openInvoiceDetail = (invoice) => {
    setSelectedInvoice(invoice);
    setDrawerOpen(true);
  };

  return (
    <Grid container rowSpacing={3} columnSpacing={2.75}>
      <Grid item xs={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>Invoices</Typography>
            <Typography variant="body2" color="textSecondary">Manage system generated invoices, download, and upload LR.</Typography>
          </Box>
        </Stack>
      </Grid>
      
      {error && (
        <Grid item xs={12}>
          <Alert severity="error">{error}</Alert>
        </Grid>
      )}

      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce title="Total Invoices" count={kpis.total} icon={<FileText size={20} />} color="primary" />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce title="Paid Invoices" count={kpis.paid} icon={<CheckCircle2 size={20} />} color="success" />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce title="Pending Invoices" count={kpis.pending} icon={<AlertTriangle size={20} />} color="warning" />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce title="Outstanding Amount" count={formatINR(kpis.pendingAmount)} icon={<IndianRupee size={20} />} color="error" />
      </Grid>

      <Grid item xs={12}>
        <MainCard content={false}>
          <DataTable 
            rows={invoices} 
            columns={columns} 
            loading={loading}
          />
        </MainCard>
      </Grid>

      {/* Invoice Detail Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 600, md: 700 }, bgcolor: '#F8FAFC' } }}
      >
        {selectedInvoice && (
          <Box sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Box>
                  <Typography variant="h5">{selectedInvoice.invoiceNumber}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Generated: {selectedInvoice.date}</Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={selectedInvoice.status} sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 600 }} />
                  <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: 'white' }}><CloseOutlined /></IconButton>
                </Stack>
              </Stack>
            </Box>

            <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
              
              {/* Financial Summary */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                  <MainCard content={false} sx={{ p: 2, height: '100%', bgcolor: 'primary.lighter', borderColor: 'primary.light' }}>
                    <Typography variant="caption" color="primary.main" textTransform="uppercase">Total Amount</Typography>
                    <Typography variant="h5" fontWeight={700} color="primary.main" mt={0.5}>{formatINR(selectedInvoice.total)}</Typography>
                  </MainCard>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <MainCard content={false} sx={{ p: 2, height: '100%', bgcolor: 'success.lighter', borderColor: 'success.light' }}>
                    <Typography variant="caption" color="success.main" textTransform="uppercase">Amount Paid</Typography>
                    <Typography variant="h5" fontWeight={700} color="success.main" mt={0.5}>{formatINR(selectedInvoice.paid)}</Typography>
                  </MainCard>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <MainCard content={false} sx={{ p: 2, height: '100%', bgcolor: 'error.lighter', borderColor: 'error.light' }}>
                    <Typography variant="caption" color="error.main" textTransform="uppercase">Balance Due</Typography>
                    <Typography variant="h5" fontWeight={700} color="error.main" mt={0.5}>{formatINR(selectedInvoice.pending)}</Typography>
                  </MainCard>
                </Grid>
              </Grid>

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
                <Button variant="contained" color="primary" startIcon={<DownloadOutlined />} onClick={() => handleDownloadPdf(selectedInvoice)}>Download PDF</Button>
                <Button variant="outlined" color="primary" startIcon={<PrinterOutlined />} onClick={() => window.print()}>Print</Button>
                <Button variant="outlined" color="primary" startIcon={<ShareAltOutlined />}>Share</Button>
                <Button variant="outlined" color="secondary" startIcon={<UploadOutlined />}>Upload LR</Button>
              </Stack>

              {/* Timeline (Mock) */}
              <Typography variant="h6" gutterBottom>Payment Timeline</Typography>
              <MainCard sx={{ p: 2 }}>
                <Stack spacing={3}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main', mt: 0.5 }} />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>Invoice Generated</Typography>
                      <Typography variant="body2" color="textSecondary">{selectedInvoice.date}</Typography>
                    </Box>
                  </Box>
                  {selectedInvoice.paid > 0 && (
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.5 }} />
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>Payment Received</Typography>
                        <Typography variant="body2" color="textSecondary">Received {formatINR(selectedInvoice.paid)} via Bank Transfer</Typography>
                      </Box>
                    </Box>
                  )}
                  {selectedInvoice.pending > 0 && (
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main', mt: 0.5 }} />
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>Pending Payment</Typography>
                        <Typography variant="body2" color="textSecondary">{formatINR(selectedInvoice.pending)} remaining</Typography>
                      </Box>
                    </Box>
                  )}
                </Stack>
              </MainCard>
              
            </Box>
          </Box>
        )}
      </Drawer>
    </Grid>
  );
}
