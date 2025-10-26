<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4"
  >
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Smart Homes
        </h1>
        <p class="text-gray-600 dark:text-gray-300">
          Construction Business Expense Tracker
        </p>
      </div>

      <UCard>
        <template #header>
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
            Create Account
          </h2>
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
            />
          </UFormField>

          <UFormField label="Password" name="password">
            <UInput
              v-model="formState.password"
              type="password"
              placeholder="••••••••"
              required
            />
          </UFormField>

          <UFormField label="Confirm Password" name="confirmPassword">
            <UInput
              v-model="formState.confirmPassword"
              type="password"
              placeholder="••••••••"
              required
            />
          </UFormField>

          <div v-if="error" class="text-red-600 text-sm">
            {{ error }}
          </div>

          <UButton type="submit" block :loading="loading">
            Create Account
          </UButton>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div
                class="w-full border-t border-gray-300 dark:border-gray-600"
              />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-gray-800 text-gray-500"
                >Or continue with</span
              >
            </div>
          </div>

          <UButton
            @click="onGoogleSignIn"
            :loading="googleLoading"
            variant="outline"
            block
            icon="i-simple-icons-google"
          >
            Sign up with Google
          </UButton>
        </UForm>

        <template #footer>
          <div class="text-center text-sm text-gray-600 dark:text-gray-300">
            Already have an account?
            <NuxtLink
              to="/auth/login"
              class="text-primary-600 hover:underline font-medium"
            >
              Sign in
            </NuxtLink>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { z } from "zod";
import type { FormSubmitEvent } from "#ui/types";

definePageMeta({
  layout: false,
  middleware: "guest",
});

const { signup, signInWithGoogle } = useAppAuth();
const router = useRouter();

const schema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type Schema = z.output<typeof schema>;

const formState = reactive({
  email: "",
  password: "",
  confirmPassword: "",
});

const loading = ref(false);
const googleLoading = ref(false);
const error = ref("");

const route = useRoute();

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  loading.value = true;
  error.value = "";

  const result = await signup(event.data.email, event.data.password);

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
