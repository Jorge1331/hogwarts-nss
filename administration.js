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
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc
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
    const invitationsCount =
      document.getElementById(
        "adminInvitationsCount"
      );

    const invitationForm =
      document.getElementById(
        "adminInvitationForm"
      );

    const invitationName =
      document.getElementById(
        "adminInvitationName"
      );

    const invitationEmail =
      document.getElementById(
        "adminInvitationEmail"
      );

    const invitationJob =
      document.getElementById(
        "adminInvitationJob"
      );

    const invitationSubmit =
      document.getElementById(
        "adminInvitationSubmit"
      );

    const invitationMessage =
      document.getElementById(
        "adminInvitationMessage"
      );

    const invitationsLoading =
      document.getElementById(
        "adminInvitationsLoading"
      );

    const invitationsError =
      document.getElementById(
        "adminInvitationsError"
      );

    const invitationsEmpty =
      document.getElementById(
        "adminInvitationsEmpty"
      );

    const invitationsList =
      document.getElementById(
        "adminInvitationsList"
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
  teachersList,
  invitationsCount,
  invitationForm,
  invitationName,
  invitationEmail,
  invitationJob,
  invitationSubmit,
  invitationMessage,
  invitationsLoading,
  invitationsError,
  invitationsEmpty,
  invitationsList
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
    let unsubscribeInvitations =
      null;

    let currentAdminUser =
      null;

    let invitationSubmitting =
      false;

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
    const classIds = [
      "5A",
      "5B",
      "6A",
      "6B"
    ];

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
    const normaliseEmail = (
      value
    ) => {

      return String(
        value || ""
      )
        .trim()
        .toLowerCase();
    };


    const isCorporateEmail = (
      email
    ) => {

      return /^[a-z0-9._%+-]+@colegiosocorro[.]es$/
        .test(
          normaliseEmail(email)
        );
    };


    const setInvitationMessage = (
      message = "",
      state = ""
    ) => {

      invitationMessage.textContent =
        message;

      if (state) {

        invitationMessage.dataset.state =
          state;

      } else {

        delete invitationMessage.dataset.state;
      }
    };


    const resetInvitationInterface =
      () => {

        currentAdminUser =
          null;

        invitationSubmitting =
          false;

        invitationForm.reset();

        invitationSubmit.disabled =
          true;

        invitationsCount.textContent =
          "0 invitaciones";

        invitationsList.replaceChildren();

        invitationsList.hidden =
          true;

        invitationsEmpty.hidden =
          true;

        invitationsError.hidden =
          true;

        invitationsLoading.hidden =
          false;

        setInvitationMessage();
      };


    const stopInvitationListener =
      () => {

        if (
          typeof unsubscribeInvitations ===
          "function"
        ) {

          unsubscribeInvitations();

          unsubscribeInvitations =
            null;
        }
      };


    const createInvitationRow = (
      invitation
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
          invitation.displayName,
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
          invitation.email,
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
          invitation.jobTitle,
          "Tutoría"
        );


      const role =
        document.createElement(
          "span"
        );

      role.className =
        "administration-role-badge";

      role.textContent =
        "Tutoría";

      const status =
        document.createElement(
          "span"
        );

      status.className =
        "administration-status-badge";

      const claimed =
        invitation.status ===
        "claimed";

      status.dataset.active =
        claimed
          ? "true"
          : "false";

      status.textContent =
        claimed
          ? "Activada"
          : "Pendiente";


       row.append(
        identity,
        job,
        role,
        status
      );

      return row;
    };


    const renderInvitations = (
      invitations
    ) => {

      invitationsCount.textContent =
        invitations.length === 1
          ? "1 invitación"
          : `${invitations.length} invitaciones`;


      invitationsLoading.hidden =
        true;

      invitationsError.hidden =
        true;

      invitationsList.replaceChildren();


      if (
        invitations.length === 0
      ) {

        invitationsList.hidden =
          true;

        invitationsEmpty.hidden =
          false;

        return;
      }


      invitationsEmpty.hidden =
        true;


      invitations.forEach(
        invitation => {

          invitationsList.appendChild(
            createInvitationRow(
              invitation
            )
          );
        }
      );


      invitationsList.hidden =
        false;
    };


    const startInvitationListener =
      () => {

        stopInvitationListener();


        unsubscribeInvitations =
          onSnapshot(
            collection(
              db,
              "teacherInvitations"
            ),

            snapshot => {

              const invitations =
                snapshot.docs
                  .map(
                    invitationSnapshot => ({
                      id:
                        invitationSnapshot.id,

                      ...invitationSnapshot.data()
                    })
                  )
                  .sort(
                    (
                      invitationA,
                      invitationB
                    ) => {

                      if (
                        invitationA.status !==
                        invitationB.status
                      ) {

                        return (
                          invitationA.status ===
                          "pending"
                            ? -1
                            : 1
                        );
                      }


                      return cleanText(
                        invitationA.displayName,
                        ""
                      ).localeCompare(
                        cleanText(
                          invitationB.displayName,
                          ""
                        ),
                        "es"
                      );
                    }
                  );


              renderInvitations(
                invitations
              );
            },

            error => {

              console.error(
                "No se han podido consultar las invitaciones:",
                error
              );

              invitationsLoading.hidden =
                true;

              invitationsList.hidden =
                true;

              invitationsEmpty.hidden =
                true;

              invitationsError.hidden =
                false;
            }
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
      const classAssignment =
        document.createElement(
          "div"
        );


      classAssignment.className =
        "administration-class-assignment";


      const classAssignmentLabel =
        document.createElement(
          "span"
        );


      classAssignmentLabel.className =
        "administration-class-label";

      classAssignmentLabel.textContent =
        "Grupos";


      const classAssignmentControls =
        document.createElement(
          "div"
        );


      classAssignmentControls.className =
        "administration-class-controls";


      if (
        teacher.role ===
        "admin"
      ) {

        const allClasses =
          document.createElement(
            "strong"
          );


        allClasses.className =
          "administration-all-classes";

        allClasses.textContent =
          "Todos";


        classAssignmentControls.appendChild(
          allClasses
        );

      } else {

        const assignedClasses =
          Array.isArray(
            teacher.assignedClasses
          )
            ? classIds.filter(
                classId =>
                  teacher.assignedClasses.includes(
                    classId
                  )
              )
            : [];


        classIds.forEach(
          classId => {

            const classButton =
              document.createElement(
                "button"
              );


            classButton.type =
              "button";

            classButton.className =
              "administration-class-button";

            classButton.textContent =
              classId;

            classButton.dataset.active =
              assignedClasses.includes(
                classId
              )
                ? "true"
                : "false";


            classButton.addEventListener(
              "click",
              async () => {

                if (
                  !currentAdminUser
                ) {

                  return;
                }


                const isAssigned =
                  assignedClasses.includes(
                    classId
                  );


                const nextAssignedClasses =
                  classIds.filter(
                    currentClassId => {

                      if (
                        currentClassId ===
                        classId
                      ) {

                        return !isAssigned;
                      }


                      return assignedClasses.includes(
                        currentClassId
                      );
                    }
                  );


                const classButtons =
                  classAssignmentControls
                    .querySelectorAll(
                      ".administration-class-button"
                    );


                classButtons.forEach(
                  button => {

                    button.disabled =
                      true;
                  }
                );


                try {

                  await updateDoc(
                    doc(
                      db,
                      "authorizedTeachers",
                      teacher.id
                    ),
                    {
                      assignedClasses:
                        nextAssignedClasses
                    }
                  );


                } catch (error) {

                  console.error(
                    "No se han podido actualizar los grupos del docente:",
                    error
                  );


                  classButtons.forEach(
                    button => {

                      button.disabled =
                        false;
                    }
                  );
                }
              }
            );


            classAssignmentControls.appendChild(
              classButton
            );
          }
        );
      }


      classAssignment.append(
        classAssignmentLabel,
        classAssignmentControls
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
        classAssignment,
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

    invitationForm.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        if (
          !currentAdminUser ||
          invitationSubmitting
        ) {

          return;
        }


        const displayName =
          cleanText(
            invitationName.value,
            ""
          );

        const email =
          normaliseEmail(
            invitationEmail.value
          );

        const jobTitle =
          cleanText(
            invitationJob.value,
            ""
          );


        if (
          displayName.length < 2 ||
          displayName.length > 80
        ) {

          setInvitationMessage(
            "Introduce un nombre válido.",
            "error"
          );

          return;
        }


        if (
          !isCorporateEmail(email)
        ) {

          setInvitationMessage(
            "El correo debe pertenecer a @colegiosocorro.es.",
            "error"
          );

          return;
        }


        if (
          jobTitle.length < 2 ||
          jobTitle.length > 80
        ) {

          setInvitationMessage(
            "Introduce un cargo válido.",
            "error"
          );

          return;
        }


        invitationSubmitting =
          true;

        invitationSubmit.disabled =
          true;

        setInvitationMessage(
          "Comprobando la invitación..."
        );


        try {

          const invitationReference =
            doc(
              db,
              "teacherInvitations",
              email
            );


          const existingInvitation =
            await getDocFromServer(
              invitationReference
            );


          if (
            existingInvitation.exists()
          ) {

            setInvitationMessage(
              "Ya existe una invitación para este correo.",
              "error"
            );

            return;
          }


          await setDoc(
            invitationReference,
            {
              email,
              displayName,
              jobTitle,
              role:
                "tutor",
              status:
                "pending",
              createdAt:
                serverTimestamp(),
              createdBy:
                currentAdminUser.uid,
              claimedAt:
                null,
              claimedUid:
                null
            }
          );


          invitationForm.reset();

          setInvitationMessage(
            "Invitación creada correctamente.",
            "success"
          );


        } catch (error) {

          console.error(
            "No se ha podido crear la invitación:",
            error
          );


          setInvitationMessage(
            "No se ha podido crear la invitación.",
            "error"
          );


        } finally {

          invitationSubmitting =
            false;

          invitationSubmit.disabled =
            !currentAdminUser;
        }
      }
    );


    resetInterface();
    resetInvitationInterface();

    onAuthStateChanged(
      auth,
      async user => {

      stopTeacherListener();
        stopInvitationListener();

        resetInterface();
        resetInvitationInterface();


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


                   currentAdminUser =
            user;

          invitationSubmit.disabled =
            false;

          startTeacherListener();
          startInvitationListener();


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
