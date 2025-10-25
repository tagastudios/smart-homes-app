// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/image", "@nuxt/ui", "@nuxt/eslint", "@vite-pwa/nuxt"],
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
