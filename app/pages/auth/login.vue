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
            Sign In
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

          <div v-if="error" class="text-red-600 text-sm">
            {{ error }}
          </div>

          <UButton type="submit" block :loading="loading"> Sign In </UButton>
        </UForm>

        <template #footer>
          <div class="text-center space-y-2">
            <NuxtLink
              to="/auth/forgot-password"
              class="text-sm text-primary-600 hover:underline"
            >
              Forgot password?
            </NuxtLink>
            <div class="text-sm text-gray-600 dark:text-gray-300">
              Don't have an account?
              <NuxtLink
                to="/auth/signup"
                class="text-primary-600 hover:underline font-medium"
              >
                Sign up
              </NuxtLink>
            </div>
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

const { login } = useAppAuth();
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
const error = ref("");

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  loading.value = true;
  error.value = "";

  const result = await login(event.data.email, event.data.password);

  if (result.error) {
    error.value = result.error;
    loading.value = false;
  } else {
    await router.push("/");
  }
};
</script>
