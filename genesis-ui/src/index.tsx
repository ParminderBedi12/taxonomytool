import { AnalyticsProvider } from '@mightyhive/analytics';
import Analytics from 'analytics';
import firebase from 'firebase/app';
import 'firebase/auth';
import ReactDOM from 'react-dom';
import App from './components/App';
import { AuthContextProvider } from './components/contexts/AuthContext';
import config from './config';
import './index.css';

let userTokenExpiration = 0;

const analytics = Analytics({
  app: 'genesis-ui',
  plugins: [],
});


firebase.initializeApp(config.firebase);

const provider = new firebase.auth.GoogleAuthProvider();
const firebaseAuth = firebase.auth();

function appWithAuth(idTokenResult: firebase.auth.IdTokenResult | null) {
  return (
    <AuthContextProvider value={{ idTokenResult }}>
      <AnalyticsProvider analytics={analytics}> 
        <App idTokenResult={idTokenResult} />
      </AnalyticsProvider>
    </AuthContextProvider>
  );
}

async function createRefreshTokenInterval(idTokenResult: firebase.auth.IdTokenResult | null) {
  if (idTokenResult != null) {
    const tokenExpirationTime = new Date(idTokenResult.expirationTime);
    const currentTime = new Date();
    const minuteThirtyBufferMs = 1.5 * 60 * 1000;
    // Five minute minimum refresh in case token date is in the past
    const fiveMinutesMs = 5 * 60 * 1000;
    // Refresh the firebase token 1.5 minutes before it expires.
    const timeDiff = tokenExpirationTime.getTime() - currentTime.getTime() - minuteThirtyBufferMs;
    userTokenExpiration = tokenExpirationTime.getTime();
    setInterval(() => {
      const currentUser = firebase.auth().currentUser;
      if (currentUser != null) {
        currentUser.getIdTokenResult(true).then((idToken: any) => {
          userTokenExpiration = new Date(idToken.expirationTime).getTime();
          renderApp(idToken);
        });
      }
    }, Math.max(timeDiff, fiveMinutesMs));
  }
}

function handleStateChange(user: firebase.User | null) {

  if (user === null){
    firebaseAuth.signInWithRedirect(provider);
  }
  else if (user !== null) {
    user.getIdTokenResult(true).then((idTokenResult: any) => {
      createRefreshTokenInterval(idTokenResult);
      renderApp(idTokenResult);
    });
  } else {
    renderApp(null);
  }
}

function handleVisibilityChange() {
  if (!document.hidden) {
    if (userTokenExpiration < new Date().getTime()) {
      renderApp(null);
    }
  }
}

function renderApp(idTokenResult: firebase.auth.IdTokenResult | null) {
  ReactDOM.render(appWithAuth(idTokenResult), document.getElementById('root'));
}

firebase.auth().onAuthStateChanged((user: any) => {
  handleStateChange(user);
});

document.addEventListener('visibilitychange', handleVisibilityChange, false);
