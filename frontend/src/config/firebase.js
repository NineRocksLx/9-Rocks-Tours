// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD80GYkjPKfIbVW747zb3s7jXSuVfBJTe4",
  authDomain: "tours-81516-acfbc.firebaseapp.com",
  projectId: "tours-81516-acfbc",
  storageBucket: "tours-81516-acfbc.firebasestorage.app",
  messagingSenderId: "742946187892",
  appId: "1:742946187892:web:2b0d2bcb974d4564327f21",
  measurementId: "G-36FC6SS4WD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);

// Helper function to upload images to Firebase Storage
export const uploadImageToStorage = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export default app;