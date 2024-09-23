// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref as databaseRef, onValue, set, off } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';


const firebaseConfig = {
  apiKey: "AIzaSyATsXP2VS6EjEkLnahy4OWFnMwlFfgA1Rw",
  authDomain: "amadice-7e4fe.firebaseapp.com",
  projectId: "amadice-7e4fe",
  storageBucket: "amadice-7e4fe.appspot.com",
  messagingSenderId: "836539421098",
  appId: "1:836539421098:web:154b506a813fc12d669bd3",
  measurementId: "G-HE5WSSGH36"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const database = getDatabase(app);
export const  storage = getStorage(app);
