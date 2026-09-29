import React, { useState, useEffect, useMemo } from 'react';
import {
  Grid, Typography, Box, Stack, TextField, InputAdornment, Button, Chip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Tabs, Tab,
  Divider, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress
} from '@mui/material';

import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import api from 'api/client';
import useAuth from 'hooks/useAuth';
import useRealtime from 'hooks/useRealtime';

import SearchOutlined from '@ant-design/icons/SearchOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import ContainerOutlined from '@ant-design/icons/ContainerOutlined';
import InboxOutlined from '@ant-design/icons/InboxOutlined';
import WarningOutlined from '@ant-design/icons/WarningOutlined';
import FileTextOutlined from '@ant-design/icons/FileTextOutlined';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';

const txnColor = {
  Purchase: 'success',
  Production: 'success',
  Opening: 'info',
  Transfer: 'primary',
  Damage: 'error',
  Expiry: 'error',
  Sale: 'warning',
  Adjustment: 'default'
};

const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
};

export default function WarehousePage() {
  const { user } = useAuth();
  const isAdminOrWarehouse = ['Super Admin', 'Admin', 'Warehouse'].includes(user?.role);

  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  
  // Data state
  const [productsList, setProductsList] = useState([]);
  const [stockLedger, setStockLedger] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [ledgerPage, setLedgerPage] = useState(0);
  const [ledgerRows, setLedgerRows] = useState(15);

  // Stock Movement Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [movementType, setMovementType] = useState('Purchase');
  const [quantity, setQuantity] = useState('');
  const [reference, setReference] = useState('');
  const [remarks, setRemarks] = useState('');

  const fetchInventoryData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      // 1. Fetch current stock status
      const stockRes = await api.get('/inventory/stock/current_stock/');
      const prodData = Array.isArray(stockRes.data) ? stockRes.data : [];
      setProductsList(prodData);

      // 2. Fetch stock ledger history
      const ledgerRes = await api.get('/inventory/stock/');
      const ledgerData = Array.isArray(ledgerRes.data) ? ledgerRes.data : [];
      setStockLedger(ledgerData);

      // 3. Fetch warehouses
      const whRes = await api.get('/inventory/warehouses/');
      const whData = Array.isArray(whRes.data) ? whRes.data : [];
      setWarehouses(whData);
      if (whData.length > 0 && !selectedWarehouse) {
        setSelectedWarehouse(whData[0].id);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
      setErrorMessage('Unable to load warehouse data. Please verify connectivity.');
      setProductsList([]);
      setStockLedger([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  // Real-time listener: auto-refresh inventory and ledger when stock movements occur
  useRealtime('stock.updated', () => {
    fetchInventoryData();
  });

  const kpis = useMemo(() => {
    const totalPhysicalStock = productsList.reduce((sum, p) => sum + (p.stock || 0), 0);
    const lowStockCount = productsList.filter(p => p.stock > 0 && p.stock <= (p.reorderLevel || 20)).length;
    const outOfStockCount = productsList.filter(p => p.stock === 0).length;
    const totalCatalogValue = productsList.reduce((sum, p) => sum + ((p.stock || 0) * (p.dealerPrice || 0)), 0);

    return {
      totalPhysicalStock,
      lowStockCount,
      outOfStockCount,
      totalCatalogValue
    };
  }, [productsList]);

  const filteredInventory = useMemo(() => {
    let rows = productsList;
    if (filterType === 'Low Stock') rows = rows.filter(r => r.stock > 0 && r.stock <= (r.reorderLevel || 20));
    if (filterType === 'Out of Stock') rows = rows.filter(r => r.stock === 0);
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(r => (r.name || '').toLowerCase().includes(s) || (r.sku || '').toLowerCase().includes(s));
    }
    return rows;
  }, [productsList, search, filterType]);

  const pagedInventory = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredInventory.slice(start, start + rowsPerPage);
  }, [filteredInventory, page, rowsPerPage]);

  const filteredLedger = useMemo(() => {
    let rows = stockLedger;
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(r => 
        (r.product_name || '').toLowerCase().includes(s) || 
        (r.type || '').toLowerCase().includes(s) || 
        (r.reference || '').toLowerCase().includes(s)
      );
    }
    return rows;
  }, [stockLedger, search]);

  const pagedLedger = useMemo(() => {
    const start = ledgerPage * ledgerRows;
    return filteredLedger.slice(start, start + ledgerRows);
  }, [filteredLedger, ledgerPage, ledgerRows]);

  const handleRecordMovement = async () => {
    if (!selectedProduct || !quantity || !movementType) {
      setErrorMessage("Please select product, movement type and enter quantity.");
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await api.post('/inventory/stock/', {
        product: selectedProduct,
        warehouse: selectedWarehouse || (warehouses[0] ? warehouses[0].id : null),
        type: movementType,
        quantity: parseInt(quantity, 10),
        reference: reference || `REF-${Date.now().toString().slice(-6)}`,
        remarks: remarks
      });

      setSuccessMessage(`Stock movement recorded successfully! New stock for product: ${res.data?.current_stock ?? 'updated'}`);
      setDialogOpen(false);
      setSelectedProduct('');
      setQuantity('');
      setReference('');
      setRemarks('');
      await fetchInventoryData();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.error || 'Failed to record stock movement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Grid container rowSpacing={3} columnSpacing={2.75}>
      <Grid item xs={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4">Warehouse & Inventory Control</Typography>
            <Typography variant="body2" color="textSecondary">
              Live database stock tracking, physical movements, damage logs and warehouse audits
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<ReloadOutlined />} onClick={fetchInventoryData}>
              Refresh Stock
            </Button>
            {isAdminOrWarehouse && (
              <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => { setErrorMessage(''); setDialogOpen(true); }}>
                Record Stock Movement
              </Button>
            )}
          </Stack>
        </Stack>
      </Grid>

      {/* Error & Success Alerts */}
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

      {/* KPI Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce title="Total Physical Units" count={kpis.totalPhysicalStock.toLocaleString()} icon={<ContainerOutlined />} color="primary" />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce title="Estimated Stock Value" count={formatINR(kpis.totalCatalogValue)} icon={<InboxOutlined />} color="success" />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce title="Low Stock Alerts" count={kpis.lowStockCount} icon={<WarningOutlined />} color="warning" />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <AnalyticEcommerce title="Out of Stock" count={kpis.outOfStockCount} icon={<WarningOutlined />} color="error" />
      </Grid>

      {/* Main Tabs */}
      <Grid item xs={12}>
        <MainCard content={false}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                <Tab label="Product Stock Matrix" />
                <Tab label="Stock Movement Ledger" />
              </Tabs>
              
              <TextField
                size="small"
                placeholder="Search products or references..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                sx={{ width: { xs: '100%', sm: 260 }, my: 1 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchOutlined /></InputAdornment>
                }}
              />
            </Stack>
          </Box>

          {/* TAB 0: PRODUCT STOCK MATRIX */}
          {tabValue === 0 && (
            <Box>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Product Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>SKU Code</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Dealer Rate</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Current Stock</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Stock Valuation</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <CircularProgress size={28} />
                        </TableCell>
                      </TableRow>
                    ) : pagedInventory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          No products found in inventory.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedInventory.map(p => (
                        <TableRow key={p.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{p.sku}</TableCell>
                          <TableCell>{p.category}</TableCell>
                          <TableCell align="right">{formatINR(p.dealerPrice)}</TableCell>
                          <TableCell align="center">
                            <Typography fontWeight={700} color={p.stock === 0 ? 'error.main' : (p.stock <= p.reorderLevel ? 'warning.main' : 'text.primary')}>
                              {p.stock} Units
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {formatINR(p.stock * p.dealerPrice)}
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={p.status} 
                              size="small" 
                              color={p.stock > 20 ? 'success' : (p.stock > 0 ? 'warning' : 'error')} 
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={filteredInventory.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              />
            </Box>
          )}

          {/* TAB 1: STOCK MOVEMENT LEDGER */}
          {tabValue === 1 && (
            <Box>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Date & Time</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Movement Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Warehouse Hub</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Reference</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <CircularProgress size={28} />
                        </TableCell>
                      </TableRow>
                    ) : pagedLedger.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          No stock movement records in ledger. Click "Record Stock Movement" to add stock.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedLedger.map(l => (
                        <TableRow key={l.id} hover>
                          <TableCell>{new Date(l.created_at).toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip label={l.type} size="small" color={txnColor[l.type] || 'default'} />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{l.product_name}</TableCell>
                          <TableCell>{l.warehouse_name || 'Central Hub'}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: ['Purchase', 'Production', 'Opening'].includes(l.type) ? 'success.main' : 'error.main' }}>
                            {['Purchase', 'Production', 'Opening'].includes(l.type) ? '+' : '-'}{l.quantity}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{l.reference || '-'}</TableCell>
                          <TableCell>{l.remarks || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={filteredLedger.length}
                rowsPerPage={ledgerRows}
                page={ledgerPage}
                onPageChange={(_, p) => setLedgerPage(p)}
                onRowsPerPageChange={e => { setLedgerRows(parseInt(e.target.value, 10)); setLedgerPage(0); }}
              />
            </Box>
          )}
        </MainCard>
      </Grid>

      {/* Record Stock Movement Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Warehouse Stock Movement</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Product</InputLabel>
              <Select
                value={selectedProduct}
                label="Product"
                onChange={e => setSelectedProduct(e.target.value)}
              >
                {productsList.map(p => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} (Current Stock: {p.stock})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Movement Type</InputLabel>
              <Select
                value={movementType}
                label="Movement Type"
                onChange={e => setMovementType(e.target.value)}
              >
                <MenuItem value="Purchase">Purchase (Stock In)</MenuItem>
                <MenuItem value="Production">Production (Stock In)</MenuItem>
                <MenuItem value="Opening">Opening Stock Balance</MenuItem>
                <MenuItem value="Damage">Damage (Stock Out)</MenuItem>
                <MenuItem value="Expiry">Expiry (Stock Out)</MenuItem>
                <MenuItem value="Sale">Sale (Stock Out)</MenuItem>
                <MenuItem value="Transfer">Transfer</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Quantity (Units)"
              type="number"
              fullWidth
              size="small"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="e.g. 50"
            />

            <FormControl fullWidth size="small">
              <InputLabel>Warehouse Hub</InputLabel>
              <Select
                value={selectedWarehouse}
                label="Warehouse Hub"
                onChange={e => setSelectedWarehouse(e.target.value)}
              >
                {warehouses.map(w => (
                  <MenuItem key={w.id} value={w.id}>
                    {w.name} ({w.location || 'Depot'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Batch / Reference No"
              fullWidth
              size="small"
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="e.g. BATCH-2026-X1"
            />

            <TextField
              label="Remarks / Notes"
              fullWidth
              multiline
              rows={2}
              size="small"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Reason for movement or inspection note"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={submitting} onClick={handleRecordMovement}>
            {submitting ? <CircularProgress size={20} /> : 'Save Stock Movement'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
