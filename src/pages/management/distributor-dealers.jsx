import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Typography, Box, Stack, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Tooltip, Chip, Paper
} from '@mui/material';
import MainCard from 'components/MainCard';
import { formatINR } from 'data/ccsMock'; 
import { EyeOutlined, PlusCircleOutlined, PhoneOutlined, WhatsAppOutlined } from '@ant-design/icons';
import api from 'api/client';

export default function DistributorDealers() {
  const navigate = useNavigate();
  const [dealers, setDealers] = useState([]);

  useEffect(() => {
    // In a real app, this would fetch only dealers assigned to the logged-in distributor.
    // We fetch all dealers for demo purposes here.
    const fetchDealers = async () => {
      try {
        const res = await api.get('/admin/users/?role=Dealer');
        const enhancedDealers = (Array.isArray(res.data) ? res.data : []).map(d => ({
          ...d,
          shopName: d.company_name || `${d.first_name || ''} ${d.last_name || ''}`.trim() || d.username,
          city: d.city || 'Depot',
          outstanding: parseFloat(d.outstanding_amount || 0),
          mobile: d.phone || '—'
        }));
        setDealers(enhancedDealers);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDealers();
  }, []);

  return (
    <Grid container rowSpacing={3}>
      <Grid item xs={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5">My Dealers</Typography>
            <Typography variant="body2" color="textSecondary">Manage and create orders for your assigned dealers.</Typography>
          </Box>
        </Stack>
      </Grid>

      <Grid item xs={12}>
        <MainCard content={false}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Dealer Code</TableCell>
                  <TableCell>Shop Name</TableCell>
                  <TableCell>Owner Name</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell align="right">Outstanding</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dealers.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell fontWeight="bold">{row.ccs_id || `DLR-${row.id.substring(0, 4)}`}</TableCell>
                    <TableCell>{row.shopName}</TableCell>
                    <TableCell>{row.name || row.username}</TableCell>
                    <TableCell>{row.mobile}</TableCell>
                    <TableCell>{row.city}</TableCell>
                    <TableCell align="right" fontWeight="bold" color="error.main">{formatINR(row.outstanding)}</TableCell>
                    <TableCell>
                      <Chip label={row.status || 'Active'} size="small" color={row.status === 'Suspended' ? 'error' : 'success'} />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="View Profile">
                          <IconButton size="small" color="primary">
                            <EyeOutlined />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Create Order">
                          <IconButton size="small" color="success" onClick={() => navigate(`/app/orders/create?dealerId=${row.id}`)}>
                            <PlusCircleOutlined />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Call">
                          <IconButton size="small" color="info">
                            <PhoneOutlined />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="WhatsApp">
                          <IconButton size="small" color="success">
                            <WhatsAppOutlined />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {dealers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No assigned dealers found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </MainCard>
      </Grid>
    </Grid>
  );
}
