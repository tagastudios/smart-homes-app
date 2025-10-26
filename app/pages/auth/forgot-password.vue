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
            Reset Password
          </h2>
        </template>

        <p class="text-gray-600 dark:text-gray-300 mb-6">
          Enter your email address and we'll send you a link to reset your
          password.
        </p>

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

          <div v-if="error" class="text-red-600 text-sm">
            {{ error }}
          </div>

          <div v-if="success" class="text-green-600 text-sm">
            {{ success }}
          </div>

          <UButton type="submit" block :loading="loading">
            Send Reset Link
          </UButton>
        </UForm>

        <template #footer>
          <div class="text-center text-sm text-gray-600 dark:text-gray-300">
            Remember your password?
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

const { resetPassword } = useAppAuth();

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

type Schema = z.output<typeof schema>;

const formState = reactive({
  email: "",
});

const loading = ref(false);
const error = ref("");
const success = ref("");

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  loading.value = true;
  error.value = "";
  success.value = "";

  const result = await resetPassword(event.data.email);

  if (result.error) {
    error.value = result.error;
  } else {
    success.value = "Password reset email sent! Please check your inbox.";
  }

  loading.value = false;
};
</script>
