/* =========================================================
   HOGWARTS NSS · CRÓNICAS
   Gestión editorial privada y publicación en El Profeta
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
  doc,
  getDocFromServer
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


document.addEventListener(
  "DOMContentLoaded",
  () => {


    /* =====================================================
       ELEMENTOS DE LA INTERFAZ
       ===================================================== */

    const chronicleTitle =
      document.getElementById(
        "chronicleTitle"
      );

    const chronicleCategory =
      document.getElementById(
        "chronicleCategory"
      );

    const chronicleBody =
      document.getElementById(
        "chronicleBody"
      );

    const chroniclePreviewCategory =
      document.getElementById(
        "chroniclePreviewCategory"
      );

    const chroniclePreviewTitle =
      document.getElementById(
        "chroniclePreviewTitle"
      );

    const chroniclePreviewText =
      document.getElementById(
        "chroniclePreviewText"
      );

    const chroniclePreviewAuthor =
      document.getElementById(
        "chroniclePreviewAuthor"
      );

    const chroniclePreviewDate =
      document.getElementById(
        "chroniclePreviewDate"
      );


    const requiredElements = [
      chronicleTitle,
      chronicleCategory,
      chronicleBody,
      chroniclePreviewCategory,
      chroniclePreviewTitle,
      chroniclePreviewText,
      chroniclePreviewAuthor,
      chroniclePreviewDate
    ];


    if (
      requiredElements.some(
        element => !element
      )
    ) {

      console.error(
        "Crónicas no contiene todos los elementos necesarios."
      );

      return;
    }


    /* =====================================================
       UTILIDADES
       ===================================================== */

    const cleanText = value =>
      String(value || "")
        .trim();


    const formatCurrentDate = () => {

      return new Intl.DateTimeFormat(
        "es-ES",
        {
          day: "2-digit",
          month: "long",
          year: "numeric"
        }
      ).format(
        new Date()
      );
    };


    /* =====================================================
       VISTA PREVIA DE EL PROFETA
       ===================================================== */

    const updatePreview = () => {

      const title =
        cleanText(
          chronicleTitle.value
        );

      const body =
        cleanText(
          chronicleBody.value
        );

      const selectedCategory =
        chronicleCategory
          .selectedOptions[0];


      chroniclePreviewTitle.textContent =
        title ||
        "El titular de la crónica aparecerá aquí";


      chroniclePreviewText.textContent =
        body ||
        "Mientras escribes, este espacio mostrará una vista previa de cómo se presentará la noticia en El Profeta.";


      chroniclePreviewCategory.textContent =
        chronicleCategory.value
          ? cleanText(
              selectedCategory?.textContent
            )
          : "Categoría";
    };


    chronicleTitle.addEventListener(
      "input",
      updatePreview
    );


    chronicleBody.addEventListener(
      "input",
      updatePreview
    );


    chronicleCategory.addEventListener(
      "change",
      updatePreview
    );


    chroniclePreviewDate.textContent =
      formatCurrentDate();


    updatePreview();


    /* =====================================================
       FIRMA DEL PROFESORADO
       ===================================================== */

    onAuthStateChanged(
      auth,
      async user => {

        if (!user) {

          chroniclePreviewAuthor.textContent =
            "Firma del profesor/a";

          return;
        }


        try {

          const teacherReference =
            doc(
              db,
              "authorizedTeachers",
              user.uid
            );


          const teacherSnapshot =
            await getDocFromServer(
              teacherReference
            );


          if (
            teacherSnapshot.exists() &&
            teacherSnapshot.data().active === true
          ) {

            const teacherData =
              teacherSnapshot.data();

            const authorName =
              cleanText(
                teacherData.displayName
              ) ||
              cleanText(
                user.displayName
              ) ||
              "Profesorado";


            chroniclePreviewAuthor.textContent =
              `Por ${authorName}`;

            return;
          }


          chroniclePreviewAuthor.textContent =
            cleanText(
              user.displayName
            ) ||
            "Profesorado";


        } catch (error) {

          console.error(
            "No se ha podido recuperar la firma de la crónica:",
            error
          );


          chroniclePreviewAuthor.textContent =
            cleanText(
              user.displayName
            ) ||
            "Profesorado";
        }
      }
    );

  }
);
