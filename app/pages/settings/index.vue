<template>
  <ClientOnly>
    <div class="min-h-screen bg-slate-950 mobile-padding-bottom">
      <!-- Gradient Header -->
      <div
        class="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-6 rounded-b-3xl shadow-lg"
      >
        <div class="flex items-center justify-between">
          <UButton
            to="/"
            variant="ghost"
            class="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl px-3 py-2 text-white"
            icon="i-lucide-arrow-left"
          />
          <div>
            <h1 class="text-2xl font-bold text-white mb-1">Settings</h1>
            <p class="text-purple-200 text-sm">Profile & Preferences</p>
          </div>
          <div class="w-10" />
        </div>
      </div>

      <div class="container mx-auto px-6 py-6 space-y-6">
        <!-- Profile Section -->
        <UCard class="bg-slate-900 border-slate-800">
          <template #header>
            <h2 class="text-lg font-semibold text-white">Profile</h2>
          </template>

          <div class="space-y-4">
            <UFormField label="First Name" :ui="{ label: 'text-white mb-2' }">
              <UInput
                v-model="profile.firstName"
                placeholder="Enter your first name"
                :ui="{ base: 'bg-slate-800 border-slate-700 text-white' }"
              />
            </UFormField>

            <UFormField label="Last Name" :ui="{ label: 'text-white mb-2' }">
              <UInput
                v-model="profile.lastName"
                placeholder="Enter your last name"
                :ui="{ base: 'bg-slate-800 border-slate-700 text-white' }"
              />
            </UFormField>

            <UFormField label="Email" :ui="{ label: 'text-white mb-2' }">
              <UInput
                :value="user?.email || ''"
                disabled
                :ui="{
                  base: 'bg-slate-800/50 border-slate-700 text-slate-400',
                }"
              />
              <template #description>
                <span class="text-slate-400 text-sm"
                  >Email cannot be changed</span
                >
              </template>
            </UFormField>

            <div class="flex justify-end pt-2">
              <UButton color="purple" :loading="saving" @click="saveProfile">
                Save Changes
              </UButton>
            </div>
          </div>
        </UCard>

        <!-- Appearance Section -->
        <UCard class="bg-slate-900 border-slate-800">
          <template #header>
            <h2 class="text-lg font-semibold text-white">Appearance</h2>
          </template>

          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-white font-medium">Theme</p>
                <p class="text-slate-400 text-sm">
                  Choose between dark and light mode
                </p>
              </div>
              <USelect
                v-model="selectedTheme"
                :options="themeOptions"
                :ui="{ base: 'bg-slate-800 border-slate-700 text-white' }"
                disabled
              />
            </div>
            <div
              class="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3"
            >
              <p class="text-amber-400 text-sm">
                Theme toggle UI ready. Functionality coming soon.
              </p>
            </div>
          </div>
        </UCard>

        <!-- Account Section -->
        <UCard class="bg-slate-900 border-slate-800">
          <template #header>
            <h2 class="text-lg font-semibold text-white">Account</h2>
          </template>

          <div class="space-y-4">
            <UButton
              color="red"
              variant="outline"
              block
              icon="i-lucide-log-out"
              :loading="loggingOut"
              @click="handleLogout"
            >
              Logout
            </UButton>
          </div>
        </UCard>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth", ssr: false });

import { useAppAuth } from "~/composables/useAuth";
import { ref, reactive } from "vue";

const { user, signOut } = useAppAuth();

const profile = reactive({
  firstName: "",
  lastName: "",
});

const saving = ref(false);
const loggingOut = ref(false);
const selectedTheme = ref("dark");

const themeOptions = [
  { label: "Dark", value: "dark" },
  { label: "Light", value: "light" },
];

const saveProfile = async () => {
  saving.value = true;
  try {
    // TODO: Save profile to Firestore
    // For now, just simulate save
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Show success message
    console.log("Profile saved:", profile);
  } catch (error) {
    console.error("Error saving profile:", error);
  } finally {
    saving.value = false;
  }
};

const handleLogout = async () => {
  loggingOut.value = true;
  try {
    await signOut();
  } catch (error) {
    console.error("Error logging out:", error);
    loggingOut.value = false;
  }
};
</script>
