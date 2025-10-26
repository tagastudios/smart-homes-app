import { getCurrentUser } from "vuefire";

export default defineNuxtRouteMiddleware(async (to, _from) => {
  try {
    console.log("Auth middleware: Checking authentication for", to.path);

    // Wait a bit longer for Firebase auth to initialize
    await new Promise((resolve) => setTimeout(resolve, 100));

    const user = await getCurrentUser(); // Waits for auth initialization

    console.log(
      "Auth middleware: User status",
      user ? "authenticated" : "not authenticated"
    );

    if (!user) {
      console.log("Auth middleware: Redirecting to login");
      // Redirect to login with the original path as a query parameter
      return navigateTo({
        path: "/auth/login",
        query: { redirect: to.fullPath },
      });
    }

    console.log("Auth middleware: User authenticated, allowing access");
  } catch (error) {
    console.error("Auth middleware error:", error);
    // If there's an error, redirect to login as well
    return navigateTo({
      path: "/auth/login",
      query: { redirect: to.fullPath },
    });
  }
});
