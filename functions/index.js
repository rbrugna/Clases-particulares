import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fetch from "node-fetch";
import { logger } from "firebase-functions";

initializeApp();
const db = getFirestore();

function getCfg(){
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
  apiKey: "AIzaSyCLMTSYxCBXS5P9zARGOrwyffAzDj7XU4E",
  authDomain: "clases-particulares-1ba72.firebaseapp.com",
  projectId: "clases-particulares-1ba72",
  storageBucket: "clases-particulares-1ba72.firebasestorage.app",
  messagingSenderId: "1002503705019",
  appId: "1:1002503705019:web:756947d3ab65aa7517b49e",
  measurementId: "G-C8KN11E4X1"
};
  return globalThis?.process?.env?.CLOUD_RUNTIME_CONFIG
    ? JSON.parse(process.env.CLOUD_RUNTIME_CONFIG).wa
    : null;
}

export const notifyTeacherWhatsApp = onCall(async (req) => {
  if(!req.auth) throw new HttpsError("unauthenticated", "Debés estar logueado.");

  const roleSnap = await db.doc(`roles/${req.auth.uid}`).get();
  if(!roleSnap.exists || roleSnap.data().role !== "student"){
    throw new HttpsError("permission-denied", "Solo alumnos pueden notificar.");
  }

  const { date, start, end, durationMin, subject } = req.data || {};
  if(!date || !start || !end || !durationMin || !subject){
    throw new HttpsError("invalid-argument", "Faltan datos.");
  }

  const wa = getCfg();
  if(!wa?.token || !wa?.phone_number_id || !wa?.teacher_wa_id || !wa?.template_name){
    logger.warn("WhatsApp no configurado. Se omite envío.");
    return { ok:false, reason:"whatsapp_not_configured" };
  }

  const userSnap = await db.doc(`users/${req.auth.uid}`).get();
  const studentName = userSnap.exists ? (userSnap.data().displayName || "Alumno") : "Alumno";

  const url = `https://graph.facebook.com/v19.0/${wa.phone_number_id}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: wa.teacher_wa_id,
    type: "template",
    template: {
      name: wa.template_name,
      language: { code: "es_AR" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: studentName },
            { type: "text", text: subject },
            { type: "text", text: date },
            { type: "text", text: `${start}–${end}` },
            { type: "text", text: `${durationMin} min` }
          ]
        }
      ]
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${wa.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if(!res.ok){
    logger.error("WhatsApp error", data);
    return { ok:false, data };
  }

  return { ok:true, data };
});