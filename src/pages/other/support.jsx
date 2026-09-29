import { useMemo, useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItemSelect from '@mui/material/MenuItem';

import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';

import CustomerServiceOutlined from '@ant-design/icons/CustomerServiceOutlined';
import SyncOutlined from '@ant-design/icons/SyncOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import LockOutlined from '@ant-design/icons/LockOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import MessageOutlined from '@ant-design/icons/MessageOutlined';
import CheckSquareOutlined from '@ant-design/icons/CheckSquareOutlined';
import LockFilled from '@ant-design/icons/LockFilled';
import MoreOutlined from '@ant-design/icons/MoreOutlined';
import TeamOutlined from '@ant-design/icons/TeamOutlined';
import ShopOutlined from '@ant-design/icons/ShopOutlined';
import UserSwitchOutlined from '@ant-design/icons/UserSwitchOutlined';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';

import api from 'api/client';
import useAuth from 'hooks/useAuth';
import useRealtime from 'hooks/useRealtime';

const STATUS_KPI_MAP = [
  { key: 'Open', color: 'primary', icon: <CustomerServiceOutlined />, label: 'Open Tickets' },
  { key: 'In Progress', color: 'warning', icon: <SyncOutlined />, label: 'In Progress' },
  { key: 'Resolved', color: 'success', icon: <CheckCircleOutlined />, label: 'Resolved' },
  { key: 'Closed', color: 'default', icon: <LockOutlined />, label: 'Closed' }
];

const STATUS_TABS = ['All', 'Open', 'In Progress', 'Resolved', 'Closed', 'Requested', 'Approved'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const STATUS_COLOR = {
  Open: 'primary',
  New: 'primary',
  Requested: 'info',
  Approved: 'success',
  'In Progress': 'warning',
  'Pending Customer': 'secondary',
  Resolved: 'success',
  Closed: 'default',
  Rejected: 'error'
};

const PRIORITY_COLOR = {
  Low: 'default',
  Medium: 'primary',
  High: 'warning',
  Critical: 'error'
};

const TYPE_COLOR = {
  Complaint: 'error',
  Return: 'warning',
  Query: 'primary'
};

const RAISED_ICON = {
  Dealer: <ShopOutlined />,
  Distributor: <TeamOutlined />,
  Employee: <UserSwitchOutlined />,
  Customer: <ShopOutlined />
};

const RAISED_COLOR = {
  Dealer: 'primary',
  Distributor: 'secondary',
  Employee: 'success',
  Customer: 'info'
};

export default function SupportPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Super Admin' || user?.role === 'Admin';

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tab, setTab] = useState(0);
  const [priority, setPriority] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [menu, setMenu] = useState(null);

  // New Ticket Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [category, setCategory] = useState('Quality');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const [compRes, retRes, enqRes] = await Promise.all([
        api.get('/support/complaints/').catch((e) => {
          console.error("Complaints fetch error:", e);
          return { data: [] };
        }),
        api.get('/support/returns/').catch((e) => {
          console.error("Returns fetch error:", e);
          return { data: [] };
        }),
        isAdmin ? api.get('/support/enquiries/').catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ]);

      const unified = [];

      if (Array.isArray(compRes.data)) {
        compRes.data.forEach((c) => {
          unified.push({
            id: c.id,
            rawType: 'complaint',
            ticketNo: `CMP-${c.id.slice(0, 8).toUpperCase()}`,
            title: `${c.category}: ${c.description || 'Support complaint'}`,
            type: 'Complaint',
            category: c.category,
            priority: 'Medium',
            status: c.status || 'Open',
            raisedBy: c.dealer_name || 'Dealer Partner',
            raisedByType: c.dealer_role || 'Dealer',
            assignee: c.assigned_to_name || 'Unassigned',
            createdAt: c.created_at ? new Date(c.created_at).toLocaleDateString() : '—',
            updatedAt: c.updated_at ? new Date(c.updated_at).toLocaleDateString() : '—',
            resolutionTimeline: c.resolution_timeline || '',
          });
        });
      }

      if (Array.isArray(retRes.data)) {
        retRes.data.forEach((r) => {
          unified.push({
            id: r.id,
            rawType: 'return',
            ticketNo: `RET-${r.id.slice(0, 8).toUpperCase()}`,
            title: `Return: ${r.reason} (Qty: ${r.quantity})`,
            type: 'Return',
            category: r.reason,
            orderNo: r.order_number,
            priority: 'High',
            status: r.status || 'Requested',
            raisedBy: r.dealer_name || 'Dealer Partner',
            raisedByType: r.dealer_role || 'Dealer',
            assignee: r.assigned_to_name || 'Unassigned',
            createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString() : '—',
            updatedAt: r.updated_at ? new Date(r.updated_at).toLocaleDateString() : '—',
          });
        });
      }

      if (Array.isArray(enqRes.data)) {
        enqRes.data.forEach((e) => {
          unified.push({
            id: e.id,
            rawType: 'enquiry',
            ticketNo: `ENQ-${e.id.slice(0, 8).toUpperCase()}`,
            title: `${e.department}: ${e.message?.slice(0, 50) || 'Enquiry message'}`,
            type: 'Query',
            category: e.department,
            priority: 'Low',
            status: e.is_resolved ? 'Resolved' : 'Open',
            raisedBy: e.name || e.email,
            raisedByType: 'Customer',
            assignee: 'Helpdesk Team',
            createdAt: e.created_at ? new Date(e.created_at).toLocaleDateString() : '—',
            updatedAt: e.created_at ? new Date(e.created_at).toLocaleDateString() : '—',
          });
        });
      }

      setTickets(unified);
    } catch (err) {
      console.error('Error fetching support tickets:', err);
      setError(err?.response?.data?.error || 'Failed to load support records from database.');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Real-time listener: auto-refresh support complaints/returns when updated
  useRealtime('support.updated', () => {
    fetchTickets();
  });

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await api.post('/support/complaints/', {
        category,
        description,
      });
      setCreateOpen(false);
      setDescription('');
      await fetchTickets();
    } catch (err) {
      console.error('Error creating ticket:', err);
      setCreateError(err?.response?.data?.error || 'Failed to register support complaint.');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!menu?.ticket) return;
    const target = menu.ticket;
    setMenu(null);
    try {
      if (target.rawType === 'complaint') {
        await api.post(`/support/complaints/${target.id}/update_status/`, {
          status: newStatus,
        });
      } else if (target.rawType === 'return') {
        await api.post(`/support/returns/${target.id}/update_status/`, {
          status: newStatus,
        });
      } else if (target.rawType === 'enquiry') {
        await api.post(`/support/enquiries/${target.id}/resolve/`);
      }
      await fetchTickets();
    } catch (err) {
      console.error('Failed to update ticket status:', err);
      alert(err?.response?.data?.error || 'Failed to update ticket status.');
    }
  };

  const kpis = useMemo(() => {
    const counts = {};
    STATUS_KPI_MAP.forEach((s) => {
      counts[s.key] = tickets.filter((t) => t.status === s.key).length;
    });
    return counts;
  }, [tickets]);

  const filtered = useMemo(() => {
    const t = STATUS_TABS[tab];
    return tickets.filter((s) => {
      if (t !== 'All' && s.status !== t) return false;
      if (priority && s.priority !== priority) return false;
      return true;
    });
  }, [tickets, tab, priority]);

  const pageData = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage]
  );

  return (
    <Stack spacing={2.75}>
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Support Tickets</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Customer support, complaints, returns and service requests (Live Database)
            </Typography>
          </Box>
          <Stack direction="row" sx={{ gap: 1 }}>
            <Button variant="outlined" startIcon={<ReloadOutlined />} onClick={fetchTickets} disabled={loading}>
              Refresh
            </Button>
            <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              New Ticket
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
            {STATUS_KPI_MAP.map((k) => (
              <Grid key={k.key} item xs={12} sm={6} md={3}>
                <AnalyticEcommerce
                  title={k.label}
                  count={kpis[k.key] || 0}
                  color={k.color}
                  icon={k.icon}
                  extra={k.key === 'Open' ? 'Awaiting action' : k.key === 'In Progress' ? 'Active SLA' : ''}
                />
              </Grid>
            ))}
          </Grid>

          <MainCard>
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Tabs
                  value={tab}
                  onChange={(_, v) => { setTab(v); setPage(0); }}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  {STATUS_TABS.map((t) => (
                    <Tab
                      key={t}
                      label={t === 'All' ? t : (
                        <Badge
                          badgeContent={tickets.filter((s) => s.status === t).length}
                          color={STATUS_COLOR[t] === 'default' ? 'secondary' : STATUS_COLOR[t] || 'primary'}
                          max={99}
                        >
                          <Box sx={{ px: 0.5 }}>{t}</Box>
                        </Badge>
                      )}
                    />
                  ))}
                </Tabs>
              </Stack>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mr: 0.5 }}>Priority:</Typography>
                <Chip label="All" size="small" variant={priority === null ? 'filled' : 'outlined'} onClick={() => setPriority(null)} sx={{ cursor: 'pointer' }} />
                {PRIORITIES.map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    size="small"
                    color={PRIORITY_COLOR[p]}
                    variant={priority === p ? 'filled' : 'outlined'}
                    onClick={() => setPriority(priority === p ? null : p)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
                <Box sx={{ flex: 1 }} />
                <Chip label={`${filtered.length} tickets`} size="small" variant="outlined" />
              </Stack>
            </Stack>
            <Divider sx={{ my: 1 }} />
            <TableContainer>
              <Table size="small" sx={{ minWidth: 1100 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Ticket No</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Raised By</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Assignee</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                    {isAdmin && <TableCell sx={{ fontWeight: 600, align: 'right' }}>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 8 : 7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No support tickets found in database.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageData.map((row) => (
                      <TableRow key={row.id} hover sx={{ '& > td': { py: 1.25 } }}>
                        <TableCell sx={{ fontWeight: 600, color: 'primary.main', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {row.ticketNo}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ maxWidth: 320 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {row.title}
                            </Typography>
                            {row.orderNo && (
                              <Chip label={`Order #${row.orderNo}`} size="small" variant="plain" sx={{ height: 18, fontSize: '0.65rem', mt: 0.25 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={row.type} color={TYPE_COLOR[row.type] || 'default'} size="small" variant="light" />
                        </TableCell>
                        <TableCell>
                          <Chip label={row.status} color={STATUS_COLOR[row.status] || 'default'} size="small" variant="light" />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                            <Avatar
                              sx={{
                                width: 26, height: 26, fontSize: '0.75rem',
                                bgcolor: `${RAISED_COLOR[row.raisedByType] || 'primary'}.lighter`,
                                color: `${RAISED_COLOR[row.raisedByType] || 'primary'}.main`
                              }}
                            >
                              {RAISED_ICON[row.raisedByType] || <ShopOutlined />}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.raisedBy}</Typography>
                              <Chip label={row.raisedByType} size="small" variant="outlined" sx={{ height: 16, fontSize: '0.6rem', mt: 0.25 }} />
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>
                          {row.assignee}
                        </TableCell>
                        <TableCell>{row.createdAt}</TableCell>
                        {isAdmin && (
                          <TableCell align="right">
                            <Tooltip title="Update Ticket Status">
                              <IconButton
                                size="small"
                                onClick={(e) => setMenu({ el: e.currentTarget, ticket: row })}
                              >
                                <MoreOutlined />
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
          </MainCard>
        </>
      )}

      {/* Admin Action Menu */}
      <Menu anchorEl={menu?.el} open={Boolean(menu)} onClose={() => setMenu(null)}>
        <MenuItem onClick={() => handleStatusChange('In Progress')}>
          <ListItemIcon sx={{ minWidth: 32 }}><SyncOutlined style={{ fontSize: 16 }} /></ListItemIcon>Mark In Progress
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('Resolved')}>
          <ListItemIcon sx={{ minWidth: 32 }}><CheckSquareOutlined style={{ fontSize: 16 }} /></ListItemIcon>Mark Resolved
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange('Closed')}>
          <ListItemIcon sx={{ minWidth: 32 }}><LockFilled style={{ fontSize: 16 }} /></ListItemIcon>Close Ticket
        </MenuItem>
      </Menu>

      {/* Create Ticket Dialog */}
      <Dialog open={createOpen} onClose={() => !creating && setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Raise Support Ticket</DialogTitle>
        <form onSubmit={handleCreateTicket}>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              {createError && <Alert severity="error">{createError}</Alert>}
              <TextField
                select
                label="Complaint Category"
                fullWidth
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <MenuItemSelect value="Quality">Quality Issue</MenuItemSelect>
                <MenuItemSelect value="Leakage">Leakage / Packaging</MenuItemSelect>
                <MenuItemSelect value="Late Delivery">Late Delivery</MenuItemSelect>
                <MenuItemSelect value="Wrong Product">Wrong Product Delivered</MenuItemSelect>
                <MenuItemSelect value="Other">Other Query / Feedback</MenuItemSelect>
              </TextField>
              <TextField
                label="Description & Details"
                fullWidth
                multiline
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your issue with batch number, product, or delivery specifics..."
                required
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setCreateOpen(false)} disabled={creating} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={creating}>
              {creating ? 'Submitting...' : 'Submit to Database'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
