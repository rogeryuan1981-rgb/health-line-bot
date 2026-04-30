// admin-panel/src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 請把這段替換成您專屬的 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAap7LEyKHvJz6NMbZ9G0nj7kb_m8bbcoM",
  authDomain: "health-line-bot-22567.firebaseapp.com",
  projectId: "health-line-bot-22567",
  storageBucket: "health-line-bot-22567.firebasestorage.app",
  messagingSenderId: "109884626379",
  appId: "1:109884626379:web:01fbf499a3154aff2dd24e"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 匯出資料庫實例，讓其他檔案可以使用
export const db = getFirestore(app);
export const auth = getAuth(app); // 導出 auth
export const googleProvider = new GoogleAuthProvider(); // 導出 Google 供應商
