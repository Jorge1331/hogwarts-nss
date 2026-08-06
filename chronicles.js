/* =========================================================
   HOGWARTS NSS · CRÓNICAS
   Gestión editorial privada y publicación en El Profeta
   ========================================================= */

"use strict";


import {
  auth,
  db
} from "./firebase-config.js";


/*
  Este módulo gestionará de forma independiente:

  - vista previa de la crónica;
  - borradores;
  - publicación;
  - archivo privado;
  - sincronización segura con El Profeta.

  La lógica se incorporará paso a paso.
*/
