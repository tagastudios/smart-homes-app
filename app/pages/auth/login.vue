<template>
  <ClientOnly>
    <div class="min-h-screen bg-default text-default mobile-padding-bottom">
      <!-- Gradient Header -->
      <div
        class="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-6 rounded-b-3xl shadow-lg"
      >
        <div class="text-center">
          <h1 class="text-3xl font-bold text-white mb-1">Smart Homes</h1>
          <p class="text-purple-200 text-sm">
            Construction Business Expense Tracker
          </p>
        </div>
      </div>

      <!-- Content Container -->
      <div class="container mx-auto px-6 py-8 max-w-md">
        <UCard class="bg-elevated border border-default">
          <template #header>
            <h2 class="text-lg font-semibold">Sign In</h2>
          </template>

          <UForm
            :state="formState"
            :schema="schema"
            @submit="onSubmit"
            class="space-y-4"
          >
            <UFormField label="Email" name="email">
              <UInput
                v-model="formState.email"
                type="email"
                placeholder="your@email.com"
                required
                class="w-full"
              />
            </UFormField>

            <UFormField label="Password" name="password">
              <UInput
                v-model="formState.password"
                type="password"
                placeholder="••••••••"
                required
                class="w-full"
              />
            </UFormField>

            <UAlert
              v-if="error"
              color="error"
              variant="soft"
              :title="error"
              icon="i-lucide-alert-circle"
            />

            <UButton
              type="submit"
              block
              :loading="loading"
              class="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            >
              Sign In
            </UButton>

            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-default" />
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-elevated text-muted">
                  Or continue with
                </span>
              </div>
            </div>

            <UButton
              @click="onGoogleSignIn"
              :loading="googleLoading"
              variant="outline"
              block
              icon="i-simple-icons-google"
              class="border border-default text-muted hover:bg-accented"
            >
              Sign in with Google
            </UButton>
          </UForm>

          <template #footer>
            <div class="text-center space-y-2">
              <NuxtLink
                to="/auth/forgot-password"
                class="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Forgot password?
              </NuxtLink>
              <div class="text-sm text-muted">
                Don't have an account?
                <NuxtLink
                  to="/auth/signup"
                  class="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  Sign up
                </NuxtLink>
              </div>
            </div>
          </template>
        </UCard>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { z } from "zod";
import type { FormSubmitEvent } from "#ui/types";

definePageMeta({
  layout: false,
  middleware: "guest",
});

const { login, signInWithGoogle } = useAppAuth();
const router = useRouter();

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type Schema = z.output<typeof schema>;

const formState = reactive({
  email: "",
  password: "",
});

const loading = ref(false);
const googleLoading = ref(false);
const error = ref("");

const route = useRoute();

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  loading.value = true;
  error.value = "";

  const result = await login(event.data.email, event.data.password);

  if (result.error) {
    error.value = result.error;
    loading.value = false;
  } else {
    // Redirect to the page user was trying to access, or dashboard
    const redirectTo = (route.query.redirect as string) || "/";
    await router.push(redirectTo);
  }
};

const onGoogleSignIn = async () => {
  googleLoading.value = true;
  error.value = "";

  const result = await signInWithGoogle();

  if (result.error) {
    error.value = result.error;
    googleLoading.value = false;
  } else {
    // Redirect to the page user was trying to access, or dashboard
    const redirectTo = (route.query.redirect as string) || "/";
    await router.push(redirectTo);
  }
};
</script>
