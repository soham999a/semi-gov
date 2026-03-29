import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDB4XCH_GeyH6JsYwhW_FnmR6SRcG6N1hk",
  authDomain: "semi-gov.firebaseapp.com",
  projectId: "semi-gov",
  storageBucket: "semi-gov.firebasestorage.app",
  messagingSenderId: "170294835576",
  appId: "1:170294835576:web:c51fee7df30682fd4ef08d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
