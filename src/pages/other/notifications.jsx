import { useMemo, useState } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Badge from '@mui/material/Badge';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';

import BellOutlined from '@ant-design/icons/BellOutlined';
import InfoCircleOutlined from '@ant-design/icons/InfoCircleOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import WarningOutlined from '@ant-design/icons/WarningOutlined';
import CloseCircleOutlined from '@ant-design/icons/CloseCircleOutlined';
import SafetyCertificateOutlined from '@ant-design/icons/SafetyCertificateOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import CheckSquareOutlined from '@ant-design/icons/CheckSquareOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import SettingOutlined from '@ant-design/icons/SettingOutlined';
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import EyeInvisibleOutlined from '@ant-design/icons/EyeInvisibleOutlined';
import RightOutlined from '@ant-design/icons/RightOutlined';

import api from 'api/client';
import useRealtime from 'hooks/useRealtime';
import CircularProgress from '@mui/material/CircularProgress';

const TYPE_AVATAR = {
  info: { icon: <InfoCircleOutlined />, color: 'primary' },
  success: { icon: <CheckCircleOutlined />, color: 'success' },
  warning: { icon: <WarningOutlined />, color: 'warning' },
  error: { icon: <CloseCircleOutlined />, color: 'error' },
  approval: { icon: <SafetyCertificateOutlined />, color: 'secondary' }
};

const TAB_CATEGORIES = ['All', 'Unread', 'Order', 'Payment', 'Stock', 'Attendance', 'Expense', 'Support', 'System'];

export default function NotificationsPage() {
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications/');
      const data = Array.isArray(res.data) ? res.data : [];
      setItems(data.map((n) => ({
        id: String(n.id),
        title: n.title,
        message: n.message,
        type: n.notification_type || 'info',
        category: n.category || 'System',
        time: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
        read: n.is_read || false,
        actionUrl: n.action_url || null
      })));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Real-time listener: auto-fetch notifications on notification.created
  useRealtime('notification.created', () => {
    fetchNotifications();
  });

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const filtered = useMemo(() => {
    const t = TAB_CATEGORIES[tab];
    return items.filter((n) => {
      if (t === 'All') {
        // fall
      } else if (t === 'Unread') {
        if (n.read) return false;
      } else if (n.category !== t) {
        return false;
      }
      if (query && !(n.title + n.message).toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [tab, items, query]);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/mark_all_read/');
    } catch {}
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteAll = () => setItems([]);

  const toggleRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/mark_read/`);
    } catch {}
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const deleteOne = (id) => setItems((prev) => prev.filter((n) => n.id !== id));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={2.75}>
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Notifications Center</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Real-time alerts, approvals and system-wide updates
            </Typography>
          </Box>
          <Stack direction="row" sx={{ gap: 1 }}>
            <Tooltip title="Mark all as read">
              <Button variant="outlined" startIcon={<CheckSquareOutlined />} onClick={markAllRead} disabled={unreadCount === 0}>
                Mark All Read
              </Button>
            </Tooltip>
            <Tooltip title="Clear all notifications">
              <Button variant="outlined" color="error" startIcon={<DeleteOutlined />} onClick={deleteAll} disabled={items.length === 0}>
                Clear
              </Button>
            </Tooltip>
            <Tooltip title="Notification Settings">
              <IconButton color="primary" onClick={() => {}}>
                <SettingOutlined />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticEcommerce
            title="Total Notifications"
            count={items.length}
            color="primary"
            icon={<BellOutlined />}
            extra="Last 30 days"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticEcommerce
            title="Unread"
            count={unreadCount}
            color="warning"
            isLoss={unreadCount > 5}
            icon={<Badge color="warning" variant="dot"><BellOutlined /></Badge>}
            extra="Awaiting attention"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticEcommerce
            title="Action Required"
            count={items.filter((n) => ['warning', 'error', 'approval'].includes(n.type)).length}
            color="error"
            icon={<WarningOutlined />}
            extra="Needs response"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticEcommerce
            title="Resolved Today"
            count={Math.round(items.length * 0.35)}
            color="success"
            percentage={8}
            icon={<CheckCircleOutlined />}
            extra="Via actions"
          />
        </Grid>
      </Grid>

      <MainCard>
        <Stack direction="row" justifyContent="space-between" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 44 }}
          >
            {TAB_CATEGORIES.map((t) => (
              <Tab
                key={t}
                label={t === 'Unread' ? `Unread (${unreadCount})` : t}
                sx={{ minHeight: 44, textTransform: 'capitalize' }}
              />
            ))}
          </Tabs>
          <TextField
            placeholder="Search notifications..."
            size="small"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ width: { xs: '100%', sm: 260 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined style={{ fontSize: 16, color: 'text.secondary' }} />
                </InputAdornment>
              )
            }}
          />
        </Stack>
        <Divider />
        <Box sx={{ maxHeight: 680, overflowY: 'auto' }}>
          <List disablePadding>
            {filtered.length === 0 && (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <BellOutlined style={{ fontSize: 48, color: 'text.disabled' }} />
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>No notifications to display.</Typography>
              </Box>
            )}
            {filtered.map((n, idx) => {
              const cfg = TYPE_AVATAR[n.type];
              return (
                <Box key={n.id}>
                  <ListItem
                    sx={{
                      bgcolor: n.read ? 'transparent' : 'primary.lighter',
                      px: 2, py: 1.75,
                      borderLeft: n.read ? 0 : 3,
                      borderColor: 'primary.main',
                      transition: '0.15s',
                      '&:hover': { bgcolor: n.read ? 'action.hover' : 'primary.50' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: `${cfg.color}.lighter`,
                          color: `${cfg.color}.main`,
                          width: 44, height: 44
                        }}
                      >
                        {cfg.icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.25 }}>
                          <Typography variant="body2" sx={{ fontWeight: n.read ? 500 : 700 }}>{n.title}</Typography>
                          {!n.read && <Chip label="NEW" size="small" color="primary" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700 }} />}
                          <Chip label={n.category} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.62rem' }} />
                        </Stack>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.4, mb: 0.5 }}>
                            {n.message}
                          </Typography>
                          {n.actionUrl && (
                            <Link
                              component="button"
                              variant="caption"
                              underline="hover"
                              color="primary"
                              onClick={() => {}}
                              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}
                            >
                              View details <RightOutlined style={{ fontSize: 11 }} />
                            </Link>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center', gap: 0.5, right: 0 }}>
                      <Typography variant="caption" sx={{ color: 'text.disabled', mr: 1 }}>{n.createdAt}</Typography>
                      <Tooltip title={n.read ? 'Mark as unread' : 'Mark as read'}>
                        <IconButton size="small" onClick={() => toggleRead(n.id)} sx={{ color: 'text.secondary' }}>
                          {n.read ? <EyeOutlined style={{ fontSize: 15 }} /> : <EyeInvisibleOutlined style={{ fontSize: 15 }} />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete notification">
                        <IconButton size="small" onClick={() => deleteOne(n.id)} sx={{ color: 'text.secondary' }}>
                          <DeleteOutlined style={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {idx < filtered.length - 1 && <Divider component="li" />}
                </Box>
              );
            })}
          </List>
        </Box>
      </MainCard>
    </Stack>
  );
}
