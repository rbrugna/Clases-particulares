import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyCLMTSYxCBXS5P9zARGOrwyffAzDj7XU4E",
  authDomain: "clases-particulares-1ba72.firebaseapp.com",
  projectId: "clases-particulares-1ba72",
  storageBucket: "clases-particulares-1ba72.firebasestorage.app",
  messagingSenderId: "1002503705019",
  appId: "1:1002503705019:web:756947d3ab65aa7517b49e",
  measurementId: "G-C8KN11E4X1"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const fx = getFunctions(app);