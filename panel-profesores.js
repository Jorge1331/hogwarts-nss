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
  limit,
  onSnapshot,
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
      movementSubmitButton,
      movementHistoryCount,
      movementHistoryLoading,
      movementHistoryError,
      movementHistoryEmpty,
      movementHistoryList,
      movementHistoryHouseFilter,
      movementHistoryTypeFilter,
      movementHistoryClearFilters
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


          setMovementMessage(
            `${selectedHouse.name}: ${formatSignedPoints(amount)} puntos registrados. Nuevo total: ${result.newTotal}.`,
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
