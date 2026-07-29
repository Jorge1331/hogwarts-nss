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
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  orderBy,
  query,
  runTransaction,
  serverTimestamp
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
         const housesLoading =
      document.getElementById(
        "housesLoading"
      );

    const housesError =
      document.getElementById(
        "housesError"
      );

    const housesGrid =
      document.getElementById(
        "housesGrid"
      );
    const houseMovementForm =
      document.getElementById(
        "houseMovementForm"
      );

    const movementHouse =
      document.getElementById(
        "movementHouse"
      );

    const movementAmount =
      document.getElementById(
        "movementAmount"
      );

    const movementCategory =
      document.getElementById(
        "movementCategory"
      );

    const movementReason =
      document.getElementById(
        "movementReason"
      );

    const movementMessage =
      document.getElementById(
        "movementMessage"
      );

    const movementSubmitButton =
      document.getElementById(
        "movementSubmitButton"
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
      panelLogoutButton,
      housesLoading,
      housesError,
      housesGrid,
      houseMovementForm,
      movementHouse,
      movementAmount,
      movementCategory,
      movementReason,
      movementMessage,
      movementSubmitButton
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
    let currentHouses = [];

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
       CASAS DE FIRESTORE
       ===================================================== */

    const createHouseCard = (
      house
    ) => {

      const card =
        document.createElement(
          "article"
        );

      card.className =
        "house-data-card";

      card.dataset.houseId =
        house.id;

      card.style.setProperty(
        "--house-primary",
        house.primaryColor
      );

      card.style.setProperty(
        "--house-accent",
        house.accentColor
      );


      const position =
        document.createElement(
          "span"
        );

      position.className =
        "house-position";

      position.textContent =
        String(
          house.displayOrder
        );


      const mascot =
        document.createElement(
          "p"
        );

      mascot.className =
        "house-mascot";

      mascot.textContent =
        house.mascot;


      const name =
        document.createElement(
          "h3"
        );

      name.textContent =
        house.name;


      const pointsLabel =
        document.createElement(
          "span"
        );

      pointsLabel.className =
        "house-points-label";

      pointsLabel.textContent =
        "Puntuación actual";


      const points =
        document.createElement(
          "strong"
        );

      points.className =
        "house-points-value";

      points.textContent =
        `${house.totalPoints} puntos`;


      const status =
        document.createElement(
          "small"
        );

      status.className =
        "house-status";

      status.textContent =
        house.active
          ? "Casa activa"
          : "Casa desactivada";


      card.append(
        position,
        mascot,
        name,
        pointsLabel,
        points,
        status
      );

      return card;
    };
        const populateHouseSelector = (
      houses
    ) => {

      const placeholder =
        document.createElement(
          "option"
        );

      placeholder.value = "";
      placeholder.textContent =
        "Selecciona una casa";


      const options =
        houses
          .filter(
            house =>
              house.active === true
          )
          .map(
            house => {

              const option =
                document.createElement(
                  "option"
                );

              option.value =
                house.id;

              option.textContent =
                house.name;

              return option;
            }
          );


      movementHouse.replaceChildren(
        placeholder,
        ...options
      );

      movementHouse.disabled =
        options.length === 0;
    };


    /* =====================================================
       PUNTUACIÓN AUTOMÁTICA POR CATEGORÍA
       ===================================================== */

    const updateMovementAmount = () => {

      const selectedOption =
        movementCategory.options[
          movementCategory.selectedIndex
        ];

      const configuredPoints =
        selectedOption?.dataset.points ||
        "";


      movementMessage.textContent = "";

      movementMessage.classList.remove(
        "success",
        "error"
      );


      if (
        configuredPoints === "free"
      ) {

        movementAmount.readOnly =
          false;

        movementAmount.value =
          "";

        movementAmount.placeholder =
          "Escribe entre -100 y +100";

        movementAmount.focus();

        return;
      }


      movementAmount.readOnly =
        true;


      if (
        configuredPoints !== ""
      ) {

        movementAmount.value =
          configuredPoints;

        movementAmount.placeholder =
          "Puntuación automática";

        return;
      }


      movementAmount.value =
        "";

      movementAmount.placeholder =
        "Selecciona una categoría";
    };


    movementCategory.addEventListener(
      "change",
      updateMovementAmount
    );

    const loadHouses =
      async () => {

        housesLoading.hidden =
          false;

        housesError.hidden =
          true;

        housesGrid.replaceChildren();


        try {

          const housesQuery =
            query(
              collection(
                db,
                "houses"
              ),
              orderBy(
                "displayOrder",
                "asc"
              )
            );


          const housesSnapshot =
            await getDocsFromServer(
              housesQuery
            );


          const houses =
            housesSnapshot.docs.map(
              houseDocument => {

                const data =
                  houseDocument.data();

                return {
                  id:
                    houseDocument.id,

                  name:
                    cleanText(
                      data.name,
                      houseDocument.id
                    ),

                  mascot:
                    cleanText(
                      data.mascot,
                      "Casa de Hogwarts"
                    ),

                  primaryColor:
                    cleanText(
                      data.primaryColor,
                      "#17223a"
                    ),

                  accentColor:
                    cleanText(
                      data.accentColor,
                      "#efc873"
                    ),

                  totalPoints:
                    Number.isFinite(
                      data.totalPoints
                    )
                      ? data.totalPoints
                      : 0,

                  displayOrder:
                    Number.isFinite(
                      data.displayOrder
                    )
                      ? data.displayOrder
                      : 99,

                  active:
                    data.active === true
                };
              }
            );


          if (
            houses.length === 0
          ) {

            throw new Error(
              "No existen casas configuradas."
            );
          }
          currentHouses =
            houses;

          populateHouseSelector(
            currentHouses
          );

          const cards =
            houses.map(
              createHouseCard
            );


          housesGrid.append(
            ...cards
          );

          housesLoading.hidden =
            true;

        } catch (error) {

          console.error(
            "No se han podido cargar las casas:",
            error
          );

          housesLoading.hidden =
            true;

          housesError.hidden =
            false;
        }
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

      loadHouses();
    };
    /* =====================================================
       REGISTRAR MOVIMIENTO DE PUNTOS
       ===================================================== */

    const setMovementMessage = (
      message,
      type = ""
    ) => {

      movementMessage.textContent =
        message;

      movementMessage.classList.remove(
        "success",
        "error"
      );

      if (type) {
        movementMessage.classList.add(
          type
        );
      }
    };


    const formatSignedPoints = (
      amount
    ) => {

      return amount > 0
        ? `+${amount}`
        : String(amount);
    };


    const submitHouseMovement =
      async (event) => {

        event.preventDefault();


        if (
          movementSubmitButton.disabled
        ) {
          return;
        }


        const user =
          auth.currentUser;

        const houseId =
          movementHouse.value.trim();

        const category =
          movementCategory.value.trim();

        const amount =
          Number(
            movementAmount.value
          );

        const optionalComment =
          movementReason.value.trim();

               const selectedHouse =
          currentHouses.find(
            house =>
              house.id === houseId
          );


        if (
          !user ||
          !currentTeacherProfile
        ) {

          setMovementMessage(
            "La sesión docente ya no está disponible.",
            "error"
          );

          return;
        }


               if (!houseId) {

          setMovementMessage(
            "Selecciona una casa.",
            "error"
          );

          return;
        }


        if (!category) {

          setMovementMessage(
            "Selecciona una categoría.",
            "error"
          );

          return;
        }


        if (
          !Number.isInteger(amount) ||
          amount === 0 ||
          amount < -100 ||
          amount > 100
        ) {

          setMovementMessage(
            "La puntuación debe ser un número entero entre -100 y 100, distinto de cero.",
            "error"
          );

          return;
        }


        /*
         Si no se escribe comentario,
         se utiliza la categoría como motivo.
        */

        const reason =
          optionalComment ||
          category;


        movementSubmitButton.disabled =
          true;

        movementSubmitButton.textContent =
          "Registrando...";

        movementHouse.disabled =
          true;

        movementCategory.disabled =
          true;

        movementAmount.disabled =
          true;

        movementReason.disabled =
          true;


        setMovementMessage(
          "Guardando el movimiento en Firestore..."
        );


        try {

          const houseReference =
            doc(
              db,
              "houses",
              houseId
            );

          const movementReference =
            doc(
              collection(
                db,
                "houseMovements"
              )
            );


          const result =
            await runTransaction(
              db,
              async transaction => {

                /*
                 Todas las lecturas deben realizarse
                 antes de empezar las escrituras.
                */

                const houseSnapshot =
                  await transaction.get(
                    houseReference
                  );


                if (
                  !houseSnapshot.exists()
                ) {

                  throw new Error(
                    "La casa seleccionada ya no existe."
                  );
                }


                const houseData =
                  houseSnapshot.data();


                if (
                  houseData.active !== true
                ) {

                  throw new Error(
                    "La casa seleccionada está desactivada."
                  );
                }


                const previousTotal =
                  Number.isInteger(
                    houseData.totalPoints
                  )
                    ? houseData.totalPoints
                    : 0;

                const newTotal =
                  previousTotal +
                  amount;


                if (
                  !Number.isSafeInteger(
                    newTotal
                  )
                ) {

                  throw new Error(
                    "El nuevo total de puntos no es válido."
                  );
                }


                transaction.update(
                  houseReference,
                  {
                    totalPoints:
                      newTotal,

                    updatedAt:
                      serverTimestamp(),

                    updatedBy:
                      user.uid,

                    lastMovementId:
                      movementReference.id
                  }
                );


                transaction.set(
                  movementReference,
                  {
                    houseId,

                    amount,

                    reason,

                    category,

                    createdBy:
                      user.uid,

                    createdByName:
                      currentTeacherProfile
                        .displayName,

                    teacherRole:
                      currentTeacherProfile
                        .role,

                    createdAt:
                      serverTimestamp(),

                    previousTotal,

                    newTotal,

                    corrected:
                      false
                  }
                );


                return {
                  previousTotal,
                  newTotal
                };
              }
            );


          houseMovementForm.reset();

          movementAmount.readOnly =
            true;

          updateMovementAmount();


          setMovementMessage(
            `${selectedHouse.name}: ${formatSignedPoints(amount)} puntos registrados. Nuevo total: ${result.newTotal}.`,
            "success"
          );


          await loadHouses();

        } catch (error) {

          console.error(
            "No se ha podido registrar el movimiento:",
            error
          );


          const message =
            error.code ===
              "permission-denied"
              ? "Firestore ha rechazado la operación. Revisa los permisos y las reglas de seguridad."
              : error.message ||
                "No se ha podido registrar el movimiento.";


          setMovementMessage(
            message,
            "error"
          );

        } finally {

          const hasActiveHouses =
            currentHouses.some(
              house =>
                house.active === true
            );


          movementHouse.disabled =
            !hasActiveHouses;

          movementCategory.disabled =
            false;

          movementAmount.disabled =
            false;

          movementReason.disabled =
            false;

          movementSubmitButton.disabled =
            false;

          movementSubmitButton.textContent =
            "Registrar movimiento";
        }
      };


    houseMovementForm.addEventListener(
      "submit",
      submitHouseMovement
    );

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
