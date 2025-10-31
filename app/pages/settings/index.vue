<template>
  <ClientOnly>
    <div
      class="min-h-screen bg-slate-950 mobile-padding-bottom overflow-visible"
    >
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

      <div class="container mx-auto px-6 py-6 space-y-6 overflow-visible">
        <!-- Account Stats Section -->
        <UCard class="bg-slate-900 border-slate-800">
          <template #header>
            <h2 class="text-lg font-semibold text-white">Account Statistics</h2>
          </template>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div class="bg-slate-800/50 rounded-lg p-4">
              <p class="text-slate-400 text-sm mb-1">Member Since</p>
              <p class="text-white font-semibold">
                {{ formatDate(user?.createdAt) }}
              </p>
            </div>
            <div class="bg-slate-800/50 rounded-lg p-4">
              <p class="text-slate-400 text-sm mb-1">Total Expenses</p>
              <p class="text-white font-semibold">
                {{ formatCurrency(totalExpenses) }}
              </p>
            </div>
            <div class="bg-slate-800/50 rounded-lg p-4">
              <p class="text-slate-400 text-sm mb-1">Total Income</p>
              <p class="text-white font-semibold">
                {{ formatCurrency(totalIncome) }}
              </p>
            </div>
            <div class="bg-slate-800/50 rounded-lg p-4">
              <p class="text-slate-400 text-sm mb-1">Net Balance</p>
              <p
                class="font-semibold"
                :class="netBalance >= 0 ? 'text-green-400' : 'text-red-400'"
              >
                {{ formatCurrency(netBalance) }}
              </p>
            </div>
            <div class="bg-slate-800/50 rounded-lg p-4">
              <p class="text-slate-400 text-sm mb-1">Total Projects</p>
              <p class="text-white font-semibold">{{ projectsCount }}</p>
            </div>
            <div class="bg-slate-800/50 rounded-lg p-4">
              <p class="text-slate-400 text-sm mb-1">Total Accounts</p>
              <p class="text-white font-semibold">{{ accountsCount }}</p>
            </div>
          </div>
        </UCard>

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

            <UFormField label="Company Name" :ui="{ label: 'text-white mb-2' }">
              <UInput
                v-model="profile.companyName"
                placeholder="Enter your company name"
                :ui="{ base: 'bg-slate-800 border-slate-700 text-white' }"
              />
            </UFormField>

            <UFormField label="Address" :ui="{ label: 'text-white mb-2' }">
              <UInput
                v-model="profile.address"
                placeholder="Enter your address"
                :ui="{ base: 'bg-slate-800 border-slate-700 text-white' }"
              />
            </UFormField>

            <UFormField label="Phone" :ui="{ label: 'text-white mb-2' }">
              <UInput
                v-model="profile.phone"
                placeholder="Enter your phone number"
                :ui="{ base: 'bg-slate-800 border-slate-700 text-white' }"
              />
            </UFormField>

            <UFormField label="Tax ID" :ui="{ label: 'text-white mb-2' }">
              <UInput
                v-model="profile.taxId"
                placeholder="Enter your tax ID"
                :ui="{ base: 'bg-slate-800 border-slate-700 text-white' }"
              />
            </UFormField>

            <div class="flex justify-end pt-2">
              <UButton
                :loading="saving"
                @click="saveProfile"
                class="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
              >
                Save Changes
              </UButton>
            </div>
          </div>
        </UCard>

        <!-- Security Section -->
        <UCard class="bg-slate-900 border-slate-800">
          <template #header>
            <h2 class="text-lg font-semibold text-white">Security</h2>
          </template>

          <div class="space-y-4">
            <UButton
              variant="outline"
              block
              icon="i-lucide-key"
              @click="showPasswordModal = true"
              class="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-purple-600"
            >
              Change Password
            </UButton>
          </div>
        </UCard>

        <!-- Financial Preferences Section -->
        <UCard class="bg-slate-900 border-slate-800">
          <template #header>
            <h2 class="text-lg font-semibold text-white">
              Financial Preferences
            </h2>
          </template>

          <div class="space-y-4">
            <UFormField label="Currency" :ui="{ label: 'text-white mb-2' }">
              <USelect
                v-model="preferences.currency"
                :options="currencyOptions"
                :ui="{ base: 'bg-slate-800 border-slate-700 text-white' }"
                @update:model-value="savePreferences"
              />
            </UFormField>

            <UFormField label="Date Format" :ui="{ label: 'text-white mb-2' }">
              <USelect
                v-model="preferences.dateFormat"
                :options="dateFormatOptions"
                :ui="{ base: 'bg-slate-800 border-slate-700 text-white' }"
                @update:model-value="savePreferences"
              />
            </UFormField>

            <div class="flex items-center justify-between pt-2">
              <div>
                <p class="text-white font-medium">Budget Alerts</p>
                <p class="text-slate-400 text-sm">
                  Get notified when project budgets reach thresholds
                </p>
              </div>
              <USwitch
                v-model="preferences.budgetAlertEnabled"
                @update:model-value="savePreferences"
              />
            </div>

            <div v-if="preferences.budgetAlertEnabled" class="pt-2">
              <UFormField
                label="Alert Threshold"
                :ui="{ label: 'text-white mb-2' }"
              >
                <USelect
                  v-model="preferences.budgetAlertThreshold"
                  :options="thresholdOptions"
                  :ui="{ base: 'bg-slate-800 border-slate-700 text-white' }"
                  @update:model-value="savePreferences"
                />
                <template #description>
                  <span class="text-slate-400 text-sm"
                    >Alert when spending reaches this percentage</span
                  >
                </template>
              </UFormField>
            </div>
          </div>
        </UCard>

        <!-- Appearance Section -->
        <UCard class="bg-slate-900 border-slate-800 overflow-visible">
          <template #header>
            <h2 class="text-lg font-semibold text-white">Appearance</h2>
          </template>

          <div class="space-y-4">
            <div class="space-y-3">
              <div>
                <p class="text-white font-medium mb-1">Theme</p>
                <p class="text-slate-400 text-sm">
                  Choose between dark and light mode
                </p>
              </div>
              <URadioGroup
                v-model="selectedTheme"
                :items="themeOptions"
                orientation="horizontal"
                variant="card"
                color="primary"
                :ui="{
                  item: 'border-slate-700 bg-slate-800',
                  base: 'border-slate-600',
                  label: 'text-white',
                  indicator: 'bg-gradient-to-r from-purple-600 to-blue-600',
                }"
                @update:model-value="handleThemeChange"
              />
            </div>
          </div>
        </UCard>

        <!-- Data Management Section -->
        <UCard class="bg-slate-900 border-slate-800">
          <template #header>
            <h2 class="text-lg font-semibold text-white">Data Management</h2>
          </template>

          <div class="space-y-4">
            <UFormField label="Export Type" :ui="{ label: 'text-white mb-2' }">
              <USelect
                v-model="exportType"
                :options="exportTypeOptions"
                :ui="{ base: 'bg-slate-800 border-slate-700 text-white' }"
              />
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <UFormField
                label="Start Date"
                :ui="{ label: 'text-white mb-2', wrapper: 'w-full' }"
              >
                <UInput
                  v-model="exportDateStart"
                  type="date"
                  class="w-full"
                  :ui="{
                    base: 'bg-slate-800 border-slate-700 text-white',
                  }"
                />
              </UFormField>

              <UFormField
                label="End Date"
                :ui="{ label: 'text-white mb-2', wrapper: 'w-full' }"
              >
                <UInput
                  v-model="exportDateEnd"
                  type="date"
                  class="w-full"
                  :ui="{
                    base: 'bg-slate-800 border-slate-700 text-white',
                  }"
                />
              </UFormField>
            </div>

            <UButton
              variant="outline"
              block
              icon="i-lucide-download"
              :loading="exporting"
              @click="handleExport"
              class="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-purple-600"
            >
              Export Data
            </UButton>
          </div>
        </UCard>

        <!-- Account Section -->
        <UCard class="bg-slate-900 border-slate-800">
          <template #header>
            <h2 class="text-lg font-semibold text-white">Account</h2>
          </template>

          <div class="space-y-4">
            <UButton
              color="error"
              variant="outline"
              block
              icon="i-lucide-log-out"
              :loading="loggingOut"
              @click="handleLogout"
            >
              Logout
            </UButton>

            <UAlert
              color="error"
              variant="soft"
              title="Danger Zone"
              description="Permanently delete all your data. This action cannot be undone."
              icon="i-lucide-alert-triangle"
            />

            <UButton
              color="error"
              variant="outline"
              block
              icon="i-lucide-trash-2"
              @click="showEraseModal = true"
            >
              Erase All Data
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- Change Password Modal -->
      <UModal v-model:open="showPasswordModal" title="Change Password">
        <template #body>
          <div class="space-y-4">
            <UFormField
              label="Current Password"
              :ui="{ label: 'text-white mb-2' }"
            >
              <UInput
                v-model="passwordForm.currentPassword"
                type="password"
                placeholder="Enter current password"
                :ui="{ base: 'bg-slate-800 border-slate-700 text-white' }"
              />
            </UFormField>

            <UFormField label="New Password" :ui="{ label: 'text-white mb-2' }">
              <UInput
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="Enter new password"
                :ui="{ base: 'bg-slate-800 border-slate-700 text-white' }"
              />
              <template #description>
                <span class="text-slate-400 text-sm">Minimum 6 characters</span>
              </template>
            </UFormField>

            <UFormField
              label="Confirm Password"
              :ui="{ label: 'text-white mb-2' }"
            >
              <UInput
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="Confirm new password"
                :ui="{ base: 'bg-slate-800 border-slate-700 text-white' }"
              />
            </UFormField>

            <div
              v-if="passwordError"
              class="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3"
            >
              {{ passwordError }}
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton
              color="neutral"
              variant="ghost"
              class="text-slate-300 hover:text-white"
              @click="showPasswordModal = false"
            >
              Cancel
            </UButton>
            <UButton
              :loading="changingPassword"
              :disabled="!isPasswordFormValid"
              @click="handleChangePassword"
              class="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            >
              Change Password
            </UButton>
          </div>
        </template>
      </UModal>

      <!-- Erase Data Modal -->
      <UModal
        v-model:open="showEraseModal"
        title="Erase All Data"
        :ui="{ title: 'text-red-400' }"
      >
        <template #body>
          <div class="space-y-4">
            <UAlert
              color="error"
              variant="outline"
              title="Warning: This action cannot be undone!"
              description="All your expenses, incomes, projects, accounts, receipts, and other data will be permanently deleted. You will still be able to log in, but with an empty account."
              icon="i-lucide-alert-triangle"
            />

            <UFormField
              :label="eraseConfirmationLabel"
              :ui="{ label: 'text-white mb-2' }"
            >
              <UInput
                v-model="eraseConfirmationInput"
                :placeholder="eraseConfirmationText"
                :ui="{ base: 'bg-slate-800 border-slate-700 text-white' }"
              />
              <template #description>
                <span class="text-slate-400 text-sm"
                  >This is required to prevent accidental deletion</span
                >
              </template>
            </UFormField>
          </div>
        </template>

        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton
              color="neutral"
              variant="ghost"
              class="text-slate-300 hover:text-white"
              @click="showEraseModal = false"
            >
              Cancel
            </UButton>
            <UButton
              color="error"
              :loading="erasing"
              :disabled="!isEraseConfirmed"
              @click="handleEraseData"
            >
              Erase All Data
            </UButton>
          </div>
        </template>
      </UModal>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useAppAuth } from "~/composables/useAuth";
import { useUserProfile } from "~/composables/useUserProfile";
import { useUserPreferences } from "~/composables/useUserPreferences";
import { useDataExport } from "~/composables/useDataExport";
import { useDataDeletion } from "~/composables/useDataDeletion";
import { useExpenses } from "~/composables/useExpenses";
import { useIncomes } from "~/composables/useIncomes";
import { useProjects } from "~/composables/useProjects";
import { useAccounts } from "~/composables/useAccounts";
import { useColorMode } from "@vueuse/core";
import { ref, reactive, computed, watch } from "vue";

definePageMeta({ middleware: "auth", ssr: false });

const router = useRouter();

const { user, changePassword } = useAppAuth();
const { profile: userProfile, updateProfile } = useUserProfile();
const { preferences, updatePreferences } = useUserPreferences();
const { exportExpensesToCsv, exportIncomesToCsv, exportAllToCsv } =
  useDataExport();
const { deleteAllUserData } = useDataDeletion();
const { totalExpenses } = useExpenses();
const { totalIncome } = useIncomes();
const { projects } = useProjects();
const { accounts } = useAccounts();
const colorMode = useColorMode();
const toast = useToast();

const profile = reactive({
  firstName: "",
  lastName: "",
  companyName: "",
  address: "",
  phone: "",
  taxId: "",
});

// Load profile data
watch(
  userProfile,
  (newProfile) => {
    if (newProfile) {
      profile.firstName = newProfile.firstName || "";
      profile.lastName = newProfile.lastName || "";
      profile.companyName = newProfile.companyName || "";
      profile.address = newProfile.address || "";
      profile.phone = newProfile.phone || "";
      profile.taxId = newProfile.taxId || "";
    }
  },
  { immediate: true }
);

// Theme management
const selectedTheme = ref((colorMode.value || "dark") as "dark" | "light");

const themeOptions = [
  { label: "Dark", value: "dark" },
  { label: "Light", value: "light" },
];

const handleThemeChange = async (value: unknown) => {
  if (
    !value ||
    typeof value !== "string" ||
    (value !== "dark" && value !== "light")
  )
    return;
  colorMode.value = value;
  await updatePreferences({ theme: value });
};

// Watch for preference changes and sync theme
watch(
  () => preferences.value.theme,
  (newTheme) => {
    if (newTheme && colorMode.value !== newTheme) {
      colorMode.value = newTheme;
      selectedTheme.value = newTheme;
    }
  },
  { immediate: true }
);

const saving = ref(false);
const loggingOut = ref(false);
const changingPassword = ref(false);
const exporting = ref(false);
const erasing = ref(false);

const showPasswordModal = ref(false);
const showEraseModal = ref(false);

const passwordForm = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const passwordError = ref("");

const eraseConfirmationText = computed(() => user.value?.email || "DELETE");
const eraseConfirmationLabel = computed(
  () => `Type "${eraseConfirmationText.value}" to confirm`
);
const eraseConfirmationInput = ref("");
const isEraseConfirmed = computed(
  () => eraseConfirmationInput.value === eraseConfirmationText.value
);

// Financial preferences
const currencyOptions = [
  { label: "USD - US Dollar", value: "USD" },
  { label: "EUR - Euro", value: "EUR" },
  { label: "GBP - British Pound", value: "GBP" },
  { label: "CAD - Canadian Dollar", value: "CAD" },
  { label: "AUD - Australian Dollar", value: "AUD" },
];

const dateFormatOptions = [
  { label: "MM/DD/YYYY", value: "MM/DD/YYYY" },
  { label: "DD/MM/YYYY", value: "DD/MM/YYYY" },
  { label: "YYYY-MM-DD", value: "YYYY-MM-DD" },
];

const thresholdOptions = [
  { label: "50%", value: 50 },
  { label: "75%", value: 75 },
  { label: "80%", value: 80 },
  { label: "90%", value: 90 },
  { label: "100%", value: 100 },
];

// Export settings
const exportType = ref("all");
const exportDateStart = ref("");
const exportDateEnd = ref("");

const exportTypeOptions = [
  { label: "All Data", value: "all" },
  { label: "Expenses Only", value: "expenses" },
  { label: "Incomes Only", value: "incomes" },
];

// Account stats
const netBalance = computed(() => totalIncome.value - totalExpenses.value);
const projectsCount = computed(() => projects.value?.length || 0);
const accountsCount = computed(() => accounts.value?.length || 0);

const formatCurrency = (amount: number) => {
  const currency = preferences.value.currency || "USD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

const formatDate = (
  date: Date | { toDate?: () => Date } | string | null | undefined
) => {
  if (!date) return "N/A";
  let d: Date;
  if (date instanceof Date) {
    d = date;
  } else if (
    typeof date === "object" &&
    date !== null &&
    "toDate" in date &&
    typeof date.toDate === "function"
  ) {
    d = date.toDate();
  } else {
    d = new Date(date as string);
  }
  const format = preferences.value.dateFormat || "MM/DD/YYYY";
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();

  if (format === "DD/MM/YYYY") {
    return `${day}/${month}/${year}`;
  } else if (format === "YYYY-MM-DD") {
    return `${year}-${month}-${day}`;
  }
  return `${month}/${day}/${year}`;
};

const isPasswordFormValid = computed(() => {
  return (
    passwordForm.currentPassword.length > 0 &&
    passwordForm.newPassword.length >= 6 &&
    passwordForm.newPassword === passwordForm.confirmPassword
  );
});

const saveProfile = async () => {
  saving.value = true;
  try {
    const result = await updateProfile(profile);
    if (result.error) {
      toast.add({
        title: "Error",
        description: result.error,
        color: "error",
      });
    } else {
      toast.add({
        title: "Success",
        description: "Profile updated successfully",
        color: "success",
      });
    }
  } catch {
    toast.add({
      title: "Error",
      description: "Failed to update profile",
      color: "error",
    });
  } finally {
    saving.value = false;
  }
};

const savePreferences = async () => {
  try {
    await updatePreferences({
      currency: preferences.value.currency,
      dateFormat: preferences.value.dateFormat,
      theme: preferences.value.theme,
      budgetAlertEnabled: preferences.value.budgetAlertEnabled,
      budgetAlertThreshold: preferences.value.budgetAlertThreshold,
    });
  } catch (error) {
    console.error("Error saving preferences:", error);
  }
};

const handleChangePassword = async () => {
  passwordError.value = "";

  if (!isPasswordFormValid.value) {
    passwordError.value = "Please fill all fields and ensure passwords match";
    return;
  }

  changingPassword.value = true;
  try {
    const result = await changePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword
    );

    if (result.error) {
      passwordError.value = result.error;
    } else {
      toast.add({
        title: "Success",
        description: "Password changed successfully",
        color: "success",
      });
      showPasswordModal.value = false;
      passwordForm.currentPassword = "";
      passwordForm.newPassword = "";
      passwordForm.confirmPassword = "";
    }
  } catch {
    passwordError.value = "An unexpected error occurred";
  } finally {
    changingPassword.value = false;
  }
};

const handleLogout = async () => {
  loggingOut.value = true;
  try {
    const { signOut } = useAppAuth();
    await signOut();
  } catch (error) {
    console.error("Error logging out:", error);
    loggingOut.value = false;
  }
};

const handleExport = async () => {
  exporting.value = true;
  try {
    const dateStart = exportDateStart.value
      ? new Date(exportDateStart.value)
      : undefined;
    const dateEnd = exportDateEnd.value
      ? new Date(exportDateEnd.value)
      : undefined;
    const dateFormat = preferences.value.dateFormat || "MM/DD/YYYY";

    let result;
    if (exportType.value === "expenses") {
      result = exportExpensesToCsv(dateStart, dateEnd, dateFormat);
    } else if (exportType.value === "incomes") {
      result = exportIncomesToCsv(dateStart, dateEnd, dateFormat);
    } else {
      result = exportAllToCsv(dateStart, dateEnd, dateFormat);
    }

    if (result.error) {
      toast.add({
        title: "Export Error",
        description: result.error,
        color: "error",
      });
    } else {
      toast.add({
        title: "Success",
        description: "Data exported successfully",
        color: "success",
      });
    }
  } catch {
    toast.add({
      title: "Error",
      description: "Failed to export data",
      color: "error",
    });
  } finally {
    exporting.value = false;
  }
};

const handleEraseData = async () => {
  if (!isEraseConfirmed.value) return;

  erasing.value = true;
  try {
    const result = await deleteAllUserData();
    if (result.error) {
      toast.add({
        title: "Error",
        description: result.error,
        color: "error",
      });
    } else {
      toast.add({
        title: "Success",
        description: "All data has been deleted",
        color: "success",
      });
      showEraseModal.value = false;
      eraseConfirmationInput.value = "";
      // Refresh page to show empty state
      await router.push("/");
    }
  } catch {
    toast.add({
      title: "Error",
      description: "Failed to delete data",
      color: "error",
    });
  } finally {
    erasing.value = false;
  }
};
</script>
