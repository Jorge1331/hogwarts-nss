/* =========================================================
   HOGWARTS NSS · CARTA DEL SANTO CÁLIZ
   Calendario mensual de bonificaciones ×2
   ========================================================= */

"use strict";


/* =========================================================
   CATEGORÍAS EXISTENTES DEL PANEL

   IMPORTANTE:
   categoryValue debe coincidir EXACTAMENTE con el value
   que ya utiliza panel-profesores.html.

   Aquí no se crean nuevas categorías ni se modifican
   sus puntuaciones base.
   ========================================================= */

export const CALIZ_CATEGORIES =
  Object.freeze({

    lectura: {
      categoryValue:
        "Libro de lectura",

      publicLabel:
        "Lectura",

      description:
        "Cada punto conseguido por lectura cuenta doble para tu Casa."
    },


    trabajoVoluntario: {
      categoryValue:
        "Trabajo voluntario",

      publicLabel:
        "Trabajo voluntario",

      description:
        "Cada punto conseguido por trabajo voluntario cuenta doble para tu Casa."
    },


    responsabilidad: {
      categoryValue:
        "Tareas y responsabilidad",

      publicLabel:
        "Tareas y responsabilidad",

      description:
        "Cada punto conseguido por tareas y responsabilidad cuenta doble para tu Casa."
    },


    convivencia: {
      categoryValue:
        "Convivencia positiva",

      publicLabel:
        "Convivencia positiva",

      description:
        "Cada punto conseguido por convivencia positiva cuenta doble para tu Casa."
    },


    superacion: {
      categoryValue:
        "Esfuerzo y superación",

      publicLabel:
        "Esfuerzo y superación",

      description:
        "Cada punto conseguido por esfuerzo y superación cuenta doble para tu Casa."
    },


    participacion: {
      categoryValue:
        "Participación",

      publicLabel:
        "Participación",

      description:
        "Cada punto conseguido por participación cuenta doble para tu Casa."
    },


    ayudaServicio: {
      categoryValue:
        "Ayuda y servicio",

      publicLabel:
        "Ayuda y servicio",

      description:
        "Cada punto conseguido por ayuda y servicio cuenta doble para tu Casa."
    }

  });


/* =========================================================
   CARTAS MENSUALES

   Cada mes podrá contener cuatro o cinco semanas.

   Las fechas son inclusivas.

   Una semana puede terminar en el mes siguiente
   cuando forma parte de la carta del mes anterior.
   ========================================================= */

export const CALIZ_MONTHLY_CARDS =
  Object.freeze([

    {
      id:
        "2026-09",

      label:
        "Septiembre 2026",

      weeks: [

        {
          start:
            "2026-09-09",

          end:
            "2026-09-13",

          categoryKey:
            "responsabilidad"
        },


        {
          start:
            "2026-09-14",

          end:
            "2026-09-20",

          categoryKey:
            "convivencia"
        },


        {
          start:
            "2026-09-21",

          end:
            "2026-09-27",

          categoryKey:
            "superacion"
        },


        {
          start:
            "2026-09-28",

          end:
            "2026-10-04",

          categoryKey:
            "lectura"
        }

      ]
    }

  ]);


/* =========================================================
   FECHAS

   Se crean fechas locales para evitar desplazamientos
   inesperados de día por UTC.
   ========================================================= */

const parseLocalDate =
  (dateKey) => {

    const [
      year,
      month,
      day
    ] =
      String(dateKey)
        .split("-")
        .map(Number);


    return new Date(
      year,
      month - 1,
      day
    );
  };


const normaliseLocalDate =
  (date) => {

    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
  };


/* =========================================================
   BONIFICACIÓN ACTIVA

   Devuelve null cuando no existe una semana configurada.
   ========================================================= */

export const getActiveCalizBonus =
  (date = new Date()) => {

    const currentDate =
      normaliseLocalDate(
        date
      );


    for (
      const monthlyCard
      of CALIZ_MONTHLY_CARDS
    ) {

      for (
        let index = 0;
        index < monthlyCard.weeks.length;
        index += 1
      ) {

        const week =
          monthlyCard.weeks[index];


        const startDate =
          parseLocalDate(
            week.start
          );

        const endDate =
          parseLocalDate(
            week.end
          );


        if (
          currentDate < startDate ||
          currentDate > endDate
        ) {

          continue;
        }


        const category =
          CALIZ_CATEGORIES[
            week.categoryKey
          ];


        if (!category) {

          console.warn(
            "La Carta del Cáliz contiene una categoría desconocida:",
            week.categoryKey
          );

          return null;
        }


        return {
          monthId:
            monthlyCard.id,

          monthLabel:
            monthlyCard.label,

          weekNumber:
            index + 1,

          start:
            week.start,

          end:
            week.end,

          categoryKey:
            week.categoryKey,

          categoryValue:
            category.categoryValue,

          publicLabel:
            category.publicLabel,

          description:
            category.description,

          multiplier:
            2
        };
      }
    }


    return null;
  };


/* =========================================================
   CARTA COMPLETA DE UN MES

   Esta función servirá después para mostrar al profesorado
   las cuatro o cinco distinciones de la carta mensual.
   ========================================================= */

export const getCalizMonthlyCard =
  (monthId) => {

    const monthlyCard =
      CALIZ_MONTHLY_CARDS.find(
        card =>
          card.id === monthId
      );


    if (!monthlyCard) {
      return null;
    }


    return {
      id:
        monthlyCard.id,

      label:
        monthlyCard.label,

      weeks:
        monthlyCard.weeks.map(
          (
            week,
            index
          ) => {

            const category =
              CALIZ_CATEGORIES[
                week.categoryKey
              ];


            return {
              weekNumber:
                index + 1,

              start:
                week.start,

              end:
                week.end,

              categoryKey:
                week.categoryKey,

              categoryValue:
                category?.categoryValue || "",

              publicLabel:
                category?.publicLabel || "",

              description:
                category?.description || "",

              multiplier:
                2
            };
          }
        )
    };
  };
/* =========================================================
   PRÓXIMA BONIFICACIÓN

   Se utiliza cuando todavía no existe una distinción
   activa para la fecha consultada.
   ========================================================= */

export const getNextCalizBonus =
  (date = new Date()) => {

    const currentDate =
      normaliseLocalDate(
        date
      );


    const futureWeeks = [];


    for (
      const monthlyCard
      of CALIZ_MONTHLY_CARDS
    ) {

      monthlyCard.weeks.forEach(
        (
          week,
          index
        ) => {

          const startDate =
            parseLocalDate(
              week.start
            );


          if (
            startDate <=
            currentDate
          ) {

            return;
          }


          const category =
            CALIZ_CATEGORIES[
              week.categoryKey
            ];


          if (!category) {
            return;
          }


          futureWeeks.push({
            monthId:
              monthlyCard.id,

            monthLabel:
              monthlyCard.label,

            weekNumber:
              index + 1,

            start:
              week.start,

            end:
              week.end,

            startDate,

            categoryKey:
              week.categoryKey,

            categoryValue:
              category.categoryValue,

            publicLabel:
              category.publicLabel,

            description:
              category.description,

            multiplier:
              2
          });
        }
      );
    }


    if (
      futureWeeks.length === 0
    ) {

      return null;
    }


    futureWeeks.sort(
      (
        firstWeek,
        secondWeek
      ) =>
        firstWeek.startDate -
        secondWeek.startDate
    );


    const nextBonus =
      futureWeeks[0];


    return {
      monthId:
        nextBonus.monthId,

      monthLabel:
        nextBonus.monthLabel,

      weekNumber:
        nextBonus.weekNumber,

      start:
        nextBonus.start,

      end:
        nextBonus.end,

      categoryKey:
        nextBonus.categoryKey,

      categoryValue:
        nextBonus.categoryValue,

      publicLabel:
        nextBonus.publicLabel,

      description:
        nextBonus.description,

      multiplier:
        nextBonus.multiplier
    };
  };
