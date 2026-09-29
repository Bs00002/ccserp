import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Stack, List, ListItemButton, ListItemText, Divider, TextField, InputAdornment, Avatar, Grid } from '@mui/material';
import MasterDetailLayout from 'components/ui/MasterDetailLayout';
import { SearchOutlined, AppstoreOutlined } from '@ant-design/icons';
import api from 'api/client';
import { formatINR, products as mockProducts } from 'data/ccsMock';
import MainCard from 'components/MainCard';

export default function DealerProducts() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products/products/');
        const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.results) ? res.data.results : mockProducts);
        setData(list);
        if (list.length > 0) setSelectedId(list[0].id);
      } catch (err) {
        console.error(err);
        setData(mockProducts);
        if (mockProducts.length > 0) setSelectedId(mockProducts[0].id);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const safeData = Array.isArray(data) ? data : [];

  const filteredProducts = useMemo(() => {
    return safeData.filter(p => 
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || p.category_name || '')?.toLowerCase().includes(search.toLowerCase())
    );
  }, [safeData, search]);

  const selectedProduct = safeData.find(p => p.id === selectedId);

  const masterContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, bgcolor: '#F9FAFB', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Product Catalog</Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined style={{ color: '#9CA3AF' }} />
              </InputAdornment>
            ),
            sx: { bgcolor: '#fff', borderRadius: 1.5 }
          }}
        />
      </Box>
      <List sx={{ p: 0, flex: 1, overflowY: 'auto' }}>
        {filteredProducts.length === 0 ? (
          <Box p={3} textAlign="center">
            <Typography variant="body2" color="textSecondary">No products found.</Typography>
          </Box>
        ) : (
          filteredProducts.map((p) => (
            <React.Fragment key={p.id}>
              <ListItemButton 
                selected={selectedId === p.id}
                onClick={() => setSelectedId(p.id)}
                sx={{ 
                  py: 2, 
                  px: 2,
                  bgcolor: selectedId === p.id ? 'primary.lighter' : 'transparent',
                  borderLeft: '4px solid',
                  borderColor: selectedId === p.id ? 'primary.main' : 'transparent',
                  '&:hover': { bgcolor: selectedId === p.id ? 'primary.lighter' : 'grey.100' }
                }}
              >
                <Avatar sx={{ mr: 2, bgcolor: 'primary.lighter', color: 'primary.main', borderRadius: 1 }} variant="rounded">
                  {p.image ? <img src={p.image} alt={p.name} width="100%" /> : <AppstoreOutlined />}
                </Avatar>
                <ListItemText
                  primary={<Typography variant="subtitle1" fontWeight={600}>{p.name}</Typography>}
                  secondary={<Typography variant="body2" color="textSecondary">{p.category} • {p.type}</Typography>}
                />
              </ListItemButton>
              <Divider />
            </React.Fragment>
          ))
        )}
      </List>
    </Box>
  );

  const detailContent = selectedProduct ? (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={3} alignItems="flex-start" mb={4}>
        <Avatar 
          variant="rounded" 
          sx={{ width: 120, height: 120, bgcolor: 'grey.100', color: 'primary.main', fontSize: '3rem' }}
        >
          {selectedProduct.image ? <img src={selectedProduct.image} alt={selectedProduct.name} width="100%" height="100%" style={{ objectFit: 'cover' }} /> : <AppstoreOutlined />}
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>{selectedProduct.name}</Typography>
          <Typography variant="h5" color="primary.main" gutterBottom>{formatINR(selectedProduct.price || 0)}</Typography>
          <Typography variant="body1" color="textSecondary">{selectedProduct.category} • {selectedProduct.type}</Typography>
        </Box>
      </Stack>

      <MainCard title="Product Specifications">
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="textSecondary">Product Category</Typography>
            <Typography variant="body1" fontWeight={600}>{selectedProduct.category}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="textSecondary">Product Type</Typography>
            <Typography variant="body1" fontWeight={600}>{selectedProduct.type}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="textSecondary">Size/Unit</Typography>
            <Typography variant="body1" fontWeight={600}>{selectedProduct.size || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="textSecondary">Price</Typography>
            <Typography variant="body1" fontWeight={600} color="primary.main">{formatINR(selectedProduct.price || 0)}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="caption" color="textSecondary">Uses / Description</Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>{selectedProduct.uses || 'No description provided.'}</Typography>
          </Grid>
        </Grid>
      </MainCard>
    </Box>
  ) : (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
      <Typography>Select a product to view details</Typography>
    </Box>
  );

  return (
    <MasterDetailLayout 
      masterContent={masterContent} 
      detailContent={detailContent} 
      masterWidth={350} 
    />
  );
}
