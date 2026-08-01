/* =========================================================
   HOGWARTS NSS · VISTA GENERAL DEL PROFESORADO
   Centro de mando en tiempo real
   ========================================================= */

"use strict";


import {
  auth,
  db
} from "./firebase-config.js";


import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


import {
  collection,
  doc,
  getCountFromServer,
  limit,
  onSnapshot,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


/* ---------------------------------------------------------
   CASAS PÚBLICAS PERMITIDAS
--------------------------------------------------------- */

const PUBLIC_HOUSE_IDS = [
  "gryffindor",
  "slytherin",
  "ravenclaw",
  "hufflepuff"
];


/* ---------------------------------------------------------
   ELEMENTOS DE LA VISTA GENERAL
--------------------------------------------------------- */

const overviewLeaderName =
  document.getElementById(
    "overviewLeaderName"
  );

const overviewLeaderDetail =
  document.getElementById(
    "overviewLeaderDetail"
  );

const overviewTotalPoints =
  document.getElementById(
    "overviewTotalPoints"
  );

const overviewPointsDetail =
  document.getElementById(
    "overviewPointsDetail"
  );

const overviewMovementCount =
  document.getElementById(
    "overviewMovementCount"
  );

const overviewLastMovement =
  document.getElementById(
    "overviewLastMovement"
  );

const overviewSyncStatus =
  document.getElementById(
    "overviewSyncStatus"
  );

const overviewSyncDetail =
  document.getElementById(
    "overviewSyncDetail"
  );
const leaderSummaryCard =
  document.querySelector(
    "#sectionResumen .leader-summary"
  );

const overviewElements = [
  overviewLeaderName,
  overviewLeaderDetail,
  overviewTotalPoints,
  overviewPointsDetail,
  overviewMovementCount,
  overviewLastMovement,
  overviewSyncStatus,
  overviewSyncDetail,
  leaderSummaryCard
  ];


/* ---------------------------------------------------------
   ESTADO DEL MÓDULO
--------------------------------------------------------- */

let currentHouses = [];

let currentPublicRanking =
  new Map();

let latestMovement = null;

let totalMovementCount = 0;

let listenersStarted = false;

let unsubscribeFunctions = [];


/* ---------------------------------------------------------
   FORMATO DE FECHA
--------------------------------------------------------- */

const formatMovementDate =
  timestamp => {

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


/* ---------------------------------------------------------
   ACTUALIZAR VISTA GENERAL
--------------------------------------------------------- */

const renderOverview =
  () => {

    const activeHouses =
      [...currentHouses]
        .filter(
          house =>
            house.active === true
        )
        .sort(
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


            return (
              firstHouse.displayOrder -
              secondHouse.displayOrder
            );
          }
        );


    /* CASA LÍDER */

    if (activeHouses.length > 0) {

      const leader =
        activeHouses[0];
       leaderSummaryCard.dataset.leaderHouse =
  leader.id;

      const tiedLeaders =
        activeHouses.filter(
          house =>
            house.totalPoints ===
            leader.totalPoints
        );


      if (tiedLeaders.length > 1) {

        overviewLeaderName.textContent =
          tiedLeaders
            .map(
              house => house.name
            )
            .join(" · ");

        overviewLeaderDetail.textContent =
          `${leader.totalPoints} puntos · Liderato compartido`;

      } else {

        overviewLeaderName.textContent =
          leader.name;


        const secondHouse =
          activeHouses[1];


        if (secondHouse) {

          const advantage =
            leader.totalPoints -
            secondHouse.totalPoints;

          overviewLeaderDetail.textContent =
            `${leader.totalPoints} puntos · ${advantage} de ventaja`;

        } else {

          overviewLeaderDetail.textContent =
            `${leader.totalPoints} puntos`;
        }
      }


      /* PUNTOS ACUMULADOS */

      const totalPoints =
        activeHouses.reduce(
          (
            accumulatedPoints,
            house
          ) =>
            accumulatedPoints +
            house.totalPoints,
          0
        );


      overviewTotalPoints.textContent =
        `${totalPoints} ${
          Math.abs(totalPoints) === 1
            ? "punto"
            : "puntos"
        }`;

      overviewPointsDetail.textContent =
        `Suma actual de las ${activeHouses.length} casas.`;

    } else {
delete leaderSummaryCard.dataset.leaderHouse;
      overviewLeaderName.textContent =
        "Sin clasificación";

      overviewLeaderDetail.textContent =
        "Esperando datos de las casas.";

      overviewTotalPoints.textContent =
        "0 puntos";

      overviewPointsDetail.textContent =
        "Esperando datos de las casas.";
    }


    /* MOVIMIENTOS */

    overviewMovementCount.textContent =
      `${totalMovementCount} ${
        totalMovementCount === 1
          ? "movimiento"
          : "movimientos"
      }`;


    if (latestMovement) {

      const movementHouse =
        currentHouses.find(
          house =>
            house.id ===
            latestMovement.houseId
        );

      const houseName =
        movementHouse?.name ||
        "Casa";

      const amount =
        Number.isInteger(
          latestMovement.amount
        )
          ? latestMovement.amount
          : 0;

      const signedAmount =
        amount > 0
          ? `+${amount}`
          : String(amount);


      overviewLastMovement.textContent =
        `${houseName}: ${signedAmount} puntos · ${formatMovementDate(
          latestMovement.createdAt
        )}`;

    } else {

      overviewLastMovement.textContent =
        "Todavía no existen movimientos.";
    }


    /* SINCRONIZACIÓN */

    if (
      currentHouses.length === 0 ||
      currentPublicRanking.size !==
        PUBLIC_HOUSE_IDS.length
    ) {

      overviewSyncStatus.textContent =
        "Conectando";

      overviewSyncDetail.textContent =
        "Comprobando los marcadores privado y público.";

      return;
    }


    const rankingMatches =
      currentHouses.every(
        house => {

          const publicHouse =
            currentPublicRanking.get(
              house.id
            );


          return (
            publicHouse &&
            publicHouse.totalPoints ===
              house.totalPoints
          );
        }
      );


    if (rankingMatches) {

      overviewSyncStatus.textContent =
        "Sincronización activa";

      overviewSyncDetail.textContent =
        "El panel privado y el Gran Comedor muestran los mismos totales.";

    } else {

      overviewSyncStatus.textContent =
        "Revisar sincronización";

      overviewSyncDetail.textContent =
        "Existe una diferencia entre los marcadores.";
    }
  };


/* ---------------------------------------------------------
   CASAS PRIVADAS
--------------------------------------------------------- */

const startHousesListener =
  () => {

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


    const unsubscribe =
      onSnapshot(
        housesQuery,

        housesSnapshot => {

          currentHouses =
            housesSnapshot.docs.map(
              houseDocument => {

                const data =
                  houseDocument.data();


                return {
                  id:
                    houseDocument.id,

                  name:
                    String(
                      data.name ||
                      houseDocument.id
                    ).trim(),

                  totalPoints:
                    Number.isInteger(
                      data.totalPoints
                    )
                      ? data.totalPoints
                      : 0,

                  displayOrder:
                    Number.isInteger(
                      data.displayOrder
                    )
                      ? data.displayOrder
                      : 99,

                  active:
                    data.active === true
                };
              }
            );


          renderOverview();
        },

        error => {

          console.error(
            "Vista general: error al cargar las casas.",
            error
          );

          overviewLeaderName.textContent =
            "Error de conexión";

          overviewLeaderDetail.textContent =
            "No se ha podido consultar la clasificación.";
        }
      );


    unsubscribeFunctions.push(
      unsubscribe
    );
  };


/* ---------------------------------------------------------
   ÚLTIMO MOVIMIENTO Y TOTAL
--------------------------------------------------------- */

const refreshMovementCount =
  async () => {

    try {

      const countSnapshot =
        await getCountFromServer(
          collection(
            db,
            "houseMovements"
          )
        );


      totalMovementCount =
        countSnapshot.data().count;


      renderOverview();

    } catch (error) {

      console.error(
        "Vista general: no se ha podido contar el historial.",
        error
      );
    }
  };


const startMovementListener =
  () => {

    const latestMovementQuery =
      query(
        collection(
          db,
          "houseMovements"
        ),
        orderBy(
          "createdAt",
          "desc"
        ),
        limit(1)
      );


    const unsubscribe =
      onSnapshot(
        latestMovementQuery,

        movementSnapshot => {

          if (
            movementSnapshot.empty
          ) {

            latestMovement = null;

          } else {

            const movementDocument =
              movementSnapshot.docs[0];


            latestMovement = {
              id:
                movementDocument.id,

              ...movementDocument.data()
            };
          }


          refreshMovementCount();

          renderOverview();
        },

        error => {

          console.error(
            "Vista general: error al cargar movimientos.",
            error
          );

          overviewMovementCount.textContent =
            "Sin conexión";

          overviewLastMovement.textContent =
            "No se ha podido consultar el historial.";
        }
      );


    unsubscribeFunctions.push(
      unsubscribe
    );
  };


/* ---------------------------------------------------------
   RANKING PÚBLICO

   Se consultan los cuatro documentos individualmente
   para respetar las reglas públicas de Firestore.
--------------------------------------------------------- */

const startPublicRankingListeners =
  () => {

    PUBLIC_HOUSE_IDS.forEach(
      houseId => {

        const publicHouseReference =
          doc(
            db,
            "publicRanking",
            houseId
          );


        const unsubscribe =
          onSnapshot(
            publicHouseReference,

            publicHouseSnapshot => {

              if (
                !publicHouseSnapshot.exists()
              ) {

                currentPublicRanking.delete(
                  houseId
                );

                renderOverview();

                return;
              }


              const data =
                publicHouseSnapshot.data();


              currentPublicRanking.set(
                houseId,
                {
                  id:
                    houseId,

                  totalPoints:
                    Number.isInteger(
                      data.totalPoints
                    )
                      ? data.totalPoints
                      : 0
                }
              );


              renderOverview();
            },

            error => {

              console.error(
                `Vista general: error al comprobar ${houseId}.`,
                error
              );

              overviewSyncStatus.textContent =
                "Sin conexión pública";

              overviewSyncDetail.textContent =
                "No se ha podido comprobar el Gran Comedor.";
            }
          );


        unsubscribeFunctions.push(
          unsubscribe
        );
      }
    );
  };


/* ---------------------------------------------------------
   CONTROL DE LISTENERS
--------------------------------------------------------- */

const stopListeners =
  () => {

    unsubscribeFunctions.forEach(
      unsubscribe => {

        try {
          unsubscribe();
        } catch {
          /* Sin acción */
        }
      }
    );


    unsubscribeFunctions = [];

    listenersStarted = false;

    currentHouses = [];

    currentPublicRanking.clear();

    latestMovement = null;

    totalMovementCount = 0;
  };


const startListeners =
  () => {

    if (listenersStarted) {
      return;
    }


    listenersStarted = true;

    startHousesListener();

    startMovementListener();

    startPublicRankingListeners();
  };


/* ---------------------------------------------------------
   INICIO
--------------------------------------------------------- */

if (
  overviewElements.every(
    element => Boolean(element)
  )
) {

  onAuthStateChanged(
    auth,
    user => {

      if (!user) {

        stopListeners();

        return;
      }


      startListeners();
    }
  );

} else {

  console.warn(
    "Vista general: faltan elementos del panel y el módulo no se iniciará."
  );
}
