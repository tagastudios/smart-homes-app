import { getCurrentUser } from "vuefire";

export default defineNuxtPlugin(async () => {
  // Only run on client-side
  if (import.meta.server) return;

  const route = useRoute();
  const isAuthRoute = route.path.startsWith("/auth/");

  console.log(
    "Auth loader plugin: Current route",
    route.path,
    "isAuthRoute:",
    isAuthRoute
  );

  // If on auth pages, hide loader immediately
  if (isAuthRoute) {
    console.log("Auth loader plugin: On auth route, hiding loader immediately");
    const loader = document.getElementById("global-auth-loader");
    if (loader) {
      loader.style.display = "none";
    }
    return;
  }

  // For protected routes, wait for Firebase auth to initialize
  try {
    console.log("Auth loader plugin: Checking authentication...");
    const user = await getCurrentUser();

    console.log(
      "Auth loader plugin: User status",
      user ? "authenticated" : "not authenticated"
    );

    // If user is authenticated, hide loader
    if (user) {
      console.log("Auth loader plugin: User authenticated, hiding loader");
      const loader = document.getElementById("global-auth-loader");
      if (loader) {
        loader.style.display = "none";
      }
    } else {
      console.log(
        "Auth loader plugin: No user, hiding loader (middleware will handle redirect)"
      );
      // If no user, redirect to login (this should be handled by middleware)
      // But hide loader first to prevent stuck loading
      const loader = document.getElementById("global-auth-loader");
      if (loader) {
        loader.style.display = "none";
      }
    }
  } catch (error) {
    console.error("Auth loader plugin: Auth initialization error:", error);
    // Hide loader even on error to prevent stuck loading
    const loader = document.getElementById("global-auth-loader");
    if (loader) {
      loader.style.display = "none";
    }
  }
});
