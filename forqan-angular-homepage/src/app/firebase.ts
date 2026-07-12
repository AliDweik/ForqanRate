import { getApp, getApps, initializeApp } from 'firebase/app';

export const ADMIN_EMAIL = 'admin@forqanratesystem.com';

export const firebaseConfig = {
  apiKey: 'AIzaSyCczWLvnkupy3lnx7QI6AltPXNqjGPreJI',
  authDomain: 'forqanratesystem.firebaseapp.com',
  projectId: 'forqanratesystem',
  storageBucket: 'forqanratesystem.firebasestorage.app',
  messagingSenderId: '993310510708',
  appId: '1:993310510708:web:237b69063ddf3312990b21',
  measurementId: 'G-L5S3ME66QM',
};

export function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}
