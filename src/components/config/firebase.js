 
// Import the functions from the SDKs
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";


// web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: "react-project-6fc5b",
  storageBucket: "gs://react-project-6fc5b.firebasestorage.app",
  messagingSenderId: "391830361876",
  appId: "1:391830361876:web:2af2c64790097e85301401",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

setPersistence(auth, browserLocalPersistence);

export { signInWithEmailAndPassword, db, auth, storage, ref, uploadBytesResumable, getDownloadURL };