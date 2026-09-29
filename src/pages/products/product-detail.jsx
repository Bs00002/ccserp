import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

import MainCard from 'components/MainCard';
import api from 'api/client';

import ArrowLeftOutlined from '@ant-design/icons/ArrowLeftOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import PrinterOutlined from '@ant-design/icons/PrinterOutlined';
import FilePdfOutlined from '@ant-design/icons/FilePdfOutlined';
import ContainerOutlined from '@ant-design/icons/ContainerOutlined';
import InboxOutlined from '@ant-design/icons/InboxOutlined';
import WarningOutlined from '@ant-design/icons/WarningOutlined';
import FileTextOutlined from '@ant-design/icons/FileTextOutlined';
import ShoppingCartOutlined from '@ant-design/icons/ShoppingCartOutlined';
import TagOutlined from '@ant-design/icons/TagOutlined';
import CheckSquareOutlined from '@ant-design/icons/CheckSquareOutlined';

function TabPanel({ children, value, index }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
};

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [stockLedger, setStockLedger] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const fetchProductData = async () => {
    setLoading(true);
    setError(null);
    try {
      let prodData = null;
      if (id) {
        try {
          const res = await api.get(`/products/${id}/`);
          prodData = res.data;
        } catch {
          // If direct id lookup failed, try fetching product list
          const listRes = await api.get('/products/');
          const list = Array.isArray(listRes.data) ? listRes.data : [];
          prodData = list.find(p => String(p.id) === String(id)) || null;
        }
      } else {
        const listRes = await api.get('/products/');
        const list = Array.isArray(listRes.data) ? listRes.data : [];
        if (list.length > 0) prodData = list[0];
      }

      if (!prodData) {
        setError('Product record not found in database.');
        setProduct(null);
        return;
      }

      setProduct(prodData);

      // Fetch warehouse stock ledger and warehouse list
      const [ledgerRes, whRes] = await Promise.all([
        api.get('/inventory/stock/').catch(() => ({ data: [] })),
        api.get('/inventory/warehouses/').catch(() => ({ data: [] }))
      ]);

      const allLedger = Array.isArray(ledgerRes.data) ? ledgerRes.data : [];
      const prodMovements = allLedger.filter(l => 
        String(l.product) === String(prodData.id) || 
        l.product_name === prodData.name
      );
      setStockLedger(prodMovements);

      const allWarehouses = Array.isArray(whRes.data) ? whRes.data : [];
      setWarehouses(allWarehouses);

    } catch (err) {
      console.error('Failed to load product detail:', err);
      setError(err?.response?.data?.error || 'Failed to load product from database.');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Product not found.'}
        </Alert>
        <Button variant="contained" startIcon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/products')}>
          Back to Products
        </Button>
      </Box>
    );
  }

  const stock = Number(product.stock || 0);
  const mrp = Number(product.mrp || 0);
  const dealerPrice = Number(product.dealer_price || 0);
  const distributorPrice = Number(product.distributor_price || (dealerPrice * 0.9));
  const gstRate = Number(product.gst_rate || 18);
  const categoryName = product.category_name || (typeof product.category === 'object' ? product.category?.name : product.category) || 'General Category';

  return (
    <Grid container rowSpacing={3} columnSpacing={2.75}>
      <Grid item size={12}>
        <Stack direction="row" sx={{ gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <IconButton size="small" onClick={() => navigate('/admin/products')} sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
            <ArrowLeftOutlined />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="h5">{product.name}</Typography>
              <Chip label={categoryName} size="small" color="primary" variant="outlined"
                sx={{ height: 22, '& .MuiChip-label': { fontSize: '0.7rem' } }} />
              <Chip label={product.status || 'Active'} size="small"
                color={product.status === 'Active' ? 'success' : 'default'}
                sx={{ height: 22, '& .MuiChip-label': { fontSize: '0.7rem' } }} />
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
              SKU: {product.sku || `SKU-${product.id}`} · Code: {product.code || `PRD-${product.id}`} · GST: {gstRate}%
            </Typography>
          </Box>
          <Stack direction="row" sx={{ gap: 1 }}>
            <Button size="small" variant="outlined" startIcon={<PrinterOutlined />} onClick={() => window.print()}>Print</Button>
            <Button size="small" variant="contained" startIcon={<EditOutlined />} onClick={() => alert('Product specifications managed via Products Catalog.')}>Edit Product</Button>
          </Stack>
        </Stack>
      </Grid>

      <Grid item size={12}>
        <MainCard>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto">
              <Tab label="Overview" icon={<ShoppingCartOutlined />} iconPosition="start" />
              <Tab label="Specifications" icon={<TagOutlined />} iconPosition="start" />
              <Tab label="Inventory & Stock" icon={<ContainerOutlined />} iconPosition="start" />
              <Tab label="Pricing" icon={<FileTextOutlined />} iconPosition="start" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item size={{ xs: 12, md: 4 }}>
                <MainCard contentSX={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280 }}>
                  <Avatar
                    sx={{
                      width: 160,
                      height: 160,
                      borderRadius: 3,
                      bgcolor: 'primary.lighter',
                      color: 'primary.dark',
                      fontSize: '3rem',
                      fontWeight: 800
                    }}
                  >
                    {product.name ? product.name.slice(0, 2).toUpperCase() : 'PR'}
                  </Avatar>
                </MainCard>
              </Grid>
              <Grid item size={{ xs: 12, md: 8 }}>
                <Grid container spacing={2}>
                  <Grid item size={12}>
                    <MainCard title="Product Information">
                      <Stack sx={{ gap: 1.75 }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600 }}>Technical Name</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{product.technical_name || product.name}</Typography>
                        </Box>
                        <Divider />
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600 }}>Recommended Dosage</Typography>
                          <Typography variant="body2">{product.dosage || '1.5 - 2.0 ml per litre of water or as per agronomist recommendation'}</Typography>
                        </Box>
                        <Divider />
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600 }}>Target Crops</Typography>
                          <Typography variant="body2">{product.crop || 'Cotton, Paddy, Wheat, Soybean, Vegetables, and Horticulture'}</Typography>
                        </Box>
                        <Divider />
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600 }}>Target Diseases / Pests</Typography>
                          <Typography variant="body2">{product.disease || 'Broad spectrum fungal diseases, sucking pests, and yield enhancement'}</Typography>
                        </Box>
                      </Stack>
                    </MainCard>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={2.5}>
              {[
                { label: 'SKU Code', value: product.sku || `SKU-${product.id}` },
                { label: 'GST Rate', value: `${gstRate}%` },
                { label: 'Category', value: categoryName },
                { label: 'Unit of Measure', value: 'Units / Bottles' },
                { label: 'Country of Origin', value: 'India' },
                { label: 'Manufacturer', value: 'Chitra Crop Science Pvt. Ltd.' },
                { label: 'Technical Name', value: product.technical_name || product.name },
                { label: 'Status', value: product.status || 'Active' }
              ].map((s, i) => (
                <Grid key={i} item size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem' }}>
                        {s.label}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{s.value}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={2.5}>
              <Grid item size={{ xs: 12, sm: 6, lg: 4 }}>
                <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'primary.light', bgcolor: 'primary.50' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'primary.dark', fontWeight: 600 }}>CURRENT TOTAL STOCK</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.dark', mt: 0.5 }}>{stock} Units</Typography>
                      </Box>
                      <ContainerOutlined style={{ fontSize: '2rem', color: 'rgba(22,119,255,0.6)' }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item size={{ xs: 12, sm: 6, lg: 4 }}>
                <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'success.light', bgcolor: 'success.50' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'success.dark', fontWeight: 600 }}>STOCK VALUATION</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.dark', mt: 0.5 }}>{formatINR(stock * dealerPrice)}</Typography>
                      </Box>
                      <InboxOutlined style={{ fontSize: '2rem', color: 'rgba(22,163,74,0.6)' }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item size={{ xs: 12, sm: 6, lg: 4 }}>
                <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: stock > 50 ? 'info.light' : 'warning.light', bgcolor: stock > 50 ? 'info.50' : 'warning.50' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: stock > 50 ? 'info.dark' : 'warning.dark', fontWeight: 600 }}>INVENTORY STATUS</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: stock > 50 ? 'info.dark' : 'warning.dark', mt: 0.5 }}>
                          {stock > 50 ? 'In Stock' : 'Low Stock'}
                        </Typography>
                      </Box>
                      <WarningOutlined style={{ fontSize: '2rem', color: 'rgba(220,38,38,0.6)' }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item size={12}>
                <MainCard title="Recent Stock Movements (Database Ledger)" subheader={`${stockLedger.length} ledger movements recorded`}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'grey.50' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Date & Time</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Movement Type</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Warehouse Hub</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Quantity</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Reference</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Remarks</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stockLedger.map((t) => (
                          <TableRow key={t.id} hover>
                            <TableCell>{new Date(t.created_at).toLocaleString('en-IN')}</TableCell>
                            <TableCell>
                              <Chip label={t.type} size="small" color={['Purchase', 'Production', 'Opening'].includes(t.type) ? 'success' : 'error'}
                                sx={{ height: 22, '& .MuiChip-label': { fontSize: '0.7rem', fontWeight: 600 } }} />
                            </TableCell>
                            <TableCell>{t.warehouse_name || 'Central Hub'}</TableCell>
                            <TableCell align="right" sx={{ color: ['Purchase', 'Production', 'Opening'].includes(t.type) ? 'success.main' : 'error.main', fontWeight: 700 }}>
                              {['Purchase', 'Production', 'Opening'].includes(t.type) ? '+' : '-'}{t.quantity}
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{t.reference || '—'}</TableCell>
                            <TableCell>{t.remarks || '—'}</TableCell>
                          </TableRow>
                        ))}
                        {stockLedger.length === 0 && (
                          <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><Typography variant="body2" sx={{ color: 'text.secondary' }}>No stock movements recorded in database</Typography></TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </MainCard>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={2.5}>
              {[
                { label: 'MRP (Maximum Retail Price)', value: formatINR(mrp), sub: 'Catalog retail price', color: 'primary' },
                { label: 'Dealer Rate', value: formatINR(dealerPrice), sub: 'Direct dealer purchase price', color: 'success' },
                { label: 'Distributor Rate', value: formatINR(distributorPrice), sub: 'Channel partner rate', color: 'info' },
                { label: 'Applicable GST', value: `${gstRate}%`, sub: 'Tax rate', color: 'warning' }
              ].map((p, i) => (
                <Grid key={i} item size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 2.25 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{p.label}</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.75 }}>{p.value}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{p.sub}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>
        </MainCard>
      </Grid>
    </Grid>
  );
}
