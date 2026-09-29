import { useState, useEffect } from 'react';
import {
  Grid, Typography, Stack, Button, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Avatar, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Tooltip
} from '@mui/material';

import MainCard from 'components/MainCard';
import {
  EditOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined,
  KeyOutlined, PlusOutlined, UserOutlined
} from '@ant-design/icons';
// @ts-ignore
import api from 'api/client';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users/');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (userId, currentActive) => {
    try {
      await api.put(`/admin/users/${userId}/`, { is_active: !currentActive });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${userId}/`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = async (user) => {
    try {
      const res = await api.get(`/admin/users/${user.id}/`);
      
      const userData = res.data;
      let state = '', district = '', territory = '', monthly_sales_plan = '', monthly_collection_plan = '';
      if (userData.role === 'Distributor' && userData.distributor_profile) {
          state = userData.distributor_profile.state || '';
          district = userData.distributor_profile.district || '';
          territory = userData.distributor_profile.territory || '';
          monthly_sales_plan = userData.distributor_profile.monthly_sales_plan || '';
          monthly_collection_plan = userData.distributor_profile.monthly_collection_plan || '';
      } else if (userData.role === 'Employee' && userData.employee_profile) {
          state = userData.employee_profile.state || '';
          district = userData.employee_profile.district || '';
          territory = userData.employee_profile.territory || '';
          monthly_sales_plan = userData.employee_profile.monthly_sales_plan || '';
          monthly_collection_plan = userData.employee_profile.monthly_collection_plan || '';
      }
      
      setSelectedUser({
        ...userData,
        state,
        district,
        territory,
        monthly_sales_plan,
        monthly_collection_plan,
        joining_date: userData.joining_date || ''
      });
      setOpenDialog(true);
    } catch (err) {
      console.error(err);
    }
  };
  
  const handleAdd = () => {
    setSelectedUser({
      username: '',
      email: '',
      phone: '',
      role: 'Employee',
      password: '',
      state: '',
      district: '',
      territory: '',
      monthly_sales_plan: '',
      monthly_collection_plan: '',
      joining_date: ''
    });
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      if (selectedUser.id) {
        // Edit Mode
        await api.put(`/admin/users/${selectedUser.id}/`, selectedUser);
      } else {
        // Create Mode
        await api.post(`/admin/users/`, selectedUser);
      }
      setOpenDialog(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to save user');
    }
  };
  
  const handleResetPassword = async () => {
    try {
      await api.put(`/admin/users/${selectedUser.id}/`, { password: newPassword });
      setOpenPasswordDialog(false);
      alert('Password reset successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to reset password');
    }
  };

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid item xs={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h5">User Management</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Manage system users, roles, and access controls.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<PlusOutlined />} onClick={handleAdd}>
            Add User
          </Button>
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <MainCard content={false}>
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>CCS ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Territory</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Monthly Sales Plan</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Monthly Collection Plan</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Active</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((row) => {
                  let territory = 'N/A';
                  let salesPlan = '—';
                  let collPlan = '—';
                  if (row.role === 'Distributor' && row.distributor_profile) {
                    territory = row.distributor_profile.territory || 'N/A';
                    if (row.distributor_profile.monthly_sales_plan) salesPlan = `₹${Number(row.distributor_profile.monthly_sales_plan).toLocaleString('en-IN')}`;
                    if (row.distributor_profile.monthly_collection_plan) collPlan = `₹${Number(row.distributor_profile.monthly_collection_plan).toLocaleString('en-IN')}`;
                  }
                  if (row.role === 'Employee' && row.employee_profile) {
                    territory = row.employee_profile.territory || 'N/A';
                    if (row.employee_profile.monthly_sales_plan) salesPlan = `₹${Number(row.employee_profile.monthly_sales_plan).toLocaleString('en-IN')}`;
                    if (row.employee_profile.monthly_collection_plan) collPlan = `₹${Number(row.employee_profile.monthly_collection_plan).toLocaleString('en-IN')}`;
                  }
                  
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>
                        {row.ccs_id || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" sx={{ gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>
                            <UserOutlined />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{row.username}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.email}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip label={row.role} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{territory}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{salesPlan}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{collPlan}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={row.status} 
                          size="small" 
                          color={row.status === 'Approved' ? 'success' : row.status === 'Pending' ? 'warning' : 'error'} 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={row.is_active ? 'Active' : 'Inactive'} 
                          size="small" 
                          color={row.is_active ? 'success' : 'default'} 
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" justifyContent="flex-end" sx={{ gap: 0.5 }}>
                          <Tooltip title={row.is_active ? "Deactivate" : "Activate"}>
                            <IconButton size="small" color={row.is_active ? "warning" : "success"} onClick={() => handleToggleActive(row.id, row.is_active)}>
                              {row.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reset Password">
                            <IconButton size="small" color="info" onClick={() => { setSelectedUser(row); setNewPassword(''); setOpenPasswordDialog(true); }}>
                              <KeyOutlined />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" color="primary" onClick={() => handleEdit(row)}>
                              <EditOutlined />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
                              <DeleteOutlined />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </MainCard>
      </Grid>

      {/* Add / Edit User Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedUser?.id ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Account Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold">Account Information</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Username / Name" 
                fullWidth 
                value={selectedUser?.username || ''} 
                onChange={e => setSelectedUser({...selectedUser, username: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Email" 
                fullWidth 
                value={selectedUser?.email || ''} 
                onChange={e => setSelectedUser({...selectedUser, email: e.target.value})}
                disabled={!!selectedUser?.id}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Phone" 
                fullWidth 
                value={selectedUser?.phone || ''} 
                onChange={e => setSelectedUser({...selectedUser, phone: e.target.value})}
              />
            </Grid>
            {!selectedUser?.id && (
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="Password" 
                  fullWidth 
                  type="password"
                  value={selectedUser?.password || ''} 
                  onChange={e => setSelectedUser({...selectedUser, password: e.target.value})}
                  helperText="Required for new users"
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={selectedUser?.role || 'Employee'}
                  label="Role"
                  onChange={e => setSelectedUser({...selectedUser, role: e.target.value})}
                >
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Distributor">Distributor</MenuItem>
                  <MenuItem value="Dealer">Dealer</MenuItem>
                  <MenuItem value="Employee">Employee</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Joining Date" 
                fullWidth 
                type="date"
                InputLabelProps={{ shrink: true }}
                value={selectedUser?.joining_date || ''} 
                onChange={e => setSelectedUser({...selectedUser, joining_date: e.target.value})}
              />
            </Grid>
            
            {/* Territory Assignment (Only for Employees & Distributors) */}
            {(selectedUser?.role === 'Employee' || selectedUser?.role === 'Distributor') && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1 }}>Territory Assignment</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField 
                    label="State" 
                    fullWidth 
                    value={selectedUser?.state || ''} 
                    onChange={e => setSelectedUser({...selectedUser, state: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField 
                    label="District" 
                    fullWidth 
                    value={selectedUser?.district || ''} 
                    onChange={e => setSelectedUser({...selectedUser, district: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField 
                    label="Territory" 
                    fullWidth 
                    value={selectedUser?.territory || ''} 
                    onChange={e => setSelectedUser({...selectedUser, territory: e.target.value})}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1 }}>Monthly Planning</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Monthly Sales Plan" 
                    fullWidth 
                    type="number"
                    value={selectedUser?.monthly_sales_plan || ''} 
                    onChange={e => setSelectedUser({...selectedUser, monthly_sales_plan: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Monthly Collection Plan" 
                    fullWidth 
                    type="number"
                    value={selectedUser?.monthly_collection_plan || ''} 
                    onChange={e => setSelectedUser({...selectedUser, monthly_collection_plan: e.target.value})}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
      
      {/* Reset Password Dialog */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reset Password for {selectedUser?.email}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField 
              label="New Password" 
              fullWidth 
              type="password"
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleResetPassword}>Reset Password</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
