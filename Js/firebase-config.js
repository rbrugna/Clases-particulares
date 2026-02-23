// Shared Firebase configuration and initialized services
// Replace the placeholders below with your Firebase Web app config
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCLMTSYxCBXS5P9zARGOrwyffAzDj7XU4E",
  authDomain: "clases-particulares-1ba72.firebaseapp.com",
  projectId: "clases-particulares-1ba72",
  storageBucket: "clases-particulares-1ba72.firebasestorage.app",
  messagingSenderId: "1002503705019",
  appId: "1:1002503705019:web:756947d3ab65aa7517b49e",
  measurementId: "G-C8KN11E4X1"
};

export const PROFESSOR_EMAIL = 'cyfernan@gmail.com'; // replace with the professor's Firebase email

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
