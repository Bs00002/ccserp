import { useState } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';

import MainCard from 'components/MainCard';

import ArrowLeftOutlined from '@ant-design/icons/ArrowLeftOutlined';
import PrinterOutlined from '@ant-design/icons/PrinterOutlined';
import FilePdfOutlined from '@ant-design/icons/FilePdfOutlined';
import UploadOutlined from '@ant-design/icons/UploadOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import ShopOutlined from '@ant-design/icons/ShopOutlined';
import TruckOutlined from '@ant-design/icons/TruckOutlined';
import CalendarOutlined from '@ant-design/icons/CalendarOutlined';
import PhoneOutlined from '@ant-design/icons/PhoneOutlined';
import FileTextOutlined from '@ant-design/icons/FileTextOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import EnvironmentOutlined from '@ant-design/icons/EnvironmentOutlined';
import SendOutlined from '@ant-design/icons/SendOutlined';

const STEPS = [
  'Draft',
  'Submitted',
  'Pending Approval',
  'Approved',
  'Packing',
  'Ready Dispatch',
  'Dispatched',
  'Delivered',
  'Invoice Generated',
  'Payment Pending',
  'Completed'
];

const statusColorMap = {
  'Draft': 'default',
  'Submitted': 'secondary',
  'Pending Approval': 'warning',
  'Approved': 'info',
  'Packing': 'warning',
  'Ready Dispatch': 'info',
  'Dispatched': 'primary',
  'Delivered': 'success',
  'Invoice Generated': 'info',
  'Payment Pending': 'warning',
  'Completed': 'success',
  'Cancelled': 'error'
};

import api from 'api/client';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { useParams, useNavigate } from 'react-router-dom';

const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        let ord = null;
        if (id) {
          const res = await api.get(`/orders/orders/${id}/`);
          ord = res.data;
        } else {
          const listRes = await api.get('/orders/orders/');
          const list = Array.isArray(listRes.data) ? listRes.data : [];
          if (list.length > 0) ord = list[0];
        }

        if (!ord) {
          setError('Order record not found.');
          setOrder(null);
          return;
        }

        const mapped = {
          id: String(ord.id),
          orderNo: ord.order_number || `ORD-${ord.id}`,
          status: ord.status || 'Pending Approval',
          createdAt: ord.created_at ? ord.created_at.split('T')[0] : '—',
          dealerName: ord.dealer_name || 'Dealer',
          shopName: ord.dealer_name || 'Agro Shop',
          employeeName: ord.created_by_name || 'Staff',
          subtotal: parseFloat(ord.subtotal || ord.total_amount || 0),
          taxAmount: parseFloat(ord.tax || Math.round(parseFloat(ord.total_amount || 0) * 0.18)),
          grandTotal: parseFloat(ord.total_amount || ord.grand_total || 0),
          gstAmount: parseFloat(ord.tax || Math.round(parseFloat(ord.total_amount || 0) * 0.18)),
          comments: ord.remarks || '',
          items: (ord.items && Array.isArray(ord.items)) ? ord.items.map(i => ({
            productName: i.product_name || 'Agri Product',
            sku: i.product_sku || 'SKU',
            packSize: i.pack_size || '1 Ltr',
            quantity: i.quantity || 1,
            unitPrice: parseFloat(i.rate || i.unit_price || 0),
            total: parseFloat(i.total || 0)
          })) : []
        };

        setOrder(mapped);
        const idx = STEPS.indexOf(mapped.status);
        setActiveStep(idx >= 0 ? idx : 0);
      } catch (err) {
        console.error('Failed to load order detail:', err);
        setError('Failed to load order from database.');
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>{error || 'Order not found.'}</Alert>
        <Button variant="contained" onClick={() => navigate('/admin/orders')}>
          Back to Orders
        </Button>
      </Box>
    );
  }

  const nextActionLabel = STEPS[Math.min(activeStep + 1, STEPS.length - 1)];
  const canAdvance = activeStep < STEPS.length - 1;
  const gstSplit = Math.round(order.gstAmount / 2);

  return (
    <Grid container rowSpacing={3} columnSpacing={2.75}>
      <Grid size={12}>
        <Stack direction="row" sx={{ gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <IconButton size="small" sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
            <ArrowLeftOutlined />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="h5">{order.orderNo}</Typography>
              <Chip label={order.status} size="small"
                color={statusColorMap[order.status]}
                sx={{ height: 24, '& .MuiChip-label': { px: 1.5, py: 0.25, fontSize: '0.75rem', fontWeight: 700 } }} />
              {order.comments && (
                <Chip label="Urgent" size="small" color="error" variant="outlined" icon={<SendOutlined />}
                  sx={{ height: 22 }} />
              )}
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Created {order.createdAt} · Sales Officer: {order.employeeName}
            </Typography>
          </Box>
          <Stack direction="row" sx={{ gap: 1 }}>
            <Button size="small" variant="outlined" startIcon={<PrinterOutlined />}>Print</Button>
            <Button size="small" variant="outlined" startIcon={<FilePdfOutlined />}>Export PDF</Button>
            {canAdvance && (
              <Button size="small" variant="contained" color="primary"
                onClick={() => setActiveStep(Math.min(activeStep + 1, STEPS.length - 1))}>
                Move to {nextActionLabel}
              </Button>
            )}
          </Stack>
        </Stack>
      </Grid>

      <Grid size={12}>
        <MainCard title="Order Workflow" subheader="11-stage order lifecycle tracking">
          <Box sx={{ px: 1, pt: 1 }}>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' } }}>
              {STEPS.map((label, _idx) => {
                const isCurrent = order.status === label;
                return (
                  <Step key={label}>
                    <StepLabel
                      optional={
                        isCurrent ? (
                          <Chip size="small" color={statusColorMap[label]} label="Current"
                            sx={{ height: 18, mt: 0.5, '& .MuiChip-label': { fontSize: '0.6rem', fontWeight: 700, px: 0.75 } }} />
                        ) : null
                      }
                    >
                      {label}
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          </Box>
        </MainCard>
      </Grid>

      <Grid size={{ xs: 12, md: 4, lg: 3 }}>
        <Stack sx={{ gap: 2 }}>
          <MainCard title="Customer">
            <Stack sx={{ gap: 2 }}>
              <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center' }}>
                <Avatar sx={{ width: 46, height: 46, bgcolor: 'primary.lighter', color: 'primary.dark', fontWeight: 700 }}>
                  {order.dealerName.split(' ').map(x => x[0]).slice(0, 2).join('')}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{order.shopName}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{order.dealerName}</Typography>
                  <Chip label="Dealer" size="small" variant="outlined" sx={{ height: 18, mt: 0.5, '& .MuiChip-label': { fontSize: '0.6rem' } }} />
                </Box>
              </Stack>
              <Divider />
              <Stack sx={{ gap: 1 }}>
                <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
                  <EnvironmentOutlined style={{ fontSize: '0.85rem', color: 'text.secondary' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Banaskantha, Gujarat - 385001
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
                  <PhoneOutlined style={{ fontSize: '0.85rem', color: 'text.secondary' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>+91 9{Math.floor(Math.random() * 90000 + 10000)} {Math.floor(Math.random() * 90000 + 10000)}</Typography>
                </Stack>
              </Stack>
              <Divider />
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Distributor</Typography>
                <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
                  <ShopOutlined style={{ fontSize: '0.85rem', color: 'info.main' }} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{order.distributorName}</Typography>
                </Stack>
              </Box>
            </Stack>
          </MainCard>

          <MainCard title="Fulfillment Details">
            <Stack sx={{ gap: 1.5 }}>
              {[
                { icon: <CalendarOutlined />, label: 'Order Date', value: order.createdAt },
                { icon: <UserOutlined />, label: 'Sales Officer', value: order.employeeName },
                { icon: <TruckOutlined />, label: 'Transport', value: order.transport || 'Pending' },
                { icon: <FileTextOutlined />, label: 'LR No.', value: order.lrNumber || 'Pending' },
                { icon: <CheckCircleOutlined />, label: 'Expected Delivery', value: order.expectedDelivery || 'TBD' }
              ].map((r, i) => (
                <Stack key={i} direction="row" sx={{ gap: 1.25, alignItems: 'flex-start' }}>
                  <Box sx={{ width: 30, height: 30, borderRadius: 1, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'text.secondary', flexShrink: 0 }}>
                    {r.icon}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600 }}>{r.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.4, wordBreak: 'break-word' }}>{r.value}</Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </MainCard>

          <MainCard title="Documents">
            <Stack sx={{ gap: 1 }}>
              {[
                { name: 'Order Confirmation.pdf', size: '240 KB' },
                { name: 'Delivery Challan.pdf', size: '310 KB' }
              ].map((d, i) => (
                <Box key={i} sx={{ p: 1.25, border: 1, borderColor: 'divider', borderRadius: 1.25 }}>
                  <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
                      <Box sx={{ width: 34, height: 34, borderRadius: 1, bgcolor: 'error.50', color: 'error.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FilePdfOutlined />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{d.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{d.size}</Typography>
                      </Box>
                    </Stack>
                    <IconButton size="small"><FileTextOutlined style={{ fontSize: '0.85rem' }} /></IconButton>
                  </Stack>
                </Box>
              ))}
              <Button size="small" variant="outlined" fullWidth startIcon={<UploadOutlined />}>
                Upload Document
              </Button>
            </Stack>
          </MainCard>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, md: 8, lg: 9 }}>
        <Stack sx={{ gap: 2.5 }}>
          <MainCard title={`Order Items (${order.items.length})`}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>QTY</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Product / SKU</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Rate</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>GST</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>MRP</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items.map((it, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ width: 80 }}>
                        <Chip label={`x ${it.quantity}`} size="small" sx={{ height: 24, minWidth: 50, fontWeight: 700, bgcolor: 'primary.lighter', color: 'primary.dark', border: 0 }} />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{it.productName}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.7rem' }}>{it.sku}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>{formatINR(it.unitPrice)}</TableCell>
                      <TableCell align="right">
                        <Chip label={`${it.gst}%`} size="small" variant="outlined" color="warning"
                          sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.65rem', px: 1 } }} />
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary' }}>{formatINR(it.mrp)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatINR(it.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Divider sx={{ mt: 2 }} />
            <Grid container sx={{ mt: 1.5 }}>
              <Grid size={{ xs: 12, sm: 7 }}>
                {order.comments && (
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'warning.50', borderColor: 'warning.light' }}>
                    <Stack direction="row" sx={{ gap: 1, alignItems: 'flex-start' }}>
                      <SendOutlined style={{ color: 'warning.main', marginTop: 2 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: 'warning.dark', fontWeight: 700 }}>Special Instructions</Typography>
                        <Typography variant="body2" sx={{ color: 'warning.dark', mt: 0.25 }}>{order.comments}</Typography>
                      </Box>
                    </Stack>
                  </Paper>
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <Card variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  <CardContent sx={{ p: 0 }}>
                    {[
                      ['Subtotal', formatINR(order.subtotal), false],
                      ['Discount', `- ${formatINR(order.discount)}`, false],
                      ['CGST', formatINR(gstSplit), false],
                      ['SGST', formatINR(gstSplit), false],
                      ['Freight', formatINR(order.freight), false]
                    ].map((r, i) => (
                      <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 0.8, borderBottom: i < 4 ? 1 : 0, borderColor: 'divider' }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{r[0]}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: r[2] ? 'inherit' : 'text.secondary' }}>{r[1]}</Typography>
                      </Box>
                    ))}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, py: 1.5, bgcolor: 'primary.50' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.dark' }}>GRAND TOTAL</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.dark' }}>{formatINR(order.total)}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </MainCard>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <MainCard title="Order History & Comments">
                <List disablePadding sx={{ '& .MuiListItem-root': { px: 0, py: 1.5 } }}>
                  {[...order.history].reverse().map((h, i) => (
                    <ListItem key={i} alignItems="flex-start" sx={{ position: 'relative', pl: 0, '&:before': { content: i < order.history.length - 1 ? "''" : 'none', position: 'absolute', left: 19, top: 44, bottom: 0, width: 2, bgcolor: 'divider' } }}>
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: i === 0 ? 'primary.lighter' : 'grey.100', color: i === 0 ? 'primary.dark' : 'text.secondary', fontSize: '0.75rem', fontWeight: 700 }}>
                          {h.by.split(' ').map(x => x[0]).slice(0, 1).join('')}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                            <Stack>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                {h.status}
                                {i === 0 && <Chip size="small" color="primary" label="Latest" sx={{ height: 16, '& .MuiChip-label': { fontSize: '0.6rem', px: 0.5 } }} />}
                              </Typography>
                              {h.note && <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>{h.note}</Typography>}
                            </Stack>
                            <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>{h.date}</Typography>
                          </Stack>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 500, mt: 0.25, display: 'block' }}>
                            by {h.by}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 1 }} />
                <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1, mt: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Add comment, note, or update..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    sx={{ flex: 1 }}
                    multiline rows={2}
                  />
                  <Tooltip title="Post Comment">
                    <Button size="small" variant="contained" disableElevation sx={{ alignSelf: { sm: 'flex-end' }, minWidth: 90, height: 40 }}>
                      Post
                    </Button>
                  </Tooltip>
                </Stack>
              </MainCard>
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <MainCard
                title="Quick Actions"
                subheader="Progress order status and perform operations"
              >
                <Stack sx={{ gap: 1.5 }}>
                  {canAdvance ? (
                    <Button variant="contained" size="medium" fullWidth
                      onClick={() => setActiveStep(s => Math.min(s + 1, STEPS.length - 1))}>
                      Move Order to {nextActionLabel}
                    </Button>
                  ) : (
                    <Chip label="Order Completed" color="success" variant="outlined" sx={{ height: 34, '& .MuiChip-label': { fontWeight: 700 } }} />
                  )}
                  <Stack direction="row" sx={{ gap: 1 }}>
                    <Button variant="outlined" size="small" sx={{ flex: 1 }}>Print Packing List</Button>
                    <Button variant="outlined" size="small" sx={{ flex: 1 }}>Send for Packing</Button>
                  </Stack>
                  <Divider />
                  <Stack direction="row" sx={{ gap: 1 }}>
                    <Button variant="outlined" size="small" sx={{ flex: 1 }} color="warning">Hold Order</Button>
                    <Button variant="outlined" size="small" sx={{ flex: 1 }} color="error">Cancel</Button>
                  </Stack>
                  <Divider />
                  <Stack sx={{ gap: 0.75 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Generate Documents</Typography>
                    <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
                      {['Invoice', 'Delivery Challan', 'E-Way Bill', 'Packing Slip'].map((lbl) => (
                        <Button key={lbl} size="small" variant="outlined" startIcon={<FileTextOutlined />} sx={{ textTransform: 'none' }}>
                          {lbl}
                        </Button>
                      ))}
                    </Stack>
                  </Stack>
                </Stack>
              </MainCard>
            </Grid>
          </Grid>
        </Stack>
      </Grid>
    </Grid>
  );
}
