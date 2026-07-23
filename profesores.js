/* =========================================================
   HOGWARTS NSS: EL LEGADO DEL FÉNIX
   Interacción de la Guardiana del Cáliz
   ========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

  const loginForm =
    document.getElementById("teacherLoginForm");

  const emailInput =
    document.getElementById("teacherEmail");

  const passwordInput =
    document.getElementById("teacherPassword");

  const togglePasswordButton =
    document.getElementById("togglePasswordButton");

  const loginMessage =
    document.getElementById("loginMessage");

  const guardianPortrait =
    document.getElementById("guardianPortrait");

  const guardianMessage =
    document.getElementById("guardianMessage");


  /* Comprobación preventiva */

  const requiredElements = [
    loginForm,
    emailInput,
    passwordInput,
    togglePasswordButton,
    loginMessage,
    guardianPortrait,
    guardianMessage
  ];

  if (requiredElements.some((element) => !element)) {
    return;
  }


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

    /*
     Reinicia la animación cada vez
     que cambia el mensaje.
    */

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
     MENSAJE DEL FORMULARIO
  ------------------------------ */

  const showLoginMessage = (
    message,
    type
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
     MOSTRAR U OCULTAR CONTRASEÑA
  ------------------------------ */

  togglePasswordButton.addEventListener(
    "click",
    () => {

      const passwordIsHidden =
        passwordInput.type === "password";

      passwordInput.type =
        passwordIsHidden
          ? "text"
          : "password";

      togglePasswordButton.textContent =
        passwordIsHidden
          ? "🙈"
          : "👁️";

      togglePasswordButton.setAttribute(
        "aria-label",
        passwordIsHidden
          ? "Ocultar contraseña"
          : "Mostrar contraseña"
      );

      speak(
        passwordIsHidden
          ? "La contraseña ha quedado visible. Asegúrate de que nadie esté mirando."
          : "El secreto vuelve a estar protegido."
      );

      passwordInput.focus();
    }
  );


  /* ------------------------------
     REACCIONES AL FORMULARIO
  ------------------------------ */

  emailInput.addEventListener(
    "focus",
    () => {

      speak(
        "Preséntate, guardián. Necesito reconocer tu identidad."
      );
    }
  );


  passwordInput.addEventListener(
    "focus",
    () => {

      speak(
        "La contraseña debe permanecer únicamente en manos de su propietario."
      );
    }
  );


  emailInput.addEventListener(
    "input",
    clearLoginMessage
  );


  passwordInput.addEventListener(
    "input",
    clearLoginMessage
  );


  /* ------------------------------
     VALIDACIÓN TEMPORAL
  ------------------------------ */

  loginForm.addEventListener(
    "submit",
    (event) => {

      event.preventDefault();

      clearLoginMessage();

      const email =
        emailInput.value.trim();

      const password =
        passwordInput.value;


      if (!email && !password) {

        speak(
          "No puedo abrir la puerta sin conocer tu identidad y tu clave.",
          "alert"
        );

        showLoginMessage(
          "Introduce el correo institucional y la contraseña.",
          "error"
        );

        emailInput.focus();

        return;
      }


      if (!email) {

        speak(
          "Todavía no te has presentado. Necesito conocer tu correo institucional.",
          "alert"
        );

        showLoginMessage(
          "Introduce tu correo institucional.",
          "error"
        );

        emailInput.focus();

        return;
      }


      if (!emailInput.validity.valid) {

        speak(
          "Ese correo no parece pertenecer a ningún guardián reconocido.",
          "alert"
        );

        showLoginMessage(
          "El formato del correo electrónico no es válido.",
          "error"
        );

        emailInput.focus();

        return;
      }


      if (!password) {

        speak(
          "Falta la clave que protege la entrada.",
          "alert"
        );

        showLoginMessage(
          "Introduce tu contraseña.",
          "error"
        );

        passwordInput.focus();

        return;
      }


      /*
       Firebase todavía no está conectado.
       No se almacena ni se envía ningún dato.
      */

      speak(
        "Has completado la identificación, pero el encantamiento protector todavía no ha sido activado."
      );

      showLoginMessage(
        "Acceso bloqueado temporalmente. Firebase Authentication se activará antes de utilizar cuentas reales.",
        "info"
      );

      /*
       La contraseña se elimina del campo
       después de la prueba.
      */

      passwordInput.value = "";
      passwordInput.type = "password";

      togglePasswordButton.textContent =
        "👁️";

      togglePasswordButton.setAttribute(
        "aria-label",
        "Mostrar contraseña"
      );
    }
  );

});
