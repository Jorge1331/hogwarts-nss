/* =========================================================
   HOGWARTS NSS — CONFIGURACIÓN DE FIREBASE
   ========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyDg6AJxnB07s40DtCrfMnW4mlTAEnqrLXM",
  authDomain: "hogwarts-nss-web.firebaseapp.com",
  projectId: "hogwarts-nss-web",
  storageBucket: "hogwarts-nss-web.firebasestorage.app",
  messagingSenderId: "95405255060",
  appId: "1:95405255060:web:481055dc52cbb0630cc781"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();


/*
Cada acceso mostrará el selector de cuentas,
aunque ya exista una sesión de Google abierta.
*/

googleProvider.setCustomParameters({
  prompt: "select_account"
});


export {
  app,
  auth,
  googleProvider
};
