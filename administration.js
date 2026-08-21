/* =========================================================
   HOGWARTS NSS · ADMINISTRACIÓN
   Consulta privada del equipo docente autorizado
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
  getDocFromServer,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


document.addEventListener(
  "DOMContentLoaded",
  () => {

    const teacherTotal =
      document.getElementById(
        "adminTeacherTotal"
      );

    const teacherActive =
      document.getElementById(
        "adminTeacherActive"
      );

    const teacherAdmins =
      document.getElementById(
        "adminTeacherAdmins"
      );

    const teacherInactive =
      document.getElementById(
        "adminTeacherInactive"
      );

    const teachersCount =
      document.getElementById(
        "adminTeachersCount"
      );

    const teachersLoading =
      document.getElementById(
        "adminTeachersLoading"
      );

    const teachersError =
      document.getElementById(
        "adminTeachersError"
      );

    const teachersEmpty =
      document.getElementById(
        "adminTeachersEmpty"
      );

    const teachersList =
      document.getElementById(
        "adminTeachersList"
      );


    const requiredElements = [
      teacherTotal,
      teacherActive,
      teacherAdmins,
      teacherInactive,
      teachersCount,
      teachersLoading,
      teachersError,
      teachersEmpty,
      teachersList
    ];


    if (
      requiredElements.some(
        element => !element
      )
    ) {

      console.error(
        "Administración no contiene todos los elementos necesarios."
      );

      return;
    }


    let unsubscribeTeachers =
      null;


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


    const cleanText = (
      value,
      fallback = "Sin especificar"
    ) => {

      const text =
        String(
          value || ""
        ).trim();


      return (
        text ||
        fallback
      );
    };


    const resetInterface = () => {

      teacherTotal.textContent =
        "—";

      teacherActive.textContent =
        "—";

      teacherAdmins.textContent =
        "—";

      teacherInactive.textContent =
        "—";

      teachersCount.textContent =
        "0 registros";

      teachersList.replaceChildren();

      teachersList.hidden =
        true;

      teachersEmpty.hidden =
        true;

      teachersError.hidden =
        true;

      teachersLoading.hidden =
        false;
    };


    const stopTeacherListener = () => {

      if (
        typeof unsubscribeTeachers ===
        "function"
      ) {

        unsubscribeTeachers();

        unsubscribeTeachers =
          null;
      }
    };


    const createTeacherRow = (
      teacher
    ) => {

      const row =
        document.createElement(
          "article"
        );


      row.className =
        "administration-teacher-row";


      const identity =
        document.createElement(
          "div"
        );


      identity.className =
        "administration-teacher-identity";


      const avatar =
        document.createElement(
          "span"
        );


      avatar.className =
        "administration-teacher-avatar";

      avatar.setAttribute(
        "aria-hidden",
        "true"
      );


      const displayName =
        cleanText(
          teacher.displayName,
          "Docente"
        );


      avatar.textContent =
        displayName
          .charAt(0)
          .toUpperCase();


      const copy =
        document.createElement(
          "div"
        );


      copy.className =
        "administration-teacher-copy";


      const name =
        document.createElement(
          "strong"
        );


      name.textContent =
        displayName;


      const email =
        document.createElement(
          "small"
        );


      email.textContent =
        cleanText(
          teacher.email,
          "Correo no disponible"
        );


      copy.append(
        name,
        email
      );


      identity.append(
        avatar,
        copy
      );


      const job =
        document.createElement(
          "span"
        );


      job.className =
        "administration-job";

      job.textContent =
        cleanText(
          teacher.jobTitle,
          "Profesorado"
        );


      const role =
        document.createElement(
          "span"
        );


      role.className =
        "administration-role-badge";

      role.textContent =
        roleLabels[
          teacher.role
        ] ||
        cleanText(
          teacher.role,
          "Rol pendiente"
        );


      const status =
        document.createElement(
          "span"
        );


      status.className =
        "administration-status-badge";

      status.dataset.active =
        teacher.active === true
          ? "true"
          : "false";

      status.textContent =
        teacher.active === true
          ? "Activa"
          : "Inactiva";


      row.append(
        identity,
        job,
        role,
        status
      );


      return row;
    };


    const renderTeachers = (
      teachers
    ) => {

      const activeCount =
        teachers.filter(
          teacher =>
            teacher.active === true
        ).length;


      const adminCount =
        teachers.filter(
          teacher =>
            teacher.role === "admin"
        ).length;


      const inactiveCount =
        teachers.length -
        activeCount;


      teacherTotal.textContent =
        String(
          teachers.length
        );

      teacherActive.textContent =
        String(
          activeCount
        );

      teacherAdmins.textContent =
        String(
          adminCount
        );

      teacherInactive.textContent =
        String(
          inactiveCount
        );


      teachersCount.textContent =
        teachers.length === 1
          ? "1 registro"
          : `${teachers.length} registros`;


      teachersLoading.hidden =
        true;

      teachersError.hidden =
        true;


      teachersList.replaceChildren();


      if (
        teachers.length === 0
      ) {

        teachersList.hidden =
          true;

        teachersEmpty.hidden =
          false;

        return;
      }


      teachersEmpty.hidden =
        true;


      teachers.forEach(
        teacher => {

          teachersList.appendChild(
            createTeacherRow(
              teacher
            )
          );
        }
      );


      teachersList.hidden =
        false;
    };


    const startTeacherListener = () => {

      stopTeacherListener();


      unsubscribeTeachers =
        onSnapshot(
          collection(
            db,
            "authorizedTeachers"
          ),

          snapshot => {

            const teachers =
              snapshot.docs
                .map(
                  teacherSnapshot => ({
                    id:
                      teacherSnapshot.id,

                    ...teacherSnapshot.data()
                  })
                )
                .sort(
                  (
                    teacherA,
                    teacherB
                  ) => {

                    if (
                      teacherA.active !==
                      teacherB.active
                    ) {

                      return (
                        teacherA.active === true
                          ? -1
                          : 1
                      );
                    }


                    return cleanText(
                      teacherA.displayName,
                      ""
                    ).localeCompare(
                      cleanText(
                        teacherB.displayName,
                        ""
                      ),
                      "es"
                    );
                  }
                );


            renderTeachers(
              teachers
            );
          },

          error => {

            console.error(
              "No se ha podido consultar el registro docente:",
              error
            );


            teachersLoading.hidden =
              true;

            teachersList.hidden =
              true;

            teachersEmpty.hidden =
              true;

            teachersError.hidden =
              false;
          }
        );
    };


    resetInterface();


    onAuthStateChanged(
      auth,
      async user => {

        stopTeacherListener();

        resetInterface();


        if (!user) {

          teachersLoading.hidden =
            true;

          return;
        }


        try {

          const currentTeacherReference =
            doc(
              db,
              "authorizedTeachers",
              user.uid
            );


          const currentTeacherSnapshot =
            await getDocFromServer(
              currentTeacherReference
            );


          if (
            !currentTeacherSnapshot.exists()
          ) {

            teachersLoading.hidden =
              true;

            return;
          }


          const currentTeacher =
            currentTeacherSnapshot.data();


          if (
            currentTeacher.active !== true ||
            currentTeacher.role !==
              "admin"
          ) {

            teachersLoading.hidden =
              true;

            return;
          }


          startTeacherListener();


        } catch (error) {

          console.error(
            "No se ha podido iniciar Administración:",
            error
          );


          teachersLoading.hidden =
            true;

          teachersError.hidden =
            false;
        }
      }
    );

  }
);
