import React, { useState, useEffect, useMemo } from 'react';
import {
  Grid, Typography, Box, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Drawer, Divider, Chip, IconButton, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Alert, CircularProgress, Card, CardContent
} from '@mui/material';
import MainCard from 'components/MainCard';
import EnterpriseTable from 'components/ui/EnterpriseTable';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import api from 'api/client';
import useAuth from 'hooks/useAuth';
import useRealtime from 'hooks/useRealtime';
import {
  PlusOutlined, EyeOutlined, TruckOutlined, SendOutlined, CheckCircleOutlined,
  ContainerOutlined, FileTextOutlined, CloseOutlined, EnvironmentOutlined, UploadOutlined,
  DownloadOutlined, SafetyCertificateOutlined, AlertOutlined
} from '@ant-design/icons';

const statusColorMap = {
  'Approved': 'warning',
  'Ready to Dispatch': 'secondary',
  'Ready Dispatch': 'secondary',
  'Dispatched': 'primary',
  'In Transit': 'primary',
  'Delivered': 'success'
};

const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
};

export default function DispatchPage() {
  const { user } = useAuth();
  const isAdmin = ['Super Admin', 'Admin'].includes(user?.role);
  const isWarehouse = user?.role === 'Warehouse';

  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Bilty Form State (Admin)
  const [biltyNumber, setBiltyNumber] = useState('');
  const [biltyFile, setBiltyFile] = useState(null);

  // LR Form State (Warehouse)
  const [transport, setTransport] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [lrNumber, setLrNumber] = useState('');
  const [lrFile, setLrFile] = useState(null);

  const fetchDispatches = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.get('/orders/');
      const data = Array.isArray(res.data) ? res.data : [];
      
      // Filter for orders relevant to dispatch & logistics
      // Warehouse sees Ready to Dispatch, Dispatched, Delivered
      // Admin sees Approved (awaiting Bilty), Ready to Dispatch, Dispatched, Delivered
      const validStatuses = ['Approved', 'Ready to Dispatch', 'Ready Dispatch', 'Dispatched', 'In Transit', 'Delivered'];
      const filtered = data.filter(o => validStatuses.includes(o.status));

      const mapped = filtered.map(o => ({
        id: o.id,
        orderNumber: o.order_number || `ORD-${o.id}`,
        dealerName: o.dealer_name || 'Dealer',
        grandTotal: parseFloat(o.grand_total || o.total_amount || 0),
        status: o.status === 'Ready Dispatch' ? 'Ready to Dispatch' : o.status,
        biltyNumber: o.bilty_number || '',
        biltyDate: o.bilty_date ? new Date(o.bilty_date).toLocaleDateString() : '',
        biltyUploadedBy: o.bilty_uploaded_by_name || '',
        biltyPdf: o.bilty_pdf || null,
        lrNumber: o.lr_number || '',
        lrDate: o.lr_date ? new Date(o.lr_date).toLocaleDateString() : '',
        lrGeneratedBy: o.lr_generated_by_name || '',
        lrReceiptUpload: o.lr_receipt_upload || null,
        transport: o.transport_details || '',
        vehicleNumber: o.vehicle_number || '',
        items: o.items || [],
        paymentTerms: o.payment_terms || 'Cash (15 Days)',
        date: o.created_at ? new Date(o.created_at).toLocaleDateString() : ''
      }));

      setDispatches(mapped);
    } catch (err) {
      console.error('Failed to fetch dispatch orders:', err);
      setErrorMessage('Unable to load dispatch orders from server. Please verify backend connectivity.');
      setDispatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatches();
  }, []);

  // Real-time listener: auto-refresh dispatches on approval, bilty, lr, or dispatch updates
  useRealtime(
    ['order.approved', 'order.bilty_created', 'order.lr_created', 'order.dispatched'],
    () => {
      fetchDispatches();
    }
  );

  const kpis = useMemo(() => ({
    approvedAwaitingBilty: dispatches.filter(d => d.status === 'Approved').length,
    readyToDispatch: dispatches.filter(d => d.status === 'Ready to Dispatch' || d.status === 'Ready Dispatch').length,
    inTransit: dispatches.filter(d => d.status === 'Dispatched' || d.status === 'In Transit').length,
    delivered: dispatches.filter(d => d.status === 'Delivered').length,
  }), [dispatches]);

  const openDispatchDetail = (dispatchRow) => {
    setSelectedDispatch(dispatchRow);
    setBiltyNumber(dispatchRow.biltyNumber || `BILTY-${dispatchRow.orderNumber}`);
    setBiltyFile(null);
    setTransport(dispatchRow.transport);
    setVehicleNumber(dispatchRow.vehicleNumber);
    setLrNumber(dispatchRow.lrNumber || (dispatchRow.orderNumber ? `LR-${dispatchRow.orderNumber}` : ''));
    setLrFile(null);
    setErrorMessage('');
    setSuccessMessage('');
    setDrawerOpen(true);
  };

  // ADMIN ACTION: Generate Bilty -> status transitions to 'Ready to Dispatch'
  const handleGenerateBilty = async () => {
    if (!selectedDispatch) return;
    if (!isAdmin) {
      setErrorMessage("Unauthorized. Only Admin can generate Bilty.");
      return;
    }
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const formData = new FormData();
      formData.append('bilty_number', biltyNumber || `BILTY-${selectedDispatch.orderNumber}`);
      if (biltyFile) {
        formData.append('bilty_pdf', biltyFile);
      }

      const res = await api.post(`/orders/${selectedDispatch.id}/generate_bilty/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMessage(res.data?.message || 'Bilty generated successfully. Order is now Ready to Dispatch.');
      await fetchDispatches();
      
      // Update selectedDispatch in drawer
      setSelectedDispatch(prev => ({
        ...prev,
        status: 'Ready to Dispatch',
        biltyNumber: biltyNumber || `BILTY-${prev.orderNumber}`
      }));
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.error || 'Failed to generate Bilty.');
    } finally {
      setActionLoading(false);
    }
  };

  // WAREHOUSE / ADMIN ACTION: Save LR Details (Does NOT dispatch)
  const handleSaveLrDetails = async () => {
    if (!selectedDispatch) return;
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const formData = new FormData();
      formData.append('transport_details', transport);
      formData.append('vehicle_number', vehicleNumber);
      formData.append('lr_number', lrNumber);
      if (lrFile) {
        formData.append('lr_receipt_upload', lrFile);
      }

      const res = await api.post(`/orders/${selectedDispatch.id}/generate_lr/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Strict rule verification: status MUST remain Ready to Dispatch!
      setSuccessMessage(res.data?.message || 'LR details saved successfully. Order remains Ready to Dispatch until authorized dispatch.');
      await fetchDispatches();
      
      setSelectedDispatch(prev => ({
        ...prev,
        lrNumber: lrNumber,
        transport: transport,
        vehicleNumber: vehicleNumber
      }));
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.error || 'Failed to save LR details.');
    } finally {
      setActionLoading(false);
    }
  };

  // WAREHOUSE / ADMIN ACTION: Perform Authorized Dispatch
  const handleAuthorizeDispatch = async () => {
    if (!selectedDispatch) return;
    if (!lrNumber && !selectedDispatch.lrNumber) {
      setErrorMessage("Cannot dispatch order without LR Number. Please generate LR first.");
      return;
    }

    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const formData = new FormData();
      formData.append('transport_details', transport || selectedDispatch.transport);
      formData.append('vehicle_number', vehicleNumber || selectedDispatch.vehicleNumber);
      formData.append('lr_number', lrNumber || selectedDispatch.lrNumber);
      if (lrFile) {
        formData.append('lr_receipt_upload', lrFile);
      }

      const res = await api.post(`/orders/${selectedDispatch.id}/dispatch_order/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMessage(res.data?.message || 'Order successfully authorized and marked as Dispatched!');
      await fetchDispatches();

      setSelectedDispatch(prev => ({
        ...prev,
        status: 'Dispatched',
        lrNumber: lrNumber || prev.lrNumber
      }));
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.error || 'Failed to authorize dispatch.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { 
      field: 'orderNumber', 
      headerName: 'Order', 
      flex: 1, 
      minWidth: 120, 
      renderCell: (params) => (
        <Typography 
          color="primary" 
          fontWeight={600} 
          sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} 
          onClick={() => openDispatchDetail(params.row)}
        >
          {params.value}
        </Typography>
      )
    },
    { field: 'dealerName', headerName: 'Dealer', flex: 1.3, minWidth: 140 },
    { 
      field: 'grandTotal', 
      headerName: 'Total Value', 
      flex: 1, 
      minWidth: 110,
      renderCell: (params) => formatINR(params.value)
    },
    { 
      field: 'biltyNumber', 
      headerName: 'Bilty No', 
      flex: 1.2, 
      minWidth: 130, 
      renderCell: (params) => params.value ? (
        <Chip label={params.value} size="small" variant="outlined" color="primary" />
      ) : (
        <Typography variant="caption" color="textSecondary">Pending Bilty</Typography>
      )
    },
    { 
      field: 'lrNumber', 
      headerName: 'LR No', 
      flex: 1.2, 
      minWidth: 130, 
      renderCell: (params) => params.value ? (
        <Chip label={params.value} size="small" color="secondary" />
      ) : (
        <Typography variant="caption" color="textSecondary">Pending LR</Typography>
      )
    },
    { 
      field: 'transport', 
      headerName: 'Transporter / Vehicle', 
      flex: 1.5, 
      minWidth: 160, 
      renderCell: (params) => (
        <Typography variant="body2" noWrap>
          {params.value || params.row.vehicleNumber ? `${params.value || ''} ${params.row.vehicleNumber ? `(${params.row.vehicleNumber})` : ''}` : '-'}
        </Typography>
      )
    },
    { field: 'date', headerName: 'Order Date', flex: 1, minWidth: 110 },
    { 
      field: 'status', 
      headerName: 'Status', 
      flex: 1.2, 
      minWidth: 130,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color={statusColorMap[params.value] || 'default'} />
      )
    }
  ];

  const rowActions = [
    {
      label: 'Manage Logistics & Dispatch',
      icon: <TruckOutlined />,
      onClick: (row) => openDispatchDetail(row),
      showInMenu: true
    }
  ];

  return (
    <Grid container rowSpacing={3} columnSpacing={2.75}>
      <Grid item xs={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4">Dispatch & Logistics Operations</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Enforce strict Bilty → Warehouse LR → Authorized Dispatch ERP workflow
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip 
              icon={<SafetyCertificateOutlined />} 
              label={`Role: ${user?.role || 'User'}`} 
              color="primary" 
              variant="outlined" 
            />
          </Stack>
        </Stack>
      </Grid>

      {/* KPI Cards */}
      {isAdmin && (
        <Grid item xs={12} sm={6} md={3}>
          <AnalyticEcommerce 
            title="Approved (Need Bilty)" 
            count={kpis.approvedAwaitingBilty} 
            icon={<FileTextOutlined />} 
            color="warning" 
          />
        </Grid>
      )}
      <Grid item xs={12} sm={6} md={isAdmin ? 3 : 4}>
        <AnalyticEcommerce 
          title="Ready to Dispatch" 
          count={kpis.readyToDispatch} 
          icon={<ContainerOutlined />} 
          color="secondary" 
        />
      </Grid>
      <Grid item xs={12} sm={6} md={isAdmin ? 3 : 4}>
        <AnalyticEcommerce 
          title="Dispatched / In Transit" 
          count={kpis.inTransit} 
          icon={<TruckOutlined />} 
          color="primary" 
        />
      </Grid>
      <Grid item xs={12} sm={6} md={isAdmin ? 3 : 4}>
        <AnalyticEcommerce 
          title="Delivered" 
          count={kpis.delivered} 
          icon={<CheckCircleOutlined />} 
          color="success" 
        />
      </Grid>

      {/* Global Error Notice if API fails */}
      {errorMessage && !drawerOpen && (
        <Grid item xs={12}>
          <Alert severity="error" onClose={() => setErrorMessage('')} action={
            <Button color="inherit" size="small" onClick={fetchDispatches}>Retry</Button>
          }>
            {errorMessage}
          </Alert>
        </Grid>
      )}

      {/* Orders Table */}
      <Grid item xs={12}>
        <MainCard content={false}>
          <Box sx={{ height: 600 }}>
            <EnterpriseTable 
              rows={dispatches}
              columns={columns}
              loading={loading}
              rowActions={rowActions}
              onRowClick={(params) => openDispatchDetail(params.row)}
            />
          </Box>
        </MainCard>
      </Grid>

      {/* Dispatch Detail Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 640 } } }}
      >
        {selectedDispatch && (
          <Box sx={{ p: 3 }}>
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="h5" color="primary">{selectedDispatch.orderNumber}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {selectedDispatch.dealerName} • Total: {formatINR(selectedDispatch.grandTotal)}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={selectedDispatch.status} color={statusColorMap[selectedDispatch.status] || 'default'} />
                <IconButton onClick={() => setDrawerOpen(false)}><CloseOutlined /></IconButton>
              </Stack>
            </Stack>
            <Divider sx={{ mb: 3 }} />

            {/* In-Drawer Messages */}
            {errorMessage && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage('')}>
                {errorMessage}
              </Alert>
            )}
            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
                {successMessage}
              </Alert>
            )}

            {/* Order Items Summary */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Ordered Items</Typography>
            <TableContainer sx={{ mb: 3, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Rate</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedDispatch.items?.length > 0 ? (
                    selectedDispatch.items.map((it, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{it.product_name || `Product #${it.product}`}</TableCell>
                        <TableCell align="right">{it.quantity}</TableCell>
                        <TableCell align="right">{formatINR(it.rate)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatINR(it.total)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">Standard Order Pack</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* STAGE 1: BILTY MANAGEMENT (Office / Admin Stage) */}
            <Card variant="outlined" sx={{ mb: 3, borderColor: selectedDispatch.biltyNumber ? 'success.light' : 'warning.light' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography variant="h6" color="primary">
                    1. Bilty Tracking (Office Stage)
                  </Typography>
                  {selectedDispatch.biltyNumber ? (
                    <Chip label="Bilty Generated" size="small" color="success" />
                  ) : (
                    <Chip label="Pending Admin Bilty" size="small" color="warning" />
                  )}
                </Stack>

                {selectedDispatch.biltyNumber ? (
                  <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Bilty Number</Typography>
                        <Typography variant="body1" fontWeight={600}>{selectedDispatch.biltyNumber}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Bilty Date</Typography>
                        <Typography variant="body2">{selectedDispatch.biltyDate || 'Recorded'}</Typography>
                      </Grid>
                      {selectedDispatch.biltyUploadedBy && (
                        <Grid item xs={12}>
                          <Typography variant="caption" color="textSecondary">Generated By: {selectedDispatch.biltyUploadedBy}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                ) : (
                  <>
                    {isAdmin ? (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          Admin: Generate Bilty document to transition this order to <strong>Ready to Dispatch</strong> for Warehouse.
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth size="small" label="Bilty Number"
                              value={biltyNumber} onChange={e => setBiltyNumber(e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Button variant="outlined" component="label" startIcon={<UploadOutlined />} fullWidth>
                              Upload Bilty Document (PDF/Image)
                              <input type="file" hidden onChange={e => setBiltyFile(e.target.files[0])} />
                            </Button>
                            {biltyFile && (
                              <Typography variant="caption" color="success.main" display="block" mt={0.5}>
                                Selected: {biltyFile.name}
                              </Typography>
                            )}
                          </Grid>
                          <Grid item xs={12}>
                            <Button 
                              variant="contained" 
                              color="primary" 
                              fullWidth
                              disabled={actionLoading}
                              onClick={handleGenerateBilty}
                            >
                              {actionLoading ? <CircularProgress size={24} /> : 'Generate Bilty & Send to Warehouse'}
                            </Button>
                          </Grid>
                        </Grid>
                      </Box>
                    ) : (
                      <Alert severity="info" icon={<AlertOutlined />}>
                        Awaiting Admin Bilty generation. Warehouse staff cannot generate or modify Bilty.
                      </Alert>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* STAGE 2: LR MANAGEMENT (Warehouse Stage) */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography variant="h6" color="primary">
                    2. Logistics & LR Tracking (Warehouse Stage)
                  </Typography>
                  {selectedDispatch.status === 'Dispatched' ? (
                    <Chip label="Dispatched" size="small" color="primary" />
                  ) : selectedDispatch.lrNumber ? (
                    <Chip label="LR Ready" size="small" color="info" />
                  ) : (
                    <Chip label="Pending LR" size="small" color="default" />
                  )}
                </Stack>

                {selectedDispatch.status === 'Approved' && !selectedDispatch.biltyNumber ? (
                  <Alert severity="warning">
                    LR Generation is locked until Admin generates Bilty and moves order to <strong>Ready to Dispatch</strong>.
                  </Alert>
                ) : (
                  <Box sx={{ mt: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField 
                          fullWidth size="small" 
                          label="Transport Agency / Logistics Name" 
                          placeholder="e.g. VRL Logistics / Sharma Roadways"
                          value={transport} 
                          onChange={e => setTransport(e.target.value)} 
                          disabled={selectedDispatch.status === 'Delivered'}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField 
                          fullWidth size="small" 
                          label="Vehicle Number" 
                          placeholder="e.g. MH-12-AB-1234"
                          value={vehicleNumber} 
                          onChange={e => setVehicleNumber(e.target.value)} 
                          disabled={selectedDispatch.status === 'Delivered'}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField 
                          fullWidth size="small" 
                          label="LR Number" 
                          placeholder="e.g. LR-88201"
                          value={lrNumber} 
                          onChange={e => setLrNumber(e.target.value)} 
                          disabled={selectedDispatch.status === 'Delivered'}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button 
                          variant="outlined" 
                          component="label" 
                          startIcon={<UploadOutlined />} 
                          fullWidth
                          disabled={selectedDispatch.status === 'Delivered'}
                        >
                          Upload LR Receipt (PDF/Image)
                          <input type="file" hidden onChange={e => setLrFile(e.target.files[0])} />
                        </Button>
                        {lrFile && (
                          <Typography variant="caption" color="success.main" display="block" mt={0.5}>
                            Selected: {lrFile.name}
                          </Typography>
                        )}
                      </Grid>
                    </Grid>

                    {/* Operational Buttons */}
                    {selectedDispatch.status !== 'Delivered' && (
                      <Stack spacing={1.5} sx={{ mt: 3 }}>
                        {/* BUTTON 1: SAVE LR DETAILS (STRICT: DOES NOT DISPATCH) */}
                        <Button 
                          variant="outlined" 
                          color="primary" 
                          fullWidth
                          disabled={actionLoading || !lrNumber}
                          onClick={handleSaveLrDetails}
                        >
                          {actionLoading ? <CircularProgress size={24} /> : 'Save LR Details (Keep Ready to Dispatch)'}
                        </Button>
                        <Typography variant="caption" color="textSecondary" textAlign="center">
                          * Saving LR details does NOT dispatch the order automatically.
                        </Typography>

                        <Divider sx={{ my: 1 }} />

                        {/* BUTTON 2: AUTHORIZE & DISPATCH */}
                        {selectedDispatch.status !== 'Dispatched' && (
                          <Button 
                            variant="contained" 
                            color="success" 
                            fullWidth
                            size="large"
                            disabled={actionLoading || (!lrNumber && !selectedDispatch.lrNumber)}
                            onClick={handleAuthorizeDispatch}
                          >
                            {actionLoading ? <CircularProgress size={24} /> : 'Authorize & Dispatch Order'}
                          </Button>
                        )}
                      </Stack>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => setDrawerOpen(false)}>Close</Button>
            </Stack>
          </Box>
        )}
      </Drawer>
    </Grid>
  );
}
