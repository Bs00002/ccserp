import { useState, useEffect } from 'react';
import { Box, CircularProgress, Alert, Button } from '@mui/material';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';
import useAuth from 'hooks/useAuth';
import api from 'api/client';

import AdminDashboard from './AdminDashboard';
import FieldDashboard from './FieldDashboard';
import DealerDashboard from './DealerDashboard';

export default function DashboardDefault() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard/');
      setData(res.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      const msg = err?.response?.data?.error || err?.message || "Failed to load dashboard data from server.";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboard();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" startIcon={<ReloadOutlined />} onClick={fetchDashboard}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // Route to the specific role dashboard
  const role = user?.role;
  
  if (role === 'Super Admin' || role === 'Admin') {
    return <AdminDashboard data={data} />;
  } else if (role === 'Distributor' || role === 'Employee' || role === 'Sales Manager') {
    return <FieldDashboard data={data} />;
  } else if (role === 'Dealer') {
    return <DealerDashboard data={data} />;
  }

  return <DealerDashboard data={data} />;
}
