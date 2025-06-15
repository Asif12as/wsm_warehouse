import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Card, 
  CardContent,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LinkIcon from '@mui/icons-material/Link';

// Mock data for the dashboard
const mockData = {
  totalProducts: 2847,
  productGrowth: 12,
  monthlySales: 54670,
  salesGrowth: 8.2,
  activeOrders: 187,
  pendingShipments: 93,
  skuMappings: 1432,
  mappingAccuracy: 96.5,
  salesByMonth: [
    { month: 'Jan', value: 3800 },
    { month: 'Feb', value: 3000 },
    { month: 'Mar', value: 4500 },
    { month: 'Apr', value: 4000 },
    { month: 'May', value: 5800 },
    { month: 'Jun', value: 5400 },
  ],
  marketplaceDistribution: [
    { name: 'Amazon', value: 40 },
    { name: 'eBay', value: 25 },
    { name: 'Shopify', value: 20 },
    { name: 'Walmart', value: 15 },
  ]
};

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Function to render the sales chart
  const renderSalesChart = () => {
    const maxValue = Math.max(...mockData.salesByMonth.map(item => item.value));
    const minValue = Math.min(...mockData.salesByMonth.map(item => item.value));
    const range = maxValue - minValue;
    
    // Calculate y-axis labels
    const yAxisLabels = [];
    const stepSize = Math.ceil(maxValue / 4 / 1000) * 1000;
    for (let i = 0; i <= 4; i++) {
      yAxisLabels.push(i * stepSize);
    }
    
    return (
      <Box sx={{ position: 'relative', height: 250, display: 'flex', mt: 2 }}>
        {/* Y-axis labels */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column-reverse', 
          justifyContent: 'space-between',
          pr: 2,
          height: '100%',
          width: '40px'
        }}>
          {yAxisLabels.map((label, index) => (
            <Typography 
              key={index} 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: '0.7rem' }}
            >
              ${label.toLocaleString()}
            </Typography>
          ))}
        </Box>
        
        {/* Chart area */}
        <Box sx={{ 
          flex: 1, 
          position: 'relative', 
          borderLeft: `1px solid ${theme.palette.divider}`,
          borderBottom: `1px solid ${theme.palette.divider}`,
          pt: 1,
          pb: 3
        }}>
          {/* Horizontal grid lines */}
          {yAxisLabels.map((label, index) => (
            <Box 
              key={index} 
              sx={{ 
                position: 'absolute', 
                left: 0, 
                right: 0, 
                bottom: `calc(${index * 25}% - 1px)`,
                borderBottom: index > 0 ? `1px dashed ${theme.palette.divider}` : 'none',
                zIndex: 1
              }} 
            />
          ))}
          
          {/* Bars */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'flex-end', 
            justifyContent: 'space-around', 
            height: '100%', 
            position: 'relative',
            zIndex: 2
          }}>
            {mockData.salesByMonth.map((item, index) => {
              const heightPercentage = ((item.value - minValue) / range) * 80 + 20; // Ensure bars are at least 20% height
              
              return (
                <Box key={index} sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  width: '14%',
                  height: '100%',
                  justifyContent: 'flex-end'
                }}>
                  <Box 
                    sx={{ 
                      height: `${heightPercentage}%`, 
                      width: '70%', 
                      backgroundColor: theme.palette.primary.main,
                      borderRadius: '4px 4px 0 0',
                      minHeight: 20,
                      transition: 'height 0.3s ease',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                        transform: 'scaleY(1.02)',
                        transformOrigin: 'bottom',
                        cursor: 'pointer'
                      }
                    }} 
                  />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mt: 1, 
                      color: theme.palette.text.secondary,
                      fontWeight: 'medium'
                    }}
                  >
                    {item.month}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    );
  };
  
  // Function to render the marketplace distribution chart
  const renderMarketplaceChart = () => {
    const colors = [
      '#FF9800', // Amazon - Orange
      '#2196F3', // eBay - Blue
      '#4CAF50', // Shopify - Green
      '#9C27B0'  // Walmart - Purple
    ];
    
    // Calculate cumulative angles for each segment
    let cumulativeAngle = 0;
    const segments = mockData.marketplaceDistribution.map((item, index) => {
      const startAngle = cumulativeAngle;
      const angle = (item.value / 100) * 360;
      cumulativeAngle += angle;
      
      return {
        ...item,
        startAngle,
        angle,
        color: colors[index]
      };
    });
    
    return (
      <Box sx={{ position: 'relative', height: 250, width: '100%', mt: 2 }}>
        {/* Pie chart container */}
        <Box sx={{ 
          position: 'relative',
          width: '200px',
          height: '200px',
          margin: '0 auto',
          borderRadius: '50%',
          overflow: 'hidden'
        }}>
          {/* Individual segments */}
          {segments.map((segment, index) => {
            // Create a CSS conic gradient for each segment
            const conicGradient = `conic-gradient(
              ${segment.color} ${segment.startAngle}deg,
              ${segment.color} ${segment.startAngle + segment.angle}deg,
              transparent ${segment.startAngle + segment.angle}deg
            )`;
            
            return (
              <Box 
                key={index}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: conicGradient,
                  borderRadius: '50%',
                  transform: 'rotate(0.1deg)', // Fix rendering issues in some browsers
                }}
              />
            );
          })}
          
          {/* Center circle */}
          <Box 
            sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: theme.palette.background.paper,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(0,0,0,0.1)',
              zIndex: 2
            }}
          />
        </Box>
        
        {/* Legend */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          flexWrap: 'wrap', 
          gap: 2,
          mt: 3
        }}>
          {segments.map((segment, index) => (
            <Box key={index} sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mr: 1
            }}>
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  backgroundColor: segment.color, 
                  borderRadius: '50%', 
                  mr: 0.8 
                }} 
              />
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 'medium',
                  color: theme.palette.text.secondary
                }}
              >
                {segment.name}: {segment.value}%
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };
  
  // Stat card component
  const StatCard = ({ title, value, icon, secondaryText, iconColor, accentColor }) => (
    <Card sx={{ height: '100%', borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              {typeof value === 'number' && value > 1000 ? value.toLocaleString() : value}
            </Typography>
            {secondaryText && (
              <Typography variant="body2" sx={{ color: accentColor || 'text.secondary', fontSize: '0.75rem' }}>
                {secondaryText}
              </Typography>
            )}
          </Box>
          <Box 
            sx={{ 
              backgroundColor: iconColor || theme.palette.primary.main, 
              width: 40, 
              height: 40, 
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              opacity: 0.9
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
  
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Warehouse Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back! Here's what's happening with your warehouse operations.
        </Typography>
      </Box>
      
      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Products" 
            value={mockData.totalProducts}
            icon={<InventoryIcon />}
            secondaryText={`+${mockData.productGrowth}% from last month`}
            iconColor="#1a237e"
            accentColor="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Monthly Sales" 
            value={`$${mockData.monthlySales}`}
            icon={<AttachMoneyIcon />}
            secondaryText={`+${mockData.salesGrowth}% from last month`}
            iconColor="#00796b"
            accentColor="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Active Orders" 
            value={mockData.activeOrders}
            icon={<ShoppingCartIcon />}
            secondaryText={`${mockData.pendingShipments} pending shipment`}
            iconColor="#e65100"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="SKU Mappings" 
            value={mockData.skuMappings}
            icon={<LinkIcon />}
            secondaryText={`${mockData.mappingAccuracy}% accuracy`}
            iconColor="#6a1b9a"
            accentColor="#4caf50"
          />
        </Grid>
      </Grid>
      
      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Sales Performance</Typography>
              {renderSalesChart()}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Marketplace Distribution</Typography>
              {renderMarketplaceChart()}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;