import { getCurrentUser } from "vuefire";

export default defineNuxtPlugin(async () => {
  // Only run on client-side
  if (import.meta.server) return;

  const route = useRoute();
  const router = useRouter();

  const checkAuth = async (path: string) => {
    const isAuthRoute = path.startsWith("/auth/");

    // If on auth pages, hide loader immediately
    if (isAuthRoute) {
      const loader = document.getElementById("global-auth-loader");
      if (loader) {
        loader.style.display = "none";
      }
      return;
    }

    // For protected routes, show loader and wait for Firebase auth to initialize
    try {
      // Show loader for protected routes
      const loader = document.getElementById("global-auth-loader");
      if (loader) {
        loader.style.display = "flex";
      }

      const user = await getCurrentUser();

      if (!user) {
        // Hide loader before redirect
        if (loader) {
          loader.style.display = "none";
        }
        // Redirect to login
        await router.push({
          path: "/auth/login",
          query: { redirect: path },
        });
        return;
      }

      // Hide loader after successful auth check
      if (loader) {
        loader.style.display = "none";
      }
    } catch (error) {
      console.error("Auth loader plugin: Auth initialization error:", error);
      // Hide loader even on error to prevent stuck loading
      const loader = document.getElementById("global-auth-loader");
      if (loader) {
        loader.style.display = "none";
      }
    }
  };

  // Initial check
  await checkAuth(route.path);

  // Add router guard to check auth on every navigation
  router.beforeEach(async (to, _from, next) => {
    // Skip check for auth routes
    if (to.path.startsWith("/auth/")) {
      next();
      return;
    }

    try {
      const user = await getCurrentUser();
      if (!user) {
        next({
          path: "/auth/login",
          query: { redirect: to.fullPath },
        });
        return;
      }
      next();
    } catch (error) {
      console.error("Router guard auth error:", error);
      next({
        path: "/auth/login",
        query: { redirect: to.fullPath },
      });
    }
  });
});
