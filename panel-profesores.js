/* =========================================================
   HOGWARTS NSS · PANEL PRIVADO DEL PROFESORADO
   Protección mediante Firebase Authentication y Firestore
   ========================================================= */

"use strict";


import {
  auth,
  db
} from "./firebase-config.js";


import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


import {
  doc,
  getDocFromServer
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const CORPORATE_DOMAIN =
  "@colegiosocorro.es";


const ALLOWED_ROLES =
  new Set([
    "admin",
    "coordinator",
    "tutor",
    "teacher"
  ]);


document.addEventListener(
  "DOMContentLoaded",
  () => {


    /* =====================================================
       ELEMENTOS PRINCIPALES
       ===================================================== */

    const panelLoading =
      document.getElementById(
        "panelLoading"
      );

    const panelDenied =
      document.getElementById(
        "panelDenied"
      );

    const panelDeniedMessage =
      document.getElementById(
        "panelDeniedMessage"
      );

    const privatePanelApp =
      document.getElementById(
        "privatePanelApp"
      );


    const panelUserInitial =
      document.getElementById(
        "panelUserInitial"
      );

    const panelUserName =
      document.getElementById(
        "panelUserName"
      );

    const panelUserJob =
      document.getElementById(
        "panelUserJob"
      );

    const panelUserRole =
      document.getElementById(
        "panelUserRole"
      );

    const panelWelcomeName =
      document.getElementById(
        "panelWelcomeName"
      );

    const panelWelcomeJob =
      document.getElementById(
        "panelWelcomeJob"
      );

    const panelLogoutButton =
      document.getElementById(
        "panelLogoutButton"
      );


    const navigationButtons =
      Array.from(
        document.querySelectorAll(
          "[data-panel-section]"
        )
      );

    const sectionButtons =
      Array.from(
        document.querySelectorAll(
          "[data-open-section]"
        )
      );

    const panelSections =
      Array.from(
        document.querySelectorAll(
          "[data-section-content]"
        )
      );

    const adminElements =
      Array.from(
        document.querySelectorAll(
          "[data-admin-only]"
        )
      );


    /* =====================================================
       COMPROBACIÓN DEL HTML
       ===================================================== */

    const requiredElements = [
      panelLoading,
      panelDenied,
      panelDeniedMessage,
      privatePanelApp,
      panelUserInitial,
      panelUserName,
      panelUserJob,
      panelUserRole,
      panelWelcomeName,
      panelWelcomeJob,
      panelLogoutButton
    ];


    if (
      requiredElements.some(
        element => !element
      )
    ) {

      console.error(
        "El panel privado no contiene todos los elementos necesarios."
      );

      return;
    }


    /* =====================================================
       ESTADO INTERNO
       ===================================================== */

    let currentTeacherProfile = null;

    let authorizationInProgress =
      false;

    let manualLogoutInProgress =
      false;

    let deniedMessageOverride =
      "";


    /* =====================================================
       FUNCIONES AUXILIARES
       ===================================================== */

    const normaliseEmail = (
      email
    ) => {

      return String(
        email || ""
      )
        .trim()
        .toLowerCase();
    };


    const cleanText = (
      value,
      fallback
    ) => {

      const text =
        String(value || "")
          .trim();

      return text || fallback;
    };


    const getFirstName = (
      fullName
    ) => {

      return cleanText(
        fullName,
        "Docente"
      )
        .split(/\s+/)[0];
    };


    const getRoleLabel = (
      role
    ) => {

      const roleLabels = {
        admin:
          "Administrador",

        coordinator:
          "Coordinación",

        tutor:
          "Tutoría",

        teacher:
          "Profesorado"
      };

      return (
        roleLabels[role] ||
        "Profesorado"
      );
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


    /* =====================================================
       PANTALLAS DE ESTADO
       ===================================================== */

    const showLoadingScreen = () => {

      panelLoading.hidden = false;
      panelDenied.hidden = true;
      privatePanelApp.hidden = true;
    };


    const showDeniedScreen = (
      message
    ) => {

      panelDeniedMessage.textContent =
        message;

      panelLoading.hidden = true;
      privatePanelApp.hidden = true;
      panelDenied.hidden = false;
    };


    const showPrivatePanel = () => {

      panelLoading.hidden = true;
      panelDenied.hidden = true;
      privatePanelApp.hidden = false;
    };


    /* =====================================================
       CONTROL DE ADMINISTRACIÓN
       ===================================================== */

    const configureAdminElements = (
      isAdmin
    ) => {

      adminElements.forEach(
        element => {

          /*
           Las secciones se controlan desde
           activateSection para evitar que la
           administración aparezca al iniciar.
          */

          if (
            element.hasAttribute(
              "data-section-content"
            )
          ) {

            element.hidden = true;

            return;
          }


          element.hidden =
            !isAdmin;
        }
      );
    };


    /* =====================================================
       NAVEGACIÓN INTERNA
       ===================================================== */

    const activateSection = (
      sectionName
    ) => {

      const requestedSection =
        String(
          sectionName || ""
        ).trim();


      if (
        requestedSection ===
          "configuracion" &&
        currentTeacherProfile?.role !==
          "admin"
      ) {

        return;
      }


      navigationButtons.forEach(
        button => {

          const isActive =
            button.dataset
              .panelSection ===
            requestedSection;

          button.classList.toggle(
            "active",
            isActive
          );

          if (isActive) {

            button.setAttribute(
              "aria-current",
              "page"
            );

          } else {

            button.removeAttribute(
              "aria-current"
            );
          }
        }
      );


      panelSections.forEach(
        section => {

          const isRequested =
            section.dataset
              .sectionContent ===
            requestedSection;

          const isAdminSection =
            section.hasAttribute(
              "data-admin-only"
            );

          const canOpen =
            !isAdminSection ||
            currentTeacherProfile?.role ===
              "admin";

          const mustDisplay =
            isRequested &&
            canOpen;


          section.hidden =
            !mustDisplay;

          section.classList.toggle(
            "active",
            mustDisplay
          );
        }
      );


      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    };


    /* =====================================================
       MOSTRAR PERFIL
       ===================================================== */

    const renderTeacherProfile = (
      profile
    ) => {

      const firstName =
        getFirstName(
          profile.displayName
        );

      const initial =
        firstName
          .charAt(0)
          .toUpperCase();

      const roleLabel =
        getRoleLabel(
          profile.role
        );


      panelUserInitial.textContent =
        initial || "P";

      panelUserName.textContent =
        profile.displayName;

      panelUserJob.textContent =
        profile.jobTitle;

      panelUserRole.textContent =
        roleLabel;

      panelWelcomeName.textContent =
        firstName;

      panelWelcomeJob.textContent =
        `${profile.jobTitle}. Acceso autorizado a Hogwarts NSS.`;


      document.title =
        `${firstName} | Panel del Profesorado`;


      configureAdminElements(
        profile.role === "admin"
      );


      activateSection(
        "resumen"
      );


      showPrivatePanel();
    };


    /* =====================================================
       CONSULTAR FIRESTORE
       ===================================================== */

    const getAuthorizedTeacherProfile =
      async (user) => {

        const teacherReference =
          doc(
            db,
            "authorizedTeachers",
            user.uid
          );


        /*
         La comprobación se realiza directamente
         contra el servidor de Firestore.
        */

        const teacherSnapshot =
          await getDocFromServer(
            teacherReference
          );


        if (
          !teacherSnapshot.exists()
        ) {

          const error =
            new Error(
              "No existe autorización docente."
            );

          error.code =
            "teacher/not-authorized";

          throw error;
        }


        const teacherData =
          teacherSnapshot.data();


        if (
          teacherData.active !== true
        ) {

          const error =
            new Error(
              "La autorización está desactivada."
            );

          error.code =
            "teacher/inactive";

          throw error;
        }


        if (
          normaliseEmail(
            teacherData.email
          ) !==
          normaliseEmail(
            user.email
          )
        ) {

          const error =
            new Error(
              "El correo autorizado no coincide."
            );

          error.code =
            "teacher/email-mismatch";

          throw error;
        }


        const role =
          cleanText(
            teacherData.role,
            ""
          ).toLowerCase();


        if (
          !ALLOWED_ROLES.has(
            role
          )
        ) {

          const error =
            new Error(
              "El rol docente no es válido."
            );

          error.code =
            "teacher/invalid-role";

          throw error;
        }


        return {

          displayName:
            cleanText(
              teacherData.displayName,
              user.displayName ||
                "Docente"
            ),

          email:
            normaliseEmail(
              teacherData.email
            ),

          jobTitle:
            cleanText(
              teacherData.jobTitle,
              "Profesorado"
            ),

          role,

          active: true
        };
      };


    /* =====================================================
       RECHAZAR ACCESO
       ===================================================== */

    const rejectAccess = async (
      message
    ) => {

      deniedMessageOverride =
        message;


      try {

        await signOut(auth);

      } catch (error) {

        console.error(
          "No se ha podido cerrar la sesión rechazada:",
          error
        );
      }


      showDeniedScreen(
        message
      );
    };


    /* =====================================================
       OBSERVADOR DE FIREBASE AUTHENTICATION
       ===================================================== */

    onAuthStateChanged(
      auth,
      async (user) => {

        if (
          manualLogoutInProgress
        ) {

          return;
        }


        if (!user) {

          const message =
            deniedMessageOverride ||
            "No existe ninguna sesión docente activa. Identifícate ante la Guardiana para acceder.";


          deniedMessageOverride = "";

          showDeniedScreen(
            message
          );

          return;
        }


        if (
          authorizationInProgress
        ) {

          return;
        }


        authorizationInProgress =
          true;

        showLoadingScreen();


        try {

          if (
            !isCorporateAccount(
              user
            )
          ) {

            await rejectAccess(
              "La cuenta utilizada no pertenece al dominio corporativo del Colegio del Socorro."
            );

            return;
          }


          const teacherProfile =
            await getAuthorizedTeacherProfile(
              user
            );


          currentTeacherProfile =
            teacherProfile;


          renderTeacherProfile(
            teacherProfile
          );


        } catch (error) {

          console.error(
            "Error durante la comprobación del panel privado:",
            error
          );


          currentTeacherProfile =
            null;


          if (
            error.code ===
              "firestore/unavailable" ||
            error.code ===
              "firestore/network-request-failed"
          ) {

            await rejectAccess(
              "No ha sido posible comprobar la autorización en Firestore. Revisa la conexión e inténtalo de nuevo."
            );

            return;
          }


          if (
            error.code ===
            "permission-denied"
          ) {

            await rejectAccess(
              "La cuenta está identificada, pero no dispone de una autorización docente activa."
            );

            return;
          }


          await rejectAccess(
            "No se ha podido confirmar una autorización válida para acceder al panel del profesorado."
          );


        } finally {

          authorizationInProgress =
            false;
        }
      }
    );


    /* =====================================================
       BOTONES DEL MENÚ
       ===================================================== */

    navigationButtons.forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            activateSection(
              button.dataset
                .panelSection
            );
          }
        );
      }
    );


    sectionButtons.forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            activateSection(
              button.dataset
                .openSection
            );
          }
        );
      }
    );


    /* =====================================================
       CERRAR SESIÓN
       ===================================================== */

    panelLogoutButton.addEventListener(
      "click",
      async () => {

        if (
          manualLogoutInProgress
        ) {

          return;
        }


        manualLogoutInProgress =
          true;

        panelLogoutButton.disabled =
          true;

        panelLogoutButton.textContent =
          "Cerrando sesión...";


        try {

          await signOut(auth);

          window.location.replace(
            "profesores.html"
          );


        } catch (error) {

          console.error(
            "No se ha podido cerrar la sesión:",
            error
          );


          manualLogoutInProgress =
            false;

          panelLogoutButton.disabled =
            false;

          panelLogoutButton.textContent =
            "No se ha podido cerrar la sesión";


          window.setTimeout(
            () => {

              panelLogoutButton.textContent =
                "Cerrar sesión";

            },
            2500
          );
        }
      }
    );


    /* =====================================================
       ESTADO INICIAL
       ===================================================== */

    showLoadingScreen();

  }
);
