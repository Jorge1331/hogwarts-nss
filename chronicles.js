/* =========================================================
   HOGWARTS NSS · CRÓNICAS
   Gestión editorial privada, vista previa y publicación en El Profeta
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
  addDoc,
  collection,
  doc,
  getDocFromServer,
  serverTimestamp
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
/* =========================================================
   GUARDADO DE BORRADORES
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const chronicleTitle =
      document.getElementById(
        "chronicleTitle"
      );

    const chronicleCategory =
      document.getElementById(
        "chronicleCategory"
      );

    const chronicleScope =
      document.getElementById(
        "chronicleScope"
      );

    const chronicleBody =
      document.getElementById(
        "chronicleBody"
      );

    const chronicleDraftButton =
      document.getElementById(
        "chronicleDraftButton"
      );


    if (
      !chronicleTitle ||
      !chronicleCategory ||
      !chronicleScope ||
      !chronicleBody ||
      !chronicleDraftButton
    ) {

      console.error(
        "No se puede iniciar el guardado de borradores de Crónicas."
      );

      return;
    }


    const cleanText = value =>
      String(value || "")
        .trim();


    const allowedCategories =
      new Set([
        "legado",
        "torneo",
        "casas",
        "comunidad",
        "aprendizaje",
        "acontecimiento"
      ]);


    const allowedScopes =
      new Set([
        "hogwarts",
        "all",
        "gryffindor",
        "slytherin",
        "ravenclaw",
        "hufflepuff"
      ]);


    const restoreDraftButton = () => {

      window.setTimeout(
        () => {

          chronicleDraftButton.textContent =
            "Guardar borrador";

        },
        1800
      );
    };


    const saveDraft = async () => {

      const user =
        auth.currentUser;

      const title =
        cleanText(
          chronicleTitle.value
        );

      const body =
        cleanText(
          chronicleBody.value
        );

      const category =
        cleanText(
          chronicleCategory.value
        );

      const scope =
        cleanText(
          chronicleScope.value
        );


      if (!user) {

        chronicleDraftButton.textContent =
          "Sesión no disponible";

        restoreDraftButton();

        return;
      }


      if (
        title.length < 3 ||
        title.length > 90
      ) {

        chronicleDraftButton.textContent =
          "Revisa el titular";

        chronicleTitle.focus();

        restoreDraftButton();

        return;
      }


      if (
        body.length < 5 ||
        body.length > 500
      ) {

        chronicleDraftButton.textContent =
          "Revisa la crónica";

        chronicleBody.focus();

        restoreDraftButton();

        return;
      }


      if (
        !allowedCategories.has(
          category
        )
      ) {

        chronicleDraftButton.textContent =
          "Elige categoría";

        chronicleCategory.focus();

        restoreDraftButton();

        return;
      }


      if (
        !allowedScopes.has(
          scope
        )
      ) {

        chronicleDraftButton.textContent =
          "Ámbito no válido";

        restoreDraftButton();

        return;
      }


      chronicleDraftButton.disabled =
        true;

      chronicleDraftButton.textContent =
        "Guardando...";


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
          !teacherSnapshot.exists() ||
          teacherSnapshot.data().active !== true
        ) {

          throw new Error(
            "La autorización docente no está disponible."
          );
        }


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


        const chronicleReference =
          await addDoc(
            collection(
              db,
              "chronicles"
            ),
            {
              type:
                "chronicle",

              schoolYear:
                "2026-2027",

              title,

              body,

              category,

              scope,

              status:
                "draft",

              authorUid:
                user.uid,

              authorName,

              createdAt:
                serverTimestamp(),

              updatedAt:
                serverTimestamp()
            }
          );


        console.info(
          "Borrador de Crónicas guardado:",
          chronicleReference.id
        );


        chronicleDraftButton.textContent =
          "Borrador guardado ✓";

        restoreDraftButton();


      } catch (error) {

        console.error(
          "No se ha podido guardar el borrador:",
          error
        );


        chronicleDraftButton.textContent =
          error.code ===
            "permission-denied"
            ? "Permiso rechazado"
            : "Error al guardar";

        restoreDraftButton();


      } finally {

        chronicleDraftButton.disabled =
          false;
      }
    };


    chronicleDraftButton.addEventListener(
      "click",
      saveDraft
    );

  }
);
/* =========================================================
   ARCHIVO DE CRÓNICAS · ELEMENTOS
   ========================================================= */

#sectionCronicas .chronicles-list {
  display: grid;
  gap: 10px;
}


#sectionCronicas .chronicle-archive-item {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    auto;

  gap: 14px;

  padding: 14px 16px;

  border:
    1px solid rgba(239, 200, 115, 0.11);

  border-radius: 14px;

  background:
    rgba(255, 255, 255, 0.025);
}


#sectionCronicas .chronicle-archive-main {
  min-width: 0;
}


#sectionCronicas .chronicle-archive-topline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  gap: 8px;

  margin-bottom: 6px;
}


#sectionCronicas .chronicle-status-badge,
#sectionCronicas .chronicle-category-badge {
  display: inline-flex;
  align-items: center;

  min-height: 22px;

  padding: 0 8px;

  border-radius: 999px;

  font-size: 0.61rem;
  font-weight: 800;

  letter-spacing: 0.04em;
}


#sectionCronicas .chronicle-status-badge {
  color:
    rgba(248, 244, 233, 0.72);

  border:
    1px solid rgba(248, 244, 233, 0.11);

  background:
    rgba(248, 244, 233, 0.04);

  text-transform: uppercase;
}


#sectionCronicas
.chronicle-status-badge[data-status="draft"] {
  color: #d9c69d;

  border-color:
    rgba(217, 198, 157, 0.22);

  background:
    rgba(217, 198, 157, 0.07);
}


#sectionCronicas
.chronicle-status-badge[data-status="published"] {
  color: #efc873;

  border-color:
    rgba(239, 200, 115, 0.28);

  background:
    rgba(216, 168, 78, 0.08);
}


#sectionCronicas .chronicle-category-badge {
  color:
    rgba(239, 200, 115, 0.76);

  background:
    rgba(216, 168, 78, 0.045);
}


#sectionCronicas .chronicle-archive-title {
  margin: 0 0 5px;

  overflow: hidden;

  color: #f8f4e9;

  font-family:
    "Cinzel",
    Georgia,
    serif;

  font-size: 0.92rem;
  line-height: 1.35;

  text-overflow: ellipsis;
  white-space: nowrap;
}


#sectionCronicas .chronicle-archive-text {
  display: -webkit-box;
  overflow: hidden;

  margin: 0;

  color:
    rgba(248, 244, 233, 0.5);

  font-size: 0.72rem;
  line-height: 1.5;

  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}


#sectionCronicas .chronicle-archive-meta {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  flex-direction: column;

  min-width: 120px;

  gap: 4px;

  color:
    rgba(248, 244, 233, 0.42);

  font-size: 0.64rem;

  text-align: right;
}


#sectionCronicas .chronicle-archive-author {
  color:
    rgba(248, 244, 233, 0.68);

  font-weight: 700;
}


@media (max-width: 700px) {

  #sectionCronicas .chronicle-archive-item {
    grid-template-columns: 1fr;
  }


  #sectionCronicas .chronicle-archive-meta {
    align-items: flex-start;

    min-width: 0;

    text-align: left;
  }

}
