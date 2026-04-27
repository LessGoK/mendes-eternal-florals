// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAzZXxS6Ztb0lXI6crsGjKjM3vCOLV0UQo",
  authDomain: "mendes-florals.firebaseapp.com",
  projectId: "mendes-florals",
  storageBucket: "mendes-florals.appspot.com",
  messagingSenderId: "717425813564",
  appId: "1:717425813564:web:d41721c84cb4ba5f89bb39",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth + Database
export const auth = getAuth(app);
export const db = getFirestore(app);

// expose for testing in console
window.auth = auth;
window.db = db;
