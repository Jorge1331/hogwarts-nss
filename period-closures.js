"use strict";


import {
  auth,
  db
} from "./firebase-config.js";


import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


import {
  doc,
  getDocFromServer,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


/* =========================================================
   HOGWARTS NSS · CIERRES DE PERIODO
   Plan Spark · Sin Cloud Functions
   ========================================================= */


const SCHOOL_YEAR =
  "2026-2027";


const HOUSE_IDS = [
  "gryffindor",
  "slytherin",
  "ravenclaw",
  "hufflepuff"
];


const ALLOWED_ROLES =
  new Set([
    "admin",
    "coordinator",
    "tutor",
    "teacher"
  ]);


const PERIODS = [

  {
    closureId:
      "2026-12-31",

    periodId:
      "periodo-1",

    periodName:
      "Primer periodo",

    /*
      Se considera vencido desde
      el 1 de enero de 2027.
    */

    dueFrom:
      new Date(
        "2027-01-01T00:00:00+01:00"
      )
  },

  {
    closureId:
      "2027-03-19",

    periodId:
      "periodo-2",

    periodName:
      "Segundo periodo",

    dueFrom:
      new Date(
        "2027-03-20T00:00:00+01:00"
      )
  },

  {
    closureId:
      "2027-06-21",

    periodId:
      "periodo-3",

    periodName:
      "Tercer periodo",

    dueFrom:
      new Date(
        "2027-06-22T00:00:00+02:00"
      )
  }

];


/* =========================================================
   PERFIL DOCENTE AUTORIZADO
   ========================================================= */


const getTeacherProfile =
  async user => {

    const teacherRef =
      doc(
        db,
        "authorizedTeachers",
        user.uid
      );


    const snapshot =
      await getDocFromServer(
        teacherRef
      );


    if (!snapshot.exists()) {
      return null;
    }


    const data =
      snapshot.data();


    const role =
      String(
        data.role || ""
      )
        .trim()
        .toLowerCase();


    const storedEmail =
      String(
        data.email || ""
      )
        .trim()
        .toLowerCase();


    const userEmail =
      String(
        user.email || ""
      )
        .trim()
        .toLowerCase();


    if (
      data.active !== true ||
      storedEmail !== userEmail ||
      !ALLOWED_ROLES.has(role)
    ) {

      return null;
    }


    return {

      displayName:
        String(
          data.displayName ||
          user.displayName ||
          "Docente"
        ).trim(),

      role
    };
  };


/* =========================================================
   CERRAR UN PERIODO
   ========================================================= */


const closePeriod =
  async (
    period,
    user,
    teacherProfile
  ) => {

    const closureRef =
      doc(
        db,
        "seasonClosures",
        period.closureId
      );


    const houseRefs =
      HOUSE_IDS.map(
        houseId =>
          doc(
            db,
            "houses",
            houseId
          )
      );


    const publicRefs =
      HOUSE_IDS.map(
        houseId =>
          doc(
            db,
            "publicRanking",
            houseId
          )
      );


    return runTransaction(
      db,
      async transaction => {

        /*
          Todas las lecturas se hacen
          antes de cualquier escritura.
        */

        const closureSnapshot =
          await transaction.get(
            closureRef
          );


        if (
          closureSnapshot.exists()
        ) {

          return {
            status:
              "already-closed"
          };
        }


        const houseSnapshots = [];

        for (
          const houseRef
          of houseRefs
        ) {

          houseSnapshots.push(
            await transaction.get(
              houseRef
            )
          );
        }


        const publicSnapshots = [];

        for (
          const publicRef
          of publicRefs
        ) {

          publicSnapshots.push(
            await transaction.get(
              publicRef
            )
          );
        }


        const previousTotals = {};

        const publicTotalsBeforeReset =
          {};

        const houseNames = {};


        HOUSE_IDS.forEach(
          (
            houseId,
            index
          ) => {

            const houseSnapshot =
              houseSnapshots[index];

            const publicSnapshot =
              publicSnapshots[index];


            if (
              !houseSnapshot.exists() ||
              !publicSnapshot.exists()
            ) {

              throw new Error(
                `Falta información de ${houseId}.`
              );
            }


            const houseData =
              houseSnapshot.data();

            const publicData =
              publicSnapshot.data();


            if (
              !Number.isInteger(
                houseData.totalPoints
              ) ||
              !Number.isInteger(
                publicData.totalPoints
              )
            ) {

              throw new Error(
                `Puntuación inválida en ${houseId}.`
              );
            }


            previousTotals[
              houseId
            ] =
              houseData.totalPoints;


            publicTotalsBeforeReset[
              houseId
            ] =
              publicData.totalPoints;


            houseNames[
              houseId
            ] =
              String(
                houseData.name ||
                houseId
              );

          }
        );


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


        const closureMarker =
          `closure:${period.closureId}`;


        const timestamp =
          serverTimestamp();


        /*
          Archivo histórico del periodo.
        */

        transaction.set(
          closureRef,
          {

            type:
              "period-closure",

            schoolYear:
              SCHOOL_YEAR,

            periodId:
              period.periodId,

            periodName:
              period.periodName,

            cutoffDate:
              period.closureId,

            createdAt:
              timestamp,

            createdBy:
              user.uid,

            createdByName:
              teacherProfile
                .displayName,

            previousTotals,

            publicTotalsBeforeReset,

            collectiveTotal,

            maximumPoints,

            winnerHouseIds,

            winnerHouseNames,

            rankingWasSynchronized,

            resetApplied:
              true,

            resetValue:
              0

          }
        );


        /*
          Solo reiniciamos marcadores.
          NO tocamos houseMovements.
        */

        houseRefs.forEach(
          houseRef => {

            transaction.update(
              houseRef,
              {

                totalPoints: 0,

                updatedAt:
                  timestamp,

                updatedBy:
                  user.uid,

                lastMovementId:
                  closureMarker

              }
            );

          }
        );


        publicRefs.forEach(
          publicRef => {

            transaction.update(
              publicRef,
              {

                totalPoints: 0,

                updatedAt:
                  timestamp

              }
            );

          }
        );


        return {

          status:
            "closed",

          periodName:
            period.periodName,

          winnerHouseNames

        };

      }
    );
  };


/* =========================================================
   COMPROBAR CIERRES PENDIENTES
   ========================================================= */


const checkPendingClosures =
  async (
    user,
    teacherProfile
  ) => {

    const now =
      new Date();


    for (
      const period
      of PERIODS
    ) {

      if (
        now < period.dueFrom
      ) {

        continue;
      }


      try {

        const result =
          await closePeriod(
            period,
            user,
            teacherProfile
          );


        if (
          result.status ===
          "closed"
        ) {

          console.info(
            `Hogwarts NSS · ${result.periodName} cerrado correctamente.`
          );
        }


      } catch (error) {

        /*
          Las reglas de Firestore serán
          la autoridad final.

          Si la fecha o los permisos no
          son válidos, el cierre no entra.
        */

        console.error(
          "No se ha podido comprobar el cierre de periodo:",
          error
        );

        return;
      }

    }
  };


/* =========================================================
   ACTIVACIÓN TRAS FIREBASE AUTH
   ========================================================= */


onAuthStateChanged(
  auth,
  async user => {

    if (!user) {
      return;
    }


    try {

      const teacherProfile =
        await getTeacherProfile(
          user
        );


     if (!teacherProfile) {
  return;
}


if (
  teacherProfile.role !==
  "admin"
) {
  return;
}


await checkPendingClosures(
  user,
  teacherProfile
);


    } catch (error) {

      console.error(
        "No se ha podido iniciar el control de periodos:",
        error
      );
    }

  }
);
