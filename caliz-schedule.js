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

    /* =====================================================
       SEPTIEMBRE 2026
       Inicio · hábitos, convivencia y esfuerzo
       ===================================================== */

    {
      id: "2026-09",

      label: "Septiembre 2026",

      weeks: [

        {
          start: "2026-09-09",
          end: "2026-09-13",
          categoryKey: "responsabilidad"
        },

        {
          start: "2026-09-14",
          end: "2026-09-20",
          categoryKey: "convivencia"
        },

        {
          start: "2026-09-21",
          end: "2026-09-27",
          categoryKey: "superacion"
        },

        {
          start: "2026-09-28",
          end: "2026-10-04",
          categoryKey: "lectura"
        }

      ]
    },


    /* =====================================================
       OCTUBRE 2026
       Participación · servicio · iniciativa
       ===================================================== */

    {
      id: "2026-10",

      label: "Octubre 2026",

      weeks: [

        {
          start: "2026-10-05",
          end: "2026-10-11",
          categoryKey: "participacion"
        },

        {
          start: "2026-10-12",
          end: "2026-10-18",
          categoryKey: "ayudaServicio"
        },

        {
          start: "2026-10-19",
          end: "2026-10-25",
          categoryKey: "trabajoVoluntario"
        },

        {
          start: "2026-10-26",
          end: "2026-11-01",
          categoryKey: "responsabilidad"
        }

      ]
    },


    /* =====================================================
       NOVIEMBRE 2026
       Convivencia · lectura · superación
       ===================================================== */

    {
      id: "2026-11",

      label: "Noviembre 2026",

      weeks: [

        {
          start: "2026-11-02",
          end: "2026-11-08",
          categoryKey: "convivencia"
        },

        {
          start: "2026-11-09",
          end: "2026-11-15",
          categoryKey: "lectura"
        },

        {
          start: "2026-11-16",
          end: "2026-11-22",
          categoryKey: "superacion"
        },

        {
          start: "2026-11-23",
          end: "2026-11-29",
          categoryKey: "trabajoVoluntario"
        }

      ]
    },


    /* =====================================================
       DICIEMBRE 2026
       Adviento · responsabilidad y servicio
       ===================================================== */

    {
      id: "2026-12",

      label: "Diciembre 2026",

      weeks: [

        {
          start: "2026-11-30",
          end: "2026-12-06",
          categoryKey: "trabajoVoluntario"
        },

        {
          start: "2026-12-07",
          end: "2026-12-13",
          categoryKey: "responsabilidad"
        },

        {
          start: "2026-12-14",
          end: "2026-12-20",
          categoryKey: "ayudaServicio"
        }

      ]
    },


    /* =====================================================
       ENERO 2027
       Regreso · reactivación de hábitos
       ===================================================== */

    {
      id: "2027-01",

      label: "Enero 2027",

      weeks: [

        {
          start: "2027-01-07",
          end: "2027-01-10",
          categoryKey: "responsabilidad"
        },

        {
          start: "2027-01-11",
          end: "2027-01-17",
          categoryKey: "participacion"
        },

        {
          start: "2027-01-18",
          end: "2027-01-24",
          categoryKey: "superacion"
        },

        {
          start: "2027-01-25",
          end: "2027-01-31",
          categoryKey: "lectura"
        }

      ]
    },


    /* =====================================================
       FEBRERO 2027
       Iniciativa · convivencia · servicio
       ===================================================== */

    {
      id: "2027-02",

      label: "Febrero 2027",

      weeks: [

        {
          start: "2027-02-01",
          end: "2027-02-07",
          categoryKey: "trabajoVoluntario"
        },

        {
          start: "2027-02-08",
          end: "2027-02-14",
          categoryKey: "convivencia"
        },

        {
          start: "2027-02-15",
          end: "2027-02-21",
          categoryKey: "ayudaServicio"
        },

        {
          start: "2027-02-22",
          end: "2027-02-28",
          categoryKey: "responsabilidad"
        }

      ]
    },


    /* =====================================================
       MARZO 2027
       Participación · esfuerzo · convivencia
       ===================================================== */

    {
      id: "2027-03",

      label: "Marzo 2027",

      weeks: [

        {
          start: "2027-03-01",
          end: "2027-03-07",
          categoryKey: "participacion"
        },

        {
          start: "2027-03-08",
          end: "2027-03-14",
          categoryKey: "superacion"
        },

        {
          start: "2027-03-15",
          end: "2027-03-21",
          categoryKey: "convivencia"
        },

        {
          start: "2027-03-22",
          end: "2027-03-24",
          categoryKey: "trabajoVoluntario"
        }

      ]
    },


    /* =====================================================
       ABRIL 2027
       Regreso de Pascua · Día del Libro
       ===================================================== */

    {
      id: "2027-04",

      label: "Abril 2027",

      weeks: [

        {
          start: "2027-04-06",
          end: "2027-04-11",
          categoryKey: "responsabilidad"
        },

        {
          start: "2027-04-12",
          end: "2027-04-18",
          categoryKey: "trabajoVoluntario"
        },

        {
          start: "2027-04-19",
          end: "2027-04-25",
          categoryKey: "lectura"
        },

        {
          start: "2027-04-26",
          end: "2027-05-02",
          categoryKey: "participacion"
        }

      ]
    },


    /* =====================================================
       MAYO 2027
       Recta final · esfuerzo y comunidad
       ===================================================== */

    {
      id: "2027-05",

      label: "Mayo 2027",

      weeks: [

        {
          start: "2027-05-03",
          end: "2027-05-09",
          categoryKey: "superacion"
        },

        {
          start: "2027-05-10",
          end: "2027-05-16",
          categoryKey: "convivencia"
        },

        {
          start: "2027-05-17",
          end: "2027-05-23",
          categoryKey: "ayudaServicio"
        },

        {
          start: "2027-05-24",
          end: "2027-05-30",
          categoryKey: "lectura"
        }

      ]
    },


    /* =====================================================
       JUNIO 2027
       Cierre del curso · último impulso
       ===================================================== */

    {
      id: "2027-06",

      label: "Junio 2027",

      weeks: [

        {
          start: "2027-05-31",
          end: "2027-06-06",
          categoryKey: "responsabilidad"
        },

        {
          start: "2027-06-07",
          end: "2027-06-13",
          categoryKey: "superacion"
        },

        {
          start: "2027-06-14",
          end: "2027-06-18",
          categoryKey: "convivencia"
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
