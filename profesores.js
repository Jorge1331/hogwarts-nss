/* =========================================================
   HOGWARTS NSS: EL LEGADO DEL FÉNIX
   Acceso docente mediante Google y Firebase
   ========================================================= */

"use strict";


import {
  auth,
  googleProvider
} from "./firebase-config.js";


import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


const CORPORATE_DOMAIN = "@colegiosocorro.es";


document.addEventListener("DOMContentLoaded", () => {

  const googleSignInButton =
    document.getElementById("googleSignInButton");

  const loginMessage =
    document.getElementById("loginMessage");

  const guardianPortrait =
    document.getElementById("guardianPortrait");

  const guardianMessage =
    document.getElementById("guardianMessage");


  if (
    !googleSignInButton ||
    !loginMessage ||
    !guardianPortrait ||
    !guardianMessage
  ) {
    console.error(
      "No se han encontrado todos los elementos del acceso docente."
    );

    return;
  }


  let currentUser = null;
  let authenticationReady = false;


  /* ------------------------------
     MENSAJES DE LA GUARDIANA
  ------------------------------ */

  const speak = (
    message,
    state = "normal"
  ) => {

    guardianMessage.textContent = message;

    guardianPortrait.classList.remove(
      "is-speaking",
      "is-alert"
    );

    void guardianPortrait.offsetWidth;

    guardianPortrait.classList.add(
      "is-speaking"
    );

    if (state === "alert") {
      guardianPortrait.classList.add(
        "is-alert"
      );
    }

    window.setTimeout(() => {

      guardianPortrait.classList.remove(
        "is-speaking"
      );

    }, 1000);
  };


  /* ------------------------------
     MENSAJE DEL ACCESO
  ------------------------------ */

  const showLoginMessage = (
    message,
    type = "info"
  ) => {

    loginMessage.textContent = message;

    loginMessage.className =
      `login-message visible ${type}`;
  };


  const clearLoginMessage = () => {

    loginMessage.textContent = "";

    loginMessage.className =
      "login-message";
  };


  /* ------------------------------
     CONTENIDO DEL BOTÓN
  ------------------------------ */

  const renderButton = (
    icon,
    text
  ) => {

    const iconElement =
      document.createElement("span");

    iconElement.className =
      "google-sign-in-icon";

    iconElement.setAttribute(
      "aria-hidden",
      "true"
    );

    iconElement.textContent = icon;


    const textElement =
      document.createElement("span");

    textElement.textContent = text;


    googleSignInButton.replaceChildren(
      iconElement,
      textElement
    );
  };


  const setLoadingState = (
    isLoading
  ) => {

    googleSignInButton.disabled =
      isLoading;

    googleSignInButton.classList.toggle(
      "is-loading",
      isLoading
    );

    if (isLoading) {

      renderButton(
        "✦",
        "Comprobando identidad..."
      );
    }
  };


  const showSignedOutState = () => {

    currentUser = null;

    googleSignInButton.classList.remove(
      "is-signed-in"
    );

    renderButton(
      "G",
      "Continuar con Google"
    );

    googleSignInButton.disabled = false;
  };


  const showSignedInState = (
    user
  ) => {

    currentUser = user;

    googleSignInButton.classList.add(
      "is-signed-in"
    );

    const firstName =
      user.displayName
        ?.trim()
        .split(/\s+/)[0] ||
      "docente";

    renderButton(
      "✓",
      `Cerrar sesión de ${firstName}`
    );

    googleSignInButton.disabled = false;
  };


  /* ------------------------------
     COMPROBAR CUENTA CORPORATIVA
  ------------------------------ */

  const isCorporateAccount = (
    user
  ) => {

    const email =
      user?.email
        ?.trim()
        .toLowerCase() ||
      "";

    return email.endsWith(
      CORPORATE_DOMAIN
    );
  };


  /* ------------------------------
     OBSERVADOR DE SESIÓN
  ------------------------------ */

  onAuthStateChanged(
    auth,
    async (user) => {

      authenticationReady = true;


      if (!user) {

        showSignedOutState();

        return;
      }


      if (!isCorporateAccount(user)) {

        await signOut(auth);

        speak(
          "Esa cuenta no pertenece a los guardianes del Colegio del Socorro.",
          "alert"
        );

        showLoginMessage(
          "Debes utilizar una cuenta corporativa terminada en @colegiosocorro.es.",
          "error"
        );

        return;
      }


      showSignedInState(user);


      const firstName =
        user.displayName
          ?.trim()
          .split(/\s+/)[0] ||
        "guardián";


      speak(
        `Identidad reconocida. Bienvenido, ${firstName}. El Cáliz ha respondido correctamente.`
      );


      showLoginMessage(
        `Cuenta verificada: ${user.email}. La autenticación con Google funciona correctamente.`,
        "info"
      );
    }
  );


  /* ------------------------------
     BOTÓN DE ACCESO
  ------------------------------ */

  googleSignInButton.addEventListener(
    "click",
    async () => {

      clearLoginMessage();


      if (!authenticationReady) {

        speak(
          "Espera un instante. Las protecciones de la puerta todavía se están preparando."
        );

        showLoginMessage(
          "Firebase Authentication todavía se está inicializando.",
          "info"
        );

        return;
      }


      /*
       Si ya existe una sesión,
       el botón permite cerrarla.
      */

      if (currentUser) {

        setLoadingState(true);

        try {

          await signOut(auth);

          speak(
            "La sesión ha quedado cerrada. La puerta vuelve a estar protegida."
          );

          showLoginMessage(
            "Sesión cerrada correctamente.",
            "info"
          );

        } catch (error) {

          console.error(
            "Error al cerrar sesión:",
            error
          );

          speak(
            "No he podido cerrar la sesión correctamente.",
            "alert"
          );

          showLoginMessage(
            "Se ha producido un error al cerrar la sesión.",
            "error"
          );

        } finally {

          showSignedOutState();
        }

        return;
      }


      /*
       Inicio de sesión mediante
       la ventana oficial de Google.
      */

      setLoadingState(true);

      speak(
        "El Cáliz comprobará ahora tu identidad mediante Google."
      );


      try {

        const result =
          await signInWithPopup(
            auth,
            googleProvider
          );


        if (!isCorporateAccount(result.user)) {

          await signOut(auth);

          speak(
            "Esa cuenta no pertenece al dominio autorizado del colegio.",
            "alert"
          );

          showLoginMessage(
            "Selecciona tu cuenta corporativa @colegiosocorro.es.",
            "error"
          );

          return;
        }


        /*
         El observador onAuthStateChanged
         completará la interfaz.
        */


      } catch (error) {

        console.error(
          "Error de Firebase Authentication:",
          error
        );


        switch (error.code) {

          case "auth/popup-closed-by-user":

            speak(
              "Has cerrado la ventana antes de completar la identificación."
            );

            showLoginMessage(
              "Acceso cancelado. No se ha iniciado ninguna sesión.",
              "info"
            );

            break;


          case "auth/popup-blocked":

            speak(
              "El navegador ha bloqueado la ventana de identificación.",
              "alert"
            );

            showLoginMessage(
              "Permite las ventanas emergentes para esta página y vuelve a intentarlo.",
              "error"
            );

            break;


          case "auth/cancelled-popup-request":

            showLoginMessage(
              "Ya había otra ventana de acceso abierta.",
              "info"
            );

            break;


          case "auth/network-request-failed":

            speak(
              "No puedo comunicarme con Google en este momento.",
              "alert"
            );

            showLoginMessage(
              "Comprueba tu conexión a Internet y vuelve a intentarlo.",
              "error"
            );

            break;


          case "auth/unauthorized-domain":

            speak(
              "Esta puerta todavía no reconoce el dominio desde el que intentas entrar.",
              "alert"
            );

            showLoginMessage(
              "El dominio de GitHub Pages no está autorizado correctamente en Firebase.",
              "error"
            );

            break;


          case "auth/operation-not-allowed":

            speak(
              "El método de acceso con Google no está habilitado.",
              "alert"
            );

            showLoginMessage(
              "Google debe estar habilitado en Firebase Authentication.",
              "error"
            );

            break;


          default:

            speak(
              "No he podido completar la comprobación de identidad.",
              "alert"
            );

            showLoginMessage(
              "Se ha producido un error inesperado durante el acceso con Google.",
              "error"
            );
        }


      } finally {

        googleSignInButton.disabled = false;

        googleSignInButton.classList.remove(
          "is-loading"
        );


        if (!currentUser) {

          renderButton(
            "G",
            "Continuar con Google"
          );
        }
      }
    }
  );

});
