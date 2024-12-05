import { createStyles, Theme, withStyles, WithStyles } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import google_sign_in from '../assets/google_sign_in.svg';
import logo from '../assets/mightyhive-logo-dark-without-text.svg';

// https://developers.google.com/identity/branding-guidelines#matching
const styles = (theme: Theme) =>
  createStyles({
    root: {
      height: '100vh',
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
    },
    loginCard: {
      alignItems: 'center',
      display: 'flex',
      height: '400px',
      width: '400px',
      justifyContent: 'center',
      textAlign: 'center',
    },
    gridItem: {
      padding: theme.spacing(2),
    },
    button: {
      width: '272px',
      padding: theme.spacing(1),
    },
    signInText: {
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
    },
  });

interface ILoginProps extends WithStyles<typeof styles> {
  appName: string;
  authUrl: string;
  hostUrl: string;
  message?: string;
  providers: string[];
}

interface ILoginButtonProps extends WithStyles<typeof styles> {
  providerName: string;
  url: string;
  image: string;
}

const LoginButton: React.FunctionComponent<ILoginButtonProps> = (props: ILoginButtonProps) => {
  // This component belongs in a Grid
  const { classes, providerName, url, image } = props;
  return (
    <Grid item={true} className={classes.gridItem}>
      <Button variant="outlined" color="default" className={classes.button} size="large" href={url}>
        <img src={image} alt="" />
        <Typography className={classes.signInText}>Sign In With {providerName}</Typography>
      </Button>
    </Grid>
  );
};

const StyledLoginButton = withStyles(styles)(LoginButton);

class Login extends React.PureComponent<ILoginProps> {
  private loginUrl(provider: string): string {
    const { authUrl, hostUrl } = this.props;
    const currenturl = window.location.pathname;
    return `${authUrl}/login/${provider}?redirect_uri=${hostUrl}&final_dest_url=${currenturl}`;
  }

  private loginButton(provider: string): React.ReactNode | void {
    const url = this.loginUrl(provider);
    switch (provider) {
      case 'google':
        return <StyledLoginButton key={provider} providerName={'Google'} url={url} image={google_sign_in} />;
      default:
        break;
    }
  }

  public render() {
    const { classes, appName, providers, message } = this.props;

    return (
      <div className={classes.root}>
        <Card className={classes.loginCard}>
          <CardContent>
            <Grid container={true} direction="column">
              <Grid item={true}>
                <img src={logo} height="80" alt="" />
              </Grid>
              <Grid item={true} className={classes.gridItem}>
                <Typography variant="h5">{appName}</Typography>
                <Typography color="textSecondary">{message || 'Please Sign In'}</Typography>
              </Grid>
              {providers.map((provider) => this.loginButton(provider))}
            </Grid>
          </CardContent>
        </Card>
      </div>
    );
  }
}

export default withStyles(styles)(Login);
