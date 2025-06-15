import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Components
import Layout from './components/Layout';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Process from './pages/Process';
import Results from './pages/Results';
import AIQuery from './pages/AIQuery';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1a237e', // Dark blue as seen in the sidebar
      light: '#4f5db3',
      dark: '#000051',
    },
    secondary: {
      main: '#7c4dff', // Purple accent color
      light: '#b47cff',
      dark: '#3f1dcb',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
        contained: {
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/process/:sessionId" element={<Process />} />
          <Route path="/results/:sessionId" element={<Results />} />
          <Route path="/ai-query" element={<AIQuery />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

export default App;