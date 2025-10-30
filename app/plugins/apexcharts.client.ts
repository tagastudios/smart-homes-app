import VueApexCharts from "vue3-apexcharts";

export default defineNuxtPlugin((nuxtApp) => {
  // Client-only: register ApexCharts
  nuxtApp.vueApp.use(VueApexCharts);
});
