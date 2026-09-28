/* =========================================================
   HOGWARTS NSS · EL PROFETA
   Lectura pública de crónicas publicadas
   ========================================================= */

import {
  db
} from "./firebase-config.js";

import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


/* =========================================================
   INICIO
   ========================================================= */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeProphetPage
  );

} else {

  initializeProphetPage();

}


/* =========================================================
   CARGA DE CRÓNICAS
   ========================================================= */

function initializeProphetPage() {

  const latestContainer =
    document.getElementById(
      "prophetLatestArticle"
    );

  const archiveContainer =
    document.getElementById(
      "prophetArchiveList"
    );


  if (
    !latestContainer ||
    !archiveContainer
  ) {

    console.error(
      "No se ha encontrado la estructura pública de El Profeta."
    );

    return;
  }


  onSnapshot(
    collection(
      db,
      "publicChronicles"
    ),

    snapshot => {

      const chronicles =
        snapshot.docs
          .map(
            documentSnapshot => ({
              id:
                documentSnapshot.id,

              ...documentSnapshot.data()
            })
          )
          .sort(
            (
              chronicleA,
              chronicleB
            ) => {

              const timeA =
                chronicleA
                  .publishedAt
                  ?.toMillis?.() || 0;

              const timeB =
                chronicleB
                  .publishedAt
                  ?.toMillis?.() || 0;


              return (
                timeB -
                timeA
              );
            }
          );


      renderProphetPage(
        latestContainer,
        archiveContainer,
        chronicles
      );
    },

    error => {

      console.error(
        "No se ha podido cargar El Profeta:",
        error
      );


      renderProphetStatus(
        latestContainer,
        "El Profeta no está disponible",
        "Las noticias volverán a mostrarse cuando se restablezca la conexión."
      );


      renderProphetStatus(
        archiveContainer,
        "Archivo no disponible",
        "No ha sido posible recuperar las crónicas del castillo."
      );
    }
  );
}


/* =========================================================
   RENDER GENERAL
   ========================================================= */

function renderProphetPage(
  latestContainer,
  archiveContainer,
  chronicles
) {

  latestContainer.replaceChildren();
  archiveContainer.replaceChildren();


  if (
    chronicles.length === 0
  ) {

    renderProphetStatus(
      latestContainer,
      "El Profeta espera nuevas crónicas",
      "La primera noticia del curso aparecerá aquí cuando sea publicada."
    );


    renderProphetStatus(
      archiveContainer,
      "El archivo todavía está vacío",
      "Las crónicas publicadas durante el curso se conservarán en este espacio."
    );

    return;
  }


  const [
    latestChronicle,
    ...archiveChronicles
  ] = chronicles;


  latestContainer.appendChild(
    createFeaturedChronicle(
      latestChronicle
    )
  );


  if (
    archiveChronicles.length === 0
  ) {

    renderProphetStatus(
      archiveContainer,
      "Todavía no hay noticias anteriores",
      "Las próximas publicaciones irán formando el archivo de El Profeta."
    );

    return;
  }


  archiveChronicles.forEach(
    chronicle => {

      archiveContainer.appendChild(
        createArchiveChronicle(
          chronicle
        )
      );
    }
  );
}


/* =========================================================
   NOTICIA PRINCIPAL
   ========================================================= */

function createFeaturedChronicle(
  chronicle
) {

  const article =
    document.createElement(
      "article"
    );

  article.className =
    "prophet-page-feature-article";


  const meta =
    createChronicleMeta(
      chronicle,
      true
    );


  const title =
    document.createElement(
      "h3"
    );

  title.textContent =
    cleanText(
      chronicle.title,
      "Crónica de Hogwarts NSS"
    );


  const body =
    document.createElement(
      "p"
    );

  body.className =
    "prophet-page-article-body";

  body.textContent =
    cleanText(
      chronicle.body,
      "Esta crónica todavía no tiene contenido."
    );


  const signature =
    createChronicleSignature(
      chronicle
    );


  article.append(
    meta,
    title,
    body,
    signature
  );


  return article;
}


/* =========================================================
   ARCHIVO
   ========================================================= */

function createArchiveChronicle(
  chronicle
) {

  const article =
    document.createElement(
      "article"
    );

  article.className =
    "prophet-page-archive-article";


  const meta =
    createChronicleMeta(
      chronicle,
      false
    );


  const title =
    document.createElement(
      "h3"
    );

  title.textContent =
    cleanText(
      chronicle.title,
      "Crónica de Hogwarts NSS"
    );


  const body =
    document.createElement(
      "p"
    );

  body.className =
    "prophet-page-article-body";

  body.textContent =
    cleanText(
      chronicle.body,
      "Esta crónica todavía no tiene contenido."
    );


  const signature =
    createChronicleSignature(
      chronicle
    );


  article.append(
    meta,
    title,
    body,
    signature
  );


  return article;
}


/* =========================================================
   METADATOS
   ========================================================= */

function createChronicleMeta(
  chronicle,
  featured
) {

  const meta =
    document.createElement(
      "div"
    );

  meta.className =
    "prophet-page-article-meta";


  const category =
    document.createElement(
      "span"
    );

  category.className =
    "prophet-page-category";


  const icon =
    document.createElement(
      "span"
    );

  icon.setAttribute(
    "aria-hidden",
    "true"
  );

  icon.textContent =
    getChronicleIcon(
      chronicle.category
    );


  const categoryText =
    document.createElement(
      "span"
    );

  categoryText.textContent =
    getChronicleCategoryLabel(
      chronicle.category
    );


  category.append(
    icon,
    categoryText
  );


  const date =
    document.createElement(
      "span"
    );

  date.className =
    "prophet-page-date";

  date.textContent =
    formatChronicleDate(
      chronicle.publishedAt
    );


  if (featured) {

    const latest =
      document.createElement(
        "span"
      );

    latest.className =
      "prophet-page-latest-label";

    latest.textContent =
      "Última publicación";


    meta.append(
      latest,
      category,
      date
    );

  } else {

    meta.append(
      category,
      date
    );

  }


  return meta;
}


/* =========================================================
   FIRMA
   ========================================================= */

function createChronicleSignature(
  chronicle
) {

  const signature =
    document.createElement(
      "footer"
    );

  signature.className =
    "prophet-page-article-signature";


  const author =
    document.createElement(
      "span"
    );

  author.textContent =
    `Por ${cleanText(
      chronicle.authorName,
      "Profesorado"
    )}`;


  const scope =
    document.createElement(
      "span"
    );

  scope.textContent =
    getChronicleScopeLabel(
      chronicle.scope
    );


  signature.append(
    author,
    scope
  );


  return signature;
}


/* =========================================================
   ESTADOS VACÍOS / ERROR
   ========================================================= */

function renderProphetStatus(
  container,
  titleText,
  bodyText
) {

  container.replaceChildren();


  const article =
    document.createElement(
      "article"
    );

  article.className =
    "prophet-page-loading";


  const title =
    document.createElement(
      "h3"
    );

  title.textContent =
    titleText;


  const body =
    document.createElement(
      "p"
    );

  body.textContent =
    bodyText;


  article.append(
    title,
    body
  );


  container.appendChild(
    article
  );
}


/* =========================================================
   CATEGORÍAS
   ========================================================= */

function getChronicleIcon(
  category
) {

  const icons = {

    legado:
      "🔥",

    torneo:
      "🪶",

    casas:
      "🏆",

    comunidad:
      "🤝",

    aprendizaje:
      "📚",

    acontecimiento:
      "✨"

  };


  return (
    icons[category] ||
    "📰"
  );
}


function getChronicleCategoryLabel(
  category
) {

  const labels = {

    legado:
      "Legado del Fénix",

    torneo:
      "Torneo",

    casas:
      "Casas",

    comunidad:
      "Comunidad",

    aprendizaje:
      "Aprendizaje",

    acontecimiento:
      "Acontecimiento"

  };


  return (
    labels[category] ||
    "Crónica"
  );
}


/* =========================================================
   ÁMBITO
   ========================================================= */

function getChronicleScopeLabel(
  scope
) {

  const labels = {

    hogwarts:
      "Hogwarts NSS",

    class:
      "Aula",

    course:
      "Curso",

    school:
      "Colegio"

  };


  return (
    labels[scope] ||
    "Hogwarts NSS"
  );
}


/* =========================================================
   FECHA
   ========================================================= */

function formatChronicleDate(
  timestamp
) {

  if (
    !timestamp ||
    typeof timestamp.toDate !==
      "function"
  ) {

    return "Fecha pendiente";
  }


  return new Intl.DateTimeFormat(
    "es-ES",
    {
      day:
        "numeric",

      month:
        "long",

      year:
        "numeric"
    }
  ).format(
    timestamp.toDate()
  );
}


/* =========================================================
   TEXTO SEGURO
   ========================================================= */

function cleanText(
  value,
  fallback = ""
) {

  const text =
    String(
      value || ""
    ).trim();


  return (
    text ||
    fallback
  );
}
