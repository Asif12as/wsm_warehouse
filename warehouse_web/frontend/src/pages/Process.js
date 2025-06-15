import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  LinearProgress,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  useTheme,
  Button
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AnalyticsIcon from '@mui/icons-material/Analytics';

const Process = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [processing, setProcessing] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  
  // Processing steps
  const steps = [
    'Validating Files',
    'Processing SKU Mappings',
    'Analyzing Sales Data',
    'Generating Results'
  ];
  
  // Processing statistics
  const [stats, setStats] = useState({
    totalRecords: 0,
    processedRecords: 0,
    matchedSkus: 0,
    unmatchedSkus: 0,
    processingTime: 0
  });

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided. Please upload files first.');
      setProcessing(false);
      return;
    }

    // Simulate processing with steps
    const simulateProcessing = () => {
      let currentProgress = 0;
      let currentStep = 0;
      let startTime = Date.now();
      let totalRecords = Math.floor(Math.random() * 5000) + 3000; // Random number between 3000-8000
      
      setStats(prev => ({ ...prev, totalRecords }));
      
      const interval = setInterval(() => {
        if (currentProgress >= 100) {
          clearInterval(interval);
          setProcessing(false);
          setCompleted(true);
          setStats(prev => ({
            ...prev,
            processingTime: ((Date.now() - startTime) / 1000).toFixed(1),
            matchedSkus: Math.floor(totalRecords * 0.95), // 95% match rate
            unmatchedSkus: Math.floor(totalRecords * 0.05) // 5% unmatched
          }));
          
          // Simulate result data
          setResult({
            totalRecords,
            matchedSkus: Math.floor(totalRecords * 0.95),
            unmatchedSkus: Math.floor(totalRecords * 0.05),
            processingTime: ((Date.now() - startTime) / 1000).toFixed(1)
          });
          
          return;
        }
        
        // Update progress
        const increment = Math.floor(Math.random() * 5) + 1;
        currentProgress = Math.min(currentProgress + increment, 100);
        setProgress(currentProgress);
        
        // Update processed records
        const processedRecords = Math.floor((currentProgress / 100) * totalRecords);
        setStats(prev => ({
          ...prev,
          processedRecords,
          matchedSkus: Math.floor(processedRecords * 0.95),
          unmatchedSkus: Math.floor(processedRecords * 0.05)
        }));
        
        // Update step
        const newStep = Math.min(Math.floor(currentProgress / 25), 3);
        if (newStep > currentStep) {
          currentStep = newStep;
          setActiveStep(currentStep);
        }
      }, 300);

      return () => clearInterval(interval);
    };

    const timer = setTimeout(() => {
      simulateProcessing();
    }, 1000);

    return () => clearTimeout(timer);
  }, [sessionId]);

  const handleViewResults = () => {
    navigate(`/results/${sessionId}`);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Data Processing Center
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Your files are being processed. This may take a few minutes.
      </Typography>
      
      {/* Processing Status Card */}
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {processing ? (
              <CircularProgress size={24} sx={{ mr: 2 }} />
            ) : completed ? (
              <CheckCircleIcon color="success" sx={{ fontSize: 24, mr: 2 }} />
            ) : (
              <ErrorIcon color="error" sx={{ fontSize: 24, mr: 2 }} />
            )}
            <Typography variant="h6">
              {processing ? 'Processing Files' : completed ? 'Processing Complete' : 'Processing Failed'}
            </Typography>
          </Box>
          
          {/* Progress bar */}
          {processing && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {progress}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: theme.palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                  }
                }} 
              />
            </Box>
          )}
          
          {/* Processing steps */}
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {/* Error message */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Processing Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Records
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.totalRecords.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Processed Records
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.processedRecords.toLocaleString()}
              </Typography>
              {processing && (
                <Typography variant="body2" color="text.secondary">
                  {Math.round((stats.processedRecords / stats.totalRecords) * 100)}% complete
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Matched SKUs
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                {stats.matchedSkus.toLocaleString()}
              </Typography>
              {stats.totalRecords > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {Math.round((stats.matchedSkus / stats.totalRecords) * 100)}% match rate
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Unmatched SKUs
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                {stats.unmatchedSkus.toLocaleString()}
              </Typography>
              {stats.totalRecords > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {Math.round((stats.unmatchedSkus / stats.totalRecords) * 100)}% unmatched
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Action buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/upload')}
          sx={{ mr: 2, borderRadius: 2, px: 3 }}
        >
          Back to Upload
        </Button>
        
        <Button 
          variant="contained" 
          color="primary"
          disabled={processing || !!error}
          onClick={handleViewResults}
          startIcon={<AnalyticsIcon />}
          sx={{ borderRadius: 2, px: 3 }}
        >
          View Results
        </Button>
      </Box>
    </Box>
  );
};

export default Process;