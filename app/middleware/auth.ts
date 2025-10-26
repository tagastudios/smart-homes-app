export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAppAuth();

  if (!isAuthenticated.value) {
    return navigateTo("/auth/login");
  }
});
