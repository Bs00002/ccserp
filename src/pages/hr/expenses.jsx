import React, { useState, useEffect } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';
import api from 'api/client';
import { AdminExpenses as StitchAdminExpenses } from '../../views/admin/AdminExpenses';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/hr/expenses/');
      if (Array.isArray(res.data)) {
        const mapped = res.data.map((e) => ({
          id: String(e.id),
          employeeName: e.employee_name || 'Staff Member',
          employeeCode: e.employee_code || `EMP-${e.employee || '101'}`,
          category: e.category || e.expense_type || 'Travel',
          amount: parseFloat(e.amount || 0),
          date: e.date || new Date().toISOString().split('T')[0],
          receiptUrl: e.receipt || e.bill_image || '',
          status: e.status || 'Pending',
          remarks: e.remarks || e.details || '',
        }));
        setExpenses(mapped);
      } else {
        setExpenses([]);
      }
    } catch (err) {
      console.error('Error fetching expenses API:', err);
      setError(err?.response?.data?.error || 'Failed to load expenses from database.');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleApproveExpense = async (id, approved) => {
    const actionName = approved ? 'approve' : 'reject';
    try {
      await api.post(`/hr/expenses/${id}/${actionName}/`);
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: approved ? 'Approved' : 'Rejected' } : e))
      );
    } catch (err) {
      console.error('Error updating expense status:', err);
      alert(err?.response?.data?.error || 'Failed to update expense status.');
    }
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
            <Button color="inherit" size="small" startIcon={<ReloadOutlined />} onClick={fetchExpenses}>
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
    <StitchAdminExpenses
      expenses={expenses}
      onApproveExpense={handleApproveExpense}
    />
  );
}
