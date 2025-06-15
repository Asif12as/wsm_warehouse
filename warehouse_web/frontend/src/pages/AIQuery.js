import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  InputAdornment,
  Divider,
  useTheme,
  Tooltip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Container,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ChatIcon from '@mui/icons-material/Chat';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CodeIcon from '@mui/icons-material/Code';
import BarChartIcon from '@mui/icons-material/BarChart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// Sample queries to display as examples
const sampleQueries = [
  "Show me the top 5 selling products this month",
  "What's the total revenue by marketplace?",
  "Find products with low stock levels",
  "Show me return rates by product category",
  "Which products have the highest profit margins?",
  "Compare sales performance across different categories"
];

const AIQuery = () => {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [queryHistory, setQueryHistory] = useState([]);
  const [queryResult, setQueryResult] = useState(null);
  const [sqlQuery, setSqlQuery] = useState('');
  const [error, setError] = useState(null);
  const [showSql, setShowSql] = useState(false);
  
  // Handle query submission
  const handleSubmitQuery = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    setQueryResult(null);
    setSqlQuery('');
    
    try {
      // Make API call to process the query
      const response = await fetch('/api/ai-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          session_id: localStorage.getItem('session_id') || 'default-session'
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to process query');
      }
      
      // Add the query to history
      setQueryHistory(prev => [...prev, { 
        query, 
        timestamp: new Date(),
        sql: data.sql
      }]);
      
      // Set the results
      setQueryResult(data.result);
      setSqlQuery(data.sql);
      setQuery('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle clicking on a sample query
  const handleSampleQueryClick = (sampleQuery) => {
    setQuery(sampleQuery);
  };
  
  // Toggle SQL visibility
  const toggleSqlVisibility = () => {
    setShowSql(!showSql);
  };
  
  // Render chart based on result type
  const renderChart = () => {
    if (!queryResult) return null;
    
    const { chart_type, data, columns, chart_options } = queryResult;
    
    // Prepare data for charts
    const chartData = {
      labels: data.map(row => row[columns.indexOf(chart_options?.x_axis || columns[0])]),
      datasets: []
    };
    
    // Handle different chart types
    switch (chart_type) {
      case 'bar':
        // For multi-axis charts
        if (chart_options?.multi_axis && Array.isArray(chart_options.y_axis)) {
          chart_options.y_axis.forEach((axis, index) => {
            chartData.datasets.push({
              label: axis,
              data: data.map(row => row[columns.indexOf(axis)]),
              backgroundColor: index === 0 ? theme.palette.primary.main : theme.palette.secondary.main,
              borderColor: index === 0 ? theme.palette.primary.dark : theme.palette.secondary.dark,
              borderWidth: 1
            });
          });
        } else {
          // For single y-axis
          const y_axis = chart_options?.y_axis || columns[1];
          
          // If there's a series field, group by that
          if (chart_options?.series) {
            const seriesValues = [...new Set(data.map(row => row[columns.indexOf(chart_options.series)]))];
            
            seriesValues.forEach((seriesValue, index) => {
              const filteredData = data.filter(row => row[columns.indexOf(chart_options.series)] === seriesValue);
              
              chartData.datasets.push({
                label: seriesValue,
                data: filteredData.map(row => row[columns.indexOf(y_axis)]),
                backgroundColor: `hsl(${index * 50}, 70%, 60%)`,
                borderColor: `hsl(${index * 50}, 70%, 50%)`,
                borderWidth: 1
              });
            });
          } else {
            // Simple bar chart
            chartData.datasets.push({
              label: y_axis,
              data: data.map(row => row[columns.indexOf(y_axis)]),
              backgroundColor: theme.palette.primary.main,
              borderColor: theme.palette.primary.dark,
              borderWidth: 1
            });
          }
        }
        
        return (
          <Box sx={{ height: 400, mt: 2 }}>
            <Bar 
              data={chartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Query Results',
                  },
                },
              }}
            />
          </Box>
        );
        
      case 'pie':
        const labels = chart_options?.labels || columns[0];
        const values = chart_options?.values || columns[1];
        
        chartData.datasets.push({
          data: data.map(row => row[columns.indexOf(values)]),
          backgroundColor: data.map((_, index) => `hsl(${index * 30}, 70%, 60%)`),
          borderColor: data.map((_, index) => `hsl(${index * 30}, 70%, 50%)`),
          borderWidth: 1
        });
        
        return (
          <Box sx={{ height: 400, mt: 2 }}>
            <Pie 
              data={chartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                  title: {
                    display: true,
                    text: 'Query Results',
                  },
                },
              }}
            />
          </Box>
        );
        
      case 'line':
        // Similar to bar chart setup
        const lineY_axis = chart_options?.y_axis || columns[1];
        
        chartData.datasets.push({
          label: lineY_axis,
          data: data.map(row => row[columns.indexOf(lineY_axis)]),
          backgroundColor: theme.palette.primary.main,
          borderColor: theme.palette.primary.main,
          borderWidth: 2,
          tension: 0.1
        });
        
        return (
          <Box sx={{ height: 400, mt: 2 }}>
            <Line 
              data={chartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Query Results',
                  },
                },
              }}
            />
          </Box>
        );
        
      case 'table':
      default:
        return renderDataTable();
    }
  };
  
  // Render data as a table
  const renderDataTable = () => {
    if (!queryResult) return null;
    
    const { columns, data } = queryResult;
    
    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="query results table">
          <TableHead>
            <TableRow>
              {columns.map((column, index) => (
                <TableCell key={index} align={typeof data[0][index] === 'number' ? 'right' : 'left'}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {column}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow key={rowIndex} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex} align={typeof cell === 'number' ? 'right' : 'left'}>
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        AI-Powered Query Interface
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Ask questions about your warehouse data in natural language and get instant insights.
      </Typography>
      
      {/* Query Input */}
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmitQuery}>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Ask me anything about your warehouse data... e.g., 'Show me the top selling products this month' or 'What's my total revenue by marketplace?'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              variant="outlined"
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SmartToyIcon color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton 
                      color="primary" 
                      onClick={handleSubmitQuery}
                      disabled={!query.trim() || isProcessing}
                    >
                      <SendIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </CardContent>
      </Card>
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 4 }}>
          {error}
        </Alert>
      )}
      
      {/* Query results */}
      {queryResult && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Query Results</Typography>
            <Button 
              size="small" 
              startIcon={<CodeIcon />}
              onClick={toggleSqlVisibility}
            >
              {showSql ? 'Hide SQL' : 'Show SQL'}
            </Button>
          </Box>
          
          {/* SQL Query */}
          {showSql && (
            <Paper sx={{ p: 2, mb: 2, backgroundColor: 'grey.100' }}>
              <Typography variant="subtitle2" gutterBottom>Generated SQL:</Typography>
              <Box 
                component="pre" 
                sx={{ 
                  overflowX: 'auto',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  m: 0
                }}
              >
                {sqlQuery}
              </Box>
            </Paper>
          )}
          
          {/* Chart or Table */}
          {renderChart()}
        </Box>
      )}
      
      {/* Main Content Area */}
      <Grid container spacing={4}>
        {/* Sample Queries */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HelpOutlineIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="h6">Try these sample queries:</Typography>
              </Box>
              <Grid container spacing={2}>
                {sampleQueries.map((sampleQuery, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{ 
                        justifyContent: 'flex-start', 
                        textAlign: 'left',
                        height: '100%',
                        borderColor: theme.palette.divider,
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          backgroundColor: `${theme.palette.primary.main}10`,
                        }
                      }}
                      onClick={() => handleSampleQueryClick(sampleQuery)}
                      startIcon={<ChatIcon fontSize="small" />}
                    >
                      {sampleQuery}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Query History */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Query History
              </Typography>
              
              {queryHistory.length === 0 ? (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    py: 4,
                    color: 'text.secondary'
                  }}
                >
                  <Box 
                    sx={{ 
                      width: 60, 
                      height: 60, 
                      borderRadius: '50%', 
                      backgroundColor: `${theme.palette.primary.main}10`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2
                    }}
                  >
                    <ChatIcon sx={{ fontSize: 30, color: theme.palette.primary.main }} />
                  </Box>
                  <Typography variant="body2" align="center">
                    No queries yet. Start by asking a question above!
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {queryHistory.map((item, index) => (
                    <Box key={index}>
                      {index > 0 && <Divider sx={{ my: 1 }} />}
                      <Box sx={{ py: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {item.query}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.timestamp.toLocaleTimeString()}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIQuery;