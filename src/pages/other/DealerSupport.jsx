import React, { useState, useEffect } from 'react';
import {
  Grid, Typography, Box, Stack, Card, CardContent, Button,
  TextField, Alert, MenuItem, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress
} from '@mui/material';
import {
  PhoneOutlined, MessageOutlined, WhatsAppOutlined,
  SendOutlined, ReloadOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';
import api from 'api/client';

const STATUS_COLOR = {
  Open: 'primary',
  'In Progress': 'warning',
  Resolved: 'success',
  Closed: 'default',
  Requested: 'info',
  Approved: 'success',
  Rejected: 'error'
};

export default function DealerSupport() {
  const [category, setCategory] = useState('Quality');
  const [ticketDesc, setTicketDesc] = useState('');
  const [submitted, setSubmitted] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [myTickets, setMyTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const fetchMyTickets = async () => {
    setLoadingTickets(true);
    setFetchError(null);
    try {
      const [compRes, retRes] = await Promise.all([
        api.get('/support/complaints/').catch(() => ({ data: [] })),
        api.get('/support/returns/').catch(() => ({ data: [] }))
      ]);

      const items = [];
      if (Array.isArray(compRes.data)) {
        compRes.data.forEach((c) => {
          items.push({
            id: c.id,
            ticketNo: `CMP-${c.id.slice(0, 8).toUpperCase()}`,
            type: 'Complaint',
            category: c.category,
            description: c.description,
            status: c.status || 'Open',
            date: c.created_at ? new Date(c.created_at).toLocaleDateString() : '—',
          });
        });
      }
      if (Array.isArray(retRes.data)) {
        retRes.data.forEach((r) => {
          items.push({
            id: r.id,
            ticketNo: `RET-${r.id.slice(0, 8).toUpperCase()}`,
            type: 'Return',
            category: r.reason,
            description: `Order #${r.order_number || ''} (Qty: ${r.quantity})`,
            status: r.status || 'Requested',
            date: r.created_at ? new Date(r.created_at).toLocaleDateString() : '—',
          });
        });
      }

      setMyTickets(items);
    } catch (err) {
      console.error('Failed to load dealer support tickets:', err);
      setFetchError(err?.response?.data?.error || 'Failed to fetch support tickets from database.');
      setMyTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketDesc.trim()) {
      setFormError('Please provide details for the support issue.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await api.post('/support/complaints/', {
        category,
        description: ticketDesc.trim(),
      });
      const createdId = res.data?.id ? `CMP-${res.data.id.slice(0, 8).toUpperCase()}` : 'NEW-TICKET';
      setSubmitted(`Your support ticket #${createdId} has been registered and saved in the database!`);
      setTicketDesc('');
      await fetchMyTickets();
    } catch (err) {
      console.error('Failed to register support complaint:', err);
      setFormError(err?.response?.data?.error || 'Failed to submit support ticket to database.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Grid container rowSpacing={3} columnSpacing={2.75}>
      {/* Header */}
      <Grid item xs={12}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Dealer Support & Assistance</Typography>
          <Typography variant="body2" color="textSecondary">
            Need help with your account, order status, or product queries? Reach out directly via WhatsApp, Call, or Support Ticket (Database-Backed).
          </Typography>
        </Box>
      </Grid>

      {/* Direct Quick Action Cards */}
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%', bgcolor: 'success.lighter', border: '1px solid', borderColor: 'success.light' }}>
          <CardContent>
            <Stack spacing={2} alignItems="center" textAlign="center">
              <Box sx={{ p: 2, bgcolor: 'success.main', color: 'white', borderRadius: '50%' }}>
                <WhatsAppOutlined style={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h5" fontWeight={700} color="success.dark">WhatsApp Support</Typography>
              <Typography variant="body2" color="textSecondary">
                Instant help from our Chitra Crop Science dealer helpdesk.
              </Typography>
              <Button
                variant="contained"
                color="success"
                startIcon={<WhatsAppOutlined />}
                fullWidth
                href="https://wa.me/919876543210"
                target="_blank"
                sx={{ mt: 1, fontWeight: 700 }}
              >
                Chat on WhatsApp (+91 98765 43210)
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%', bgcolor: 'primary.lighter', border: '1px solid', borderColor: 'primary.light' }}>
          <CardContent>
            <Stack spacing={2} alignItems="center" textAlign="center">
              <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: '50%' }}>
                <PhoneOutlined style={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h5" fontWeight={700} color="primary.main">Toll-Free Helpline</Typography>
              <Typography variant="body2" color="textSecondary">
                Speak directly with your assigned Sales Manager.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PhoneOutlined />}
                fullWidth
                href="tel:18001234567"
                sx={{ mt: 1, fontWeight: 700 }}
              >
                Call 1800-123-4567
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%', bgcolor: 'warning.lighter', border: '1px solid', borderColor: 'warning.light' }}>
          <CardContent>
            <Stack spacing={2} alignItems="center" textAlign="center">
              <Box sx={{ p: 2, bgcolor: 'warning.main', color: 'white', borderRadius: '50%' }}>
                <MessageOutlined style={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h5" fontWeight={700} color="warning.dark">Email Depot Support</Typography>
              <Typography variant="body2" color="textSecondary">
                Send official emails regarding ledger verification & billing.
              </Typography>
              <Button
                variant="contained"
                color="warning"
                startIcon={<MessageOutlined />}
                fullWidth
                href="mailto:support@chitracropscience.com"
                sx={{ mt: 1, fontWeight: 700 }}
              >
                Send Message
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Raise Support Ticket Form */}
      <Grid item xs={12}>
        <MainCard title="Raise a Support Ticket">
          {submitted && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSubmitted(null)}>
              {submitted}
            </Alert>
          )}

          {formError && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setFormError(null)}>
              {formError}
            </Alert>
          )}

          <form onSubmit={handleCreateTicket}>
            <Stack spacing={3}>
              <TextField
                select
                fullWidth
                label="Issue Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <MenuItem value="Quality">Product Quality Issue</MenuItem>
                <MenuItem value="Leakage">Leakage / Packaging Damage</MenuItem>
                <MenuItem value="Late Delivery">Late Delivery / Logistics</MenuItem>
                <MenuItem value="Wrong Product">Wrong Product Delivered</MenuItem>
                <MenuItem value="Other">Billing / Account / Other Query</MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="Detailed Description"
                multiline
                rows={4}
                placeholder="Explain your query, order issue, or product batch details..."
                value={ticketDesc}
                onChange={(e) => setTicketDesc(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SendOutlined />}
                disabled={submitting}
                sx={{ width: { xs: '100%', sm: 240 }, py: 1.2, fontWeight: 700 }}
              >
                {submitting ? 'Submitting to Database...' : 'Submit Support Ticket'}
              </Button>
            </Stack>
          </form>
        </MainCard>
      </Grid>

      {/* Dealer's Real Submitted Tickets */}
      <Grid item xs={12}>
        <MainCard
          title="My Support Tickets (Live History)"
          secondary={
            <Button
              variant="outlined"
              size="small"
              startIcon={<ReloadOutlined />}
              onClick={fetchMyTickets}
              disabled={loadingTickets}
            >
              Refresh
            </Button>
          }
        >
          {fetchError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFetchError(null)}>
              {fetchError}
            </Alert>
          )}

          {loadingTickets ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Ticket No</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {myTickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        No support tickets found for your dealer account.
                      </TableCell>
                    </TableRow>
                  ) : (
                    myTickets.map((t) => (
                      <TableRow key={t.id} hover>
                        <TableCell sx={{ fontWeight: 600, color: 'primary.main', fontFamily: 'monospace' }}>
                          {t.ticketNo}
                        </TableCell>
                        <TableCell>
                          <Chip label={t.type} size="small" variant="light" />
                        </TableCell>
                        <TableCell>{t.category}</TableCell>
                        <TableCell sx={{ maxWidth: 300 }}>{t.description}</TableCell>
                        <TableCell>
                          <Chip label={t.status} color={STATUS_COLOR[t.status] || 'default'} size="small" variant="light" />
                        </TableCell>
                        <TableCell>{t.date}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </MainCard>
      </Grid>
    </Grid>
  );
}
