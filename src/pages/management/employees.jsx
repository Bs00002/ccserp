import React, { useState, useEffect } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';
import api from 'api/client';
import { AdminDistributors as StitchAdminDistributors } from '../../views/admin/AdminDistributors';

export default function EmployeesPage() {
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDistributors = async () => {
    setLoading(true);
    setError(null);
    try {
      const distRes = await api.get('/admin/users/?role=Distributor');
      if (Array.isArray(distRes.data)) {
        const mapped = distRes.data.map((d, index) => ({
          id: String(d.id || index + 1),
          code: d.ccs_id || `DIST-PLN-0${index + 1}`,
          name: d.company_name || `${d.first_name || ''} ${d.last_name || ''}`.trim() || d.username,
          ownerName: `${d.first_name || ''} ${d.last_name || ''}`.trim() || d.username,
          phone: d.phone || '—',
          email: d.email || '—',
          city: d.city || 'Depot',
          state: d.state || 'Gujarat',
          territory: d.territory || 'General',
          dealersCount: 0,
          monthlySales: 0,
          monthlySalesPlan: Number(d.distributor_profile?.monthly_sales_plan || d.employee_profile?.monthly_sales_plan || 0),
          monthlyCollectionPlan: Number(d.distributor_profile?.monthly_collection_plan || d.employee_profile?.monthly_collection_plan || 0),
          outstandingBalance: 0,
          status: d.is_active ? 'Active' : 'Inactive',
        }));
        setDistributors(mapped);
      } else {
        setDistributors([]);
      }
    } catch (err) {
      console.error('Error fetching distributors API:', err);
      setError(err?.response?.data?.error || 'Failed to load distributors from database.');
      setDistributors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistributors();
  }, []);

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
            <Button color="inherit" size="small" startIcon={<ReloadOutlined />} onClick={fetchDistributors}>
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
    <StitchAdminDistributors
      distributors={distributors}
      onAddDistributor={(newDist) => setDistributors((prev) => [newDist, ...prev])}
    />
  );
}
