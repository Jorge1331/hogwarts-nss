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
  onSnapshot,
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
   MEMORIA DEL CURSO · CRÓNICAS EN TIEMPO REAL
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const chroniclesList =
      document.getElementById(
        "chroniclesList"
      );

    const chroniclesCounter =
      document.getElementById(
        "chroniclesCounter"
      );

    const chroniclesEmpty =
      document.getElementById(
        "chroniclesEmpty"
      );

    const filterButtons =
      Array.from(
        document.querySelectorAll(
          "[data-chronicle-filter]"
        )
      );


    if (
      !chroniclesList ||
      !chroniclesCounter ||
      !chroniclesEmpty
    ) {

      console.error(
        "No se puede iniciar la Memoria de Crónicas."
      );

      return;
    }


    const categoryLabels = {
      legado: "🔥 Legado del Fénix",
      torneo: "🪶 Torneo",
      casas: "🏆 Casas",
      comunidad: "🤝 Comunidad",
      aprendizaje: "📚 Aprendizaje",
      acontecimiento: "✨ Acontecimiento"
    };


    const statusLabels = {
      draft: "Borrador",
      published: "Publicada"
    };


    let chronicles = [];

    let activeFilter =
      "all";

    let unsubscribeChronicles =
      null;


    const formatDate = timestamp => {

      if (
        !timestamp ||
        typeof timestamp.toDate !== "function"
      ) {

        return "Fecha pendiente";
      }


      return new Intl.DateTimeFormat(
        "es-ES",
        {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }
      ).format(
        timestamp.toDate()
      );
    };


    const getVisibleChronicles = () => {

      if (
        activeFilter === "all"
      ) {

        return chronicles;
      }


      if (
        activeFilter === "published"
      ) {

        return chronicles.filter(
          chronicle =>
            chronicle.status ===
              "published"
        );
      }


      return chronicles.filter(
        chronicle =>
          chronicle.status ===
            "draft"
      );
    };


    const renderChronicles = () => {

      const visibleChronicles =
        getVisibleChronicles();


      chroniclesCounter.textContent =
        chronicles.length === 1
          ? "1 crónica"
          : `${chronicles.length} crónicas`;


      chroniclesList.replaceChildren();


      if (
        visibleChronicles.length === 0
      ) {

        chroniclesList.appendChild(
          chroniclesEmpty
        );

        return;
      }


      visibleChronicles.forEach(
        chronicle => {

          const article =
            document.createElement(
              "article"
            );


          article.className =
            "chronicle-archive-item";

          article.dataset.chronicleId =
            chronicle.id;


          const main =
            document.createElement(
              "div"
            );

          main.className =
            "chronicle-archive-main";


          const topline =
            document.createElement(
              "div"
            );

          topline.className =
            "chronicle-archive-topline";


          const statusBadge =
            document.createElement(
              "span"
            );

          statusBadge.className =
            "chronicle-status-badge";

          statusBadge.dataset.status =
            chronicle.status || "draft";

          statusBadge.textContent =
            statusLabels[
              chronicle.status
            ] ||
            "Borrador";


          const categoryBadge =
            document.createElement(
              "span"
            );

          categoryBadge.className =
            "chronicle-category-badge";

          categoryBadge.textContent =
            categoryLabels[
              chronicle.category
            ] ||
            "Crónica";


          topline.append(
            statusBadge,
            categoryBadge
          );


          const title =
            document.createElement(
              "h4"
            );

          title.className =
            "chronicle-archive-title";

          title.textContent =
            chronicle.title ||
            "Crónica sin titular";


          const text =
            document.createElement(
              "p"
            );

          text.className =
            "chronicle-archive-text";

          text.textContent =
            chronicle.body || "";


          main.append(
            topline,
            title,
            text
          );


          const meta =
            document.createElement(
              "div"
            );

          meta.className =
            "chronicle-archive-meta";


          const author =
            document.createElement(
              "span"
            );

          author.className =
            "chronicle-archive-author";

          author.textContent =
            chronicle.authorName ||
            "Profesorado";


          const date =
            document.createElement(
              "span"
            );

          date.textContent =
            formatDate(
              chronicle.updatedAt ||
              chronicle.createdAt
            );


          meta.append(
            author,
            date
          );


          article.append(
            main,
            meta
          );


          chroniclesList.appendChild(
            article
          );
        }
      );
    };


    filterButtons.forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            activeFilter =
              button.dataset
                .chronicleFilter ||
              "all";


            filterButtons.forEach(
              currentButton => {

                currentButton.classList.toggle(
                  "active",
                  currentButton === button
                );
              }
            );


            renderChronicles();
          }
        );
      }
    );


    onAuthStateChanged(
      auth,
      user => {

        if (
          unsubscribeChronicles
        ) {

          unsubscribeChronicles();

          unsubscribeChronicles =
            null;
        }


        if (!user) {

          chronicles = [];

          renderChronicles();

          return;
        }


        unsubscribeChronicles =
          onSnapshot(
            collection(
              db,
              "chronicles"
            ),
            snapshot => {

              chronicles =
                snapshot.docs
                  .map(
                    documentSnapshot => ({
                      id:
                        documentSnapshot.id,
                      ...documentSnapshot.data()
                    })
                  )
                  .sort(
                    (a, b) => {

                      const aTime =
                        a.updatedAt?.toMillis?.() ||
                        a.createdAt?.toMillis?.() ||
                        0;

                      const bTime =
                        b.updatedAt?.toMillis?.() ||
                        b.createdAt?.toMillis?.() ||
                        0;


                      return bTime - aTime;
                    }
                  );


              renderChronicles();
            },
            error => {

              console.error(
                "No se ha podido cargar la Memoria de Crónicas:",
                error
              );
            }
          );
      }
    );

  }
);
