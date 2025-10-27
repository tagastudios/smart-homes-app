import { initializeApp, getApps } from "firebase-admin/app";

export default defineNuxtPlugin(() => {
  // Only run on server side
  if (import.meta.client) return;

  // Initialize Firebase Admin SDK if not already initialized
  if (getApps().length === 0) {
    try {
      // Use environment variables for Firebase Admin SDK initialization
      const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS ? {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      } : undefined;

      initializeApp({
        credential: serviceAccount ? require('firebase-admin').credential.cert(serviceAccount) : undefined,
        projectId: process.env.FIREBASE_PROJECT_ID || "smart-homes-app-26938",
      });
    } catch (error) {
      console.error("Failed to initialize Firebase Admin SDK:", error);
    }
  }
});
