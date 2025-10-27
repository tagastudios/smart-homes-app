import { initializeApp, getApps } from "firebase-admin/app";

export default defineNuxtPlugin(() => {
  // Only run on server side
  if (import.meta.client) return;

  // Initialize Firebase Admin SDK if not already initialized
  if (getApps().length === 0) {
    try {
      initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || "smart-homes-app-26938",
      });
    } catch (error) {
      console.error("Failed to initialize Firebase Admin SDK:", error);
    }
  }
});
