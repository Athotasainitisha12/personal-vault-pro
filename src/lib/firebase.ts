import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCVahfSVnhfwYQcPnxnA3Zbs1HNByY-M6Y",
  authDomain: "personalmanger-7becb.firebaseapp.com",
  projectId: "personalmanger-7becb",
  storageBucket: "personalmanger-7becb.firebasestorage.app",
  messagingSenderId: "535014103258",
  appId: "1:535014103258:web:3a9a5ced2b76f20ebbede3",
  measurementId: "G-5WN6K0FWRR"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
