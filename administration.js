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
  getDocsFromServer,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
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
    const studentsCount =
      document.getElementById(
        "adminStudentsCount"
      );

    const studentImportForm =
      document.getElementById(
        "adminStudentImportForm"
      );

    const studentImportData =
      document.getElementById(
        "adminStudentImportData"
      );

    const studentPreviewButton =
      document.getElementById(
        "adminStudentPreviewButton"
      );

    const studentImportButton =
      document.getElementById(
        "adminStudentImportButton"
      );

    const studentImportMessage =
      document.getElementById(
        "adminStudentImportMessage"
      );

    const studentsPreviewEmpty =
      document.getElementById(
        "adminStudentsPreviewEmpty"
      );

    const studentsPreview =
      document.getElementById(
        "adminStudentsPreview"
      );
         const studentManagementCount =
      document.getElementById(
        "adminStudentManagementCount"
      );

    const studentManagementTabs =
      document.getElementById(
        "adminStudentManagementTabs"
      );

    const studentManagementLoading =
      document.getElementById(
        "adminStudentManagementLoading"
      );

    const studentManagementError =
      document.getElementById(
        "adminStudentManagementError"
      );

    const studentManagementEmpty =
      document.getElementById(
        "adminStudentManagementEmpty"
      );

    const studentManagementList =
      document.getElementById(
        "adminStudentManagementList"
      );

    const studentManagementMessage =
      document.getElementById(
        "adminStudentManagementMessage"
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
      invitationsList,
      studentsCount,
      studentImportForm,
      studentImportData,
      studentPreviewButton,
      studentImportButton,
      studentImportMessage,
      studentsPreviewEmpty,
      studentsPreview,
      studentManagementCount,
      studentManagementTabs,
      studentManagementLoading,
      studentManagementError,
      studentManagementEmpty,
      studentManagementList,
      studentManagementMessage
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
    let unsubscribeStudentManagement =
      null;

    let currentAdminUser =

    let invitationSubmitting =
      false;
    let preparedStudents =
      [];
       let studentImportSubmitting =
      false;

    let studentManagementStudents =
      [];

    let selectedStudentClassId =
      "5A";

    const studentHouseIds = [
      "gryffindor",
      "hufflepuff",
      "ravenclaw",
      "slytherin"
    ];

    const studentHouseLabels = {
      gryffindor:
        "Gryffindor",

      hufflepuff:
        "Hufflepuff",

      ravenclaw:
        "Ravenclaw",

      slytherin:
        "Slytherin"
    };
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
         const setStudentImportMessage = (
      message = "",
      state = ""
    ) => {

      studentImportMessage.textContent =
        message;

      if (state) {

        studentImportMessage.dataset.state =
          state;

      } else {

        delete studentImportMessage.dataset.state;
      }
    };


    const resetStudentPreview = () => {

      preparedStudents =
        [];

      studentsPreview.replaceChildren();

      studentsPreview.hidden =
        true;

      studentsPreviewEmpty.hidden =
        false;

      studentImportButton.disabled =
        true;

      setStudentImportMessage();
    };


    const resetStudentImportInterface =
      () => {

        studentImportForm.reset();

        studentsCount.textContent =
          "0 alumnos";

        studentPreviewButton.disabled =
          true;

        resetStudentPreview();
      };


    const parseStudentImportData =
      () => {

        const lines =
          studentImportData.value
            .split(
              /\r?\n/
            )
            .map(
              line =>
                line.trim()
            )
            .filter(
              line =>
                line.length > 0
            );


        if (
          lines.length === 0
        ) {

          throw new Error(
            "Pega primero el listado de alumnado."
          );
        }


        const classOrders =
          new Map(
            classIds.map(
              classId => [
                classId,
                0
              ]
            )
          );

        const seenStudents =
          new Set();

        const students =
          [];


        lines.forEach(
          (
            line,
            lineIndex
          ) => {

            const parts =
              line
                .split(
                  "|"
                )
                .map(
                  part =>
                    part.trim()
                );


            if (
              parts.length !== 3
            ) {

              throw new Error(
                `Línea ${lineIndex + 1}: formato incorrecto.`
              );
            }


            const classId =
              parts[0];

            const displayName =
              parts[1];

            const houseId =
              parts[2]
                .toLowerCase();


            if (
              !classIds.includes(
                classId
              )
            ) {

              throw new Error(
                `Línea ${lineIndex + 1}: grupo no válido.`
              );
            }


            if (
              displayName.length < 2 ||
              displayName.length > 80
            ) {

              throw new Error(
                `Línea ${lineIndex + 1}: nombre no válido.`
              );
            }


            if (
              !studentHouseIds.includes(
                houseId
              )
            ) {

              throw new Error(
                `Línea ${lineIndex + 1}: Casa no válida.`
              );
            }


            const studentKey =
              `${classId}:${displayName.toLocaleLowerCase(
                "es"
              )}`;


            if (
              seenStudents.has(
                studentKey
              )
            ) {

              throw new Error(
                `Línea ${lineIndex + 1}: alumno duplicado en ${classId}.`
              );
            }


            seenStudents.add(
              studentKey
            );


            const order =
              (
                classOrders.get(
                  classId
                ) || 0
              ) + 1;


            if (
              order > 40
            ) {

              throw new Error(
                `${classId} supera el máximo de 40 alumnos.`
              );
            }


            classOrders.set(
              classId,
              order
            );


            students.push({
              displayName,
              classId,
              houseId,
              personalPoints:
                0,
              active:
                true,
              schoolYear:
                "2026-2027",
              order
            });
          }
        );


        const missingClass =
          classIds.find(
            classId =>
              (
                classOrders.get(
                  classId
                ) || 0
              ) === 0
          );


        if (
          missingClass
        ) {

          throw new Error(
            `Falta alumnado del grupo ${missingClass}.`
          );
        }


        return students;
      };


    const createStudentPreviewSummary =
      students => {

        const summary =
          document.createElement(
            "div"
          );

        summary.className =
          "administration-student-preview-summary";


        studentHouseIds.forEach(
          houseId => {

            const item =
              document.createElement(
                "div"
              );

            item.className =
              "administration-student-preview-summary-item";


            const total =
              document.createElement(
                "strong"
              );

            total.textContent =
              String(
                students.filter(
                  student =>
                    student.houseId ===
                    houseId
                ).length
              );


            const label =
              document.createElement(
                "span"
              );

            label.textContent =
              studentHouseLabels[
                houseId
              ];


            item.append(
              total,
              label
            );

            summary.appendChild(
              item
            );
          }
        );


        return summary;
      };


    const createStudentPreviewGroup = (
      classId,
      students
    ) => {

      const group =
        document.createElement(
          "section"
        );

      group.className =
        "administration-student-preview-group";


      const heading =
        document.createElement(
          "header"
        );

      heading.className =
        "administration-student-preview-group-heading";


      const title =
        document.createElement(
          "strong"
        );

      title.textContent =
        classId;


      const count =
        document.createElement(
          "span"
        );

      count.textContent =
        `${students.length} alumnos`;


      heading.append(
        title,
        count
      );

      group.appendChild(
        heading
      );


      students.forEach(
        student => {

          const row =
            document.createElement(
              "div"
            );

          row.className =
            "administration-student-preview-row";


          const name =
            document.createElement(
              "span"
            );

          name.className =
            "administration-student-preview-name";

          name.textContent =
            `${student.order}. ${student.displayName}`;


          const house =
            document.createElement(
              "span"
            );

          house.className =
            "administration-student-preview-house";

          house.textContent =
            studentHouseLabels[
              student.houseId
            ];


          row.append(
            name,
            house
          );

          group.appendChild(
            row
          );
        }
      );


      return group;
    };


    const renderStudentPreview =
      students => {

        studentsPreview.replaceChildren();


        studentsPreview.appendChild(
          createStudentPreviewSummary(
            students
          )
        );


        const groups =
          document.createElement(
            "div"
          );

        groups.className =
          "administration-student-preview-groups";


        classIds.forEach(
          classId => {

            groups.appendChild(
              createStudentPreviewGroup(
                classId,
                students.filter(
                  student =>
                    student.classId ===
                    classId
                )
              )
            );
          }
        );


        studentsPreview.appendChild(
          groups
        );

        studentsPreviewEmpty.hidden =
          true;

        studentsPreview.hidden =
          false;
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
      const setStudentManagementMessage = (
      message = "",
      state = ""
    ) => {

      studentManagementMessage.textContent =
        message;

      if (state) {

        studentManagementMessage.dataset.state =
          state;

      } else {

        delete studentManagementMessage.dataset.state;
      }
    };


    const updateStudentManagementTabs =
      () => {

        studentManagementTabs
          .querySelectorAll(
            "[data-student-class]"
          )
          .forEach(
            button => {

              const selected =
                button.dataset.studentClass ===
                selectedStudentClassId;

              button.setAttribute(
                "aria-selected",
                selected
                  ? "true"
                  : "false"
              );
            }
          );
      };


    const resetStudentManagementInterface =
      () => {

        studentManagementStudents =
          [];

        selectedStudentClassId =
          "5A";

        studentManagementCount.textContent =
          "0 alumnos";

        studentManagementList.replaceChildren();

        studentManagementList.hidden =
          true;

        studentManagementEmpty.hidden =
          true;

        studentManagementError.hidden =
          true;

        studentManagementLoading.hidden =
          false;

        setStudentManagementMessage();

        updateStudentManagementTabs();
      };


    const stopStudentManagementListener =
      () => {

        if (
          typeof unsubscribeStudentManagement ===
          "function"
        ) {

          unsubscribeStudentManagement();

          unsubscribeStudentManagement =
            null;
        }
      };


    const createStudentManagementRow =
      student => {

        const row =
          document.createElement(
            "article"
          );

        row.className =
          "administration-student-management-row";

        row.dataset.active =
          student.active === true
            ? "true"
            : "false";


        const identity =
          document.createElement(
            "div"
          );

        identity.className =
          "administration-student-management-identity";


        const order =
          document.createElement(
            "span"
          );

        order.className =
          "administration-student-management-order";

        order.textContent =
          String(
            student.order
          );


        const copy =
          document.createElement(
            "div"
          );

        copy.className =
          "administration-student-management-copy";


        const name =
          document.createElement(
            "strong"
          );

        name.className =
          "administration-student-management-name";

        name.textContent =
          cleanText(
            student.displayName,
            "Alumno"
          );


        const meta =
          document.createElement(
            "span"
          );

        meta.className =
          "administration-student-management-meta";

        meta.textContent =
          student.active === true
            ? "Alumno activo"
            : "Alumno inactivo";


        copy.append(
          name,
          meta
        );

        identity.append(
          order,
          copy
        );


        const points =
          document.createElement(
            "div"
          );

        points.className =
          "administration-student-management-points";


        const pointsValue =
          document.createElement(
            "strong"
          );

        pointsValue.textContent =
          String(
            Number.isInteger(
              student.personalPoints
            )
              ? student.personalPoints
              : 0
          );


        const pointsLabel =
          document.createElement(
            "span"
          );

        pointsLabel.textContent =
          "Puntos";


        points.append(
          pointsValue,
          pointsLabel
        );


        const house =
          document.createElement(
            "label"
          );

        house.className =
          "administration-student-management-house";


        const houseLabel =
          document.createElement(
            "span"
          );

        houseLabel.textContent =
          "Casa";


        const houseSelect =
          document.createElement(
            "select"
          );

        houseSelect.disabled =
          true;

        houseSelect.setAttribute(
          "aria-label",
          `Casa de ${student.displayName}`
        );


        studentHouseIds.forEach(
          houseId => {

            const option =
              document.createElement(
                "option"
              );

            option.value =
              houseId;

            option.textContent =
              studentHouseLabels[
                houseId
              ];

            option.selected =
              student.houseId ===
              houseId;

            houseSelect.appendChild(
              option
            );
          }
        );


        house.append(
          houseLabel,
          houseSelect
        );


        const status =
          document.createElement(
            "button"
          );

        status.type =
          "button";

        status.className =
          "administration-student-management-status";

        status.dataset.active =
          student.active === true
            ? "true"
            : "false";

        status.textContent =
          student.active === true
            ? "Activo"
            : "Inactivo";

        status.disabled =
          true;


        row.append(
          identity,
          points,
          house,
          status
        );

        return row;
      };


    const renderStudentManagement =
      () => {

        updateStudentManagementTabs();

        studentManagementLoading.hidden =
          true;

        studentManagementError.hidden =
          true;

        studentManagementList.replaceChildren();


        const students =
          studentManagementStudents
            .filter(
              student =>
                student.classId ===
                selectedStudentClassId
            )
            .sort(
              (
                studentA,
                studentB
              ) =>
                studentA.order -
                studentB.order
            );


        studentManagementCount.textContent =
          students.length === 1
            ? "1 alumno"
            : `${students.length} alumnos`;


        if (
          students.length === 0
        ) {

          studentManagementList.hidden =
            true;

          studentManagementEmpty.hidden =
            false;

          return;
        }


        studentManagementEmpty.hidden =
          true;


        students.forEach(
          student => {

            studentManagementList.appendChild(
              createStudentManagementRow(
                student
              )
            );
          }
        );


        studentManagementList.hidden =
          false;
      };


    const startStudentManagementListener =
      () => {

        stopStudentManagementListener();


        unsubscribeStudentManagement =
          onSnapshot(
            collection(
              db,
              "students"
            ),

            snapshot => {

              studentManagementStudents =
                snapshot.docs.map(
                  studentSnapshot => ({
                    id:
                      studentSnapshot.id,

                    ...studentSnapshot.data()
                  })
                );


              studentsCount.textContent =
                studentManagementStudents.length === 1
                  ? "1 alumno"
                  : `${studentManagementStudents.length} alumnos`;


              renderStudentManagement();
            },

            error => {

              console.error(
                "No se ha podido consultar el alumnado:",
                error
              );


              studentManagementLoading.hidden =
                true;

              studentManagementList.hidden =
                true;

              studentManagementEmpty.hidden =
                true;

              studentManagementError.hidden =
                false;
            }
          );
      };


    studentManagementTabs.addEventListener(
      "click",
      event => {

        if (
          !currentAdminUser
        ) {

          return;
        }


        const button =
          event.target.closest(
            "[data-student-class]"
          );


        if (
          !button
        ) {

          return;
        }


        const classId =
          button.dataset.studentClass;


        if (
          !classIds.includes(
            classId
          )
        ) {

          return;
        }


        selectedStudentClassId =
          classId;

        setStudentManagementMessage();

        renderStudentManagement();
      }
    );
     studentImportData.addEventListener(
      "input",
      () => {

        resetStudentPreview();
      }
    );


    studentPreviewButton.addEventListener(
      "click",
      () => {

        if (
          !currentAdminUser
        ) {

          return;
        }


        try {

          const students =
            parseStudentImportData();


          preparedStudents =
            students;


          renderStudentPreview(
            preparedStudents
          );


                    setStudentImportMessage(
            `${preparedStudents.length} alumnos preparados. Revisa el reparto antes de guardar.`,
            "success"
          );

          studentImportButton.disabled =
            false;


        } catch (error) {

          console.error(
            "No se ha podido preparar el alumnado:",
            error
          );


          resetStudentPreview();


          setStudentImportMessage(
            error.message ||
              "No se ha podido preparar el alumnado.",
            "error"
          );
        }
      }
    );
         studentImportButton.addEventListener(
      "click",
      async () => {

        if (
          !currentAdminUser ||
          studentImportSubmitting ||
          preparedStudents.length === 0
        ) {

          return;
        }


        const confirmed =
          window.confirm(
            `Vas a crear ${preparedStudents.length} alumnos en Firestore. ¿Confirmas la importación?`
          );


        if (
          !confirmed
        ) {

          return;
        }


        studentImportSubmitting =
          true;

        studentPreviewButton.disabled =
          true;

        studentImportButton.disabled =
          true;


        setStudentImportMessage(
          "Comprobando el registro actual antes de guardar..."
        );


        try {

          const existingStudentsSnapshot =
            await getDocsFromServer(
              collection(
                db,
                "students"
              )
            );


          if (
            !existingStudentsSnapshot.empty
          ) {

            resetStudentPreview();


            setStudentImportMessage(
              "La colección de alumnado ya contiene registros. Se ha cancelado la importación para evitar duplicados.",
              "error"
            );

            return;
          }


          const batch =
            writeBatch(
              db
            );


          preparedStudents.forEach(
            student => {

              const studentReference =
                doc(
                  collection(
                    db,
                    "students"
                  )
                );


              batch.set(
                studentReference,
                {
                  displayName:
                    student.displayName,
                  classId:
                    student.classId,
                  houseId:
                    student.houseId,
                  personalPoints:
                    0,
                  active:
                    true,
                  schoolYear:
                    "2026-2027",
                  order:
                    student.order
                }
              );
            }
          );


          const importedCount =
            preparedStudents.length;


          setStudentImportMessage(
            `Guardando ${importedCount} alumnos...`
          );


          await batch.commit();


          studentImportForm.reset();

          resetStudentPreview();


          studentsCount.textContent =
            importedCount === 1
              ? "1 alumno"
              : `${importedCount} alumnos`;


          setStudentImportMessage(
            `${importedCount} alumnos guardados correctamente en Firestore.`,
            "success"
          );


        } catch (error) {

          console.error(
            "No se ha podido guardar el alumnado:",
            error
          );


          setStudentImportMessage(
            "No se ha podido guardar el alumnado. No se ha completado la importación.",
            "error"
          );


        } finally {

          studentImportSubmitting =
            false;


          studentPreviewButton.disabled =
            !currentAdminUser;


          studentImportButton.disabled =
            (
              !currentAdminUser ||
              preparedStudents.length === 0
            );
        }
      }
    );
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
    resetStudentImportInterface();
    resetStudentManagementInterface();

    onAuthStateChanged(
      auth,
      async user => {

      s        stopTeacherListener();
        stopInvitationListener();
        stopStudentManagementListener();

                resetInterface();
        resetInvitationInterface();
        resetStudentImportInterface();
        resetStudentManagementInterface();


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

          studentPreviewButton.disabled =
            false;

                   startTeacherListener();
          startInvitationListener();
          startStudentManagementListener();


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
