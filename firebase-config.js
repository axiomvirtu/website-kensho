import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyC8tjGInz6CDA-DpwVrvSozmPWxrDCqWw4",
    authDomain: "adm-spartan-sport-t1.firebaseapp.com",
    databaseURL: "https://adm-spartan-sport-t1-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "adm-spartan-sport-t1",
    storageBucket: "adm-spartan-sport-t1.firebasestorage.app",
    messagingSenderId: "325727581205",
    appId: "1:325727581205:web:47741916e85b1882154a1c",
    measurementId: "G-BHGRHDJVK6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);
