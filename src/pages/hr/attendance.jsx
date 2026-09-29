import React, { useState, useEffect } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';
import api from 'api/client';
import { AdminAttendance as StitchAdminAttendance } from '../../views/admin/AdminAttendance';

export default function AttendanceAdmin() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAttendance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/hr/attendance/');
      if (Array.isArray(res.data)) {
        const mapped = res.data.map((att) => ({
          id: String(att.id),
          employeeName: att.employee_name || 'Field Staff',
          employeeCode: att.employee_code || `EMP-${att.employee || '101'}`,
          date: att.date || new Date().toISOString().split('T')[0],
          checkIn: att.check_in ? String(att.check_in).slice(0, 5) : '—',
          checkOut: att.check_out ? String(att.check_out).slice(0, 5) : '—',
          location: att.current_location || att.check_in_location || 'Field',
          status: att.status || 'Present',
          workingHours: att.working_hours ? `${att.working_hours} hrs` : '—',
        }));
        setRecords(mapped);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('Error fetching attendance API:', err);
      setError(err?.response?.data?.error || 'Failed to load attendance records from database.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
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
            <Button color="inherit" size="small" startIcon={<ReloadOutlined />} onClick={fetchAttendance}>
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
    <StitchAdminAttendance
      attendanceRecords={records}
    />
  );
}
