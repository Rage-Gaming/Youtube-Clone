// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDW0uRKzDpMKjEywEaGPaobOJMaLkk6qwA",
  authDomain: "fir-c556c.firebaseapp.com",
  projectId: "fir-c556c",
  storageBucket: "fir-c556c.firebasestorage.app",
  messagingSenderId: "52197211390",
  appId: "1:52197211390:web:acc9249be32738940179af"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };