// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@nuxt/image",
    "@nuxt/ui",
    "@nuxt/eslint",
    "@vite-pwa/nuxt",
    "nuxt-vuefire",
  ],
  css: ["~/assets/css/main.css"],
  vuefire: {
    config: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      appId: process.env.FIREBASE_APP_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    },
    auth: {
      enabled: true,
    },
    firestore: {
      enabled: true,
    },
    storage: {
      enabled: true,
    },
    admin: {
      serviceAccount: process.env.GOOGLE_APPLICATION_CREDENTIALS ? {
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
      } : undefined,
    },
  },
  pwa: {
    /* PWA options */
    manifest: {
      name: "Smart Homes",
      short_name: "Smart Homes",
      description: "Smart Homes",
      theme_color: "#000000",
      background_color: "#000000",
      display: "standalone",
    },
  },
});
