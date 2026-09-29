import { useMemo, useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import LinearProgress from '@mui/material/LinearProgress';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';

import TrophyOutlined from '@ant-design/icons/TrophyOutlined';
import DashboardOutlined from '@ant-design/icons/DashboardOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import TeamOutlined from '@ant-design/icons/TeamOutlined';
import ShopOutlined from '@ant-design/icons/ShopOutlined';
import EnvironmentOutlined from '@ant-design/icons/EnvironmentOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';

import api from 'api/client';
import useAuth from 'hooks/useAuth';

const formatINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

const STATUS_COLOR = {
  'On Track': 'primary',
  Behind: 'warning',
  Achieved: 'success',
  Exceeded: 'secondary'
};

const STATUS_BG = {
  'On Track': 'primary.lighter',
  Behind: 'warning.lighter',
  Achieved: 'success.lighter',
  Exceeded: 'secondary.lighter'
};

const ASSIGNEE_ICONS = {
  Employee: <UserOutlined />,
  Distributor: <TeamOutlined />,
  Dealer: <ShopOutlined />,
  Territory: <EnvironmentOutlined />
};

export default function TargetsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Super Admin' || user?.role === 'Admin';

  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [periodFilter, setPeriodFilter] = useState(null);
  const [assigneeFilter, setAssigneeFilter] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  // Edit / Assign Target Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [targetAmountInput, setTargetAmountInput] = useState('');
  const [monthlySalesPlanInput, setMonthlySalesPlanInput] = useState('');
  const [monthlyCollectionPlanInput, setMonthlyCollectionPlanInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState(null);

  const periodTypes = ['Monthly', 'Quarterly', 'Half Yearly', 'Annual'];
  const assigneeTypes = ['Employee', 'Distributor', 'Dealer', 'Territory'];

  const fetchTargets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/hr/targets/');
      if (Array.isArray(res.data)) {
        setTargets(res.data);
      } else {
        setTargets([]);
      }
    } catch (err) {
      console.error('Failed to fetch targets from backend:', err);
      setError(err?.response?.data?.error || 'Failed to load targets from backend database.');
      setTargets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const handleOpenEdit = (t) => {
    setSelectedTarget(t);
    setTargetAmountInput(t.targetAmount || '');
    setMonthlySalesPlanInput(t.monthlySalesPlan || '');
    setMonthlyCollectionPlanInput(t.monthlyCollectionPlan || '');
    setModalError(null);
    setEditModalOpen(true);
  };

  const handleSaveTarget = async (e) => {
    e.preventDefault();
    if (!selectedTarget) return;
    setSaving(true);
    setModalError(null);
    try {
      await api.post(`/hr/targets/${selectedTarget.id}/update_target/`, {
        targetAmount: parseFloat(targetAmountInput || 0),
        monthlySalesPlan: parseFloat(monthlySalesPlanInput || 0),
        monthlyCollectionPlan: parseFloat(monthlyCollectionPlanInput || 0),
      });
      setEditModalOpen(false);
      await fetchTargets();
    } catch (err) {
      console.error('Failed to update target in database:', err);
      setModalError(err?.response?.data?.error || 'Failed to update target in database.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    return targets.filter((t) => {
      if (periodFilter && t.periodType !== periodFilter) return false;
      if (assigneeFilter && t.assigneeType !== assigneeFilter) return false;
      return true;
    });
  }, [targets, periodFilter, assigneeFilter]);

  const summary = useMemo(() => {
    const assigned = targets.reduce((s, t) => s + (t.targetAmount || 0), 0);
    const achieved = targets.reduce((s, t) => s + (t.achievedAmount || 0), 0);
    const collections = targets.reduce((s, t) => s + (t.actualCollections || 0), 0);
    const pct = assigned > 0 ? Math.round((achieved / assigned) * 100) : 0;
    return { assigned, achieved, collections, pct, count: targets.length };
  }, [targets]);

  const pageData = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage]
  );

  return (
    <Stack spacing={2.75}>
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Targets &amp; Performance</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Define, track and measure performance targets across teams and distributors (Live Database)
            </Typography>
          </Box>
          <Stack direction="row" sx={{ gap: 1 }}>
            <Button variant="outlined" startIcon={<ReloadOutlined />} onClick={fetchTargets} disabled={loading}>
              Refresh
            </Button>
          </Stack>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <AnalyticEcommerce
                title="Total Assigned"
                count={formatINR(summary.assigned).replace('₹', '')}
                prefix="₹"
                color="primary"
                icon={<TrophyOutlined />}
                extra={`${summary.count} team members`}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AnalyticEcommerce
                title="Actual Sales Achieved"
                count={formatINR(summary.achieved).replace('₹', '')}
                prefix="₹"
                color="success"
                icon={<TrophyOutlined />}
                percentage={summary.pct}
                extra={`Collections: ${formatINR(summary.collections)}`}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MainCard contentSX={{ p: 2.25 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                  <Stack sx={{ gap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.2px' }}>
                      Overall Achievement %
                    </Typography>
                    <Stack direction="row" sx={{ alignItems: 'baseline', gap: 0.5 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>{summary.pct}%</Typography>
                    </Stack>
                  </Stack>
                  <Box
                    sx={{
                      width: 42, height: 42, borderRadius: 2, bgcolor: 'secondary.lighter',
                      color: 'secondary.dark', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem'
                    }}
                  >
                    <DashboardOutlined />
                  </Box>
                </Stack>
                <Box sx={{ pt: 1.5, borderTop: 1, borderColor: 'grey.100' }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, summary.pct)}
                    sx={{ height: 10, borderRadius: 5, bgcolor: 'grey.200' }}
                  />
                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.75 }}>
                    <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>Achieved: {formatINR(summary.achieved)}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Target: {formatINR(summary.assigned)}</Typography>
                  </Stack>
                </Box>
              </MainCard>
            </Grid>
          </Grid>

          <MainCard>
            <Stack direction="column" spacing={2}>
              <Box>
                <Stack direction="row" alignItems="center" sx={{ gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, minWidth: 90 }}>Period:</Typography>
                  <Chip label="All" size="small" variant={periodFilter === null ? 'filled' : 'outlined'} onClick={() => setPeriodFilter(null)} sx={{ cursor: 'pointer' }} />
                  {periodTypes.map((p) => (
                    <Chip key={p} label={p} size="small" variant={periodFilter === p ? 'filled' : 'outlined'} color={periodFilter === p ? 'primary' : 'default'} onClick={() => setPeriodFilter(p)} sx={{ cursor: 'pointer' }} />
                  ))}
                </Stack>
                <Stack direction="row" alignItems="center" sx={{ gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, minWidth: 90 }}>Assignee:</Typography>
                  <Chip label="All" size="small" variant={assigneeFilter === null ? 'filled' : 'outlined'} onClick={() => setAssigneeFilter(null)} sx={{ cursor: 'pointer' }} />
                  {assigneeTypes.map((a) => (
                    <Chip key={a} label={a} icon={ASSIGNEE_ICONS[a]} size="small" variant={assigneeFilter === a ? 'filled' : 'outlined'} color={assigneeFilter === a ? 'primary' : 'default'} onClick={() => setAssigneeFilter(a)} sx={{ cursor: 'pointer' }} />
                  ))}
                </Stack>
              </Box>
              <Divider />
              <TableContainer>
                <Table size="small" sx={{ minWidth: 1000 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Assignee</TableCell>
                      <TableCell sx={{ fontWeight: 600, align: 'right' }}>Target</TableCell>
                      <TableCell sx={{ fontWeight: 600, align: 'right' }}>Monthly Sales Plan</TableCell>
                      <TableCell sx={{ fontWeight: 600, align: 'right' }}>Monthly Collection Plan</TableCell>
                      <TableCell sx={{ fontWeight: 600, align: 'right' }}>Sales Achieved</TableCell>
                      <TableCell sx={{ fontWeight: 600, align: 'right' }}>Collections</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 220 }}>Progress</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      {isAdmin && <TableCell sx={{ fontWeight: 600, align: 'center' }}>Action</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pageData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 10 : 9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No sales targets found in database.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pageData.map((row) => (
                        <TableRow key={row.id} hover sx={{ '& > td': { py: 1.5 } }}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.period}</Typography>
                              <Chip label={row.periodType} size="small" variant="outlined" sx={{ mt: 0.5, height: 20, fontSize: '0.68rem' }} />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" sx={{ gap: 1.5 }}>
                              <Avatar
                                sx={{
                                  width: 34, height: 34, bgcolor: STATUS_BG['On Track'],
                                  color: 'primary.dark', fontSize: '0.9rem'
                                }}
                              >
                                {ASSIGNEE_ICONS[row.assigneeType] || <UserOutlined />}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.assigneeName}</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.designation || row.assigneeType}</Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{formatINR(row.targetAmount)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {row.monthlySalesPlan ? formatINR(row.monthlySalesPlan) : '—'}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                            {row.monthlyCollectionPlan ? formatINR(row.monthlyCollectionPlan) : '—'}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                            {formatINR(row.achievedAmount)}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'info.main', fontWeight: 600 }}>
                            {formatINR(row.actualCollections)}
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" sx={{ gap: 1 }}>
                              <Box sx={{ flex: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(100, row.percentage)}
                                  sx={{
                                    height: 8, borderRadius: 4, bgcolor: 'grey.200',
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: row.percentage >= 100 ? 'success.main' : row.percentage >= 75 ? 'primary.main' : 'warning.main'
                                    }
                                  }}
                                />
                              </Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, minWidth: 40, textAlign: 'right' }}>
                                {row.percentage}%
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip label={row.status} color={STATUS_COLOR[row.status] || 'default'} size="small" variant="light" />
                          </TableCell>
                          {isAdmin && (
                            <TableCell align="center">
                              <Tooltip title="Edit Target">
                                <IconButton size="small" color="primary" onClick={() => handleOpenEdit(row)}>
                                  <EditOutlined />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={filtered.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
                rowsPerPageOptions={[8, 16, 25, 50]}
              />
            </Stack>
          </MainCard>
        </>
      )}

      {/* Target Edit Dialog */}
      <Dialog open={editModalOpen} onClose={() => !saving && setEditModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Update Target: {selectedTarget?.assigneeName}
        </DialogTitle>
        <form onSubmit={handleSaveTarget}>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              {modalError && (
                <Alert severity="error">{modalError}</Alert>
              )}
              <TextField
                label="Sales Target (₹)"
                type="number"
                fullWidth
                value={targetAmountInput}
                onChange={(e) => setTargetAmountInput(e.target.value)}
                helperText="Total target amount for current period"
                required
              />
              <TextField
                label="Monthly Sales Plan (₹)"
                type="number"
                fullWidth
                value={monthlySalesPlanInput}
                onChange={(e) => setMonthlySalesPlanInput(e.target.value)}
                helperText="Monthly sales objective"
              />
              <TextField
                label="Monthly Collection Plan (₹)"
                type="number"
                fullWidth
                value={monthlyCollectionPlanInput}
                onChange={(e) => setMonthlyCollectionPlanInput(e.target.value)}
                helperText="Monthly target collection objective"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setEditModalOpen(false)} disabled={saving} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save & Persist'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
