const { initializeApp } =
  require("firebase-admin/app");

const {
  getFirestore,
  FieldValue
} =
  require("firebase-admin/firestore");

const {
  onSchedule
} =
  require("firebase-functions/v2/scheduler");

const logger =
  require("firebase-functions/logger");


initializeApp();

const db = getFirestore();


/* =========================================================
   CONFIGURACIÓN GENERAL
   ========================================================= */

const TIME_ZONE =
  "Europe/Madrid";

const HOUSE_IDS = [
  "gryffindor",
  "slytherin",
  "ravenclaw",
  "hufflepuff"
];


/*
  Solo estas tres fechas pueden provocar
  un reinicio durante el curso 2026-2027.
*/

const PERIOD_CLOSURES = {

  "2026-12-31": {
    periodId: "periodo-1",
    periodName: "Primer periodo",
    label:
      "Cierre automático del primer periodo"
  },

  "2027-03-19": {
    periodId: "periodo-2",
    periodName: "Segundo periodo",
    label:
      "Cierre automático del segundo periodo"
  },

  "2027-06-21": {
    periodId: "periodo-3",
    periodName: "Tercer periodo",
    label:
      "Cierre automático del tercer periodo"
  }

};


/* =========================================================
   FECHA LOCAL DE MADRID
   ========================================================= */

const getMadridDateKey = (
  scheduleTime
) => {

  const date =
    new Date(scheduleTime);


  const parts =
    new Intl.DateTimeFormat(
      "es-ES",
      {
        timeZone: TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }
    ).formatToParts(date);


  const values =
    Object.fromEntries(
      parts.map(
        ({ type, value }) => [
          type,
          value
        ]
      )
    );


  return (
    `${values.year}-` +
    `${values.month}-` +
    `${values.day}`
  );
};


/* =========================================================
   CIERRE AUTOMÁTICO DE PERIODOS
   ========================================================= */

exports.closeHousePeriods =
  onSchedule(
    {
      /*
        Todos los días a las 23:55.

        La función comprobará después si
        realmente es una de las tres
        fechas autorizadas.
      */

      schedule: "55 23 * * *",

      timeZone: TIME_ZONE,

      region:
        "europe-southwest1",

      /*
        Si existe un fallo temporal,
        Firebase puede reintentarlo.

        El documento seasonClosures
        impide que un cierre válido
        pueda ejecutarse dos veces.
      */

      retryCount: 3,
      maxRetrySeconds: 3600
    },

    async event => {

      const dateKey =
        getMadridDateKey(
          event.scheduleTime
        );


      const closure =
        PERIOD_CLOSURES[
          dateKey
        ];


      /*
        Día normal del curso:
        no hacemos absolutamente nada.
      */

      if (!closure) {
        return;
      }


      const closureRef =
        db
          .collection(
            "seasonClosures"
          )
          .doc(
            dateKey
          );


      const houseRefs =
        HOUSE_IDS.map(
          houseId =>
            db
              .collection("houses")
              .doc(houseId)
        );


      const publicRankingRefs =
        HOUSE_IDS.map(
          houseId =>
            db
              .collection(
                "publicRanking"
              )
              .doc(houseId)
        );


      const result =
        await db.runTransaction(
          async transaction => {

            /*
              PROTECCIÓN CONTRA
              DOBLE EJECUCIÓN
            */

            const closureSnapshot =
              await transaction.get(
                closureRef
              );


            if (
              closureSnapshot.exists
            ) {

              return {
                status:
                  "already-closed"
              };
            }


            /*
              Primero leemos TODOS los
              documentos.

              No escribimos nada todavía.
            */

            const houseSnapshots = [];

            for (
              const ref
              of houseRefs
            ) {

              houseSnapshots.push(
                await transaction.get(
                  ref
                )
              );
            }


            const publicSnapshots = [];

            for (
              const ref
              of publicRankingRefs
            ) {

              publicSnapshots.push(
                await transaction.get(
                  ref
                )
              );
            }


            /*
              VALIDACIÓN
            */

            houseSnapshots.forEach(
              (
                snapshot,
                index
              ) => {

                if (
                  !snapshot.exists
                ) {

                  throw new Error(
                    `No existe houses/${
                      HOUSE_IDS[index]
                    }`
                  );
                }


                if (
                  !Number.isInteger(
                    snapshot.data()
                      .totalPoints
                  )
                ) {

                  throw new Error(
                    `Puntuación inválida en houses/${
                      HOUSE_IDS[index]
                    }`
                  );
                }

              }
            );


            publicSnapshots.forEach(
              (
                snapshot,
                index
              ) => {

                if (
                  !snapshot.exists
                ) {

                  throw new Error(
                    `No existe publicRanking/${
                      HOUSE_IDS[index]
                    }`
                  );
                }


                if (
                  !Number.isInteger(
                    snapshot.data()
                      .totalPoints
                  )
                ) {

                  throw new Error(
                    `Puntuación inválida en publicRanking/${
                      HOUSE_IDS[index]
                    }`
                  );
                }

              }
            );


            /*
              GUARDAMOS LOS RESULTADOS
              ANTES DEL REINICIO
            */

            const previousTotals = {};

            const publicTotalsBeforeReset =
              {};

            const houseNames = {};


            HOUSE_IDS.forEach(
              (
                houseId,
                index
              ) => {

                const houseData =
                  houseSnapshots[
                    index
                  ].data();

                const publicData =
                  publicSnapshots[
                    index
                  ].data();


                previousTotals[
                  houseId
                ] =
                  houseData
                    .totalPoints;


                publicTotalsBeforeReset[
                  houseId
                ] =
                  publicData
                    .totalPoints;


                houseNames[
                  houseId
                ] =
                  houseData.name ||
                  houseId;

              }
            );


            /*
              COMPROBAMOS SI PANEL
              PRIVADO Y RANKING PÚBLICO
              ESTABAN SINCRONIZADOS
            */

            const rankingWasSynchronized =
              HOUSE_IDS.every(
                houseId =>
                  previousTotals[
                    houseId
                  ] ===
                  publicTotalsBeforeReset[
                    houseId
                  ]
              );


            /*
              CALCULAMOS GANADOR.

              También soportamos empate.
            */

            const maximumPoints =
              Math.max(
                ...Object.values(
                  previousTotals
                )
              );


            const winnerHouseIds =
              HOUSE_IDS.filter(
                houseId =>
                  previousTotals[
                    houseId
                  ] ===
                  maximumPoints
              );


            const winnerHouseNames =
              winnerHouseIds.map(
                houseId =>
                  houseNames[
                    houseId
                  ]
              );


            const collectiveTotal =
              Object.values(
                previousTotals
              ).reduce(
                (
                  total,
                  points
                ) =>
                  total + points,
                0
              );


            const serverTimestamp =
              FieldValue
                .serverTimestamp();


            /*
              ARCHIVO DEL PERIODO

              NO entra en houseMovements.
              El historial docente queda
              completamente intacto.
            */

            transaction.set(
              closureRef,
              {
                type:
                  "automatic-period-closure",

                schoolYear:
                  "2026-2027",

                periodId:
                  closure.periodId,

                periodName:
                  closure.periodName,

                label:
                  closure.label,

                scheduledDate:
                  dateKey,

                scheduledTime:
                  event.scheduleTime,

                closedAt:
                  serverTimestamp,

                previousTotals,

                publicTotalsBeforeReset,

                collectiveTotal,

                maximumPoints,

                winnerHouseIds,

                winnerHouseNames,

                rankingWasSynchronized,

                resetApplied: true,

                resetValue: 0,

                system:
                  "hogwarts-nss"
              }
            );


            /*
              REINICIO DE MARCADORES
              PRIVADOS
            */

            houseRefs.forEach(
              ref => {

                transaction.update(
                  ref,
                  {
                    totalPoints: 0,
                    updatedAt:
                      serverTimestamp
                  }
                );

              }
            );


            /*
              REINICIO DEL
              RANKING PÚBLICO
            */

            publicRankingRefs.forEach(
              ref => {

                transaction.update(
                  ref,
                  {
                    totalPoints: 0,
                    updatedAt:
                      serverTimestamp
                  }
                );

              }
            );


            return {
              status: "closed",
              dateKey,
              periodName:
                closure.periodName,
              winnerHouseNames
            };

          }
        );


      if (
        result.status ===
        "already-closed"
      ) {

        logger.info(
          "El periodo ya estaba cerrado.",
          {
            dateKey
          }
        );

        return;
      }


      logger.info(
        "Periodo cerrado correctamente.",
        {
          dateKey:
            result.dateKey,

          periodName:
            result.periodName,

          winners:
            result
              .winnerHouseNames
        }
      );

    }
  );
