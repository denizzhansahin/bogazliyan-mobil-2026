import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  
};

// Uygulamayı başlat
const app = initializeApp(firebaseConfig);

// const auth = getAuth(app);
// const db = getFirestore(app);

export { app };