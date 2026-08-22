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
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


/* =========================================================
   HOGWARTS NSS · CORRECCIONES DE MOVIMIENTOS
   Trazabilidad sin borrar ni alterar el registro original
   ========================================================= */


const ALLOWED_ROLES =
  new Set([
    "admin",
    "coordinator",
    "tutor",
    "teacher"
  ]);


const PRIVILEGED_CORRECTION_ROLES =
  new Set([
    "admin",
  ]);


const PERIOD_BOUNDARIES = [
  {
    before:
      Date.parse(
        "2027-01-01T00:00:00+01:00"
      ),
    closureId:
      "2026-12-31"
  },
  {
    before:
      Date.parse(
        "2027-03-20T00:00:00+01:00"
      ),
    closureId:
      "2027-03-19"
  },
  {
    before:
      Date.parse(
        "2027-06-22T00:00:00+02:00"
      ),
    closureId:
      "2027-06-21"
  }
];


let currentTeacherProfile = null;
let currentUser = null;

let correctionsByMovementId =
  new Map();

let unsubscribeCorrections = null;
let historyObserver = null;
let activeMovement = null;


/* =========================================================
   UTILIDADES
   ========================================================= */


const cleanText = (
  value,
  fallback = ""
) => {

  const text =
    String(value || "")
      .trim();

  return text || fallback;
};


const normaliseEmail = email =>
  cleanText(email)
    .toLowerCase();


const formatSignedPoints = amount =>
  amount > 0
    ? `+${amount}`
    : String(amount);


const formatDate = timestamp => {

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
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(
    timestamp.toDate()
  );
};


const getClosureIdForMovement =
  timestamp => {

    if (
      !timestamp ||
      typeof timestamp.toMillis !==
        "function"
    ) {
      return null;
    }


    const movementTime =
      timestamp.toMillis();


    const period =
      PERIOD_BOUNDARIES.find(
        item =>
          movementTime <
          item.before
      );


    return period?.closureId ||
      null;
  };


/* =========================================================
   PERFIL DOCENTE
   ========================================================= */


const getTeacherProfile =
  async user => {

    const teacherRef =
      doc(
        db,
        "authorizedTeachers",
        user.uid
      );


    const snapshot =
      await getDocFromServer(
        teacherRef
      );


    if (!snapshot.exists()) {
      return null;
    }


    const data =
      snapshot.data();


    const role =
      cleanText(
        data.role
      ).toLowerCase();


    if (
      data.active !== true ||
      normaliseEmail(
        data.email
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
        cleanText(
          data.displayName,
          user.displayName ||
            "Docente"
        ),

      role
    };
  };


const canCorrectMovement =
  movement => {

    if (
      !currentUser ||
      !currentTeacherProfile
    ) {
      return false;
    }


    return (
      movement.createdBy ===
        currentUser.uid ||
      PRIVILEGED_CORRECTION_ROLES.has(
        currentTeacherProfile.role
      )
    );
  };


/* =========================================================
   INTERFAZ DE CORRECCIÓN
   ========================================================= */


const createCorrectionModal = () => {

  if (
    document.getElementById(
      "movementCorrectionModal"
    )
  ) {
    return;
  }


  const backdrop =
    document.createElement(
      "div"
    );

  backdrop.id =
    "movementCorrectionModal";

  backdrop.className =
    "movement-correction-modal";

  backdrop.hidden = true;


  backdrop.innerHTML = `
    <div
      class="movement-correction-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="movementCorrectionTitle"
    >

      <div class="movement-correction-heading">

        <div>

          <p class="private-eyebrow">
            Trazabilidad segura
          </p>

          <h3 id="movementCorrectionTitle">
            Corregir movimiento
          </h3>

        </div>

        <button
          id="movementCorrectionClose"
          class="movement-correction-close"
          type="button"
          aria-label="Cerrar corrección"
        >
          ×
        </button>

      </div>


      <div
        id="movementCorrectionSummary"
        class="movement-correction-summary"
      ></div>


      <form id="movementCorrectionForm">

        <label class="movement-correction-field">

          <span>
            Motivo de la corrección
          </span>

          <textarea
            id="movementCorrectionReason"
            maxlength="160"
            rows="3"
            required
            placeholder="Explica brevemente por qué se revierte este movimiento."
          ></textarea>

          <small>
            No incluyas nombres ni información identificativa del alumnado.
          </small>

        </label>


        <p
          id="movementCorrectionMessage"
          class="movement-correction-message"
          role="status"
          aria-live="polite"
        ></p>


        <div class="movement-correction-actions">

          <button
            id="movementCorrectionCancel"
            type="button"
            class="movement-correction-secondary"
          >
            Cancelar
          </button>

          <button
            id="movementCorrectionSubmit"
            type="submit"
            class="movement-correction-primary"
          >
            Confirmar corrección
          </button>

        </div>

      </form>

    </div>
  `;


  document.body.append(
    backdrop
  );


  const closeButton =
    document.getElementById(
      "movementCorrectionClose"
    );

  const cancelButton =
    document.getElementById(
      "movementCorrectionCancel"
    );

  const form =
    document.getElementById(
      "movementCorrectionForm"
    );


  closeButton.addEventListener(
    "click",
    closeCorrectionModal
  );


  cancelButton.addEventListener(
    "click",
    closeCorrectionModal
  );


  backdrop.addEventListener(
    "click",
    event => {

      if (event.target === backdrop) {
        closeCorrectionModal();
      }
    }
  );


  form.addEventListener(
    "submit",
    submitCorrection
  );
};


const closeCorrectionModal = () => {

  const modal =
    document.getElementById(
      "movementCorrectionModal"
    );

  const form =
    document.getElementById(
      "movementCorrectionForm"
    );

  const message =
    document.getElementById(
      "movementCorrectionMessage"
    );


  if (form) {
    form.reset();
  }


  if (message) {

    message.textContent = "";

    message.className =
      "movement-correction-message";
  }


  if (modal) {
    modal.hidden = true;
  }


  activeMovement = null;
};


const setCorrectionMessage = (
  text,
  type = ""
) => {

  const message =
    document.getElementById(
      "movementCorrectionMessage"
    );


  if (!message) {
    return;
  }


  message.textContent =
    text;

  message.className =
    "movement-correction-message";


  if (type) {
    message.classList.add(
      type
    );
  }
};


const openCorrectionModal =
  movement => {

    createCorrectionModal();


    const modal =
      document.getElementById(
        "movementCorrectionModal"
      );

    const summary =
      document.getElementById(
        "movementCorrectionSummary"
      );

    const reason =
      document.getElementById(
        "movementCorrectionReason"
      );


    activeMovement =
      movement;


    const amount =
      Number.isInteger(
        movement.amount
      )
        ? movement.amount
        : 0;


    const correctionAmount =
      -amount;


    summary.replaceChildren();


    const title =
      document.createElement(
        "strong"
      );


    title.textContent =
      `${cleanText(
        movement.category,
        "Movimiento"
      )} · ${formatSignedPoints(
        amount
      )} puntos`;


    const explanation =
      document.createElement(
        "p"
      );


    explanation.textContent =
      `Se aplicará ${formatSignedPoints(
        correctionAmount
      )} puntos a la misma casa. El movimiento original permanecerá guardado.`;


    const metadata =
      document.createElement(
        "small"
      );


    metadata.textContent =
      `Registrado por ${cleanText(
        movement.createdByName,
        "Profesorado"
      )} · ${formatDate(
        movement.createdAt
      )}`;


    summary.append(
      title,
      explanation,
      metadata
    );


    modal.hidden = false;

    reason.focus();
  };


/* =========================================================
   DECORAR EL HISTORIAL EXISTENTE
   ========================================================= */


const createCorrectionBadge =
  correction => {

    const wrapper =
      document.createElement(
        "div"
      );


    wrapper.className =
      "movement-correction-status corrected";


    const badge =
      document.createElement(
        "strong"
      );


    badge.textContent =
      "Corregido";


    const detail =
      document.createElement(
        "small"
      );


    detail.textContent =
      `${formatSignedPoints(
        correction.correctionAmount
      )} · ${cleanText(
        correction.createdByName,
        "Profesorado"
      )}`;


    wrapper.append(
      badge,
      detail
    );


    return wrapper;
  };


const createCorrectionButton =
  movementId => {

    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";


    button.className =
      "movement-correction-button";


    button.dataset.correctMovement =
      movementId;


    button.textContent =
      "Corregir";


    return button;
  };


const decorateHistory = () => {

  const items =
    document.querySelectorAll(
      ".movement-history-item[data-movement-id]"
    );


  items.forEach(
    item => {

      const movementId =
        cleanText(
          item.dataset.movementId
        );


      if (!movementId) {
        return;
      }


      const previousControls =
        item.querySelector(
          ".movement-correction-controls"
        );


      if (previousControls) {
        previousControls.remove();
      }


      const controls =
        document.createElement(
          "div"
        );


      controls.className =
        "movement-correction-controls";


      const correction =
        correctionsByMovementId.get(
          movementId
        );


      if (correction) {

        controls.append(
          createCorrectionBadge(
            correction
          )
        );

      } else {

        controls.append(
          createCorrectionButton(
            movementId
          )
        );
      }


      item.append(
        controls
      );
    }
  );
};


const observeHistory = () => {

  const historyList =
    document.getElementById(
      "movementHistoryList"
    );


  if (!historyList) {
    return;
  }


  if (historyObserver) {
    historyObserver.disconnect();
  }


  historyObserver =
    new MutationObserver(
      decorateHistory
    );


  historyObserver.observe(
    historyList,
    {
      childList: true,
      subtree: false
    }
  );


  historyList.addEventListener(
    "click",
    handleHistoryClick
  );


  decorateHistory();
};


/* =========================================================
   CONSULTAR MOVIMIENTO
   ========================================================= */


const handleHistoryClick =
  async event => {

    const button =
      event.target.closest(
        "[data-correct-movement]"
      );


    if (!button) {
      return;
    }


    const movementId =
      cleanText(
        button.dataset
          .correctMovement
      );


    if (!movementId) {
      return;
    }


    button.disabled = true;


    try {

      if (
        correctionsByMovementId.has(
          movementId
        )
      ) {

        decorateHistory();

        return;
      }


      const movementRef =
        doc(
          db,
          "houseMovements",
          movementId
        );


      const movementSnapshot =
        await getDocFromServer(
          movementRef
        );


      if (!movementSnapshot.exists()) {

        throw new Error(
          "El movimiento ya no está disponible."
        );
      }


      const movement = {

        id:
          movementSnapshot.id,

        ...movementSnapshot.data()
      };


      if (
        !Number.isInteger(
          movement.amount
        ) ||
        movement.amount === 0
      ) {

        throw new Error(
          "Este movimiento no contiene una puntuación válida."
        );
      }


      if (
        !canCorrectMovement(
          movement
        )
      ) {

        throw new Error(
          "Solo puede corregir este movimiento quien lo registró o un miembro de coordinación."
        );
      }


      openCorrectionModal(
        movement
      );


    } catch (error) {

      console.error(
        "No se ha podido preparar la corrección:",
        error
      );


      window.alert(
        error.message ||
        "No se ha podido preparar la corrección."
      );


    } finally {

      button.disabled =
        false;
    }
  };


/* =========================================================
   TRANSACCIÓN DE CORRECCIÓN
   ========================================================= */


const submitCorrection =
  async event => {

    event.preventDefault();


    if (
      !activeMovement ||
      !currentUser ||
      !currentTeacherProfile
    ) {

      setCorrectionMessage(
        "La sesión o el movimiento ya no están disponibles.",
        "error"
      );

      return;
    }


    const reasonField =
      document.getElementById(
        "movementCorrectionReason"
      );

    const submitButton =
      document.getElementById(
        "movementCorrectionSubmit"
      );


    const reason =
      cleanText(
        reasonField?.value
      );


    if (
      reason.length < 5 ||
      reason.length > 160
    ) {

      setCorrectionMessage(
        "Escribe un motivo de entre 5 y 160 caracteres.",
        "error"
      );

      reasonField?.focus();

      return;
    }


    submitButton.disabled =
      true;


    setCorrectionMessage(
      "Aplicando la corrección..."
    );


    try {

      const movementId =
        activeMovement.id;


      const correctionRef =
        doc(
          db,
          "movementCorrections",
          movementId
        );


      const movementRef =
        doc(
          db,
          "houseMovements",
          movementId
        );


      const result =
        await runTransaction(
          db,
          async transaction => {

            const correctionSnapshot =
              await transaction.get(
                correctionRef
              );


            if (
              correctionSnapshot.exists()
            ) {

              throw new Error(
                "Este movimiento ya ha sido corregido."
              );
            }


            const movementSnapshot =
              await transaction.get(
                movementRef
              );


            if (
              !movementSnapshot.exists()
            ) {

              throw new Error(
                "El movimiento original ya no existe."
              );
            }


            const movement = {

              id:
                movementSnapshot.id,

              ...movementSnapshot.data()
            };


            if (
              !canCorrectMovement(
                movement
              )
            ) {

              throw new Error(
                "No tienes permiso para corregir este movimiento."
              );
            }


            if (
              !Number.isInteger(
                movement.amount
              ) ||
              movement.amount === 0
            ) {

              throw new Error(
                "La puntuación original no es válida."
              );
            }


            const houseId =
              cleanText(
                movement.houseId
              );


            const houseRef =
              doc(
                db,
                "houses",
                houseId
              );


            const publicRef =
              doc(
                db,
                "publicRanking",
                houseId
              );


            const houseSnapshot =
              await transaction.get(
                houseRef
              );


            const publicSnapshot =
              await transaction.get(
                publicRef
              );


            if (
              !houseSnapshot.exists() ||
              !publicSnapshot.exists()
            ) {

              throw new Error(
                "No se ha podido comprobar el marcador de la casa."
              );
            }


            const houseData =
              houseSnapshot.data();


            const publicData =
              publicSnapshot.data();


            if (
              !Number.isInteger(
                houseData.totalPoints
              ) ||
              !Number.isInteger(
                publicData.totalPoints
              )
            ) {

              throw new Error(
                "El marcador contiene datos no válidos."
              );
            }


            if (
              houseData.totalPoints !==
              publicData.totalPoints
            ) {

              throw new Error(
                "La corrección se ha cancelado porque los marcadores privado y público no están sincronizados."
              );
            }


            const closureId =
              getClosureIdForMovement(
                movement.createdAt
              );


            if (closureId) {

              const closureRef =
                doc(
                  db,
                  "seasonClosures",
                  closureId
                );


              const closureSnapshot =
                await transaction.get(
                  closureRef
                );


              if (
                closureSnapshot.exists()
              ) {

                throw new Error(
                  "Este movimiento pertenece a un periodo ya cerrado y no puede corregirse."
                );
              }
            }


            const correctionAmount =
              -movement.amount;


            const previousTotal =
              houseData.totalPoints;


            const newTotal =
              previousTotal +
              correctionAmount;


            if (
              !Number.isSafeInteger(
                newTotal
              )
            ) {

              throw new Error(
                "El nuevo total de puntos no es válido."
              );
            }


           const correctionMarker =
  movementId;

            transaction.update(
              houseRef,
              {

                totalPoints:
                  newTotal,

                updatedAt:
                  serverTimestamp(),

                updatedBy:
                  currentUser.uid,

                lastMovementId:
                  correctionMarker

              }
            );


            transaction.update(
              publicRef,
              {

                totalPoints:
                  newTotal,

                updatedAt:
                  serverTimestamp()

              }
            );


            transaction.set(
              correctionRef,
              {

                type:
                  "movement-correction",

                originalMovementId:
                  movementId,

                houseId,

                originalAmount:
                  movement.amount,

                correctionAmount,

                originalCategory:
                  cleanText(
                    movement.category,
                    "Movimiento"
                  ),

                reason,

                createdBy:
                  currentUser.uid,

                createdByName:
                  currentTeacherProfile
                    .displayName,

                teacherRole:
                  currentTeacherProfile
                    .role,

                createdAt:
                  serverTimestamp(),

                previousTotal,

                newTotal

              }
            );


            return {

              correctionAmount,

              newTotal
            };
          }
        );


      setCorrectionMessage(
        `Corrección aplicada: ${formatSignedPoints(
          result.correctionAmount
        )} puntos. Nuevo total: ${result.newTotal}.`,
        "success"
      );


      window.setTimeout(
        closeCorrectionModal,
        900
      );


    } catch (error) {

      console.error(
        "No se ha podido aplicar la corrección:",
        error
      );


      const message =
        error.code ===
          "permission-denied"
          ? "Firestore ha rechazado la corrección. Comprueba los permisos y las reglas de seguridad."
          : error.message ||
            "No se ha podido aplicar la corrección.";


      setCorrectionMessage(
        message,
        "error"
      );


    } finally {

      submitButton.disabled =
        false;
    }
  };


/* =========================================================
   SINCRONIZAR CORRECCIONES
   ========================================================= */


const loadCorrections = () => {

  if (unsubscribeCorrections) {
    return;
  }


  unsubscribeCorrections =
    onSnapshot(
      collection(
        db,
        "movementCorrections"
      ),

      snapshot => {

        correctionsByMovementId =
          new Map(
            snapshot.docs.map(
              correctionDocument => [

                correctionDocument.id,

                correctionDocument.data()
              ]
            )
          );


        decorateHistory();
      },

      error => {

        console.error(
          "No se han podido sincronizar las correcciones:",
          error
        );
      }
    );
};


/* =========================================================
   ACTIVACIÓN
   ========================================================= */


const initialiseCorrections = () => {

  createCorrectionModal();

  observeHistory();
};


if (
  document.readyState ===
    "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initialiseCorrections,
    {
      once: true
    }
  );

} else {

  initialiseCorrections();
}


onAuthStateChanged(
  auth,
  async user => {

    currentUser =
      user || null;

    currentTeacherProfile =
      null;


    if (!user) {

      if (
        unsubscribeCorrections
      ) {

        unsubscribeCorrections();

        unsubscribeCorrections =
          null;
      }


      correctionsByMovementId =
        new Map();


      decorateHistory();

      return;
    }


    try {

      const teacherProfile =
        await getTeacherProfile(
          user
        );


      if (!teacherProfile) {
        return;
      }


      currentTeacherProfile =
        teacherProfile;


      loadCorrections();


    } catch (error) {

      console.error(
        "No se ha podido iniciar el módulo de correcciones:",
        error
      );
    }
  }
);
