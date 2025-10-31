<template>
  <ClientOnly>
    <div class="min-h-screen bg-slate-950 mobile-padding-bottom">
      <!-- Gradient Header -->
      <div
        class="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-6 rounded-b-3xl shadow-lg"
      >
        <div class="flex items-center justify-between">
          <UButton
            to="/auth/login"
            variant="ghost"
            class="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl px-3 py-2 text-white"
            icon="i-lucide-arrow-left"
          />
          <div class="text-center flex-1">
            <h1 class="text-3xl font-bold text-white mb-1">Smart Homes</h1>
            <p class="text-purple-200 text-sm">Reset Password</p>
          </div>
          <div class="w-10" />
        </div>
      </div>

      <!-- Content Container -->
      <div class="container mx-auto px-6 py-8 max-w-md">
        <UCard class="bg-slate-900 border-slate-800">
          <template #header>
            <h2 class="text-lg font-semibold text-white">Reset Password</h2>
          </template>

          <p class="text-slate-400 mb-6">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>

          <UForm
            :state="formState"
            :schema="schema"
            @submit="onSubmit"
            class="space-y-4"
          >
            <UFormField
              label="Email"
              name="email"
              :ui="{ label: 'text-white mb-2' }"
            >
              <UInput
                v-model="formState.email"
                type="email"
                placeholder="your@email.com"
                required
                class="w-full"
                :ui="{
                  base: 'bg-slate-800 border-slate-700 text-white w-full',
                }"
              />
            </UFormField>

            <UAlert
              v-if="error"
              color="error"
              variant="soft"
              :title="error"
              icon="i-lucide-alert-circle"
            />

            <UAlert
              v-if="success"
              color="success"
              variant="soft"
              :title="success"
              icon="i-lucide-check-circle"
            />

            <UButton
              type="submit"
              block
              :loading="loading"
              class="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            >
              Send Reset Link
            </UButton>
          </UForm>

          <template #footer>
            <div class="text-center text-sm text-slate-400">
              Remember your password?
              <NuxtLink
                to="/auth/login"
                class="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Sign in
              </NuxtLink>
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
