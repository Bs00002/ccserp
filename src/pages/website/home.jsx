import { Box, Button, Container, Grid, Typography, Stack, Card, CardContent, CardMedia, Avatar } from '@mui/material';
import { ArrowRightOutlined, CheckCircleFilled, SafetyCertificateOutlined, ExperimentOutlined, TrophyOutlined, TeamOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
// @ts-ignore
import api from 'api/client';
import { products as mockProducts } from 'data/ccsMock';

const stats = [
  { label: 'Year Established', value: '2023', icon: <TrophyOutlined /> },
  { label: 'States Covered', value: 'Across India', icon: <TeamOutlined /> },
  { label: 'Quality Assured', value: '100%', icon: <SafetyCertificateOutlined /> },
  { label: 'Research Labs', value: 'State of Art', icon: <ExperimentOutlined /> }
];

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products/products/');
        const data = res.data?.results || res.data;
        if (Array.isArray(data) && data.length > 0) {
          // just grab top 4 for featured
          setFeaturedProducts(data.slice(0, 4));
        } else {
          setFeaturedProducts(mockProducts.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to fetch featured products', err);
        setFeaturedProducts(mockProducts.slice(0, 4));
      }
    };
    fetchProducts();
  }, []);

  return (
    <Box>
      <Helmet>
        <title>Chitra Crop Science | Premium Agricultural Inputs & Crop Solutions</title>
        <meta name="description" content="Chitra Crop Science delivers world-class water-soluble fertilizers, bio-stimulants, and crop protection chemicals. We empower Indian farmers to achieve unprecedented yields." />
        <meta property="og:title" content="Chitra Crop Science | Premium Agricultural Inputs" />
        <meta property="og:description" content="Empowering Indian farmers with ISO certified agro-chemicals, fertilizers, and bio-stimulants." />
      </Helmet>

      {/* Hero Section */}
      <Box sx={{
        position: 'relative',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        backgroundImage: 'url(https://images.unsplash.com/photo-1592982537447-6f23f81eb5d5?auto=format&fit=crop&w=1920&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(90deg, rgba(17,24,39,0.95) 0%, rgba(17,24,39,0.4) 100%)',
          zIndex: 1
        }
      }}>
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2, py: { xs: 8, md: 0 } }}>
          <Grid container>
            <Grid item xs={12} md={7} lg={6}>
              <Box sx={{ mb: 2, display: 'inline-flex', alignItems: 'center', bgcolor: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', px: 2, py: 0.5, borderRadius: 5 }}>
                <Typography variant="body2" color="#4ade80" fontWeight="bold">🌱 Chitra Crop Science</Typography>
              </Box>
              <Typography variant="h1" fontWeight="900" color="white" sx={{ fontSize: { xs: '3rem', md: '4.5rem' }, lineHeight: 1.1, mb: 3 }}>
                Premium Agricultural <br/><Box component="span" color="primary.main">Inputs.</Box>
              </Typography>
              <Typography variant="h6" color="#9ca3af" sx={{ mb: 5, lineHeight: 1.6, fontWeight: 400, maxWidth: 600 }}>
                We deliver world-class water-soluble fertilizers, bio-stimulants, and crop protection chemicals. Empowering Indian farmers to achieve unprecedented yields.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button component={Link} to="/products" variant="contained" color="primary" size="large" sx={{ px: 4, py: 1.5, fontSize: '1.1rem', borderRadius: 8 }} endIcon={<ArrowRightOutlined />}>Explore Products</Button>
                <Button component={Link} to="/become-dealer" variant="outlined" size="large" sx={{ px: 4, py: 1.5, fontSize: '1.1rem', color: 'white', borderColor: 'white', borderRadius: 8, '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(46,125,50,0.1)' } }}>Become a Dealer</Button>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box sx={{ bgcolor: 'primary.main', py: 6, mt: -2 }}>
        <Container maxWidth="xl">
          <Grid container spacing={4} justifyContent="center">
            {stats.map((stat, i) => (
              <Grid item xs={6} md={3} key={i} textAlign="center">
                <Box sx={{ color: 'white', fontSize: 40, mb: 1, opacity: 0.8 }}>{stat.icon}</Box>
                <Typography variant="h3" fontWeight="900" color="white">{stat.value}</Typography>
                <Typography variant="subtitle1" color="rgba(255,255,255,0.8)" fontWeight="bold" textTransform="uppercase">{stat.label}</Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* About / Why Choose Us */}
      <Box sx={{ py: 12, bgcolor: 'background.paper' }}>
        <Container maxWidth="xl">
          <Grid container spacing={8} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ position: 'relative' }}>
                <img src="https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=800&q=80" alt="Farmers" style={{ width: '100%', borderRadius: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} />
                <Box sx={{ position: 'absolute', bottom: -30, right: -30, bgcolor: 'white', p: 3, borderRadius: 4, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                  <Typography variant="h4" fontWeight="bold" color="primary">ISO 9001</Typography>
                  <Typography variant="body2" color="textSecondary">Certified Manufacturing</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="overline" color="primary" fontWeight="bold" fontSize="1rem">Why Choose Us</Typography>
              <Typography variant="h2" fontWeight="bold" gutterBottom sx={{ mt: 1, mb: 3 }}>Innovating for a Greener Tomorrow.</Typography>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 4, fontSize: '1.1rem', lineHeight: 1.7 }}>
                Established by Jethu Dan in 2023, Chitra Crop Science operates with a singular focus: delivering uncompromising quality. From our advanced R&D labs to our ISO-certified manufacturing facilities in Gujarat, we ensure every product passes rigorous quality checks.
              </Typography>
              <Grid container spacing={3}>
                {['Direct Support from Agronomists', 'Transparent Dealer Margins', 'State-of-the-art Formulation Labs', 'Government Approved Formulations'].map((item, i) => (
                  <Grid item xs={12} sm={6} key={i}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <CheckCircleFilled style={{ color: '#2e7d32', fontSize: '20px' }} />
                      <Typography variant="subtitle1" fontWeight="600">{item}</Typography>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
              <Button component={Link} to="/about" variant="text" color="primary" sx={{ mt: 4, fontWeight: 'bold', fontSize: '1rem' }} endIcon={<ArrowRightOutlined />}>Learn More About Us</Button>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Featured Products */}
      <Box sx={{ py: 12, bgcolor: '#f8fafc' }}>
        <Container maxWidth="xl">
          <Box textAlign="center" mb={8}>
            <Typography variant="overline" color="primary" fontWeight="bold" fontSize="1rem">Product Catalogue</Typography>
            <Typography variant="h3" fontWeight="bold" sx={{ mt: 1 }}>Featured Solutions</Typography>
          </Box>
          <Grid container spacing={4}>
            {featuredProducts.length > 0 ? featuredProducts.map((product) => (
              <Grid item xs={12} sm={6} md={3} key={product.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 4, transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-10px)' }, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                  <CardMedia component="img" height="200" image={product.image_url || product.images?.[0] || 'https://via.placeholder.com/500x300?text=CCS+Product'} alt={product.name} />
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>{product.name}</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>{product.technical_name || product.technicalName || product.composition}</Typography>
                    <Typography variant="subtitle2" color="primary.main">{product.category_name || product.category}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            )) : (
              <Grid item xs={12}>
                <Typography textAlign="center" color="textSecondary">Loading featured products...</Typography>
              </Grid>
            )}
          </Grid>
          <Box textAlign="center" mt={6}>
            <Button component={Link} to="/products" variant="outlined" color="primary" size="large" sx={{ px: 4, borderRadius: 8 }}>View All Products</Button>
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ bgcolor: '#111827', py: 10, textAlign: 'center', color: 'white' }}>
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight="bold" gutterBottom>Ready to elevate your agro business?</Typography>
          <Typography variant="h6" color="#9ca3af" sx={{ mb: 5, fontWeight: 400 }}>
            Join our growing network of dealers who trust Chitra Crop Science for reliable supply, incredible margins, and dedicated support.
          </Typography>
          <Button component={Link} to="/become-dealer" variant="contained" color="primary" size="large" sx={{ px: 6, py: 2, fontSize: '1.2rem', borderRadius: 8 }}>
            Partner With Us Today
          </Button>
        </Container>
      </Box>
    </Box>
  );
}
