import { DrawerClassKey as MaterialUiDrawerClassKey } from '@material-ui/core/Drawer';
import { createStyles, Theme } from '@material-ui/core/styles';

const drawerOpenWidth = 300;

const createDrawerShiftTransition = (theme: Theme) => {
  return theme.transitions.create(['width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  });
};

const generateDrawerMenuIconCss = (theme: Theme) => {
  return {
    marginLeft: theme.spacing(2),
    padding: theme.spacing(1),
  };
};

/** Style function for custom AppBar componenet */
export const appBar = (theme: Theme) => {
  return createStyles({
    root: {
      zIndex: theme.zIndex.drawer + 1,
      transition: createDrawerShiftTransition(theme),
      backgroundColor: theme.palette.background.default,
    },
  });
};

/** Style function for custom Checkbox componenet */
export const checkbox = (theme: Theme) => {
  return createStyles({
    root: {
      color: theme.palette.action.hover,
      // The default padding is too wide. Override default in theme instead?
      padding: theme.spacing(0.5),
    },
  });
};

/** Style function for custom icons in custom Drawer */
export const drawerMenuIcon = (theme: Theme) => {
  return createStyles({
    root: generateDrawerMenuIconCss(theme),
  });
};

/** Style function for custom Chip componenet */
export const chip = (theme: Theme) => {
  return createStyles({
    root: {},
  });
};

/** Style function for OptionPicker component */
export const optionPicker = (theme: Theme) => {
  return createStyles({
    list: {
      maxHeight: '400px',
      overflow: 'auto',
    },
    menuButtonGrid: {
      margin: '0px',
      padding: theme.spacing(1),
    },
  });
};

export type DrawerClassKey = MaterialUiDrawerClassKey | 'paperOpen' | 'paperClosed' | 'toolbarHeader' | 'drawerMenuIcon' | 'inner';

/** Style function for custom Drawer componenet */
export const drawer = (theme: Theme) => {
  // The styles keys should correspond to the definition above!
  return createStyles({
    paper: {
      position: 'relative',
      whiteSpace: 'nowrap',
      backgroundColor: theme.palette.background.paper,
    },
    // Additional styles not part of the Material UI base Drawer CSS API
    paperOpen: {
      width: drawerOpenWidth,
      transition: createDrawerShiftTransition(theme),
    },
    paperClosed: {
      overflowX: 'hidden',
      [theme.breakpoints.up('sm')]: {
        width: theme.spacing(9),
      },
      transition: createDrawerShiftTransition(theme),
      width: theme.spacing(7),
    },
    toolbarHeader: {
      display: 'flex',
      alignItems: 'center',
      // Inherits the styles from the theme.
      ...theme.mixins.toolbar,
    },
    inner: {
      paddingTop: theme.spacing(1),
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
    },
    drawerMenuIcon: generateDrawerMenuIconCss(theme),
  });
};

export const navigationList = (theme: Theme) => {
  return createStyles({
    root: {
      paddingTop: 0,
      paddingBottom: 0,
    },
    icon: {
      ...generateDrawerMenuIconCss(theme),
    },
    iconHighlight: {
      ...generateDrawerMenuIconCss(theme),
    },
    iconNestedCompact: {
      ...generateDrawerMenuIconCss(theme),
    },
    iconNestedExpanded: {
      marginLeft: generateDrawerMenuIconCss(theme).marginLeft * 3,
      paddingLeft: theme.spacing(1),
      paddingTop: theme.spacing(1),
      paddingRight: theme.spacing(1),
      paddingBottom: theme.spacing(1),
    },
    listItemParentText: {
      fontSize: '13px',
    },
    listItem: {
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
      '&:hover $icon': {
      },
    },
    listItemLink: {
      '&:hover': {
        backgroundColor: theme.palette.background.paper,
      },
      '&:hover $icon': {
      },
    },
    selected: {
      backgroundColor: theme.palette.primary.dark,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
    },
  });
};
