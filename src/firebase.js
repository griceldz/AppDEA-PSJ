import { initializeApp } from "firebase/app";

import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCWnAvjq5-2EQAhTPjD56gpxA-zukT1qRk",
  authDomain: "dea-psj.firebaseapp.com",
  projectId: "dea-psj",
  storageBucket: "dea-psj.firebasestorage.app",
  messagingSenderId: "1049357852708",
  appId: "1:1049357852708:web:a3485e20f59468114c38b1",
  measurementId: "G-3XLHYFG2B4",
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
