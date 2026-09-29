import { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Card, CardMedia, CardContent, Chip, TextField, InputAdornment, Button, Stack, CircularProgress, Paper, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import { SearchOutlined, DownloadOutlined, CloseOutlined } from '@ant-design/icons';
import { Helmet } from 'react-helmet-async';
// @ts-ignore
import api from 'api/client';
import { products as mockProducts } from 'data/ccsMock';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products/products/');
        // Handle both paginated and non-paginated responses
        const data = res.data?.results || res.data;
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        } else {
          setProducts(mockProducts);
        }
      } catch (err) {
        console.error('Failed to fetch products', err);
        setProducts(mockProducts);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const safeProducts = Array.isArray(products) ? products : [];
  const categories = ['All', ...new Set(safeProducts.map(p => p.category_name || p.category?.name || p.category || 'Uncategorized'))];

  const filtered = safeProducts.filter(p => {
    const pCat = p.category_name || p.category?.name || p.category || 'Uncategorized';
    const techName = p.technical_name || p.technicalName || p.composition || '';
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || techName.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === 'All' || pCat === category;
    return matchesSearch && matchesCat;
  });

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pb: 10 }}>
      <Helmet>
        <title>Our Products | Chitra Crop Science</title>
        <meta name="description" content="Explore Chitra Crop Science's catalogue of premium water-soluble fertilizers, bio-stimulants, fungicides, and insecticides." />
      </Helmet>

      {/* Header */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h2" fontWeight="bold" gutterBottom>Our Crop Solutions</Typography>
          <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.9 }}>
            Explore our comprehensive range of agricultural inputs designed to protect your crops and maximize your yield.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: -4 }}>
        <Paper elevation={12} sx={{ p: 3, borderRadius: 4, mb: 6, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <TextField
            variant="outlined"
            placeholder="Search by product name or technical composition..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ flexGrow: 1, maxWidth: { xs: '100%', md: 500 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined /></InputAdornment> }}
          />
          <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', py: 1 }}>
            {categories.map(cat => (
              <Chip 
                key={cat} 
                label={cat} 
                clickable 
                color={category === cat ? "primary" : "default"}
                onClick={() => setCategory(cat)}
                sx={{ fontWeight: 'bold', px: 1 }}
              />
            ))}
          </Stack>
        </Paper>

        {loading ? (
          <Box textAlign="center" py={10}><CircularProgress size={60} /></Box>
        ) : (
          <Grid container spacing={4}>
            {filtered.map((product) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 4, transition: '0.3s', '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }, cursor: 'pointer' }} onClick={() => setSelectedProduct(product)}>
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia component="img" height="240" image={product.image_url || 'https://via.placeholder.com/500x300?text=CCS+Product'} alt={product.name} />
                    <Chip label={product.category_name || product.category?.name} color="secondary" size="small" sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 'bold' }} />
                  </Box>
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>{product.name}</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2, minHeight: 40 }}>{product.technical_name}</Typography>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ bgcolor: '#f1f5f9', p: 1.5, borderRadius: 2 }}>
                      <Typography variant="subtitle2" color="textSecondary">Packing: <Box component="span" fontWeight="bold" color="textPrimary">{product.packing || 'Contact Us'}</Box></Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {filtered.length === 0 && (
              <Grid item xs={12}>
                <Box textAlign="center" py={10}>
                  <Typography variant="h6" color="textSecondary">No products found matching your criteria.</Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        )}
      </Container>

      {/* Product Detail Dialog */}
      <Dialog open={Boolean(selectedProduct)} onClose={() => setSelectedProduct(null)} maxWidth="md" fullWidth>
        {selectedProduct && (
          <>
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4" fontWeight="bold" color="primary.main">{selectedProduct.name}</Typography>
              <IconButton onClick={() => setSelectedProduct(null)}><CloseOutlined /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={4}>
                <Grid item xs={12} md={5}>
                  <img src={selectedProduct.image_url || 'https://via.placeholder.com/500x500?text=CCS+Product'} alt={selectedProduct.name} style={{ width: '100%', borderRadius: 12 }} />
                </Grid>
                <Grid item xs={12} md={7}>
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary" textTransform="uppercase">Technical Name</Typography>
                      <Typography variant="body1" fontWeight="bold">{selectedProduct.technical_name}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary" textTransform="uppercase">Composition</Typography>
                      <Typography variant="body1">{selectedProduct.composition}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary" textTransform="uppercase">Target Crop</Typography>
                      <Typography variant="body1">{selectedProduct.crop || 'Applicable to various crops'}</Typography>
                    </Box>
                    {selectedProduct.disease && (
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary" textTransform="uppercase">Target Disease/Pest</Typography>
                        <Typography variant="body1">{selectedProduct.disease}</Typography>
                      </Box>
                    )}
                    <Box>
                      <Typography variant="subtitle2" color="textSecondary" textTransform="uppercase">Benefits</Typography>
                      <Typography variant="body1">{selectedProduct.benefits}</Typography>
                    </Box>
                    <Stack direction="row" spacing={3} sx={{ bgcolor: '#f1f5f9', p: 2, borderRadius: 2, mt: 2 }}>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Dosage</Typography>
                        <Typography variant="body1" fontWeight="bold">{selectedProduct.dosage || 'Contact Agronomist'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">Available Packing</Typography>
                        <Typography variant="body1" fontWeight="bold">{selectedProduct.packing || 'Contact Us'}</Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2, px: 3 }}>
              {selectedProduct.pdf_url && (
                <Button variant="outlined" startIcon={<DownloadOutlined />} href={selectedProduct.pdf_url} target="_blank">
                  Download Brochure
                </Button>
              )}
              <Button variant="contained" onClick={() => setSelectedProduct(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
