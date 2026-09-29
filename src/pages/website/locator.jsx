import { Container, Typography, Grid, Card, CardContent, TextField, Button, Stack, Box, CircularProgress, Link as MuiLink } from '@mui/material';
import { SearchOutlined, EnvironmentOutlined, PhoneOutlined, MailOutlined, WhatsAppOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
// @ts-ignore
import api from 'api/client';
import { dealers as mockDealers } from 'data/ccsMock';

export default function LocatorPage() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    fetchDealers('');
  }, []);

  const fetchDealers = async (query) => {
    setLoading(true);
    try {
      const res = await api.get(`/public/dealers/?search=${query}`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setResults(res.data);
      } else {
        const filteredMock = mockDealers.filter(d => 
          !query || 
          d.name?.toLowerCase().includes(query.toLowerCase()) || 
          d.shopName?.toLowerCase().includes(query.toLowerCase()) || 
          d.state?.toLowerCase().includes(query.toLowerCase()) || 
          d.district?.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filteredMock);
      }
    } catch (err) {
      console.error('Failed to fetch dealers', err);
      const filteredMock = mockDealers.filter(d => 
        !query || 
        d.name?.toLowerCase().includes(query.toLowerCase()) || 
        d.shopName?.toLowerCase().includes(query.toLowerCase()) || 
        d.state?.toLowerCase().includes(query.toLowerCase()) || 
        d.district?.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filteredMock);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearched(true);
    fetchDealers(search);
  };

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pb: 10 }}>
      <Helmet>
        <title>Dealer Locator | Chitra Crop Science</title>
        <meta name="description" content="Find an authorized Chitra Crop Science dealer near you. Search by City, District, State, or Dealer Name." />
      </Helmet>

      {/* Header */}
      <Box sx={{ bgcolor: 'primary.dark', color: 'white', py: 8, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h2" fontWeight="bold" gutterBottom>Dealer Locator</Typography>
          <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.9 }}>
            Find an authorized Chitra Crop Science dealer near you.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -4 }}>
        <Card elevation={12} sx={{ p: 4, borderRadius: 4, mb: 6 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <TextField 
              fullWidth 
              variant="outlined" 
              placeholder="Enter City, District, State or Dealer Name" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button variant="contained" size="large" startIcon={<SearchOutlined />} onClick={handleSearch} sx={{ px: 4, py: 1.5, minWidth: 150 }}>Search</Button>
          </Stack>
        </Card>

        {loading ? (
          <Box textAlign="center" py={10}><CircularProgress size={60} /></Box>
        ) : (
          <Grid container spacing={4}>
            {results.map((item, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ height: '100%', borderRadius: 4, transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' } }}>
                  <CardContent sx={{ p: 4 }}>
                    <Stack spacing={3}>
                      <Stack direction="row" spacing={2} alignItems="center" color="primary.main">
                        <Box sx={{ p: 1.5, bgcolor: 'rgba(46,125,50,0.1)', borderRadius: 2 }}><EnvironmentOutlined style={{ fontSize: 24 }} /></Box>
                        <Box>
                          <Typography variant="h5" fontWeight="bold" color="textPrimary">{item.name}</Typography>
                          <Typography variant="subtitle2">{item.city}{item.city && item.state ? ', ' : ''}{item.state}</Typography>
                        </Box>
                      </Stack>
                      
                      <Box sx={{ pl: 7 }}>
                        {item.address && <Typography variant="body1" mb={2} color="textSecondary">{item.address}</Typography>}
                        
                        <Stack spacing={1.5}>
                          {item.phone && (
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <PhoneOutlined style={{ color: '#64748b' }} />
                              <Typography variant="body2">{item.phone}</Typography>
                            </Stack>
                          )}
                          {item.email && (
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <MailOutlined style={{ color: '#64748b' }} />
                              <Typography variant="body2">{item.email}</Typography>
                            </Stack>
                          )}
                        </Stack>
                      </Box>
                      
                      <Stack direction="row" spacing={2} mt={2}>
                        <Button 
                          variant="outlined" 
                          startIcon={<EnvironmentOutlined />} 
                          fullWidth
                          href={`https://maps.google.com/?q=${encodeURIComponent(item.name + ' ' + item.city + ' ' + item.state)}`}
                          target="_blank"
                        >
                          Directions
                        </Button>
                        <Button 
                          variant="contained" 
                          color="success" 
                          startIcon={<WhatsAppOutlined />} 
                          fullWidth
                          href={`https://wa.me/${item.phone ? item.phone.replace(/\D/g,'') : ''}`}
                          target="_blank"
                        >
                          WhatsApp
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {results.length === 0 && (
              <Grid item xs={12}>
                <Box textAlign="center" py={10}>
                  <Typography variant="h6" color="textSecondary">
                    {searched ? "No dealers found matching your search." : "No dealers available."}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
