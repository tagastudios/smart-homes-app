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
      enabled: false,
    },
    firestore: {
      enabled: true,
    },
    storage: {
      enabled: true,
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
