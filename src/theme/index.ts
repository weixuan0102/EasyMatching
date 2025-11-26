import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366F1'
    },
    secondary: {
      main: '#22D3EE'
    },
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF'
    }
  },
  typography: {
    fontFamily:
      '"Noto Sans TC", "Inter", "Helvetica Neue", "Helvetica", "Arial", sans-serif'
  },
  shape: {
    borderRadius: 12
  }
});

