import firebase from 'firebase/app';
import 'firebase/firestore';
interface IConfig {
  // The base URL for this app
  hostUrl: string;

  // teh Firebase stuffs.
  firebase: {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
  };

  // Firestore settings
  firestoreSettings: firebase.firestore.Settings;

  // For reaching MightyDesk.
  mightyDeskHostname: string;

  amplitudeKey: string | undefined;
  // The hostname for the pharos QA grpc endpoint
  pharosHostname: string;
  // Hostname for search QA grpc endpoint
  searchHostName: string;
}

// An error will be thrown if any of these are undefined.
const requiredEnvVars = [
  'REACT_APP_HOST_URL',
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_DB_URL',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MSG_SENDER_ID',
];

const undefinedEnvVars: string[] = [];
requiredEnvVars.forEach((name) => {
  if (process.env[name] === undefined) {
    undefinedEnvVars.push(name);
  }
});
if (undefinedEnvVars.length) {
  throw new Error(`Missing required environment variables: ${undefinedEnvVars}`);
}

const config: IConfig = {
  hostUrl: process.env.REACT_APP_HOST_URL!,
  firebase: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY!,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN!,
    databaseURL: process.env.REACT_APP_FIREBASE_DB_URL!,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MSG_SENDER_ID!,
  },
  firestoreSettings: {},
  mightyDeskHostname: process.env.REACT_APP_MIGHTYDESK_HOSTNAME!,
  amplitudeKey: process.env.REACT_APP_AMPLITUDE_KEY,
  pharosHostname: process.env.REACT_APP_PHAROS_URL!,
  searchHostName: process.env.REACT_APP_ELASTICSEARCH_URL!,
};

export default config;
