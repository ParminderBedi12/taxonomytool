import { createMuiTheme, Theme } from '@material-ui/core';

const defaultTheme = createMuiTheme();

// The global theme used by the app's Material UI components.
const theme: Theme = createMuiTheme({
  palette: {
    background: {
      default: '#ffffff',
      paper: '#f2f2f0',
    },
    divider: '#0171ad',
    type: 'light',
    primary: {
      main: '#0096d6',
      dark: '#0096d6',
    },
    secondary: {
      main: '#0171ad',
    },
  },
  typography: {
    // Use the proximanova font instead of the default Roboto font.
    fontFamily: ['Forma-DJR', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'].join(','),
  },
  overrides: {
    MuiTable: {
      root: {
        borderBottom: '1px solid #0171ad',
      },
    },
    MuiInputLabel: {
      root: {
        fontSize: defaultTheme.typography.fontSize,
      },
    },
    MuiTableCell: {
      root: {
        borderBottom: '1px solid #0171ad',
        // For links, use normal color except on hover
        '& a, & a:visited, & a:active ': { color: '#0171ad' },
        '& a:hover': { color: '#0171ad' },
      },
    },
    MuiFilledInput: {
      root: {
        backgroundColor: '#ffffff',
        height: 'auto',
      },
    },
  },
  props: {
    MuiTextField: {
      autoComplete: 'off', // disable autocomplete by default
    },
    MuiButton: {
      variant: 'contained',
      color: 'primary',
    },
  },
});

export default theme;
