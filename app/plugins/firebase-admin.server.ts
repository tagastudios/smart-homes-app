import { initializeApp, getApps } from "firebase-admin/app";

export default defineNuxtPlugin(() => {
  // Initialize Firebase Admin SDK for server-side operations
  if (getApps().length === 0) {
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || "smart-homes-app-26938",
    });
  }
});
