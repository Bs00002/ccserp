import React, { useState, useEffect } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';
import api from 'api/client';
import { AdminDealers as StitchAdminDealers } from '../../views/admin/AdminDealers';

export default function DealersPage() {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDealers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/users/?role=Dealer');
      if (Array.isArray(res.data)) {
        const mappedDealers = res.data.map((d) => ({
          id: String(d.id),
          name: d.company_name || `${d.first_name || ''} ${d.last_name || ''}`.trim() || d.username,
          code: d.ccs_id || `DLR-${d.id.slice(0, 6)}`,
          ownerName: `${d.first_name || ''} ${d.last_name || ''}`.trim() || d.username,
          city: d.city || 'Depot',
          state: d.state || 'Gujarat',
          phone: d.phone || '—',
          email: d.email || '—',
          gstin: d.gstin || '—',
          creditLimit: parseFloat(d.credit_limit || 0),
          outstandingBalance: parseFloat(d.outstanding_amount || 0),
          status: d.is_active ? 'Active' : 'Inactive',
          distributorName: 'CCS Operations',
          territory: d.territory || 'General',
        }));
        setDealers(mappedDealers);
      } else {
        setDealers([]);
      }
    } catch (err) {
      console.error('Error fetching dealers from API:', err);
      setError(err?.response?.data?.error || 'Failed to load dealers from database.');
      setDealers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, []);

  const handleAddDealer = (newDealer) => {
    setDealers((prev) => [newDealer, ...prev]);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, maxWidth: 650, mx: 'auto', mt: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" startIcon={<ReloadOutlined />} onClick={fetchDealers}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <StitchAdminDealers
      dealers={dealers}
      onAddDealer={handleAddDealer}
    />
  );
}
