import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Pagination from '@mui/material/Pagination';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import LinearProgress from '@mui/material/LinearProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';

import SearchOutlined from '@ant-design/icons/SearchOutlined';
import FilterOutlined from '@ant-design/icons/FilterOutlined';
import FileExcelOutlined from '@ant-design/icons/FileExcelOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import ShopOutlined from '@ant-design/icons/ShopOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import WarningOutlined from '@ant-design/icons/WarningOutlined';
import PercentageOutlined from '@ant-design/icons/PercentageOutlined';
import CloseOutlined from '@ant-design/icons/CloseOutlined';

import api from 'api/client';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

const formatINR = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
};

const statusColor = (status) => {
  switch (status) {
    case 'Active': return 'success';
    case 'Inactive': return 'default';
    case 'Suspended': return 'warning';
    default: return 'default';
  }
};

export default function DistributorsPage() {
  const navigate = useNavigate();
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [tabValue, setTabValue] = useState('All');
  const [page, setPage] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const rowsPerPage = 10;

  const fetchDistributors = async () => {
    setLoading(true);
    setError(null);
    try {
      let data = [];
      try {
        const res = await api.get('/crm/distributors/');
        if (Array.isArray(res.data) && res.data.length > 0) {
          data = res.data;
        }
      } catch {
        // fallback to admin users query
      }

      if (data.length === 0) {
        const adminRes = await api.get('/admin/users/?role=Distributor');
        if (Array.isArray(adminRes.data)) {
          data = adminRes.data.map((u, i) => ({
            id: String(u.id),
            code: u.ccs_id || `DST-${i + 1}`,
            name: u.company_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
            firmName: u.company_name || u.username,
            ownerName: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
            mobile: u.phone || '—',
            district: u.city || u.distributor_profile?.district || 'General',
            creditLimit: parseFloat(u.distributor_profile?.monthly_sales_plan || 500000),
            outstanding: 0,
            status: u.is_active ? 'Active' : 'Inactive'
          }));
        }
      } else {
        data = data.map((d, i) => ({
          id: String(d.id),
          code: d.code || `DST-${i + 1}`,
          name: d.name || d.company_name,
          firmName: d.company_name || d.name,
          ownerName: d.contact_person || d.name,
          mobile: d.phone || '—',
          district: d.city || d.district || 'General',
          creditLimit: parseFloat(d.credit_limit || d.monthly_sales_plan || 500000),
          outstanding: parseFloat(d.outstanding_balance || 0),
          status: d.status || 'Active'
        }));
      }

      setDistributors(data);
    } catch (err) {
      console.error('Failed to load distributors:', err);
      setError('Failed to load distributors from database.');
      setDistributors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistributors();
  }, []);

  const filtered = useMemo(() => {
    let list = [...distributors];
    if (tabValue !== 'All') list = list.filter(d => d.status === tabValue);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(d =>
        (d.name && d.name.toLowerCase().includes(s)) ||
        (d.code && d.code.toLowerCase().includes(s)) ||
        (d.ownerName && d.ownerName.toLowerCase().includes(s)) ||
        (d.firmName && d.firmName.toLowerCase().includes(s)) ||
        (d.district && d.district.toLowerCase().includes(s)) ||
        (d.mobile && d.mobile.includes(s))
      );
    }
    return list;
  }, [distributors, search, tabValue]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageData = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const totalOutstanding = distributors.reduce((s, d) => s + (d.outstanding || 0), 0);
  const totalCredit = distributors.reduce((s, d) => s + (d.creditLimit || 0), 0);
  const activeDistributors = distributors.filter(d => d.status === 'Active');

  const kpis = {
    total: distributors.length,
    active: activeDistributors.length,
    outstanding: totalOutstanding,
    creditUtilized: totalCredit > 0 ? Math.round((totalOutstanding / totalCredit) * 100) : 0
  };

  const tabs = ['All', 'Active', 'Inactive'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {error && (
        <Grid item size={12}>
          <Alert severity="error">{error}</Alert>
        </Grid>
      )}
      <Grid item size={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" sx={{ gap: 2 }}>
          <Box>
            <Typography variant="h5">Distributors</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Manage channel partners, credit limits, territory mapping and dealer network
            </Typography>
          </Box>
          <Stack direction="row" alignItems="center" flexWrap="wrap" sx={{ gap: 1.5 }}>
            <TextField
              size="small"
              placeholder="Search distributors..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              sx={{ width: { xs: 1, sm: 260 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined style={{ fontSize: 16, color: 'text.secondary' }} />
                  </InputAdornment>
                )
              }}
            />
            <Chip icon={<FilterOutlined />} label="Filter" size="medium" sx={{ height: 40, '& .MuiChip-icon': { ml: 0.5 } }} clickable />
            <Button variant="outlined" startIcon={<FileExcelOutlined />} size="medium" sx={{ height: 40 }}>Export</Button>
            <Button variant="contained" startIcon={<PlusOutlined />} size="medium" sx={{ height: 40 }}>Create Distributor</Button>
          </Stack>
        </Stack>
      </Grid>

      <Grid item size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce title="Total Distributors" count={kpis.total} icon={<ShopOutlined />} color="primary" extra={`${activeDistributors.length} active partners`} />
      </Grid>
      <Grid item size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce title="Active" count={kpis.active} icon={<CheckCircleOutlined />} color="success" extra={`${distributors.filter(d => d.status === 'Inactive').length} inactive`} />
      </Grid>
      <Grid item size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce title="Total Outstanding" count={formatINR(kpis.outstanding).replace('₹', '')} prefix="₹" icon={<WarningOutlined />} color="warning" extra={`${distributors.filter(d => d.outstanding > 0).length} accounts`} />
      </Grid>
      <Grid item size={{ xs: 12, sm: 6, lg: 3 }}>
        <MainCard contentSX={{ p: 2.25 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
            <Stack sx={{ gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>Credit Utilized</Typography>
              <Stack direction="row" sx={{ alignItems: 'baseline', flexWrap: 'wrap', gap: 0.5 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{kpis.creditUtilized}%</Typography>
              </Stack>
            </Stack>
            <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: 'info.lighter', color: 'info.dark', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
              <PercentageOutlined />
            </Box>
          </Stack>
          <Box sx={{ pt: 0.5 }}>
            <LinearProgress variant="determinate" value={kpis.creditUtilized} color={kpis.creditUtilized > 80 ? 'warning' : 'info'} sx={{ height: 8, borderRadius: 4 }} />
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{formatINR(totalOutstanding)} used</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{formatINR(totalCredit)} limit</Typography>
            </Stack>
          </Box>
        </MainCard>
      </Grid>

      <Grid item size={12}>
        <MainCard content={false}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 1.5 }}>
            <Tabs value={tabValue} onChange={(_, v) => { setTabValue(v); setPage(1); }} variant="scrollable" scrollButtons={false}>
              {tabs.map(t => (
                <Tab
                  key={t}
                  value={t}
                  label={
                    <Badge
                      badgeContent={t === 'All' ? distributors.length : distributors.filter(d => d.status === t).length}
                      color="primary"
                      max={999}
                      sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}
                    >
                      {t}
                    </Badge>
                  }
                  sx={{ minHeight: 48, textTransform: 'none', fontWeight: 600 }}
                />
              ))}
            </Tabs>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Showing <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{filtered.length}</Box> records
            </Typography>
          </Stack>
          <Divider />
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table sx={{ minWidth: 1000 }}>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Firm</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Owner</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Mobile</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>GST No.</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>District</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Credit Limit</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Outstanding</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pageData.map((row) => {
                  const util = row.creditLimit > 0 ? Math.round((row.outstanding / row.creditLimit) * 100) : 0;
                  return (
                    <TableRow key={row.id} hover sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }} onClick={() => navigate(`/management/distributors/${row.id}`)}>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.code}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" sx={{ gap: 1.5 }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.lighter', color: 'secondary.main', fontWeight: 600, fontSize: '0.85rem' }}>
                            {row.firmName?.split(' ').map(n => n[0]).slice(0, 2).join('') || row.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{row.name}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.firmName}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>{row.ownerName}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.mobile}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'text.secondary' }}>{row.gst || 'Pending'}</TableCell>
                      <TableCell>{row.district}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{formatINR(row.creditLimit)}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: row.outstanding > row.creditLimit * 0.8 ? 'warning.main' : 'text.primary' }}>
                            {formatINR(row.outstanding)}
                          </Typography>
                          <LinearProgress variant="determinate" value={Math.min(util, 100)} color={util > 80 ? 'warning' : util > 60 ? 'primary' : 'success'} sx={{ height: 4, borderRadius: 2, mt: 0.5, width: 80 }} />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={row.status} color={statusColor(row.status)} size="small" sx={{ fontWeight: 500 }} />
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Stack direction="row" justifyContent="flex-end" sx={{ gap: 0.25 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" color="info" onClick={() => navigate(`/management/distributors/${row.id}`)}>
                              <EyeOutlined style={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" color="primary"><EditOutlined style={{ fontSize: 16 }} /></IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => setDeleteDialog(row)}>
                              <DeleteOutlined style={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {pageData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>No distributors found.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 2 }} flexWrap="wrap">
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Rows per page: {rowsPerPage} • Total: {filtered.length}
            </Typography>
            <Pagination count={pageCount} page={page} onChange={(_, p) => setPage(p)} color="primary" size="small" />
          </Stack>
        </MainCard>
      </Grid>

      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Stack direction="row" alignItems="center" sx={{ gap: 1 }}>
            <DeleteOutlined style={{ color: 'error.main' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Delete Distributor</Typography>
          </Stack>
          <IconButton size="small" onClick={() => setDeleteDialog(null)}><CloseOutlined style={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Are you sure you want to delete <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{deleteDialog?.name}</Box>?
            All associated dealer mappings will be affected.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteDialog(null)} variant="outlined" size="small">Cancel</Button>
          <Button onClick={() => setDeleteDialog(null)} variant="contained" color="error" size="small">Delete</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
