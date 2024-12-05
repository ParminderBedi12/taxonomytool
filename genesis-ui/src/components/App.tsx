import { createStyles, Divider, Theme, withStyles, WithStyles } from '@material-ui/core';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import AssignmentIcon from '@material-ui/icons/Assignment';
import InputIcon from '@material-ui/icons/Input';
import { AnalyticsConsumer } from '@mightyhive/analytics';
import { Drawer, NavigationListItem, NestedNavigationList, TopAppBar } from '@mightyhive/material-components';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import { default as React, ReactNode } from 'react';
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom';
import logo from '../assets/HP_logo_black.svg';
import NotFound from '../routes/notFound/NotFound';
import Taxonomy from '../routes/Taxonomy/Taxonomy';
import withRoot from '../withRoot';
import { Routes } from './../routes/RouteLocations';
import { AuthContext, AuthContextConsumer } from './contexts/AuthContext';
import { RenderNotifications } from './notifications/RenderNotifications';
import Notifications from './notifications/Notificiations';

const drawerOpenWidth = 300;

const genesisAccessAll = 'genesisAll';
const genesisTaxonomyClaim = 'genesisTaxonomy';

// Styles for entire app
const styles = (theme: Theme) => {
  return createStyles({
    root: {
      flexGrow: 1,
      zIndex: 1,
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      height: '100vh',
    },
    titleText: {
      flex: 1,
    },
    hide: {
      display: 'none',
    },
    toolbar: {
      display: 'flex',
      alignItems: 'center',
      // Inherits the styles from the theme.
      ...theme.mixins.toolbar,
    },
    content: {
      flexGrow: 1,
      width: `calc(100% - ${drawerOpenWidth}px)`,
      overflowY: 'auto',
    },
    menu: {
      width: '300px',
    },
    listItem: {
      '&:hover': {
        color: theme.palette.primary.main,
        backgroundColor: theme.palette.background.paper,
      },
      '&:hover $icon': {
        color: theme.palette.primary.main,
        backgroundColor: theme.palette.background.paper,
      },
    },
    // The class needs to be here so the above can effectively highlight the icon component
    // Link to MUI customization docs: https://material-ui.com/customization/components/#pseudo-classes
    icon: {},
  });
};

interface IAppProps extends WithStyles<typeof styles> {
  bearerToken: string;
  userDetails: {
    // This is the claims property the firebase.auth.IdTokenResult interface
    [key: string]: any;
  };
}
interface IAppState {
  accountMenuAnchor: HTMLElement | null;
  isDrawerOpen: boolean;
}
class App extends React.Component<IAppProps, IAppState> {
  constructor(props: IAppProps) {
    super(props);
    this.state = {
      isDrawerOpen: true,
      accountMenuAnchor: null,
    };
  }

  private handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    this.setState({ accountMenuAnchor: event.currentTarget });
  };

  private handleClose = () => {
    this.setState({ accountMenuAnchor: null });
  };

  private isUserAllowed(permittedClaims: string[]) {
    const { userDetails } = this.props;
    for (const permittedClaim of permittedClaims) {
      // if any user claim does not match a permitted claim, forbid access
      if (!userDetails.hasOwnProperty(permittedClaim) || !userDetails[permittedClaim]) {
        return false;
      }
    }
    // if all claims match, allow access
    return true;
  }

  public render() {
    const { classes, userDetails } = this.props;
    const { accountMenuAnchor, isDrawerOpen } = this.state;
    const appName = 'Genesis';
    const isMenuOpen = Boolean(accountMenuAnchor);

    const automationMenu = (
      <NestedNavigationList text="AUTOMATION" drawerOpen={isDrawerOpen}>
        {<NavigationListItem to={Routes.Taxonomy} primaryText="Taxonomator" key={Routes.Taxonomy} icon={<AssignmentIcon />} />}
      </NestedNavigationList>
    );

    return (
      <Router>
        <div className={classes.root}>
          <AnalyticsConsumer>
            {({ track }) => (
              <TopAppBar
                logo={<img height="50" src={logo} alt="MediaMonksHP" />}
                imageUrl={userDetails.picture}
                menuTitle={userDetails.email}
                onAvatarIconClick={this.handleMenu}
                onDrawerIconClick={() => {
                  const { isDrawerOpen } = this.state;
                  const drawerNewStateIsOpen = !isDrawerOpen;
                  if (drawerNewStateIsOpen) {
                    track('App Bar: Menu View', { State: 'Open' });
                  } else {
                    track('App Bar: Menu View', { State: 'Closed' });
                  }
                  track('App Bar: Menu View', { State: drawerNewStateIsOpen });
                  this.setState({ isDrawerOpen: drawerNewStateIsOpen });
                }}
                showDrawerIcon={true}
                title={appName}
                userName={userDetails.name as string}
              />
            )}
          </AnalyticsConsumer>
          <Menu
            getContentAnchorEl={null /* https://github.com/mui-org/material-ui/issues/7961 */}
            anchorEl={accountMenuAnchor}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={isMenuOpen}
            onClose={this.handleClose}
            className={classes.menu}
            elevation={0}
          >
            <AnalyticsConsumer>
              {({ track }) => (
                <MenuItem
                  onClick={() => {
                    this.handleClose();
                    track('App Bar: Log Out', { URL: window.location.href });
                    firebase.auth().signOut();
                  }}
                  className={classes.listItem}
                >
                  <ListItemIcon color="primary" className={classes.icon}>
                    <InputIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Log Out</ListItemText>
                </MenuItem>
              )}
            </AnalyticsConsumer>
          </Menu>
          <Drawer variant="permanent" open={isDrawerOpen}>
            { automationMenu }
            <div style={{ display: 'flex', flexGrow: 1 }} />
            <Divider />
          </Drawer>
          <main className={classes.content}>
            <div className={classes.toolbar} />
            <RenderNotifications />
            <Switch>
              <Redirect exact={true} from="/" to={Routes.Taxonomy} />
              {<Route path={Routes.Taxonomy} render={() => <Taxonomy isUserApproved={this.isUserAllowed([genesisTaxonomyClaim])} />} />}
              {this.isUserAllowed([genesisAccessAll]) && <Route path={Routes.Notifications} render={() => <Notifications />} />}
              <Route render={() => <NotFound />} />
            </Switch>
          </main>
        </div>
      </Router>
    );
  }
}

function AppWithAuth(props: IAppProps) {
  return (
    <AuthContextConsumer>
      {(authContext: AuthContext): ReactNode => {
        if (!authContext.idTokenResult) {
          return <div />;
        } else {
          return (
            <AnalyticsConsumer>
              {({ analytics }) => {
                analytics.user(authContext.idTokenResult!.claims.email);
                return <App {...props} userDetails={authContext.idTokenResult!.claims} />;
              }}
            </AnalyticsConsumer>
          );
        }
      }}
    </AuthContextConsumer>
  );
}

// track function wrapper only works with functional components :/
export default withRoot(withStyles(styles)(AppWithAuth));
