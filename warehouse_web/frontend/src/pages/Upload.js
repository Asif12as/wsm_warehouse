import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

// Marketplace icons
import AmazonIcon from '@mui/icons-material/ShoppingCart'; // Placeholder
import EbayIcon from '@mui/icons-material/LocalOffer'; // Placeholder
import ShopifyIcon from '@mui/icons-material/Store'; // Placeholder
import WalmartIcon from '@mui/icons-material/Storefront'; // Placeholder
import EtsyIcon from '@mui/icons-material/Redeem'; // Placeholder
import OtherIcon from '@mui/icons-material/MoreHoriz'; // Placeholder

const Upload = () => {
  const [sessionId, setSessionId] = useState('');
  const [mappingFile, setMappingFile] = useState(null);
  const [salesFile, setSalesFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();

  // Define marketplaces
  const marketplaces = [
    { id: 'amazon', name: 'Amazon', icon: <AmazonIcon sx={{ fontSize: 32 }} />, color: '#FF9900' },
    { id: 'ebay', name: 'eBay', icon: <EbayIcon sx={{ fontSize: 32 }} />, color: '#0063D1' },
    { id: 'shopify', name: 'Shopify', icon: <ShopifyIcon sx={{ fontSize: 32 }} />, color: '#7AB55C' },
    { id: 'walmart', name: 'Walmart', icon: <WalmartIcon sx={{ fontSize: 32 }} />, color: '#0071DC' },
    { id: 'etsy', name: 'Etsy', icon: <EtsyIcon sx={{ fontSize: 32 }} />, color: '#F45800' },
    { id: 'other', name: 'Other', icon: <OtherIcon sx={{ fontSize: 32 }} />, color: '#757575' },
  ];

  useEffect(() => {
    // Generate a unique session ID when the component mounts
    setSessionId(uuidv4());
  }, []);

  const mappingDropzone = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv', '.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    onDrop: acceptedFiles => {
      setMappingFile(acceptedFiles[0]);
      setError('');
    }
  });

  const salesDropzone = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv', '.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    onDrop: acceptedFiles => {
      setSalesFile(acceptedFiles[0]);
      setError('');
    }
  });

  const uploadFile = async () => {
    if (!mappingFile || !salesFile) {
      setError('Please upload both mapping and sales files');
      return;
    }

    if (!selectedMarketplace) {
      setError('Please select a marketplace');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('mapping_file', mappingFile);
    formData.append('sales_file', salesFile);
    formData.append('session_id', sessionId);
    formData.append('marketplace', selectedMarketplace);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess(true);
      setTimeout(() => {
        navigate(`/process/${sessionId}`);
      }, 1000);
    } catch (err) {
      setError('Error uploading files. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarketplaceSelect = (marketplaceId) => {
    setSelectedMarketplace(marketplaceId);
    setError('');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Data Processing Center
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Upload and process sales data files to align warehouse SKU mapping.
      </Typography>

      {/* Marketplace Selection */}
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Select Marketplace
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {marketplaces.map((marketplace) => (
              <Grid item xs={6} sm={4} md={2} key={marketplace.id}>
                <Paper 
                  elevation={selectedMarketplace === marketplace.id ? 6 : 1}
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    borderRadius: 2,
                    border: selectedMarketplace === marketplace.id ? 
                      `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3
                    }
                  }}
                  onClick={() => handleMarketplaceSelect(marketplace.id)}
                >
                  <Box 
                    sx={{ 
                      backgroundColor: `${marketplace.color}20`, 
                      p: 1.5, 
                      borderRadius: '50%',
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Box sx={{ color: marketplace.color }}>
                      {marketplace.icon}
                    </Box>
                  </Box>
                  <Typography variant="body2" align="center">
                    {marketplace.name}
                  </Typography>
                  {selectedMarketplace === marketplace.id && (
                    <Typography variant="caption" color="primary" sx={{ mt: 0.5 }}>
                      Selected
                    </Typography>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Download a sample CSV file format for {selectedMarketplace ? marketplaces.find(m => m.id === selectedMarketplace).name : 'Amazon'}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* File Upload Section */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Drop CSV Files here or click to browse
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload sales data CSV files with maximum file size: 10MB
          </Typography>

          <Grid container spacing={3}>
            {/* Mapping File Upload */}
            <Grid item xs={12} md={6}>
              <Paper 
                {...mappingDropzone.getRootProps()} 
                sx={{
                  p: 3,
                  border: '2px dashed',
                  borderColor: mappingFile ? theme.palette.success.main : theme.palette.divider,
                  borderRadius: 2,
                  backgroundColor: mappingFile ? `${theme.palette.success.main}10` : 'background.paper',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: `${theme.palette.primary.main}10`
                  }
                }}
              >
                <input {...mappingDropzone.getInputProps()} />
                {mappingFile ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      {mappingFile.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {(mappingFile.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CloudUploadIcon sx={{ fontSize: 40, mb: 1, color: theme.palette.text.secondary }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Mapping File
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Drag & drop or click to browse
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Sales File Upload */}
            <Grid item xs={12} md={6}>
              <Paper 
                {...salesDropzone.getRootProps()} 
                sx={{
                  p: 3,
                  border: '2px dashed',
                  borderColor: salesFile ? theme.palette.success.main : theme.palette.divider,
                  borderRadius: 2,
                  backgroundColor: salesFile ? `${theme.palette.success.main}10` : 'background.paper',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: `${theme.palette.primary.main}10`
                  }
                }}
              >
                <input {...salesDropzone.getInputProps()} />
                {salesFile ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      {salesFile.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {(salesFile.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CloudUploadIcon sx={{ fontSize: 40, mb: 1, color: theme.palette.text.secondary }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Sales File
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Drag & drop or click to browse
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 3 }}>
              Files uploaded successfully! Redirecting to processing...
            </Alert>
          )}

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              disabled={loading || !mappingFile || !salesFile || !selectedMarketplace}
              onClick={uploadFile}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ 
                px: 4, 
                py: 1.5,
                borderRadius: 2,
                boxShadow: 2
              }}
            >
              {loading ? 'Uploading...' : 'Process Files'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Upload;