/* =========================================================
   HOGWARTS NSS: EL LEGADO DEL FÉNIX
   Acceso docente autorizado mediante Google y Firestore
   ========================================================= */

"use strict";


import {
  auth,
  db,
  googleProvider
} from "./firebase-config.js";


import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const CORPORATE_DOMAIN = "@colegiosocorro.es";


document.addEventListener("DOMContentLoaded", () => {

  const googleSignInButton =
    document.getElementById("googleSignInButton");

  const loginMessage =
    document.getElementById("loginMessage");
   const teacherPanelButton =
  document.getElementById("teacherPanelButton");

  const guardianPortrait =
    document.getElementById("guardianPortrait");

  const guardianMessage =
    document.getElementById("guardianMessage");


if (
  !googleSignInButton ||
  !teacherPanelButton ||
  !loginMessage ||
  !guardianPortrait ||
  !guardianMessage
) {
  
    console.error(
      "No se han encontrado los elementos del acceso docente."
    );

    return;
  }


  let currentUser = null;
  let currentTeacherProfile = null;
  let authenticationReady = false;
  let authorizationInProgress = false;


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
     MENSAJES DEL ACCESO
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
    message = "Comprobando identidad..."
  ) => {

    googleSignInButton.disabled = true;
teacherPanelButton.hidden = true;
    googleSignInButton.classList.add(
      "is-loading"
    );

    renderButton(
      "✦",
      message
    );
  };


  const stopLoadingState = () => {

    googleSignInButton.disabled = false;

    googleSignInButton.classList.remove(
      "is-loading"
    );
  };


  const showSignedOutState = () => {
     

    currentUser = null;
    currentTeacherProfile = null;
     teacherPanelButton.hidden = true;

    googleSignInButton.classList.remove(
      "is-signed-in"
    );

    stopLoadingState();

    renderButton(
      "G",
      "Continuar con Google"
    );
  };


  const showAuthorizedState = (
    user,
    profile
  ) => {

    currentUser = user;
    currentTeacherProfile = profile;
     teacherPanelButton.hidden = false;

    googleSignInButton.classList.add(
      "is-signed-in"
    );

    stopLoadingState();

    const firstName =
      profile.displayName
        ?.trim()
        .split(/\s+/)[0] ||
      user.displayName
        ?.trim()
        .split(/\s+/)[0] ||
      "docente";

    renderButton(
      "✓",
      `Cerrar sesión de ${firstName}`
    );
  };


  /* ------------------------------
     COMPROBACIONES BÁSICAS
  ------------------------------ */

  const normaliseEmail = (
    email
  ) => {

    return String(email || "")
      .trim()
      .toLowerCase();
  };


  const isCorporateAccount = (
    user
  ) => {

    return normaliseEmail(
      user?.email
    ).endsWith(
      CORPORATE_DOMAIN
    );
  };


  const getRoleLabel = (
    role
  ) => {

    const roleLabels = {
      admin: "administrador",
      coordinator: "coordinador",
      tutor: "tutor",
      teacher: "docente"
    };

    return roleLabels[role] || "docente";
  };


  /* ------------------------------
     CONSULTAR AUTORIZACIÓN
  ------------------------------ */

  const getAuthorizedTeacherProfile =
    async (user) => {

      const teacherReference =
        doc(
          db,
          "authorizedTeachers",
          user.uid
        );

      const teacherSnapshot =
        await getDoc(
          teacherReference
        );


      if (!teacherSnapshot.exists()) {

        const error =
          new Error(
            "El docente no está autorizado."
          );

        error.code =
          "teacher/not-authorized";

        throw error;
      }


      const profile =
        teacherSnapshot.data();


      if (profile.active !== true) {

        const error =
          new Error(
            "La cuenta docente está desactivada."
          );

        error.code =
          "teacher/inactive";

        throw error;
      }


      if (
        normaliseEmail(profile.email) !==
        normaliseEmail(user.email)
      ) {

        const error =
          new Error(
            "El correo no coincide."
          );

        error.code =
          "teacher/email-mismatch";

        throw error;
      }


      if (
        typeof profile.role !== "string" ||
        !profile.role.trim()
      ) {

        const error =
          new Error(
            "El docente no tiene un rol válido."
          );

        error.code =
          "teacher/invalid-role";

        throw error;
      }


      return {
        displayName:
          profile.displayName || "Docente",

        email:
          profile.email,

        jobTitle:
          profile.jobTitle || "Profesorado",

        role:
          profile.role,

        active:
          profile.active
      };
    };


  /* ------------------------------
     DENEGAR Y CERRAR SESIÓN
  ------------------------------ */

  const rejectAccess = async (
    guardianText,
    interfaceText
  ) => {

    try {

      await signOut(auth);

    } catch (error) {

      console.error(
        "Error al cerrar una sesión no autorizada:",
        error
      );
    }


    showSignedOutState();

    speak(
      guardianText,
      "alert"
    );

    showLoginMessage(
      interfaceText,
      "error"
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


      if (authorizationInProgress) {

        return;
      }


      authorizationInProgress = true;

      setLoadingState(
        "Consultando el Cáliz..."
      );


      try {

        if (!isCorporateAccount(user)) {

          await rejectAccess(
            "Esa cuenta no pertenece a los guardianes del Colegio del Socorro.",
            "Debes utilizar una cuenta corporativa terminada en @colegiosocorro.es."
          );

          return;
        }


        const teacherProfile =
          await getAuthorizedTeacherProfile(
            user
          );


        showAuthorizedState(
          user,
          teacherProfile
        );


        const firstName =
          teacherProfile.displayName
            .trim()
            .split(/\s+/)[0];

        const roleLabel =
          getRoleLabel(
            teacherProfile.role
          );


        speak(
          `Acceso autorizado. Bienvenido, ${firstName}. El Cáliz te reconoce como ${teacherProfile.jobTitle}.`
        );


        showLoginMessage(
          `Autorización confirmada: ${teacherProfile.jobTitle} · ${roleLabel}.`,
          "info"
        );


      } catch (error) {

        console.error(
          "Error al comprobar la autorización:",
          error
        );


        if (
          error.code ===
          "firestore/unavailable"
        ) {

          try {

            await signOut(auth);

          } catch (signOutError) {

            console.error(
              "Error al cerrar sesión:",
              signOutError
            );
          }

          showSignedOutState();

          speak(
            "No puedo consultar ahora mismo el registro de guardianes.",
            "alert"
          );

          showLoginMessage(
            "No se ha podido conectar con Firestore. Comprueba la conexión y vuelve a intentarlo.",
            "error"
          );

          return;
        }


        await rejectAccess(
          "Tu identidad de Google es válida, pero no figuras entre los guardianes autorizados.",
          "Esta cuenta no dispone de autorización activa para acceder a la Sala de Profesores."
        );


      } finally {

        authorizationInProgress = false;
      }
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
          "Espera un instante. Las protecciones todavía se están preparando."
        );

        showLoginMessage(
          "Firebase Authentication todavía se está inicializando.",
          "info"
        );

        return;
      }


      if (authorizationInProgress) {

        speak(
          "El Cáliz todavía está comprobando tu autorización."
        );

        return;
      }


      /*
       Cerrar la sesión autorizada.
      */

      if (currentUser) {

        setLoadingState(
          "Cerrando sesión..."
        );


        try {

          await signOut(auth);

          showSignedOutState();

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

          showAuthorizedState(
            currentUser,
            currentTeacherProfile
          );

          speak(
            "No he podido cerrar la sesión correctamente.",
            "alert"
          );

          showLoginMessage(
            "Se ha producido un error al cerrar la sesión.",
            "error"
          );
        }

        return;
      }


      /*
       Abrir la ventana oficial de Google.
      */

      setLoadingState(
        "Comprobando identidad..."
      );

      speak(
        "El Cáliz comprobará tu identidad mediante Google."
      );


      try {

        await signInWithPopup(
          auth,
          googleProvider
        );

        /*
         onAuthStateChanged comprobará después
         el documento privado del docente.
        */


      } catch (error) {

        console.error(
          "Error de Firebase Authentication:",
          error
        );

        showSignedOutState();


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
              "Permite las ventanas emergentes y vuelve a intentarlo.",
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
              "Esta puerta no reconoce el dominio desde el que intentas entrar.",
              "alert"
            );

            showLoginMessage(
              "El dominio de GitHub Pages no está autorizado en Firebase.",
              "error"
            );

            break;


          default:

            speak(
              "No he podido completar la comprobación de identidad.",
              "alert"
            );

            showLoginMessage(
              "Se ha producido un error inesperado durante el acceso.",
              "error"
            );
        }
      }
    }
  );

});
