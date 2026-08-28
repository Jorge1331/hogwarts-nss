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
  getActiveCalizBonus,
  getCalizMonthlyCard,
  getNextCalizBonus
} from "./caliz-schedule.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where
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


const CLASS_IDS = [
  "5A",
  "5B",
  "6A",
  "6B"
];


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
     const teacherCalizMultiplier =
  document.getElementById(
    "teacherCalizMultiplier"
  );

const teacherCalizState =
  document.getElementById(
    "teacherCalizState"
  );

const teacherCalizTitle =
  document.getElementById(
    "teacherCalizTitle"
  );

const teacherCalizDates =
  document.getElementById(
    "teacherCalizDates"
  );

const teacherCalizMonth =
  document.getElementById(
    "teacherCalizMonth"
  );

const teacherCalizWeeks =
  document.getElementById(
    "teacherCalizWeeks"
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
         const movementHistoryCount =
      document.getElementById(
        "movementHistoryCount"
      );

    const movementHistoryLoading =
      document.getElementById(
        "movementHistoryLoading"
      );

    const movementHistoryError =
      document.getElementById(
        "movementHistoryError"
      );

    const movementHistoryEmpty =
      document.getElementById(
        "movementHistoryEmpty"
      );

    const movementHistoryList =
      document.getElementById(
        "movementHistoryList"
      );
    const movementHistoryHouseFilter =
      document.getElementById(
        "movementHistoryHouseFilter"
      );

    const movementHistoryTypeFilter =
      document.getElementById(
        "movementHistoryTypeFilter"
      );

        const movementHistoryClearFilters =
      document.getElementById(
        "movementHistoryClearFilters"
      );

        const studentClassTabs =
      document.getElementById(
        "studentClassTabs"
      );

        const studentRoster =
      document.getElementById(
        "studentRoster"
      );

       const studentMeritWorkspace =
      document.getElementById(
        "studentMeritWorkspace"
      );

    const studentProfileStatus =
      document.getElementById(
        "studentProfileStatus"
      );

    const studentProfileContent =
      document.getElementById(
        "studentProfileContent"
      );

    const navigationButtons =

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
      teacherCalizMultiplier,
      teacherCalizState,
      teacherCalizTitle,
      teacherCalizDates,
      teacherCalizMonth,
      teacherCalizWeeks,
      houseMovementForm,
      movementHouse,
      movementAmount,
      movementCategory,
      movementReason,
      movementMessage,
      movementSubmitButton,
      movementHistoryCount,
      movementHistoryLoading,
      movementHistoryError,
      movementHistoryEmpty,
      movementHistoryList,
      movementHistoryHouseFilter,
      movementHistoryTypeFilter,
      movementHistoryClearFilters,
      studentClassTabs,
      studentRoster,
      studentMeritWorkspace,
      studentProfileStatus,
      studentProfileContent
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

        let selectedStudentClassId =
      null;

        let unsubscribeStudentRoster =
      null;

       let currentStudentRoster = [];

    let selectedStudentId =
      null;

    let currentStudentProfileMovements =
      [];

    let unsubscribeStudentProfileMovements =
      null;

    let authorizationInProgress =
      false;

    let manualLogoutInProgress =
      false;

    let deniedMessageOverride =
      "";
    let currentHouses = [];
         let currentMovements = [];
         let unsubscribeMovementHistory =
      null;
    let unsubscribeHouses =
      null;
         let previousHouseRanks =
      new Map();

    let previousHousePoints =
      new Map();

    let houseRankChanges =
      new Map();
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
         "Tutoría",

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


    const renderStudentClassTabs = (
      profile
    ) => {

      const assignedClasses =
        CLASS_IDS.filter(
          classId =>
            Array.isArray(
              profile?.assignedClasses
            ) &&
            profile.assignedClasses.includes(
              classId
            )
        );


      if (
        assignedClasses.length === 0
      ) {

        selectedStudentClassId =
          null;


        const emptyMessage =
          document.createElement(
            "span"
          );

        emptyMessage.className =
          "student-class-loading";

        emptyMessage.textContent =
          "Sin grupos asignados";


        studentClassTabs.replaceChildren(
          emptyMessage
        );

        return;
      }


      if (
        !assignedClasses.includes(
          selectedStudentClassId
        )
      ) {

        selectedStudentClassId =
          assignedClasses[0];
      }


      const buttons =
        assignedClasses.map(
          classId => {

            const button =
              document.createElement(
                "button"
              );

            button.type =
              "button";

            button.className =
              "student-class-tab";

            button.dataset.studentClass =
              classId;


            const isActive =
              classId ===
              selectedStudentClassId;


            if (
              isActive
            ) {

              button.classList.add(
                "is-active"
              );
            }


            button.setAttribute(
              "aria-pressed",
              isActive
                ? "true"
                : "false"
            );


            button.textContent =
              `${classId.charAt(0)}.º ${classId.charAt(1)}`;


            button.addEventListener(
              "click",
              () => {

                selectedStudentClassId =
                  classId;

                               renderStudentClassTabs(
                  profile
                );

                startStudentRosterListener();
              }
            );


            return button;
          }
        );


           studentClassTabs.replaceChildren(
        ...buttons
      );
    };


    const showStudentRosterState = (
      title,
      message
    ) => {

      const state =
        document.createElement(
          "div"
        );

      state.className =
        "student-panel-empty";


      const heading =
        document.createElement(
          "strong"
        );

      heading.textContent =
        title;


      const detail =
        document.createElement(
          "p"
        );

      detail.textContent =
        message;


      state.append(
        heading,
        detail
      );


            studentRoster.replaceChildren(
        state
      );
    };


    const showStudentMeritState = (
      title,
      message
    ) => {

      const state =
        document.createElement(
          "div"
        );

      state.className =
        "student-panel-empty";


      const heading =
        document.createElement(
          "strong"
        );

      heading.textContent =
        title;


      const detail =
        document.createElement(
          "p"
        );

      detail.textContent =
        message;


      state.append(
        heading,
        detail
      );


            studentMeritWorkspace.replaceChildren(
        state
      );
    };


    const createStudentProfileElement =
      (
        tagName,
        className,
        text
      ) => {

        const element =
          document.createElement(
            tagName
          );

        if (className) {

          element.className =
            className;
        }

        if (
          text !== undefined &&
          text !== null
        ) {

          element.textContent =
            text;
        }

        return element;
      };


    const formatStudentProfileAmount =
      amount => {

        if (amount > 0) {

          return `+${amount}`;
        }

        if (amount < 0) {

          return `−${Math.abs(
            amount
          )}`;
        }

        return "0";
      };


    const formatStudentProfileDate =
      timestamp => {

        if (
          !timestamp ||
          typeof timestamp.toDate !==
            "function"
        ) {

          return "Fecha pendiente";
        }

        const date =
          timestamp.toDate();

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {

          return "Fecha pendiente";
        }

        return new Intl.DateTimeFormat(
          "es-ES",
          {
            day:
              "numeric",

            month:
              "short"
          }
        )
          .format(date)
          .replace(".", "");
      };


    const getStudentProfileTimestamp =
      movement => {

        if (
          movement.createdAt &&
          typeof movement.createdAt.toMillis ===
            "function"
        ) {

          return movement.createdAt.toMillis();
        }

        return 0;
      };


    const showStudentProfileState =
      (
        title,
        message
      ) => {

        studentProfileStatus.textContent =
          title;

        const state =
          createStudentProfileElement(
            "div",
            "student-panel-empty"
          );

        const heading =
          createStudentProfileElement(
            "strong",
            "",
            title
          );

        const detail =
          createStudentProfileElement(
            "p",
            "",
            message
          );

        state.append(
          heading,
          detail
        );

        studentProfileContent.replaceChildren(
          state
        );
      };


    const stopStudentProfileListener =
      () => {

        if (
          typeof unsubscribeStudentProfileMovements ===
            "function"
        ) {

          unsubscribeStudentProfileMovements();
        }

        unsubscribeStudentProfileMovements =
          null;

        currentStudentProfileMovements =
          [];
      };


    const renderStudentProfile =
      () => {

        const selectedStudent =
          currentStudentRoster.find(
            student =>
              student.id ===
              selectedStudentId
          );

        if (!selectedStudent) {

          stopStudentProfileListener();

          showStudentProfileState(
            "Sin alumno seleccionado",
            "Selecciona un alumno para consultar su evolución y sus últimos méritos."
          );

          return;
        }

        const houseLabels = {
          gryffindor:
            "Gryffindor",

          hufflepuff:
            "Hufflepuff",

          ravenclaw:
            "Ravenclaw",

          slytherin:
            "Slytherin"
        };

        const personalPoints =
          Number.isInteger(
            selectedStudent.personalPoints
          )
            ? selectedStudent.personalPoints
            : 0;

        const positionIndex =
          currentStudentRoster.findIndex(
            student =>
              student.id ===
              selectedStudent.id
          );

        const position =
          positionIndex >= 0
            ? positionIndex + 1
            : null;

        const movements =
          currentStudentProfileMovements
            .filter(
              movement =>
                movement.studentId ===
                  selectedStudent.id &&
                movement.classId ===
                  selectedStudent.classId &&
                movement.schoolYear ===
                  "2026-2027" &&
                movement.type ===
                  "student-merit"
            )
            .slice()
            .sort(
              (
                movementA,
                movementB
              ) =>
                getStudentProfileTimestamp(
                  movementB
                ) -
                getStudentProfileTimestamp(
                  movementA
                )
            );

        const houseContribution =
          movements.reduce(
            (
              total,
              movement
            ) =>
              total +
              (
                Number.isInteger(
                  movement.houseAmount
                )
                  ? movement.houseAmount
                  : 0
              ),
            0
          );

        const positiveCount =
          movements.filter(
            movement =>
              Number.isInteger(
                movement.personalAmount
              ) &&
              movement.personalAmount > 0
          ).length;

        const negativeCount =
          movements.filter(
            movement =>
              Number.isInteger(
                movement.personalAmount
              ) &&
              movement.personalAmount < 0
          ).length;

        const scoredMovementCount =
          positiveCount +
          negativeCount;

        const positiveAngle =
          scoredMovementCount > 0
            ? (
                positiveCount /
                scoredMovementCount
              ) * 360
            : 0;

        const studentName =
          cleanText(
            selectedStudent.displayName,
            "Alumno"
          );

        const houseLabel =
          houseLabels[
            selectedStudent.houseId
          ] || "Sin Casa";

        studentProfileStatus.textContent =
          `${studentName} · ${houseLabel}`;

        const profile =
          createStudentProfileElement(
            "div",
            "student-profile-card"
          );

        const summary =
          createStudentProfileElement(
            "div",
            "student-profile-summary"
          );

        const balance =
          createStudentProfileElement(
            "div",
            "student-profile-balance"
          );

        const ring =
          createStudentProfileElement(
            "div",
            "student-profile-ring"
          );

        ring.style.setProperty(
          "--student-positive-angle",
          `${positiveAngle}deg`
        );

        ring.setAttribute(
          "role",
          "img"
        );

        ring.setAttribute(
          "aria-label",
          `Balance de movimientos: ${positiveCount} positivos y ${negativeCount} negativos.`
        );

        if (
          scoredMovementCount === 0
        ) {

          ring.classList.add(
            "is-empty"
          );
        }

        const ringCenter =
          createStudentProfileElement(
            "span",
            "student-profile-ring-center"
          );

        const ringPoints =
          createStudentProfileElement(
            "strong",
            "",
            String(
              personalPoints
            )
          );

        const ringLabel =
          createStudentProfileElement(
            "small",
            "",
            Math.abs(
              personalPoints
            ) === 1
              ? "punto"
              : "puntos"
          );

        ringCenter.append(
          ringPoints,
          ringLabel
        );

        ring.appendChild(
          ringCenter
        );

        const balanceLegend =
          createStudentProfileElement(
            "div",
            "student-profile-balance-legend"
          );

        const positiveLegend =
          createStudentProfileElement(
            "span",
            "is-positive",
            `${positiveCount} ${
              positiveCount === 1
                ? "mérito"
                : "méritos"
            }`
          );

        const negativeLegend =
          createStudentProfileElement(
            "span",
            "is-negative",
            `${negativeCount} ${
              negativeCount === 1
                ? "penalización"
                : "penalizaciones"
            }`
          );

        balanceLegend.append(
          positiveLegend,
          negativeLegend
        );

        balance.append(
          ring,
          balanceLegend
        );

        const stats =
          createStudentProfileElement(
            "div",
            "student-profile-stats"
          );

        const createStat =
          (
            label,
            value
          ) => {

            const stat =
              createStudentProfileElement(
                "div",
                "student-profile-stat"
              );

            const statLabel =
              createStudentProfileElement(
                "span",
                "",
                label
              );

            const statValue =
              createStudentProfileElement(
                "strong",
                "",
                value
              );

            stat.append(
              statLabel,
              statValue
            );

            return stat;
          };

        stats.append(
          createStat(
            "Posición",
            position
              ? `#${position}`
              : "—"
          ),
          createStat(
            "Puntos",
            String(
              personalPoints
            )
          ),
          createStat(
            "A su Casa",
            formatStudentProfileAmount(
              houseContribution
            )
          )
        );

        summary.append(
          balance,
          stats
        );

        const history =
          createStudentProfileElement(
            "div",
            "student-profile-history"
          );

        const historyHeading =
          createStudentProfileElement(
            "div",
            "student-profile-history-heading"
          );

        const historyTitle =
          createStudentProfileElement(
            "strong",
            "",
            "Últimos méritos"
          );

        const historyCount =
          createStudentProfileElement(
            "span",
            "",
            `${movements.length} ${
              movements.length === 1
                ? "movimiento"
                : "movimientos"
            }`
          );

        historyHeading.append(
          historyTitle,
          historyCount
        );

        const historyList =
          createStudentProfileElement(
            "div",
            "student-profile-history-list"
          );

        const recentMovements =
          movements.slice(
            0,
            5
          );

        if (
          recentMovements.length === 0
        ) {

          const emptyHistory =
            createStudentProfileElement(
              "p",
              "student-profile-history-empty",
              "Todavía no hay méritos registrados para este alumno."
            );

          historyList.appendChild(
            emptyHistory
          );

        } else {

          recentMovements.forEach(
            movement => {

              const personalAmount =
                Number.isInteger(
                  movement.personalAmount
                )
                  ? movement.personalAmount
                  : 0;

              const houseAmount =
                Number.isInteger(
                  movement.houseAmount
                )
                  ? movement.houseAmount
                  : 0;

              const item =
                createStudentProfileElement(
                  "article",
                  "student-profile-movement"
                );

              item.classList.add(
                personalAmount >= 0
                  ? "is-positive"
                  : "is-negative"
              );

              const itemHeading =
                createStudentProfileElement(
                  "div",
                  "student-profile-movement-heading"
                );

              const category =
                createStudentProfileElement(
                  "strong",
                  "",
                  cleanText(
                    movement.category,
                    "Movimiento"
                  )
                );

              const amount =
                createStudentProfileElement(
                  "span",
                  "",
                  formatStudentProfileAmount(
                    personalAmount
                  )
                );

              itemHeading.append(
                category,
                amount
              );

              const impact =
                createStudentProfileElement(
                  "p",
                  "student-profile-movement-impact",
                  `Personal ${formatStudentProfileAmount(
                    personalAmount
                  )} · Casa ${formatStudentProfileAmount(
                    houseAmount
                  )}`
                );

              if (
                movement.calizApplied ===
                  true &&
                Number.isInteger(
                  movement.calizMultiplier
                ) &&
                movement.calizMultiplier > 1
              ) {

                impact.textContent +=
                  ` · Santo Cáliz ×${movement.calizMultiplier}`;
              }

              const reason =
                String(
                  movement.reason || ""
                ).trim();

              const meta =
                createStudentProfileElement(
                  "small",
                  "student-profile-movement-meta",
                  `${formatStudentProfileDate(
                    movement.createdAt
                  )} · ${cleanText(
                    movement.createdByName,
                    "Profesorado"
                  )}`
                );

              item.append(
                itemHeading,
                impact
              );

              if (reason) {

                const reasonElement =
                  createStudentProfileElement(
                    "p",
                    "student-profile-movement-reason",
                    reason
                  );

                item.appendChild(
                  reasonElement
                );
              }

              item.appendChild(
                meta
              );

              historyList.appendChild(
                item
              );
            }
          );
        }

        history.append(
          historyHeading,
          historyList
        );

        profile.append(
          summary,
          history
        );

        studentProfileContent.replaceChildren(
          profile
        );
      };


    const startStudentProfileListener =
      () => {

        const selectedStudent =
          currentStudentRoster.find(
            student =>
              student.id ===
              selectedStudentId
          );

        stopStudentProfileListener();

        if (!selectedStudent) {

          renderStudentProfile();

          return;
        }

        const studentId =
          selectedStudent.id;

        const classId =
          selectedStudent.classId;

        showStudentProfileState(
          "Consultando seguimiento",
          "Recuperando los movimientos registrados de este alumno."
        );

        const studentMovementsQuery =
          query(
            collection(
              db,
              "studentMovements"
            ),
            where(
              "studentId",
              "==",
              studentId
            ),
            where(
              "classId",
              "==",
              classId
            )
          );

        unsubscribeStudentProfileMovements =
          onSnapshot(
            studentMovementsQuery,

            snapshot => {

              if (
                selectedStudentId !==
                  studentId ||
                selectedStudentClassId !==
                  classId
              ) {

                return;
              }

              currentStudentProfileMovements =
                snapshot.docs.map(
                  movementSnapshot => ({
                    id:
                      movementSnapshot.id,

                    ...movementSnapshot.data()
                  })
                );

              renderStudentProfile();
            },

            error => {

              if (
                selectedStudentId !==
                  studentId ||
                selectedStudentClassId !==
                  classId
              ) {

                return;
              }

              console.error(
                "No se ha podido cargar el seguimiento del alumno:",
                error
              );

              showStudentProfileState(
                "Seguimiento no disponible",
                "Firestore no ha podido recuperar el historial privado de este alumno."
              );
            }
          );
      };


    studentRoster.addEventListener(
      "click",
      event => {

        const target =
          event.target instanceof Element
            ? event.target.closest(
                ".student-roster-item"
              )
            : null;

        if (!target) {

          return;
        }

        startStudentProfileListener();
      }
    );


        const renderSelectedStudentWorkspace =
      () => {

        const selectedStudent =
          currentStudentRoster.find(
            student =>
              student.id ===
              selectedStudentId
          );


        if (!selectedStudent) {

          showStudentMeritState(
            "Selecciona un alumno",
            "Aquí aparecerán su Casa, sus puntos personales, la categoría y la aportación final a la Casa."
          );

          return;
        }


        const houseLabels = {
          gryffindor:
            "Gryffindor",

          hufflepuff:
            "Hufflepuff",

          ravenclaw:
            "Ravenclaw",

          slytherin:
            "Slytherin"
        };


        const personalPoints =
          Number.isInteger(
            selectedStudent.personalPoints
          )
            ? selectedStudent.personalPoints
            : 0;


        const classLabel =
          `${selectedStudent.classId.charAt(0)}.º ${selectedStudent.classId.charAt(1)}`;


        const houseLabel =
          houseLabels[
            selectedStudent.houseId
          ] || "Sin Casa";


        const workspace =
          document.createElement(
            "div"
          );

        workspace.className =
          "house-movement-form";


        const studentSummary =
          document.createElement(
            "p"
          );

        studentSummary.className =
          "student-merit-intro";

        studentSummary.textContent =
          `${cleanText(
            selectedStudent.displayName,
            "Alumno"
          )} · ${classLabel} · ${houseLabel} · ${personalPoints} ${
            Math.abs(
              personalPoints
            ) === 1
              ? "punto personal"
              : "puntos personales"
          }`;


        const categoryField =
          document.createElement(
            "label"
          );

        categoryField.className =
          "movement-field";


        const categoryLabel =
          document.createElement(
            "span"
          );

        categoryLabel.textContent =
          "Categoría";


        const categorySelect =
          document.createElement(
            "select"
          );

        categorySelect.name =
          "studentMeritCategory";

        categorySelect.required =
          true;


        Array.from(
          movementCategory.options
        ).forEach(
          option => {

            categorySelect.appendChild(
              option.cloneNode(
                true
              )
            );
          }
        );


        categorySelect.value =
          "";


        categoryField.append(
          categoryLabel,
          categorySelect
        );


        const freeAmountField =
          document.createElement(
            "label"
          );

        freeAmountField.className =
          "movement-field movement-reason-field";

        freeAmountField.hidden =
          true;


        const freeAmountLabel =
          document.createElement(
            "span"
          );

        freeAmountLabel.textContent =
          "Puntuación libre";


        const freeAmountInput =
          document.createElement(
            "input"
          );

        freeAmountInput.type =
          "number";

        freeAmountInput.min =
          "-100";

        freeAmountInput.max =
          "100";

        freeAmountInput.step =
          "1";

        freeAmountInput.placeholder =
          "Escribe entre -100 y +100";


        freeAmountField.append(
          freeAmountLabel,
          freeAmountInput
        );


        const reasonField =
          document.createElement(
            "label"
          );

        reasonField.className =
          "movement-field movement-reason-field";


        const reasonLabel =
          document.createElement(
            "span"
          );

        reasonLabel.textContent =
          "Comentario opcional";


        const reasonInput =
          document.createElement(
            "textarea"
          );

        reasonInput.name =
          "studentMeritReason";

        reasonInput.maxLength =
          160;

        reasonInput.rows =
          1;

        reasonInput.placeholder =
          "Puedes añadir una aclaración, pero no es obligatorio.";


        const reasonHelp =
          document.createElement(
            "small"
          );

        reasonHelp.textContent =
          "No hace falta repetir el nombre del alumno.";


        reasonField.append(
          reasonLabel,
          reasonInput,
          reasonHelp
        );


        const previewFooter =
          document.createElement(
            "div"
          );

        previewFooter.className =
          "movement-form-footer";


        const preview =
          document.createElement(
            "p"
          );

        preview.className =
          "movement-message";

        preview.setAttribute(
          "role",
          "status"
        );

        preview.setAttribute(
          "aria-live",
          "polite"
        );

        preview.textContent =
          "Selecciona una categoría para previsualizar la puntuación.";


              const submitButton =
          document.createElement(
            "button"
          );

        submitButton.type =
          "button";

        submitButton.className =
          "movement-submit-button";

        submitButton.textContent =
          "Registrar mérito";


        previewFooter.append(
          preview,
          submitButton
        );


        const formatPreviewAmount =
          amount => {

            if (amount > 0) {

              return `+${amount}`;
            }


            if (amount < 0) {

              return `−${Math.abs(
                amount
              )}`;
            }


            return "0";
          };


        const setStudentMeritMessage =
          (
            message,
            type = ""
          ) => {

            preview.textContent =
              message;

            preview.classList.remove(
              "success",
              "error"
            );


            if (type) {

              preview.classList.add(
                type
              );
            }
          };


        const getStudentMeritScoring =
          () => {

            const selectedOption =
              categorySelect.options[
                categorySelect.selectedIndex
              ];


            const categoryValue =
              String(
                selectedOption?.value ||
                ""
              ).trim();


            const configuredPoints =
              selectedOption?.dataset.points ||
              "";


            if (
              !categoryValue ||
              configuredPoints === ""
            ) {

              freeAmountField.hidden =
                true;

              freeAmountInput.value =
                "";


              return {
                valid:
                  false,

                message:
                  "Selecciona una categoría para previsualizar la puntuación.",

                categoryValue:
                  "",

                baseAmount:
                  null,

                houseAmount:
                  null,

                bonus:
                  null
              };
            }


            let baseAmount =
              null;


            if (
              configuredPoints ===
              "free"
            ) {

              freeAmountField.hidden =
                false;


              const freeAmountText =
                freeAmountInput.value.trim();


              if (!freeAmountText) {

                return {
                  valid:
                    false,

                  message:
                    "Escribe una puntuación libre para calcular su efecto.",

                  categoryValue,

                  baseAmount:
                    null,

                  houseAmount:
                    null,

                  bonus:
                    null
                };
              }


              baseAmount =
                Number(
                  freeAmountText
                );


              if (
                !Number.isInteger(
                  baseAmount
                ) ||
                baseAmount === 0 ||
                baseAmount < -100 ||
                baseAmount > 100
              ) {

                return {
                  valid:
                    false,

                  message:
                    "La puntuación libre debe ser un entero entre -100 y +100, distinto de cero.",

                  categoryValue,

                  baseAmount:
                    null,

                  houseAmount:
                    null,

                  bonus:
                    null
                };
              }

            } else {

              freeAmountField.hidden =
                true;

              freeAmountInput.value =
                "";


              baseAmount =
                Number(
                  configuredPoints
                );


              if (
                !Number.isInteger(
                  baseAmount
                ) ||
                baseAmount === 0
              ) {

                return {
                  valid:
                    false,

                  message:
                    "La categoría seleccionada no contiene una puntuación válida.",

                  categoryValue,

                  baseAmount:
                    null,

                  houseAmount:
                    null,

                  bonus:
                    null
                };
              }
            }


            const activeBonus =
              getActiveCalizBonus();


            const bonusApplies =
              Boolean(
                configuredPoints !==
                  "free" &&
                activeBonus &&
                baseAmount > 0 &&
                categoryValue ===
                  activeBonus.categoryValue
              );


            const houseAmount =
              bonusApplies
                ? baseAmount *
                  activeBonus.multiplier
                : baseAmount;


            return {
              valid:
                true,

              message:
                "",

              categoryValue,

              baseAmount,

              houseAmount,

              bonus:
                bonusApplies
                  ? activeBonus
                  : null
            };
          };


        const updateStudentMeritPreview =
          () => {

            const scoring =
              getStudentMeritScoring();


            if (!scoring.valid) {

              setStudentMeritMessage(
                scoring.message
              );

              return;
            }


            setStudentMeritMessage(
              `Alumno ${formatPreviewAmount(
                scoring.baseAmount
              )} · Casa ${formatPreviewAmount(
                scoring.houseAmount
              )}${
                scoring.bonus
                  ? ` · Santo Cáliz ×${scoring.bonus.multiplier}`
                  : ""
              }`
            );
          };


        const submitStudentMerit =
          async () => {

            if (
              submitButton.disabled
            ) {

              return;
            }


            const user =
              auth.currentUser;

            const scoring =
              getStudentMeritScoring();

            const reason =
              reasonInput.value.trim();


            if (
              !user ||
              !currentTeacherProfile
            ) {

              setStudentMeritMessage(
                "La sesión docente ya no está disponible.",
                "error"
              );

              return;
            }


            if (
              !selectedStudent ||
              selectedStudent.id !==
                selectedStudentId
            ) {

              setStudentMeritMessage(
                "El alumno seleccionado ya no está disponible.",
                "error"
              );

              return;
            }


            const assignedClasses =
              Array.isArray(
                currentTeacherProfile
                  .assignedClasses
              )
                ? currentTeacherProfile
                    .assignedClasses
                : [];


            if (
              !assignedClasses.includes(
                selectedStudent.classId
              )
            ) {

              setStudentMeritMessage(
                "Este grupo no está asignado a tu perfil docente.",
                "error"
              );

              return;
            }


            if (!scoring.valid) {

              setStudentMeritMessage(
                scoring.message,
                "error"
              );

              return;
            }


            if (
              reason &&
              reason.length < 2
            ) {

              setStudentMeritMessage(
                "El comentario debe tener al menos 2 caracteres o dejarse vacío.",
                "error"
              );

              reasonInput.focus();

              return;
            }


            if (
              reason.length > 160
            ) {

              setStudentMeritMessage(
                "El comentario no puede superar los 160 caracteres.",
                "error"
              );

              reasonInput.focus();

              return;
            }


            const selectedHouse =
              currentHouses.find(
                house =>
                  house.id ===
                    selectedStudent.houseId
              );


            if (
              !selectedHouse ||
              selectedHouse.active !== true
            ) {

              setStudentMeritMessage(
                "La Casa del alumno no está disponible para recibir puntos.",
                "error"
              );

              return;
            }


            submitButton.disabled =
              true;

            submitButton.textContent =
              "Registrando...";

            categorySelect.disabled =
              true;

            freeAmountInput.disabled =
              true;

            reasonInput.disabled =
              true;


            setStudentMeritMessage(
              "Guardando el mérito en Firestore..."
            );


            try {

              const studentReference =
                doc(
                  db,
                  "students",
                  selectedStudent.id
                );


              const houseReference =
                doc(
                  db,
                  "houses",
                  selectedStudent.houseId
                );


              const publicRankingReference =
                doc(
                  db,
                  "publicRanking",
                  selectedStudent.houseId
                );


              const movementReference =
                doc(
                  collection(
                    db,
                    "studentMovements"
                  )
                );


              const result =
                await runTransaction(
                  db,
                  async transaction => {

                    /*
                     Todas las lecturas se realizan
                     antes de cualquier escritura.
                    */

                    const studentSnapshot =
                      await transaction.get(
                        studentReference
                      );


                    const houseSnapshot =
                      await transaction.get(
                        houseReference
                      );


                    const publicRankingSnapshot =
                      await transaction.get(
                        publicRankingReference
                      );


                    if (
                      !studentSnapshot.exists()
                    ) {

                      throw new Error(
                        "El alumno seleccionado ya no existe."
                      );
                    }


                    if (
                      !houseSnapshot.exists()
                    ) {

                      throw new Error(
                        "La Casa del alumno ya no existe."
                      );
                    }


                    if (
                      !publicRankingSnapshot.exists()
                    ) {

                      throw new Error(
                        "El ranking público de la Casa no está disponible."
                      );
                    }


                    const studentData =
                      studentSnapshot.data();

                    const houseData =
                      houseSnapshot.data();

                    const publicRankingData =
                      publicRankingSnapshot.data();


                    if (
                      studentData.active !== true
                    ) {

                      throw new Error(
                        "El alumno seleccionado está desactivado."
                      );
                    }


                    if (
                      studentData.schoolYear !==
                        "2026-2027"
                    ) {

                      throw new Error(
                        "El alumno no pertenece al curso activo."
                      );
                    }


                    if (
                      studentData.classId !==
                        selectedStudent.classId ||
                      studentData.houseId !==
                        selectedStudent.houseId
                    ) {

                      throw new Error(
                        "Los datos del alumno han cambiado. Vuelve a seleccionarlo."
                      );
                    }


                    if (
                      !assignedClasses.includes(
                        studentData.classId
                      )
                    ) {

                      throw new Error(
                        "Ya no tienes acceso a este grupo."
                      );
                    }


                    if (
                      houseData.active !== true
                    ) {

                      throw new Error(
                        "La Casa del alumno está desactivada."
                      );
                    }


                    if (
                      !Number.isInteger(
                        studentData.personalPoints
                      )
                    ) {

                      throw new Error(
                        "La puntuación personal actual no es válida."
                      );
                    }


                    if (
                      !Number.isInteger(
                        houseData.totalPoints
                      )
                    ) {

                      throw new Error(
                        "La puntuación actual de la Casa no es válida."
                      );
                    }


                    if (
                      !Number.isInteger(
                        publicRankingData.totalPoints
                      )
                    ) {

                      throw new Error(
                        "La puntuación del ranking público no es válida."
                      );
                    }


                    const previousStudentPoints =
                      studentData.personalPoints;

                    const previousHouseTotal =
                      houseData.totalPoints;


                    if (
                      publicRankingData.totalPoints !==
                        previousHouseTotal
                    ) {

                      throw new Error(
                        "La Casa y el ranking público no están sincronizados."
                      );
                    }


                    const newStudentPoints =
                      previousStudentPoints +
                      scoring.baseAmount;

                    const newHouseTotal =
                      previousHouseTotal +
                      scoring.houseAmount;


                    if (
                      !Number.isSafeInteger(
                        newStudentPoints
                      ) ||
                      !Number.isSafeInteger(
                        newHouseTotal
                      )
                    ) {

                      throw new Error(
                        "El nuevo total de puntos no es válido."
                      );
                    }


                    transaction.update(
                      studentReference,
                      {
                        personalPoints:
                          newStudentPoints,

                        lastMovementId:
                          movementReference.id
                      }
                    );


                    transaction.update(
                      houseReference,
                      {
                        totalPoints:
                          newHouseTotal,

                        updatedAt:
                          serverTimestamp(),

                        updatedBy:
                          user.uid,

                        lastMovementId:
                          movementReference.id
                      }
                    );


                    transaction.update(
                      publicRankingReference,
                      {
                        totalPoints:
                          newHouseTotal,

                        updatedAt:
                          serverTimestamp()
                      }
                    );


                    transaction.set(
                      movementReference,
                      {
                        type:
                          "student-merit",

                        schoolYear:
                          "2026-2027",

                        studentId:
                          studentSnapshot.id,

                        studentName:
                          studentData.displayName,

                        classId:
                          studentData.classId,

                        houseId:
                          studentData.houseId,

                        category:
                          scoring.categoryValue,

                        reason,

                        personalAmount:
                          scoring.baseAmount,

                        houseAmount:
                          scoring.houseAmount,

                        calizApplied:
                          Boolean(
                            scoring.bonus
                          ),

                        calizMultiplier:
                          scoring.bonus
                            ? 2
                            : 1,

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

                        previousStudentPoints,

                        newStudentPoints,

                        previousHouseTotal,

                        newHouseTotal,

                        corrected:
                          false
                      }
                    );


                    return {
                      studentName:
                        studentData.displayName,

                      newStudentPoints,

                      newHouseTotal
                    };
                  }
                );


              const calizNotice =
                scoring.bonus
                  ? ` · Santo Cáliz ×${scoring.bonus.multiplier}`
                  : "";


              setStudentMeritMessage(
                `${result.studentName}: ${formatPreviewAmount(
                  scoring.baseAmount
                )} personal · ${formatPreviewAmount(
                  scoring.houseAmount
                )} para ${selectedHouse.name}${calizNotice}.`,
                "success"
              );

            } catch (error) {

              console.error(
                "No se ha podido registrar el mérito individual:",
                error
              );


              const message =
                error.code ===
                  "permission-denied"
                  ? "Firestore ha rechazado el mérito individual. No se ha modificado ningún punto."
                  : error.message ||
                    "No se ha podido registrar el mérito individual.";


              setStudentMeritMessage(
                message,
                "error"
              );

            } finally {

              categorySelect.disabled =
                false;

              freeAmountInput.disabled =
                false;

              reasonInput.disabled =
                false;

              submitButton.disabled =
                false;

              submitButton.textContent =
                "Registrar mérito";
            }
          };


        categorySelect.addEventListener(
          "change",
          updateStudentMeritPreview
        );


        freeAmountInput.addEventListener(
          "input",
          updateStudentMeritPreview
        );


        submitButton.addEventListener(
          "click",
          submitStudentMerit
        );


        workspace.append(
          studentSummary,
          categoryField,
          freeAmountField,
          reasonField,
          previewFooter
        );


         studentMeritWorkspace.replaceChildren(
          workspace
        );
      };


    const renderStudentRoster = (
      students
    ) => {

      const activeStudents =
        students
          .filter(
            student =>
              student.active === true &&
              student.classId ===
                selectedStudentClassId &&
              student.schoolYear ===
                "2026-2027"
          )
                   .sort(
            (
              studentA,
              studentB
            ) => {

              const pointsA =
                Number.isInteger(
                  studentA.personalPoints
                )
                  ? studentA.personalPoints
                  : 0;

              const pointsB =
                Number.isInteger(
                  studentB.personalPoints
                )
                  ? studentB.personalPoints
                  : 0;


              if (
                pointsA !==
                pointsB
              ) {

                return pointsB - pointsA;
              }


              const orderA =
                Number.isInteger(
                  studentA.order
                )
                  ? studentA.order
                  : 999;

              const orderB =
                Number.isInteger(
                  studentB.order
                )
                  ? studentB.order
                  : 999;


              return orderA - orderB;
            }
          );


      currentStudentRoster =
        activeStudents;


      if (
        !activeStudents.some(
          student =>
            student.id ===
            selectedStudentId
        )
      ) {

        selectedStudentId =
          null;
      }


      if (
        activeStudents.length === 0
      ) {

        showStudentRosterState(
          "No hay alumnado activo",
          "Este grupo no contiene alumnado activo disponible."
        );
        renderSelectedStudentWorkspace();
        renderStudentProfile();

        return;


      const houseLabels = {
        gryffindor:
          "Gryffindor",

        hufflepuff:
          "Hufflepuff",

        ravenclaw:
          "Ravenclaw",

        slytherin:
          "Slytherin"
      };


      const items =
        activeStudents.map(
                    (
            student,
            index
          ) => {

            const item =
              document.createElement(
                "button"
              );

            item.type =
              "button";

            item.className =
              "student-roster-item";

            item.dataset.studentId =
              student.id;


            const isSelected =
              student.id ===
              selectedStudentId;


            if (isSelected) {

              item.classList.add(
                "is-active"
              );
            }


            item.setAttribute(
              "aria-pressed",
              isSelected
                ? "true"
                : "false"
            );


            const order =
              document.createElement(
                "span"
              );

                      order.textContent =
              String(
                index + 1
              );


            const identity =
              document.createElement(
                "strong"
              );

            identity.textContent =
              `${cleanText(
                student.displayName,
                "Alumno"
              )} · ${
                houseLabels[
                  student.houseId
                ] || "Sin Casa"
              }`;


            const personalPoints =
              Number.isInteger(
                student.personalPoints
              )
                ? student.personalPoints
                : 0;


            const points =
              document.createElement(
                "span"
              );

            points.textContent =
              `${personalPoints} ${
                Math.abs(
                  personalPoints
                ) === 1
                  ? "pt"
                  : "pts"
              }`;


            item.addEventListener(
              "click",
              () => {

                selectedStudentId =
                  student.id;

                renderStudentRoster(
                  currentStudentRoster
                );
              }
            );


            item.append(
              order,
              identity,
              points
            );


            return item;
          }
        );


      studentRoster.replaceChildren(
        ...items
      );
         
      renderSelectedStudentWorkspace();
      renderStudentProfile();
    };
    const stopStudentRosterListener =
      () => {

        if (
          typeof unsubscribeStudentRoster ===
            "function"
        ) {

          unsubscribeStudentRoster();

          unsubscribeStudentRoster =
            null;
        }

        stopStudentProfileListener();

        showStudentProfileState(
          "Sin alumno seleccionado",
          "Selecciona un alumno para consultar su evolución y sus últimos méritos."
        );
      };


       const startStudentRosterListener =
      () => {

        stopStudentRosterListener();

        currentStudentRoster = [];

        selectedStudentId =
          null;

        renderSelectedStudentWorkspace();


        const assignedClasses =
          Array.isArray(
            currentTeacherProfile
              ?.assignedClasses
          )
            ? currentTeacherProfile
                .assignedClasses
            : [];


        if (
          !selectedStudentClassId ||
          !assignedClasses.includes(
            selectedStudentClassId
          )
        ) {

          showStudentRosterState(
            "Sin grupo seleccionado",
            "Selecciona uno de tus grupos asignados para consultar su alumnado."
          );

          return;
        }


        const classId =
          selectedStudentClassId;

        const classLabel =
          `${classId.charAt(0)}.º ${classId.charAt(1)}`;


        showStudentRosterState(
          "Cargando alumnado",
          `Consultando el alumnado de ${classLabel}.`
        );


        const studentsQuery =
          query(
            collection(
              db,
              "students"
            ),
            where(
              "classId",
              "==",
              classId
            )
          );


        unsubscribeStudentRoster =
          onSnapshot(
            studentsQuery,

            snapshot => {

              if (
                selectedStudentClassId !==
                  classId
              ) {

                return;
              }


              const students =
                snapshot.docs.map(
                  studentSnapshot => ({
                    id:
                      studentSnapshot.id,

                    ...studentSnapshot.data()
                  })
                );


              renderStudentRoster(
                students
              );
            },

            error => {

              if (
                selectedStudentClassId !==
                  classId
              ) {

                return;
              }


              console.error(
                "No se ha podido cargar el alumnado del grupo:",
                error
              );


              showStudentRosterState(
                "No se ha podido cargar el alumnado",
                "Firestore no ha podido completar la consulta de este grupo."
              );
            }
          );
      };

     /* =====================================================
   CARTA DEL SANTO CÁLIZ
   ===================================================== */

const formatCalizDate =
  (dateKey) => {

    const date =
      new Date(
        `${dateKey}T12:00:00`
      );


    return new Intl.DateTimeFormat(
      "es-ES",
      {
        day:
          "numeric",

        month:
          "short"
      }
    )
      .format(date)
      .replace(".", "");
  };


const formatCalizRange =
  (
    startKey,
    endKey
  ) => {

    const startDate =
      new Date(
        `${startKey}T12:00:00`
      );

    const endDate =
      new Date(
        `${endKey}T12:00:00`
      );


    if (
      startDate.getFullYear() ===
        endDate.getFullYear() &&
      startDate.getMonth() ===
        endDate.getMonth()
    ) {

      const month =
        new Intl.DateTimeFormat(
          "es-ES",
          {
            month:
              "short"
          }
        )
          .format(endDate)
          .replace(".", "");


      return (
        `${startDate.getDate()}–` +
        `${endDate.getDate()} ${month}`
      );
    }


    return (
      `${formatCalizDate(startKey)} – ` +
      `${formatCalizDate(endKey)}`
    );
  };


const createTeacherCalizWeek =
  (
    week,
    activeBonus
  ) => {

    const weekElement =
      document.createElement(
        "div"
      );


    weekElement.className =
      "teacher-caliz-week";


    const isActive =
      Boolean(
        activeBonus &&
        week.start ===
          activeBonus.start &&
        week.end ===
          activeBonus.end
      );


    if (isActive) {

      weekElement.classList.add(
        "is-active"
      );
    }


    const dates =
      document.createElement(
        "span"
      );


    dates.textContent =
      `Semana ${week.weekNumber} · ${formatCalizRange(
        week.start,
        week.end
      )}`;


    const title =
      document.createElement(
        "strong"
      );


    title.textContent =
      `${week.publicLabel} ×${week.multiplier}`;


    weekElement.append(
      dates,
      title
    );


    return weekElement;
  };


const renderTeacherCalizCard =
  () => {

    const activeBonus =
      getActiveCalizBonus();


    const nextBonus =
      activeBonus
        ? null
        : getNextCalizBonus();


    const visibleBonus =
      activeBonus ||
      nextBonus;


    if (!visibleBonus) {

      teacherCalizMultiplier.hidden =
        true;

      teacherCalizState.textContent =
        "Carta en preparación";

      teacherCalizTitle.textContent =
        "No hay una distinción programada";

      teacherCalizDates.textContent =
        "Próximamente se anunciarán nuevas bonificaciones.";

      teacherCalizMonth.textContent =
        "—";


      const emptyMessage =
        document.createElement(
          "p"
        );


      emptyMessage.className =
        "teacher-caliz-loading";

      emptyMessage.textContent =
        "No existe una Carta mensual disponible para estas fechas.";


      teacherCalizWeeks.replaceChildren(
        emptyMessage
      );


      return;
    }


    teacherCalizMultiplier.hidden =
      false;

    teacherCalizMultiplier.textContent =
      `×${visibleBonus.multiplier}`;

    teacherCalizMultiplier.setAttribute(
      "aria-label",
      `Bonificación por ${visibleBonus.multiplier}`
    );


    teacherCalizState.textContent =
      activeBonus
        ? "Distinción activa"
        : "Próxima distinción";


    teacherCalizTitle.textContent =
      visibleBonus.publicLabel;


    teacherCalizDates.textContent =
      activeBonus
        ? `${formatCalizRange(
            visibleBonus.start,
            visibleBonus.end
          )} · Puntuación doble activa`
        : `${formatCalizRange(
            visibleBonus.start,
            visibleBonus.end
          )} · Próxima bonificación`;


    const monthlyCard =
      getCalizMonthlyCard(
        visibleBonus.monthId
      );


    if (!monthlyCard) {

      teacherCalizMonth.textContent =
        "—";

      teacherCalizWeeks.replaceChildren();

      return;
    }


    teacherCalizMonth.textContent =
      monthlyCard.label;


    const weekElements =
      monthlyCard.weeks.map(
        week =>
          createTeacherCalizWeek(
            week,
            activeBonus
          )
      );


    teacherCalizWeeks.replaceChildren(
      ...weekElements
    );
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
        `${house.rankPosition}.º`;

      card.dataset.rankPosition =
        String(
          house.rankPosition
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
        `${house.totalPoints} ${
          Math.abs(house.totalPoints) === 1
            ? "punto"
            : "puntos"
        }`;
      const rankChange =
        Number.isInteger(
          house.rankChange
        )
          ? house.rankChange
          : 0;


      const trend =
        document.createElement(
          "span"
        );

      trend.className =
        "house-rank-trend";


      if (rankChange > 0) {

        trend.classList.add(
          "rank-trend-up"
        );

        trend.textContent =
          `↑ Sube ${rankChange} ${
            rankChange === 1
              ? "puesto"
              : "puestos"
          }`;

      } else if (rankChange < 0) {

        const lostPositions =
          Math.abs(rankChange);

        trend.classList.add(
          "rank-trend-down"
        );

        trend.textContent =
          `↓ Baja ${lostPositions} ${
            lostPositions === 1
              ? "puesto"
              : "puestos"
          }`;

      } else {

        trend.classList.add(
          "rank-trend-stable"
        );

        trend.textContent =
          "— Se mantiene";
      }

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
        trend,
        status
      );

      return card;
    };
         const createHouseRanking = (
      houses
    ) => {

      const sortedHouses =
        [...houses].sort(
          (firstHouse, secondHouse) => {

            if (
              firstHouse.totalPoints !==
              secondHouse.totalPoints
            ) {

              return (
                secondHouse.totalPoints -
                firstHouse.totalPoints
              );
            }

            /*
             En caso de empate conserva el
             orden institucional original.
            */

            return (
              firstHouse.displayOrder -
              secondHouse.displayOrder
            );
          }
        );


      let previousPoints = null;
      let previousRank = 0;


      return sortedHouses.map(
        (house, index) => {

          const rankPosition =
            previousPoints ===
              house.totalPoints
              ? previousRank
              : index + 1;


          previousPoints =
            house.totalPoints;

          previousRank =
            rankPosition;


          return {
            ...house,
            rankPosition
          };
        }
      );
    };


    const captureHouseCardPositions =
      () => {

        const positions =
          new Map();


        housesGrid
          .querySelectorAll(
            ".house-data-card"
          )
          .forEach(
            card => {

              positions.set(
                card.dataset.houseId,
                card.getBoundingClientRect()
              );
            }
          );


        return positions;
      };


    const animateHouseRanking = (
      previousPositions
    ) => {

      if (
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
      ) {

        return;
      }


      window.requestAnimationFrame(
        () => {

          housesGrid
            .querySelectorAll(
              ".house-data-card"
            )
            .forEach(
              card => {

                const previousRectangle =
                  previousPositions.get(
                    card.dataset.houseId
                  );


                if (!previousRectangle) {
                  return;
                }


                const currentRectangle =
                  card.getBoundingClientRect();


                const differenceX =
                  previousRectangle.left -
                  currentRectangle.left;

                const differenceY =
                  previousRectangle.top -
                  currentRectangle.top;


                if (
                  Math.abs(differenceX) < 1 &&
                  Math.abs(differenceY) < 1
                ) {

                  return;
                }


                card.style.zIndex =
                  "3";


                const animation =
                  card.animate(
                    [
                      {
                        transform:
                          `translate(${differenceX}px, ${differenceY}px)`
                      },
                      {
                        transform:
                          "translate(0, 0)"
                      }
                    ],
                    {
                      duration: 750,
                      easing:
                        "cubic-bezier(0.22, 1, 0.36, 1)"
                    }
                  );


                animation.addEventListener(
                  "finish",
                  () => {

                    card.style
                      .removeProperty(
                        "z-index"
                      );
                  },
                  {
                    once: true
                  }
                );
              }
            );
        }
      );
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
const getMovementScoring =
  () => {

    const selectedOption =
      movementCategory.options[
        movementCategory.selectedIndex
      ];


    const configuredPoints =
      selectedOption?.dataset.points ||
      "";


    const categoryValue =
      String(
        selectedOption?.value || ""
      ).trim();


    /*
     La puntuación libre nunca recibe
     bonificación automática del Cáliz.
    */

    if (
      configuredPoints === "free"
    ) {

      return {
        mode:
          "free",

        baseAmount:
          null,

        amount:
          null,

        bonus:
          null
      };
    }


    if (
      configuredPoints === ""
    ) {

      return {
        mode:
          "empty",

        baseAmount:
          null,

        amount:
          null,

        bonus:
          null
      };
    }


    const baseAmount =
      Number(
        configuredPoints
      );


    if (
      !Number.isInteger(
        baseAmount
      )
    ) {

      return {
        mode:
          "invalid",

        baseAmount:
          null,

        amount:
          null,

        bonus:
          null
      };
    }


    const activeBonus =
      getActiveCalizBonus();


    const bonusApplies =
      Boolean(
        activeBonus &&
        baseAmount > 0 &&
        categoryValue ===
          activeBonus.categoryValue
      );


    return {
      mode:
        "automatic",

      baseAmount,

      amount:
        bonusApplies
          ? baseAmount *
            activeBonus.multiplier
          : baseAmount,

      bonus:
        bonusApplies
          ? activeBonus
          : null
    };
  };
    const updateMovementAmount =
  () => {

    const scoring =
      getMovementScoring();


    movementMessage.textContent =
      "";

    movementMessage.classList.remove(
      "success",
      "error"
    );


    if (
      scoring.mode === "free"
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
      scoring.mode ===
        "automatic"
    ) {

      movementAmount.value =
        String(
          scoring.amount
        );

      movementAmount.placeholder =
        "Puntuación automática";


      if (scoring.bonus) {

        const baseSign =
          scoring.baseAmount > 0
            ? "+"
            : "";

        const amountSign =
          scoring.amount > 0
            ? "+"
            : "";


        movementMessage.textContent =
          `Santo Cáliz ×${scoring.bonus.multiplier}: ` +
          `${baseSign}${scoring.baseAmount} → ` +
          `${amountSign}${scoring.amount} puntos.`;
      }


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

       const loadHouses = () => {

      /*
       Evita crear varios observadores
       sobre las mismas casas.
      */

      if (unsubscribeHouses) {
        return;
      }


      housesLoading.hidden =
        false;

      housesError.hidden =
        true;

      housesGrid.replaceChildren();


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


      unsubscribeHouses =
        onSnapshot(
          housesQuery,

          housesSnapshot => {

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


            if (houses.length === 0) {

              currentHouses = [];

              housesLoading.hidden =
                true;

              housesError.hidden =
                false;

              return;
            }


            /*
             Conserva la casa seleccionada
             mientras se actualiza el marcador.
            */

                       const selectedHouseId =
              movementHouse.value;


            const previousCardPositions =
              captureHouseCardPositions();


                       const rankedHouses =
              createHouseRanking(
                houses
              );


            rankedHouses.forEach(
              house => {

                const previousRank =
                  previousHouseRanks.get(
                    house.id
                  );

                const previousPoints =
                  previousHousePoints.get(
                    house.id
                  );


                if (
                  Number.isInteger(
                    previousRank
                  )
                ) {

                  if (
                    previousRank !==
                    house.rankPosition
                  ) {

                    /*
                     Resultado positivo:
                     la casa ha subido.
                    */

                    houseRankChanges.set(
                      house.id,
                      previousRank -
                        house.rankPosition
                    );

                  } else if (
                    previousPoints !==
                    house.totalPoints
                  ) {

                    /*
                     Ha cambiado su puntuación,
                     pero mantiene posición.
                    */

                    houseRankChanges.set(
                      house.id,
                      0
                    );
                  }
                }


                previousHouseRanks.set(
                  house.id,
                  house.rankPosition
                );

                previousHousePoints.set(
                  house.id,
                  house.totalPoints
                );
              }
            );


            currentHouses =
              rankedHouses.map(
                house => ({
                  ...house,

                  rankChange:
                    houseRankChanges.get(
                      house.id
                    ) || 0
                })
              );


            /*
             El formulario mantiene el orden
             tradicional de las cuatro casas.
            */

            populateHouseSelector(
              houses
            );


            if (
              selectedHouseId &&
              currentHouses.some(
                house =>
                  house.id ===
                    selectedHouseId &&
                  house.active === true
              )
            ) {

              movementHouse.value =
                selectedHouseId;
            }


            const cards =
              currentHouses.map(
                createHouseCard
              );


            housesGrid.replaceChildren(
              ...cards
            );
            animateHouseRanking(
              previousCardPositions
            );

            housesLoading.hidden =
              true;

            housesError.hidden =
              true;


            /*
             Actualiza también los nombres y
             colores mostrados en el historial.
            */

            if (
              currentMovements.length > 0
            ) {

              renderMovementHistory();
            }
          },

          error => {

            console.error(
              "No se han podido sincronizar las casas:",
              error
            );

            housesLoading.hidden =
              true;

            housesError.hidden =
              false;
          }
        );
    };
         /* =====================================================
       HISTORIAL DE MOVIMIENTOS
       ===================================================== */

    const formatMovementDate = (
      timestamp
    ) => {

      if (
        !timestamp ||
        typeof timestamp.toDate !==
          "function"
      ) {

        return "Fecha pendiente";
      }


      return new Intl.DateTimeFormat(
        "es-ES",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }
      ).format(
        timestamp.toDate()
      );
    };


    const getMovementHouse = (
      houseId
    ) => {

      return (
        currentHouses.find(
          house =>
            house.id === houseId
        ) || {
          id: houseId,
          name: cleanText(
            houseId,
            "Casa desconocida"
          ),
          primaryColor: "#755019",
          accentColor: "#e6c47b"
        }
      );
    };


    const createMovementHistoryItem = (
      movement
    ) => {

      const house =
        getMovementHouse(
          movement.houseId
        );

      const item =
        document.createElement(
          "article"
        );

      item.className =
        "movement-history-item";

      item.dataset.movementId =
        movement.id;

      item.style.setProperty(
        "--movement-house-primary",
        house.primaryColor
      );

      item.style.setProperty(
        "--movement-house-accent",
        house.accentColor
      );


      const houseBlock =
        document.createElement(
          "div"
        );

      houseBlock.className =
        "movement-history-house";


      const houseDot =
        document.createElement(
          "span"
        );

      houseDot.className =
        "movement-history-house-dot";

      houseDot.setAttribute(
        "aria-hidden",
        "true"
      );


      const houseName =
        document.createElement(
          "strong"
        );

      houseName.textContent =
        house.name;

      houseBlock.append(
        houseDot,
        houseName
      );


      const mainBlock =
        document.createElement(
          "div"
        );

      mainBlock.className =
        "movement-history-main";


      const category =
        document.createElement(
          "strong"
        );

      category.className =
        "movement-history-category";

      category.textContent =
        cleanText(
          movement.category,
          "Movimiento de puntos"
        );


      const reason =
        document.createElement(
          "p"
        );

      reason.className =
        "movement-history-reason";

      const reasonText =
        cleanText(
          movement.reason,
          ""
        );

      const categoryText =
        cleanText(
          movement.category,
          ""
        );

      reason.textContent =
        reasonText &&
        reasonText !== categoryText
          ? reasonText
          : "Sin comentario adicional";

      mainBlock.append(
        category,
        reason
      );


      const metaBlock =
        document.createElement(
          "div"
        );

      metaBlock.className =
        "movement-history-meta";


      const teacher =
        document.createElement(
          "span"
        );

      teacher.className =
        "movement-history-teacher";

      teacher.textContent =
        cleanText(
          movement.createdByName,
          "Profesorado"
        );


      const date =
        document.createElement(
          "time"
        );

      date.className =
        "movement-history-date";

      date.textContent =
        formatMovementDate(
          movement.createdAt
        );

      metaBlock.append(
        teacher,
        date
      );


      const scoreBlock =
        document.createElement(
          "div"
        );

      scoreBlock.className =
        "movement-history-score";


      const amount =
        Number.isInteger(
          movement.amount
        )
          ? movement.amount
          : 0;


      const points =
        document.createElement(
          "strong"
        );

      points.className =
        `movement-history-points ${
          amount >= 0
            ? "positive"
            : "negative"
        }`;

      points.textContent =
        amount > 0
          ? `+${amount}`
          : String(amount);


      const total =
        document.createElement(
          "span"
        );

      total.className =
        "movement-history-total";

      total.textContent =
        `Total: ${
          Number.isInteger(
            movement.newTotal
          )
            ? movement.newTotal
            : 0
        }`;


      scoreBlock.append(
        points,
        total
      );


      item.append(
        houseBlock,
        mainBlock,
        metaBlock,
        scoreBlock
      );

      return item;
    };


       const showFilteredHistoryEmptyState = (
      title,
      message
    ) => {

      const emptyTitle =
        movementHistoryEmpty.querySelector(
          "strong"
        );

      const emptyMessage =
        movementHistoryEmpty.querySelector(
          "p"
        );

      if (emptyTitle) {
        emptyTitle.textContent =
          title;
      }

      if (emptyMessage) {
        emptyMessage.textContent =
          message;
      }

      movementHistoryEmpty.hidden =
        false;

      movementHistoryList.hidden =
        true;
    };


    const renderMovementHistory = () => {

      const selectedHouse =
        movementHistoryHouseFilter.value;

      const selectedType =
        movementHistoryTypeFilter.value;


      const filteredMovements =
        currentMovements.filter(
          movement => {

            const matchesHouse =
              selectedHouse === "all" ||
              movement.houseId ===
                selectedHouse;

            const amount =
              Number.isInteger(
                movement.amount
              )
                ? movement.amount
                : 0;

            const matchesType =
              selectedType === "all" ||
              (
                selectedType ===
                  "positive" &&
                amount > 0
              ) ||
              (
                selectedType ===
                  "negative" &&
                amount < 0
              );

            return (
              matchesHouse &&
              matchesType
            );
          }
        );


      if (
        filteredMovements.length ===
        currentMovements.length
      ) {

        movementHistoryCount.textContent =
          `${currentMovements.length} ${
            currentMovements.length === 1
              ? "movimiento"
              : "movimientos"
          }`;

      } else {

        movementHistoryCount.textContent =
          `${filteredMovements.length} de ${
            currentMovements.length
          } movimientos`;
      }


      movementHistoryList
        .replaceChildren();

      movementHistoryEmpty.hidden =
        true;


      if (
        currentMovements.length === 0
      ) {

        showFilteredHistoryEmptyState(
          "Todavía no existen movimientos",
          "Los registros aparecerán aquí después de modificar la puntuación de una casa."
        );

        return;
      }


      if (
        filteredMovements.length === 0
      ) {

        showFilteredHistoryEmptyState(
          "No hay movimientos con estos filtros",
          "Prueba con otra casa o tipo de movimiento."
        );

        return;
      }


      const historyItems =
        filteredMovements.map(
          createMovementHistoryItem
        );

      movementHistoryList.append(
        ...historyItems
      );

      movementHistoryList.hidden =
        false;
    };


       const loadMovementHistory = () => {

      /*
       Evita crear varios observadores si la función
       vuelve a ejecutarse después de registrar puntos.
      */

      if (unsubscribeMovementHistory) {
        return;
      }


      movementHistoryLoading.hidden =
        false;

      movementHistoryError.hidden =
        true;

      movementHistoryEmpty.hidden =
        true;

      movementHistoryList.hidden =
        true;

      movementHistoryList
        .replaceChildren();


      const movementsQuery =
        query(
          collection(
            db,
            "houseMovements"
          ),
          orderBy(
            "createdAt",
            "desc"
          ),
          limit(50)
        );


      unsubscribeMovementHistory =
        onSnapshot(
          movementsQuery,

          movementsSnapshot => {

            currentMovements =
              movementsSnapshot.docs.map(
                movementDocument => ({
                  id:
                    movementDocument.id,
                  ...movementDocument.data()
                })
              );


            movementHistoryLoading.hidden =
              true;

            movementHistoryError.hidden =
              true;

            renderMovementHistory();
          },

          error => {

            console.error(
              "No se ha podido sincronizar el historial:",
              error
            );

            currentMovements = [];

            movementHistoryCount.textContent =
              "0 movimientos";

            movementHistoryLoading.hidden =
              true;

            movementHistoryError.hidden =
              false;
          }
        );
    };


    movementHistoryHouseFilter
      .addEventListener(
        "change",
        renderMovementHistory
      );


    movementHistoryTypeFilter
      .addEventListener(
        "change",
        renderMovementHistory
      );


    movementHistoryClearFilters
      .addEventListener(
        "click",
        () => {

          movementHistoryHouseFilter.value =
            "all";

          movementHistoryTypeFilter.value =
            "all";

          renderMovementHistory();
        }
      );
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

      renderTeacherCalizCard();
      loadHouses();
      loadMovementHistory();
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

        const scoring =
  getMovementScoring();


const amount =
  scoring.mode === "free"
    ? Number(
        movementAmount.value
      )
    : scoring.amount;


const appliedCalizBonus =
  scoring.bonus;

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
          optionalComment &&
          optionalComment.length < 3
        ) {

          setMovementMessage(
            "El comentario debe tener al menos 3 caracteres o dejarse vacío.",
            "error"
          );

          movementReason.focus();

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
         
         const publicRankingReference =
            doc(
              db,
              "publicRanking",
              houseId
            );
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
                transaction.update(
                  publicRankingReference,
                  {
                    totalPoints:
                      newTotal,

                    updatedAt:
                      serverTimestamp()
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


         const calizNotice =
  appliedCalizBonus
    ? ` · Santo Cáliz ×${appliedCalizBonus.multiplier}`
    : "";


setMovementMessage(
  `${selectedHouse.name}: ${formatSignedPoints(amount)} puntos registrados${calizNotice}. Nuevo total: ${result.newTotal}.`,
  "success"
);


          await loadHouses();
          await loadMovementHistory();

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

          assignedClasses:
            role === "admin"
              ? [...CLASS_IDS]
              : (
                  Array.isArray(
                    teacherData.assignedClasses
                  )
                    ? teacherData.assignedClasses.filter(
                        classId =>
                          CLASS_IDS.includes(
                            classId
                          )
                      )
                    : []
                ),

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

        stopStudentRosterListener();

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

         renderStudentClassTabs(
            teacherProfile
          );

          startStudentRosterListener();


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
