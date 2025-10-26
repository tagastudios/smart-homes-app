import { getCurrentUser } from "vuefire";

export default defineNuxtPlugin(async () => {
  // Only run on client-side
  if (import.meta.server) return;

  const route = useRoute();
  const router = useRouter();
  const isAuthRoute = route.path.startsWith("/auth/");

  // console.log(
  //   "Auth loader plugin: Current route",
  //   route.path,
  //   "isAuthRoute:",
  //   isAuthRoute
  // );

  // If on auth pages, hide loader immediately
  if (isAuthRoute) {
    // console.log("Auth loader plugin: On auth route, hiding loader immediately");
    const loader = document.getElementById("global-auth-loader");
    if (loader) {
      loader.style.display = "none";
    }
    return;
  }

  // For protected routes, wait for Firebase auth to initialize
  try {
    // console.log("Auth loader plugin: Checking authentication...");
    const user = await getCurrentUser();

    // console.log(
    //   "Auth loader plugin: User status",
    //   user ? "authenticated" : "not authenticated"
    // );

    if (!user) {
      // console.log("Auth loader plugin: No user, redirecting to login");
      // Hide loader before redirect
      const loader = document.getElementById("global-auth-loader");
      if (loader) {
        loader.style.display = "none";
      }
      // Redirect to login
      await router.push({
        path: "/auth/login",
        query: { redirect: route.fullPath },
      });
      return;
    }

    // console.log("Auth loader plugin: User is authenticated, hiding loader");
    // Hide loader after successful auth check
    const loader = document.getElementById("global-auth-loader");
    if (loader) {
      // console.log("Auth loader plugin: Hiding loader after auth check");
      loader.style.display = "none";
    } else {
      // console.log("Auth loader plugin: Loader element not found!");
    }
  } catch (error) {
    console.error("Auth loader plugin: Auth initialization error:", error);
    // Hide loader even on error to prevent stuck loading
    const loader = document.getElementById("global-auth-loader");
    if (loader) {
      // console.log("Auth loader plugin: Hiding loader after error");
      loader.style.display = "none";
    }
  }
});
