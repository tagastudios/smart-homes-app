import { getCurrentUser } from "vuefire";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = await getCurrentUser(); // Waits for auth initialization

  if (!user) {
    return navigateTo("/auth/login");
  }
});
