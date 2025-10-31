import { getCurrentUser } from "vuefire";

export default defineNuxtRouteMiddleware(async (to, _from) => {
  // Skip middleware check for auth routes
  if (to.path.startsWith("/auth/")) {
    return;
  }

  try {
    // Wait for Firebase auth to initialize
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user = await getCurrentUser(); // Waits for auth initialization

    if (!user) {
      // Redirect to login with the original path as a query parameter
      return navigateTo({
        path: "/auth/login",
        query: { redirect: to.fullPath },
      });
    }

    // User is authenticated, allow access
  } catch (error) {
    console.error("Auth middleware error:", error);
    // If there's an error, redirect to login as well
    return navigateTo({
      path: "/auth/login",
      query: { redirect: to.fullPath },
    });
  }
});
