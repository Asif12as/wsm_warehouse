import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Button, 
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import GetAppIcon from '@mui/icons-material/GetApp';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';

// Mock data for SKU mappings
const generateMockData = (count) => {
  const marketplaces = ['Amazon', 'eBay', 'Shopify', 'Walmart'];
  const statuses = ['verified', 'pending', 'failed'];
  const methods = ['automatic', 'manual', 'suggested'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    originalSku: `SKU-${Math.floor(Math.random() * 10000)}`,
    mappedSku: `MSKU-${Math.floor(Math.random() * 10000)}`,
    masterSku: `WMS-${Math.floor(Math.random() * 100000)}`,
    marketplace: marketplaces[Math.floor(Math.random() * marketplaces.length)],
    confidence: Math.floor(Math.random() * 101),
    method: methods[Math.floor(Math.random() * methods.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
  }));
};

const Results = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [marketplaceFilter, setMarketplaceFilter] = useState('all');
  const [exportFormat, setExportFormat] = useState('csv');
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    failed: 0,
    avgConfidence: 0
  });

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided. Please process files first.');
      setLoading(false);
      return;
    }

    // Simulate API call to fetch results
    const fetchResults = async () => {
      try {
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate mock data
        const mockData = generateMockData(50);
        setData(mockData);
        
        // Calculate stats
        const verified = mockData.filter(item => item.status === 'verified').length;
        const pending = mockData.filter(item => item.status === 'pending').length;
        const failed = mockData.filter(item => item.status === 'failed').length;
        const avgConfidence = Math.round(
          mockData.reduce((sum, item) => sum + item.confidence, 0) / mockData.length
        );
        
        setStats({
          total: mockData.length,
          verified,
          pending,
          failed,
          avgConfidence
        });
        
        setLoading(false);
      } catch (err) {
        setError('Error fetching results. Please try again.');
        setLoading(false);
      }
    };

    fetchResults();
  }, [sessionId]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };
  
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };
  
  const handleMarketplaceFilterChange = (event) => {
    setMarketplaceFilter(event.target.value);
    setPage(0);
  };
  
  const handleExportFormatChange = (event) => {
    setExportFormat(event.target.value);
  };
  
  const handleExport = () => {
    // Simulate export
    alert(`Exporting data in ${exportFormat.toUpperCase()} format`);
  };
  
  // Filter data based on search term and filters
  const filteredData = data.filter(item => {
    const matchesSearch = 
      searchTerm === '' ||
      item.originalSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mappedSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.masterSku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesMarketplace = marketplaceFilter === 'all' || item.marketplace === marketplaceFilter;
    
    return matchesSearch && matchesStatus && matchesMarketplace;
  });
  
  // Get unique marketplaces for filter
  const marketplaces = ['all', ...new Set(data.map(item => item.marketplace))];
  
  // Render status chip
  const renderStatusChip = (status) => {
    switch (status) {
      case 'verified':
        return (
          <Chip 
            icon={<CheckCircleIcon fontSize="small" />} 
            label="Verified" 
            size="small" 
            sx={{ 
              backgroundColor: `${theme.palette.success.main}20`,
              color: theme.palette.success.main,
              fontWeight: 'medium',
              '& .MuiChip-icon': { color: theme.palette.success.main }
            }} 
          />
        );
      case 'pending':
        return (
          <Chip 
            icon={<WarningIcon fontSize="small" />} 
            label="Pending" 
            size="small" 
            sx={{ 
              backgroundColor: `${theme.palette.warning.main}20`,
              color: theme.palette.warning.main,
              fontWeight: 'medium',
              '& .MuiChip-icon': { color: theme.palette.warning.main }
            }} 
          />
        );
      case 'failed':
        return (
          <Chip 
            icon={<ErrorIcon fontSize="small" />} 
            label="Failed" 
            size="small" 
            sx={{ 
              backgroundColor: `${theme.palette.error.main}20`,
              color: theme.palette.error.main,
              fontWeight: 'medium',
              '& .MuiChip-icon': { color: theme.palette.error.main }
            }} 
          />
        );
      default:
        return null;
    }
  };
  
  // Render confidence indicator
  const renderConfidence = (confidence) => {
    let color;
    if (confidence >= 90) color = theme.palette.success.main;
    else if (confidence >= 70) color = theme.palette.warning.main;
    else color = theme.palette.error.main;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ mr: 1, color }}>
          {confidence}%
        </Typography>
        <Box 
          sx={{ 
            width: 16, 
            height: 16, 
            borderRadius: '50%', 
            backgroundColor: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {confidence >= 90 && <CheckCircleIcon sx={{ fontSize: 12, color: '#fff' }} />}
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        SKU Mapping Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage and validate SKU mappings across all marketplaces with intelligent automation.
      </Typography>
      
      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Mappings
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {stats.total}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Verified
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                  {stats.verified}
                </Typography>
                <CheckCircleIcon sx={{ ml: 1, color: theme.palette.success.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Pending
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.warning.main }}>
                  {stats.pending}
                </Typography>
                <WarningIcon sx={{ ml: 1, color: theme.palette.warning.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Failed
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                  {stats.failed}
                </Typography>
                <ErrorIcon sx={{ ml: 1, color: theme.palette.error.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Avg. Confidence
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {stats.avgConfidence}%
                </Typography>
                <RefreshIcon sx={{ ml: 1, color: theme.palette.primary.main, cursor: 'pointer' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Search and Filters */}
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search mappings"
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                select
                fullWidth
                label="Marketplace"
                value={marketplaceFilter}
                onChange={handleMarketplaceFilterChange}
                size="small"
              >
                {marketplaces.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option === 'all' ? 'All Marketplaces' : option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                select
                fullWidth
                label="Status"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                size="small"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="verified">Verified</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                select
                fullWidth
                label="Export Format"
                value={exportFormat}
                onChange={handleExportFormatChange}
                size="small"
              >
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="xlsx">Excel</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GetAppIcon />}
                onClick={handleExport}
                sx={{ height: '40px' }}
              >
                Export
              </Button>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
            <FilterListIcon sx={{ fontSize: 18, mr: 1, color: theme.palette.text.secondary }} />
            <Typography variant="body2" color="text.secondary">
              Showing {filteredData.length} of {data.length} mappings
            </Typography>
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ mr: 1 }}>
                <Tooltip title="Show only unverified entries">
                  <Box component="span" sx={{ cursor: 'pointer', textDecoration: 'underline' }}>
                    Advanced Filters
                  </Box>
                </Tooltip>
              </Typography>
              <Chip 
                label="CSV Import" 
                size="small" 
                variant="outlined" 
                onDelete={() => {}} 
                sx={{ mr: 1 }} 
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      {/* Results Table */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ ml: 2 }}>
                Loading mapping results...
              </Typography>
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Original SKU</TableCell>
                      <TableCell>Mapped SKU</TableCell>
                      <TableCell>Master SKU</TableCell>
                      <TableCell>Marketplace</TableCell>
                      <TableCell>Confidence</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredData
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.originalSku}</TableCell>
                          <TableCell>{row.mappedSku}</TableCell>
                          <TableCell>{row.masterSku}</TableCell>
                          <TableCell>{row.marketplace}</TableCell>
                          <TableCell>{renderConfidence(row.confidence)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={row.method} 
                              size="small" 
                              variant="outlined" 
                              sx={{ textTransform: 'capitalize' }} 
                            />
                          </TableCell>
                          <TableCell>{renderStatusChip(row.status)}</TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <IconButton size="small" color="primary">
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error">
                                <ErrorIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Results;