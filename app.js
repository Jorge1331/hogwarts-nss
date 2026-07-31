/* =========================================================
   HOGWARTS NSS: EL LEGADO DEL FÉNIX
   Funcionamiento inicial del panel principal
   ========================================================= */

"use strict";
import {
  db
} from "./firebase-config.js";

import {
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* ---------------------------------------------------------
   CONFIGURACIÓN PROVISIONAL
--------------------------------------------------------- */

const CONFIG = {
  nextChallengeDate: "2026-11-27T09:00:00",
  nextChallengeName: "El desafío del Dragón"
};


/* ---------------------------------------------------------
   DATOS DE DEMOSTRACIÓN

   Más adelante estos datos procederán de Firebase.
--------------------------------------------------------- */

const PUBLIC_HOUSE_IDS = [
  "gryffindor",
  "slytherin",
  "ravenclaw",
  "hufflepuff"
];

const publicRankingDocuments =
  new Map();

let houses = [];

/* ---------------------------------------------------------
   INICIO DE LA APLICACIÓN
--------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  initializePublicRanking();
  initializeNavigation();
  initializeCountdown();
  initializeButtons();
  initializeMapLocations();
  initializeInventory();
});


/* ---------------------------------------------------------
   CLASIFICACIÓN DE LAS CASAS
--------------------------------------------------------- */
function initializePublicRanking() {

  PUBLIC_HOUSE_IDS.forEach(
    (houseId) => {

      const houseReference =
        doc(
          db,
          "publicRanking",
          houseId
        );


      onSnapshot(
        houseReference,

        (houseSnapshot) => {

          if (!houseSnapshot.exists()) {

            console.error(
              `No existe la casa pública ${houseId}.`
            );

            return;
          }


          const data =
            houseSnapshot.data();


          publicRankingDocuments.set(
            houseId,
            {
              id: houseId,

              name:
                String(
                  data.name || houseId
                ).trim(),

              emblem:
                String(
                  data.emblem || "✦"
                ).trim(),

              points:
                Number.isInteger(
                  data.totalPoints
                )
                  ? data.totalPoints
                  : 0,

              displayOrder:
                Number.isInteger(
                  data.displayOrder
                )
                  ? data.displayOrder
                  : 99,

              active:
                data.active === true
            }
          );


          /*
           Esperamos a recibir las cuatro casas
           antes de sustituir el ranking inicial.
          */

          if (
            publicRankingDocuments.size !==
            PUBLIC_HOUSE_IDS.length
          ) {

            return;
          }


          houses =
            Array.from(
              publicRankingDocuments.values()
            ).filter(
              (house) =>
                house.active === true
            );


          renderHouseRanking();
        },

        (error) => {

          console.error(
            `No se ha podido sincronizar ${houseId}:`,
            error
          );
        }
      );
    }
  );
}
function renderHouseRanking() {

  const rankingElement =
    document.querySelector(
      "#houseRanking"
    );


  if (!rankingElement) {
    return;
  }


  /*
   Guarda la posición visual anterior
   de cada casa antes de reconstruir la lista.
  */

  const previousPositions =
    new Map();


  rankingElement
    .querySelectorAll(
      ".ranking-row[data-house-id]"
    )
    .forEach(
      (row) => {

        previousPositions.set(
          row.dataset.houseId,
          row.getBoundingClientRect()
        );
      }
    );


  const sortedHouses =
    [...houses].sort(
      (houseA, houseB) => {

        if (
          houseA.points !==
          houseB.points
        ) {

          return (
            houseB.points -
            houseA.points
          );
        }


        return (
          houseA.displayOrder -
          houseB.displayOrder
        );
      }
    );


  /*
   Dos casas con los mismos puntos
   comparten la misma posición.
  */

  let previousPoints = null;
  let previousRank = 0;


  const rankedHouses =
    sortedHouses.map(
      (house, index) => {

        const rankPosition =
          previousPoints ===
            house.points
            ? previousRank
            : index + 1;


        previousPoints =
          house.points;

        previousRank =
          rankPosition;


        return {
          ...house,
          rankPosition
        };
      }
    );


  rankingElement.replaceChildren();


  rankedHouses.forEach(
    (house) => {

      const rankingRow =
        document.createElement(
          "li"
        );


      rankingRow.className =
        `ranking-row ${house.id}`;

      rankingRow.dataset.houseId =
        house.id;

      rankingRow.dataset.rankPosition =
        String(
          house.rankPosition
        );


      rankingRow.innerHTML = `
        <span class="ranking-position">
          ${house.rankPosition}.º
        </span>

        <span
          class="house-emblem"
          aria-hidden="true"
        >
          ${house.emblem}
        </span>

        <strong>
          ${house.name}
        </strong>

        <span
          class="house-score"
          data-house="${house.id}"
        >
          ${formatPoints(house.points)} pts
        </span>
      `;


      rankingElement.appendChild(
        rankingRow
      );
    }
  );


  animatePublicRanking(
    rankingElement,
    previousPositions
  );
}
function animatePublicRanking(
  rankingElement,
  previousPositions
) {

  if (
    previousPositions.size === 0 ||
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
  ) {

    return;
  }


  window.requestAnimationFrame(
    () => {

      rankingElement
        .querySelectorAll(
          ".ranking-row[data-house-id]"
        )
        .forEach(
          (row) => {

            const previousRectangle =
              previousPositions.get(
                row.dataset.houseId
              );


            if (!previousRectangle) {
              return;
            }


            const currentRectangle =
              row.getBoundingClientRect();


            const differenceX =
              previousRectangle.left -
              currentRectangle.left;

            const differenceY =
              previousRectangle.top -
              currentRectangle.top;


            if (
              Math.abs(differenceX) < 1 &&
              Math.abs(differenceY) < 1
            ) {

              return;
            }


            row.style.zIndex = "3";


            const animation =
              row.animate(
                [
                  {
                    transform:
                      `translate(${differenceX}px, ${differenceY}px)`,

                    boxShadow:
                      "0 0 0 rgba(239, 200, 115, 0)"
                  },
                  {
                    transform:
                      "translate(0, 0)",

                    boxShadow:
                      "0 0 22px rgba(239, 200, 115, 0.22)"
                  },
                  {
                    transform:
                      "translate(0, 0)",

                    boxShadow:
                      "0 0 0 rgba(239, 200, 115, 0)"
                  }
                ],
                {
                  duration: 850,

                  easing:
                    "cubic-bezier(0.22, 1, 0.36, 1)"
                }
              );


            animation.addEventListener(
              "finish",
              () => {

                row.style.removeProperty(
                  "z-index"
                );
              },
              {
                once: true
              }
            );
          }
        );
    }
  );
}
function formatPoints(points) {
  return new Intl.NumberFormat("es-ES").format(points);
}


/* ---------------------------------------------------------
   NAVEGACIÓN LATERAL
--------------------------------------------------------- */

function initializeNavigation() {
  const navigationItems = document.querySelectorAll(".nav-item");

  navigationItems.forEach((item) => {
    item.addEventListener("click", () => {
      navigationItems.forEach((navigationItem) => {
        navigationItem.classList.remove("active");
      });

      item.classList.add("active");

      const sectionName = item.dataset.section;

      handleNavigation(sectionName);
    });
  });
}


function handleNavigation(sectionName) {
  const sectionMap = {
    inicio: ".hero-banner",
    "gran-comedor": ".ranking-card",
    caliz: ".mission-card",
    callejon: ".inventory-card",
    mapa: ".map-card",
    gringotts: ".activity-card",
    pociones: ".event-card",
    torneo: ".upcoming-card",
    copa: ".ranking-card",
    biblioteca: ".site-footer"
  };

  const selector = sectionMap[sectionName];
  const targetElement = document.querySelector(selector);

  if (!targetElement) {
    showMagicMessage(
      "Esta estancia de Hogwarts todavía permanece cerrada."
    );

    return;
  }

  targetElement.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  highlightElement(targetElement);
}


function highlightElement(element) {
  element.classList.remove("magic-highlight");

  void element.offsetWidth;

  element.classList.add("magic-highlight");

  window.setTimeout(() => {
    element.classList.remove("magic-highlight");
  }, 1400);
}


/* ---------------------------------------------------------
   CUENTA ATRÁS
--------------------------------------------------------- */

function initializeCountdown() {
  updateCountdown();

  window.setInterval(updateCountdown, 60 * 60 * 1000);
}


function updateCountdown() {
  const countdownElement = document.querySelector(
    "#daysToNextChallenge"
  );

  if (!countdownElement) {
    return;
  }

  const now = new Date();
  const challengeDate = new Date(CONFIG.nextChallengeDate);

  if (Number.isNaN(challengeDate.getTime())) {
    countdownElement.textContent = "—";
    return;
  }

  const difference = challengeDate.getTime() - now.getTime();

  if (difference <= 0) {
    countdownElement.textContent = "0";
    return;
  }

  const remainingDays = Math.ceil(
    difference / (1000 * 60 * 60 * 24)
  );

  countdownElement.textContent = remainingDays;
}


/* ---------------------------------------------------------
   BOTONES GENERALES
--------------------------------------------------------- */

function initializeButtons() {
  const primaryButtons = document.querySelectorAll(
    ".primary-button"
  );

  const secondaryButtons = document.querySelectorAll(
    ".secondary-button"
  );

  const textButtons = document.querySelectorAll(
    ".text-button"
  );

  primaryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showMagicMessage(
        "La misión del Santo Cáliz estará disponible muy pronto."
      );
    });
  });

  secondaryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const buttonText = button.textContent
        .trim()
        .toLowerCase();

      if (buttonText.includes("clasificación")) {
        showRankingSummary();
        return;
      }

      if (buttonText.includes("evento")) {
        showMagicMessage(
          "La Niebla Gris se mueve por los pasillos de Hogwarts NSS."
        );
        return;
      }

      showMagicMessage(
        "Esta función se activará en la siguiente fase."
      );
    });
  });

  textButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showMagicMessage(
        "La Cámara de Recompensas todavía está siendo preparada."
      );
    });
  });

  const iconButtons = document.querySelectorAll(".icon-button");

  iconButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showMagicMessage(
        "No hay nuevas lechuzas en este momento."
      );
    });
  });
}


/* ---------------------------------------------------------
   RESUMEN DE CLASIFICACIÓN
--------------------------------------------------------- */

function showRankingSummary() {
 const sortedHouses = [...houses].sort(
  (houseA, houseB) => {

    if (
      houseA.points !==
      houseB.points
    ) {

      return (
        houseB.points -
        houseA.points
      );
    }

    return (
      houseA.displayOrder -
      houseB.displayOrder
    );
  }
);

  const leader = sortedHouses[0];
  const secondHouse = sortedHouses[1];

  const difference = leader.points - secondHouse.points;

  showMagicMessage(
    `${leader.name} lidera la Copa con ` +
    `${formatPoints(leader.points)} puntos. ` +
    `Su ventaja es de ${formatPoints(difference)} puntos.`
  );
}


/* ---------------------------------------------------------
   MAPA DEL MERODEADOR
--------------------------------------------------------- */

function initializeMapLocations() {
  const mapLocations = document.querySelectorAll(
    ".map-location"
  );

  mapLocations.forEach((location) => {
    location.addEventListener("click", () => {
      const locationName = location.textContent.trim();

      showMagicMessage(
        `${locationName} aparecerá como una estancia propia ` +
        `en una próxima versión del castillo.`
      );
    });
  });
}


/* ---------------------------------------------------------
   OBJETOS MÁGICOS
--------------------------------------------------------- */

function initializeInventory() {
  const inventoryItems = document.querySelectorAll(
    ".inventory-item"
  );

  inventoryItems.forEach((item) => {
    item.addEventListener("click", () => {
      const objectName =
        item.querySelector("small")?.textContent.trim() ??
        "Objeto mágico";

      showMagicMessage(
        `${objectName}: todavía no puede utilizarse.`
      );
    });
  });
}


/* ---------------------------------------------------------
   MENSAJES EMERGENTES
--------------------------------------------------------- */

function showMagicMessage(message) {
  removeExistingToast();

  const toast = document.createElement("div");

  toast.className = "magic-toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");

  toast.innerHTML = `
    <span class="magic-toast-icon">🪶</span>

    <div>
      <strong>Mensaje de Hogwarts NSS</strong>
      <p>${escapeHTML(message)}</p>
    </div>

    <button
      class="magic-toast-close"
      type="button"
      aria-label="Cerrar mensaje"
    >
      ×
    </button>
  `;

  document.body.appendChild(toast);

  const closeButton = toast.querySelector(
    ".magic-toast-close"
  );

  closeButton?.addEventListener("click", () => {
    hideToast(toast);
  });

  window.requestAnimationFrame(() => {
    toast.classList.add("visible");
  });

  window.setTimeout(() => {
    hideToast(toast);
  }, 5000);
}


function hideToast(toast) {
  if (!toast || !toast.isConnected) {
    return;
  }

  toast.classList.remove("visible");

  window.setTimeout(() => {
    toast.remove();
  }, 300);
}


function removeExistingToast() {
  const existingToast = document.querySelector(
    ".magic-toast"
  );

  existingToast?.remove();
}


function escapeHTML(value) {
  const temporaryElement = document.createElement("div");

  temporaryElement.textContent = String(value);

  return temporaryElement.innerHTML;
}


/* ---------------------------------------------------------
   HERRAMIENTAS PROVISIONALES DE PRUEBA

   Permiten cambiar puntos desde la consola del navegador:

   HogwartsNSS.addPoints("gryffindor", 100);
   HogwartsNSS.removePoints("slytherin", 50);
   HogwartsNSS.resetDemo();
--------------------------------------------------------- */

window.HogwartsNSS = {
  addPoints(houseId, points) {
    modifyHousePoints(houseId, Math.abs(Number(points)));
  },

  removePoints(houseId, points) {
    modifyHousePoints(
      houseId,
      -Math.abs(Number(points))
    );
  },

  resetDemo() {
    houses[0].points = 12540;
    houses[1].points = 11230;
    houses[2].points = 9870;
    houses[3].points = 8420;

    renderHouseRanking();

    showMagicMessage(
      "La clasificación de demostración ha sido restaurada."
    );
  },

  getRanking() {
    return [...houses]
      .sort(
        (houseA, houseB) =>
          houseB.points - houseA.points
      )
      .map((house) => ({
        casa: house.name,
        puntos: house.points
      }));
  }
};


function modifyHousePoints(houseId, points) {
  const house = houses.find(
    (currentHouse) => currentHouse.id === houseId
  );

  if (!house || !Number.isFinite(points)) {
    console.error(
      "Casa o cantidad de puntos no válida."
    );

    return;
  }

  house.points = Math.max(
    0,
    house.points + points
  );

  renderHouseRanking();

  const action =
    points >= 0
      ? "ha recibido"
      : "ha perdido";

  showMagicMessage(
    `${house.name} ${action} ` +
    `${formatPoints(Math.abs(points))} puntos.`
  );
}
