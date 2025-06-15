import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Box, 
  Toolbar, 
  Typography, 
  Container, 
  Paper,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SettingsIcon from '@mui/icons-material/Settings';
import TableChartIcon from '@mui/icons-material/TableChart';
import InfoIcon from '@mui/icons-material/Info';
import InventoryIcon from '@mui/icons-material/Inventory';
import BarChartIcon from '@mui/icons-material/BarChart';
import StorageIcon from '@mui/icons-material/Storage';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import ChatIcon from '@mui/icons-material/Chat';

const steps = ['Upload Files', 'Process Data', 'View Results'];
const stepPaths = ['/upload', '/process', '/results'];

const Layout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = React.useState(!isMobile);
  
  // Determine active step based on current path
  const getActiveStep = () => {
    const currentPath = location.pathname;
    const index = stepPaths.indexOf(currentPath);
    return index !== -1 ? index : -1;
  };
  
  const activeStep = getActiveStep();
  
  const toggleDrawer = (open) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };
  
  const handleStepClick = (index) => {
    navigate(stepPaths[index]);
  };
  
  const menuItems = [
    { text: 'Dashboard', icon: <HomeIcon />, path: '/' },
    { text: 'Products', icon: <InventoryIcon />, path: '/products' },
    { text: 'Data Processing', icon: <UploadFileIcon />, path: '/upload' },
    { text: 'SKU Mapping', icon: <SettingsIcon />, path: '/process' },
    { text: 'Analytics', icon: <BarChartIcon />, path: '/analytics' },
    { text: 'AI Query', icon: <ChatIcon />, path: '/ai-query' },
    { text: 'Reports', icon: <TableChartIcon />, path: '/results' },
    { text: 'Database', icon: <StorageIcon />, path: '/database' },
  ];
  
  const drawerWidth = 240;
  
  const drawer = (
    <Box
      sx={{
        width: drawerWidth,
        height: '100%',
        backgroundColor: theme.palette.primary.main,
        color: '#fff',
      }}
      role="presentation"
      onClick={isMobile ? toggleDrawer(false) : undefined}
      onKeyDown={isMobile ? toggleDrawer(false) : undefined}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', mb: 2 }}>
        <img src="/logo-new.svg" alt="Logo" style={{ width: 40, height: 40, marginRight: 10 }} />
        <Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
            WMS Pro
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>
            Warehouse Management
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
      <List sx={{ pt: 1 }}>
        {menuItems.map((item, index) => (
          <ListItem 
            button 
            key={item.text} 
            onClick={() => navigate(item.path)}
            selected={location.pathname === item.path}
            sx={{
              mb: 0.5,
              mx: 1,
              borderRadius: 1,
              '&.Mui-selected': {
                backgroundColor: 'rgba(255,255,255,0.15)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            <ListItemIcon sx={{ color: '#fff', minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{ 
                fontSize: '0.9rem',
                fontWeight: location.pathname === item.path ? 'medium' : 'normal'
              }} 
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 'auto', p: 2 }}>
        <ListItem 
          button 
          sx={{
            borderRadius: 1,
            backgroundColor: 'rgba(255,255,255,0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.15)',
            },
          }}
        >
          <ListItemIcon sx={{ color: '#fff', minWidth: 40 }}>
            <SettingsApplicationsIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Settings" 
            primaryTypographyProps={{ fontSize: '0.9rem' }} 
          />
        </ListItem>
        <Box 
          sx={{ 
            mt: 2, 
            p: 1.5, 
            borderRadius: 1, 
            backgroundColor: 'rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Box 
            sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: '#4caf50',
              mr: 1 
            }} 
          />
          <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
            System Status: Operational
          </Typography>
        </Box>
      </Box>
    </Box>
  );
  
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Permanent drawer for desktop */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              border: 'none',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      )}
      
      {/* Temporary drawer for mobile */}
      {isMobile && (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={toggleDrawer(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              border: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}
      
      {/* Main content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 0, 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: theme.palette.background.default,
          overflow: 'hidden',
        }}
      >
        {/* App bar only for mobile */}
        {isMobile && (
          <AppBar 
            position="static" 
            elevation={0}
            sx={{ 
              backgroundColor: '#fff', 
              color: theme.palette.text.primary,
              borderBottom: '1px solid',
              borderColor: 'rgba(0, 0, 0, 0.08)',
            }}
          >
            <Toolbar>
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
                onClick={toggleDrawer(true)}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                WMS Pro
              </Typography>
            </Toolbar>
          </AppBar>
        )}
        
        <Container 
          maxWidth="xl" 
          sx={{ 
            mt: 4, 
            mb: 4, 
            flexGrow: 1, 
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
          }}
        >
          {activeStep !== -1 && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label, index) => (
                  <Step key={label} completed={activeStep > index}>
                    <StepLabel 
                      onClick={() => handleStepClick(index)} 
                      sx={{ cursor: 'pointer' }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Paper>
          )}
          
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;