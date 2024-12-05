import firebase from 'firebase/app';
import 'firebase/auth';
/**
 * Provides user authentication state through the React context API
 */
import React from 'react';

class AuthContext {
  // The Firebase response from a given ID token
  public idTokenResult: firebase.auth.IdTokenResult | null = null;
}

const { Consumer, Provider } = React.createContext(new AuthContext());

const AuthContextConsumer = Consumer;
const AuthContextProvider = Provider;

export default AuthContext;
export { AuthContext, AuthContextConsumer, AuthContextProvider };
