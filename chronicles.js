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
  serverTimestamp,
  updateDoc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
/* =========================================================
   AUTORIZACIÓN DOCENTE COMÚN
   ========================================================= */

const ALLOWED_ROLES =
  new Set([
    "admin",
    "coordinator",
    "tutor",
    "teacher"
  ]);


const normaliseEmail = value =>
  String(
    value || ""
  )
    .trim()
    .toLowerCase();


const getAuthorizedTeacherProfile =
  async user => {

    if (
      !user ||
      !user.uid ||
      !user.email
    ) {
      return null;
    }


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
      !teacherSnapshot.exists()
    ) {
      return null;
    }


    const teacherData =
      teacherSnapshot.data();


    const role =
      String(
        teacherData.role || ""
      )
        .trim()
        .toLowerCase();


    if (
      teacherData.active !== true ||
      normaliseEmail(
        teacherData.email
      ) !==
        normaliseEmail(
          user.email
        ) ||
      !ALLOWED_ROLES.has(role)
    ) {
      return null;
    }


    return {
      displayName:
        String(
          teacherData.displayName ||
          user.displayName ||
          "Profesorado"
        ).trim(),

      email:
        normaliseEmail(
          teacherData.email
        ),

      role,

      active:
        true
    };
  };

let activeChronicleId = null;

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

      const teacherProfile =
        await getAuthorizedTeacherProfile(
          user
        );


      /*
       Si la sesión cambia mientras
       Firestore valida el perfil,
       ignoramos la respuesta antigua.
      */

      if (
        auth.currentUser?.uid !==
        user.uid
      ) {
        return;
      }


      if (!teacherProfile) {

        chroniclePreviewAuthor.textContent =
          "Firma del profesor/a";

        return;
      }


      chroniclePreviewAuthor.textContent =
        `Por ${teacherProfile.displayName}`;


    } catch (error) {

      console.error(
        "No se ha podido recuperar la firma de la crónica:",
        error
      );


      chroniclePreviewAuthor.textContent =
        "Firma del profesor/a";
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
        activeChronicleId
          ? "Actualizar borrador"
          : "Guardar borrador";

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

        const teacherProfile =
  await getAuthorizedTeacherProfile(
    user
  );


if (
  auth.currentUser?.uid !==
  user.uid
) {

  throw new Error(
    "La sesión docente ha cambiado."
  );
}


if (!teacherProfile) {

  throw new Error(
    "La autorización docente no está disponible."
  );
}


const authorName =
  teacherProfile.displayName;


      const wasEditing =
  Boolean(
    activeChronicleId
  );


if (activeChronicleId) {

  await updateDoc(
    doc(
      db,
      "chronicles",
      activeChronicleId
    ),
    {
      title,
      body,
      category,
      scope,

      updatedAt:
        serverTimestamp()
    }
  );


  console.info(
    "Borrador de Crónicas actualizado:",
    activeChronicleId
  );


} else {

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


  activeChronicleId =
    chronicleReference.id;


  console.info(
    "Borrador de Crónicas guardado:",
    activeChronicleId
  );
}


chronicleDraftButton.textContent =
  wasEditing
    ? "Borrador actualizado ✓"
    : "Borrador guardado ✓";

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
           const canEditDraft =
  chronicle.status === "draft" &&
  chronicle.authorUid ===
    auth.currentUser?.uid;


if (canEditDraft) {

  article.tabIndex = 0;

  article.setAttribute(
    "role",
    "button"
  );


  const openDraft = () => {

    const titleInput =
      document.getElementById(
        "chronicleTitle"
      );

    const categoryInput =
      document.getElementById(
        "chronicleCategory"
      );

    const scopeInput =
      document.getElementById(
        "chronicleScope"
      );

    const bodyInput =
      document.getElementById(
        "chronicleBody"
      );

    const draftButton =
      document.getElementById(
        "chronicleDraftButton"
      );


    if (
      !titleInput ||
      !categoryInput ||
      !scopeInput ||
      !bodyInput ||
      !draftButton
    ) {

      return;
    }


    activeChronicleId =
      chronicle.id;


    titleInput.value =
      chronicle.title || "";

    categoryInput.value =
      chronicle.category || "";

    scopeInput.value =
      chronicle.scope || "hogwarts";

    bodyInput.value =
      chronicle.body || "";


    titleInput.dispatchEvent(
      new Event(
        "input",
        {
          bubbles: true
        }
      )
    );


    categoryInput.dispatchEvent(
      new Event(
        "change",
        {
          bubbles: true
        }
      )
    );


    bodyInput.dispatchEvent(
      new Event(
        "input",
        {
          bubbles: true
        }
      )
    );


    draftButton.textContent =
      "Actualizar borrador";


    document
      .getElementById(
        "chronicleForm"
      )
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
  };


  article.addEventListener(
    "click",
    openDraft
  );


  article.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" ||
        event.key === " "
      ) {

        event.preventDefault();

        openDraft();
      }
    }
  );
}


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
/* =========================================================
   PUBLICACIÓN EN EL PROFETA
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const chroniclePublishButton =
      document.getElementById(
        "chroniclePublishButton"
      );

    const chronicleDraftButton =
      document.getElementById(
        "chronicleDraftButton"
      );

    const chronicleForm =
      document.getElementById(
        "chronicleForm"
      );

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


    if (
      !chroniclePublishButton ||
      !chronicleDraftButton ||
      !chronicleForm ||
      !chronicleTitle ||
      !chronicleCategory ||
      !chronicleScope ||
      !chronicleBody
    ) {

      console.error(
        "No se puede iniciar la publicación de Crónicas."
      );

      return;
    }


    const cleanText = value =>
      String(
        value || ""
      ).trim();


    const restorePublishButton = () => {

      window.setTimeout(
        () => {

          chroniclePublishButton.textContent =
            "Publicar en El Profeta";

        },
        2200
      );
    };


    const publishChronicle =
      async () => {

        const user =
          auth.currentUser;


        if (!user) {

          chroniclePublishButton.textContent =
            "Sesión no disponible";

          restorePublishButton();

          return;
        }


        if (!activeChronicleId) {

          chroniclePublishButton.textContent =
            "Abre un borrador primero";

          restorePublishButton();

          return;
        }


        chroniclePublishButton.disabled =
          true;

        chroniclePublishButton.textContent =
          "Comprobando...";


        try {

          const privateReference =
            doc(
              db,
              "chronicles",
              activeChronicleId
            );


          const privateSnapshot =
            await getDocFromServer(
              privateReference
            );


          if (
            !privateSnapshot.exists()
          ) {

            throw new Error(
              "El borrador ya no existe."
            );
          }


          const chronicle =
            privateSnapshot.data();


          if (
            chronicle.status !==
              "draft" ||
            chronicle.authorUid !==
              user.uid
          ) {

            throw new Error(
              "Este borrador no puede publicarse."
            );
          }


          const hasUnsavedChanges =
            cleanText(
              chronicleTitle.value
            ) !==
              cleanText(
                chronicle.title
              ) ||

            cleanText(
              chronicleBody.value
            ) !==
              cleanText(
                chronicle.body
              ) ||

            cleanText(
              chronicleCategory.value
            ) !==
              cleanText(
                chronicle.category
              ) ||

            cleanText(
              chronicleScope.value
            ) !==
              cleanText(
                chronicle.scope
              );


          if (
            hasUnsavedChanges
          ) {

            chroniclePublishButton.textContent =
              "Guarda cambios primero";

            restorePublishButton();

            return;
          }


          const confirmed =
            window.confirm(
              "¿Publicar esta crónica en El Profeta?\n\nDejará de ser un borrador y pasará a la zona pública."
            );


          if (!confirmed) {

            chroniclePublishButton.textContent =
              "Publicar en El Profeta";

            return;
          }


          chroniclePublishButton.textContent =
            "Publicando...";


          const publicReference =
            doc(
              db,
              "publicChronicles",
              activeChronicleId
            );


          const batch =
            writeBatch(
              db
            );


          batch.update(
            privateReference,
            {
              status:
                "published",

              updatedAt:
                serverTimestamp()
            }
          );


          batch.set(
            publicReference,
            {
              title:
                chronicle.title,

              body:
                chronicle.body,

              category:
                chronicle.category,

              scope:
                chronicle.scope,

              authorName:
                chronicle.authorName,

              publishedAt:
                serverTimestamp()
            }
          );


          await batch.commit();


          console.info(
            "Crónica publicada en El Profeta:",
            activeChronicleId
          );


          activeChronicleId =
            null;


          chronicleForm.reset();


          chronicleTitle.dispatchEvent(
            new Event(
              "input",
              {
                bubbles: true
              }
            )
          );


          chronicleCategory.dispatchEvent(
            new Event(
              "change",
              {
                bubbles: true
              }
            )
          );


          chronicleBody.dispatchEvent(
            new Event(
              "input",
              {
                bubbles: true
              }
            )
          );


          chronicleDraftButton.textContent =
            "Guardar borrador";


          chroniclePublishButton.textContent =
            "Publicado ✓";


          restorePublishButton();


        } catch (error) {

          console.error(
            "No se ha podido publicar la crónica:",
            error
          );


          chroniclePublishButton.textContent =
            error.code ===
              "permission-denied"
              ? "Permiso rechazado"
              : "Error al publicar";


          restorePublishButton();


        } finally {

          chroniclePublishButton.disabled =
            false;
        }
      };


    chroniclePublishButton.addEventListener(
      "click",
      publishChronicle
    );

  }
);
