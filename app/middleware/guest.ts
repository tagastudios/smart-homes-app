import { getCurrentUser } from "vuefire";

export default defineNuxtRouteMiddleware(async (to, _from) => {
  const user = await getCurrentUser(); // Waits for auth initialization

  if (user) {
    // If there's a redirect parameter, go there; otherwise go to dashboard
    const redirectTo = (to.query.redirect as string) || "/";
    return navigateTo(redirectTo);
  }
});
