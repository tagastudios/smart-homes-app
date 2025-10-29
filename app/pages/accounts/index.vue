<template>
  <ClientOnly>
    <div class="min-h-screen bg-slate-950 mobile-padding-bottom">
      <!-- Gradient Header -->
      <div
        class="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-6 rounded-b-3xl shadow-lg"
      >
        <div>
          <h1 class="text-2xl font-bold text-white mb-1">Accounts</h1>
          <p class="text-purple-200 text-sm">
            Manage your credit cards, debit cards, and bank accounts
          </p>
        </div>
      </div>

      <div class="container mx-auto px-6 py-6">
        <!-- Loading State -->
        <div v-if="pending" class="text-center py-12">
          <UIcon
            name="i-lucide-loader-2"
            class="animate-spin mx-auto h-12 w-12 text-purple-400 mb-4"
          />
          <p class="text-slate-400">Loading accounts...</p>
        </div>

        <!-- Empty State -->
        <UCard
          v-else-if="accounts && accounts.length === 0"
          class="bg-slate-900 border-slate-800"
        >
          <div class="text-center py-12">
            <UIcon
              name="i-lucide-credit-card"
              class="mx-auto h-16 w-16 text-slate-400 mb-4"
            />
            <h3 class="text-lg font-semibold text-white mb-2">
              No accounts yet
            </h3>
            <p class="text-slate-400 mb-6">
              Add your first account to get started.
            </p>
            <UButton
              @click="openModal()"
              icon="i-lucide-plus"
              class="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            >
              Add Account
            </UButton>
          </div>
        </UCard>

        <!-- Accounts List -->
        <div v-else>
          <!-- Add Account Button -->
          <div class="mb-4">
            <UButton
              @click="openModal()"
              icon="i-lucide-plus"
              size="lg"
              block
              class="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 font-semibold py-3"
            >
              Add Account
            </UButton>
          </div>

          <div class="space-y-4">
            <UCard
              v-for="account in accounts"
              :key="account.id"
              class="bg-slate-900 border-slate-800 rounded-xl hover:border-slate-600 transition-colors"
            >
              <div class="p-5 space-y-4">
                <!-- Header -->
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <div
                        :class="`w-10 h-10 rounded-xl flex items-center justify-center ${getTypeBgColor(
                          account.type
                        )}`"
                      >
                        <UIcon
                          :name="getTypeIcon(account.type)"
                          :class="`w-5 h-5 ${getTypeColor(account.type)}`"
                        />
                      </div>
                      <div>
                        <h3 class="text-lg font-semibold text-white">
                          {{ account.name }}
                        </h3>
                        <p class="text-sm text-slate-400 capitalize">
                          {{ account.type }}
                          <span v-if="account.cardType" class="ml-1">
                            • {{ formatCardType(account.cardType) }}
                          </span>
                        </p>
                      </div>
                    </div>
                    <p
                      v-if="account.lastFourDigits"
                      class="text-sm text-slate-500 mt-1"
                    >
                      •••• {{ account.lastFourDigits }}
                    </p>
                  </div>
                  <UBadge
                    :color="account.isActive ? 'primary' : 'neutral'"
                    class="shrink-0 ml-4"
                  >
                    {{ account.isActive ? "Active" : "Inactive" }}
                  </UBadge>
                </div>

                <!-- Actions -->
                <div class="flex gap-2 pt-3 border-t border-slate-700">
                  <UButton
                    size="sm"
                    variant="ghost"
                    icon="i-lucide-edit"
                    @click="openModal(account)"
                    class="text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    Edit
                  </UButton>
                  <UButton
                    size="sm"
                    variant="ghost"
                    icon="i-lucide-power"
                    @click="toggleStatus(account)"
                    :loading="loading"
                    class="text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    {{ account.isActive ? "Deactivate" : "Activate" }}
                  </UButton>
                  <UButton
                    size="sm"
                    variant="ghost"
                    icon="i-lucide-trash-2"
                    @click="confirmDelete(account)"
                    class="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    Delete
                  </UButton>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <UModal v-model:open="showModal">
        <template #content>
          <UCard
            class="bg-slate-900 border-slate-800"
            :ui="{
              root: 'bg-slate-900 border-slate-800',
              header: 'bg-slate-900 border-slate-800',
              body: 'bg-slate-900',
              footer: 'bg-slate-900 border-slate-800',
            }"
          >
            <template #header>
              <h3 class="text-xl font-semibold text-white">
                {{ editingAccount ? "Edit Account" : "Add New Account" }}
              </h3>
            </template>

            <UForm :state="form" @submit="submitForm" class="space-y-4">
              <UFormField
                label="Account Name"
                name="name"
                required
                :ui="{ label: 'text-white mb-2', wrapper: 'w-full' }"
              >
                <UInput
                  v-model="form.name"
                  placeholder="e.g., Chase Business Card"
                  class="w-full"
                  :ui="{
                    base: 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:ring-purple-500 w-full',
                  }"
                />
              </UFormField>

              <UFormField
                label="Account Type"
                name="type"
                required
                :ui="{ label: 'text-white mb-2', wrapper: 'w-full' }"
              >
                <USelectMenu
                  v-model="form.type"
                  :options="accountTypes"
                  placeholder="Select type"
                  class="w-full"
                  :ui="{
                    base: 'bg-slate-800 border-slate-700 text-white focus:ring-purple-500 w-full',
                  }"
                />
              </UFormField>

              <UFormField
                v-if="isCardType"
                label="Card Type"
                name="cardType"
                hint="Optional: Card brand (Visa, Mastercard, etc.)"
                :ui="{
                  label: 'text-white mb-2',
                  hint: 'text-slate-400 text-xs mt-1',
                  wrapper: 'w-full',
                }"
              >
                <USelectMenu
                  v-model="form.cardType"
                  :options="cardTypes"
                  placeholder="Select card type"
                  class="w-full"
                  :ui="{
                    base: 'bg-slate-800 border-slate-700 text-white focus:ring-purple-500 w-full',
                  }"
                />
              </UFormField>

              <UFormField
                label="Last 4 Digits"
                name="lastFourDigits"
                hint="Optional: Last 4 digits shown on receipts"
                :ui="{
                  label: 'text-white mb-2',
                  hint: 'text-slate-400 text-xs mt-1',
                  wrapper: 'w-full',
                }"
              >
                <UInput
                  v-model="form.lastFourDigits"
                  placeholder="0000"
                  maxlength="4"
                  pattern="[0-9]*"
                  class="w-full"
                  :ui="{
                    base: 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:ring-purple-500 w-full',
                  }"
                />
              </UFormField>

              <UFormField
                label="Status"
                name="isActive"
                :ui="{ label: 'text-white mb-2', wrapper: 'w-full' }"
              >
                <div class="flex items-center gap-3">
                  <USwitch v-model="form.isActive" />
                  <span class="text-sm text-slate-300">
                    {{ form.isActive ? "Active" : "Inactive" }}
                  </span>
                </div>
              </UFormField>

              <div
                v-if="error"
                class="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3"
              >
                {{ error }}
              </div>
            </UForm>

            <template #footer>
              <div class="flex gap-2 justify-end">
                <UButton
                  color="neutral"
                  variant="ghost"
                  @click="closeModal"
                  class="text-slate-300 hover:text-white"
                >
                  Cancel
                </UButton>
                <UButton
                  @click="submitForm"
                  :loading="loading"
                  class="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                >
                  {{ editingAccount ? "Update" : "Create" }}
                </UButton>
              </div>
            </template>
          </UCard>
        </template>
      </UModal>

      <!-- Delete Confirmation Modal -->
      <UModal v-model:open="showDeleteModal">
        <template #content>
          <UCard
            class="bg-slate-900 border-slate-800"
            :ui="{
              root: 'bg-slate-900 border-slate-800',
              header: 'bg-slate-900 border-slate-800',
              body: 'bg-slate-900',
              footer: 'bg-slate-900 border-slate-800',
            }"
          >
            <template #header>
              <div class="flex items-center gap-3">
                <UIcon
                  name="i-lucide-alert-triangle"
                  class="w-6 h-6 text-red-400"
                />
                <h3 class="text-xl font-semibold text-red-400">
                  Delete Account
                </h3>
              </div>
            </template>

            <p class="text-slate-300">
              Are you sure you want to delete the account
              <span class="font-semibold text-white"
                >"{{ accountToDelete?.name }}"</span
              >? This action cannot be undone.
            </p>

            <template #footer>
              <div class="flex gap-2 justify-end">
                <UButton
                  color="neutral"
                  variant="ghost"
                  @click="showDeleteModal = false"
                  class="text-slate-300 hover:text-white"
                >
                  Cancel
                </UButton>
                <UButton
                  color="error"
                  @click="handleDelete"
                  :loading="loading"
                  class="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </UButton>
              </div>
            </template>
          </UCard>
        </template>
      </UModal>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import type { IAccount, IAccountForm } from "~/types";

definePageMeta({
  middleware: "auth",
  ssr: false,
  layout: "default",
});

const {
  accounts,
  pending,
  createAccount,
  updateAccount,
  deleteAccount,
  toggleAccountStatus,
} = useAccounts();

const showModal = ref(false);
const showDeleteModal = ref(false);
const editingAccount = ref<IAccount | null>(null);
const accountToDelete = ref<IAccount | null>(null);
const loading = ref(false);
const error = ref("");

const accountTypes = [
  { label: "Credit Card", value: "credit" },
  { label: "Debit Card", value: "debit" },
  { label: "Bank Account", value: "bank" },
  { label: "Loan", value: "loan" },
];

const cardTypes = [
  { label: "Visa", value: "visa" },
  { label: "Mastercard", value: "mastercard" },
  { label: "American Express", value: "amex" },
  { label: "Discover", value: "discover" },
  { label: "Other", value: "other" },
];

const isCardType = computed(() => {
  return form.type === "credit" || form.type === "debit";
});

const form = reactive<IAccountForm>({
  name: "",
  type: "credit",
  cardType: undefined,
  lastFourDigits: "",
  isActive: true,
});

const getTypeColor = (type: string) => {
  switch (type) {
    case "credit":
      return "text-purple-400";
    case "debit":
      return "text-blue-400";
    case "bank":
      return "text-blue-400";
    case "loan":
      return "text-orange-400";
    default:
      return "text-slate-400";
  }
};

const getTypeBgColor = (type: string) => {
  switch (type) {
    case "credit":
      return "bg-purple-500/20";
    case "debit":
      return "bg-blue-500/20";
    case "bank":
      return "bg-blue-500/20";
    case "loan":
      return "bg-orange-500/20";
    default:
      return "bg-slate-500/20";
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "credit":
      return "i-lucide-credit-card";
    case "debit":
      return "i-lucide-wallet";
    case "bank":
      return "i-lucide-building";
    case "loan":
      return "i-lucide-banknote";
    default:
      return "i-lucide-credit-card";
  }
};

const formatCardType = (cardType: string) => {
  switch (cardType) {
    case "visa":
      return "Visa";
    case "mastercard":
      return "Mastercard";
    case "amex":
      return "Amex";
    case "discover":
      return "Discover";
    case "other":
      return "Other";
    default:
      return cardType;
  }
};

const openModal = (account?: IAccount) => {
  if (account) {
    editingAccount.value = account;
    form.name = account.name;
    form.type = account.type;
    form.cardType = account.cardType;
    form.lastFourDigits = account.lastFourDigits || "";
    form.isActive = account.isActive;
  } else {
    editingAccount.value = null;
    form.name = "";
    form.type = "credit";
    form.cardType = undefined;
    form.lastFourDigits = "";
    form.isActive = true;
  }
  error.value = "";
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingAccount.value = null;
  error.value = "";
};

const submitForm = async () => {
  loading.value = true;
  error.value = "";

  // Prepare account data, only including cardType if account type is credit/debit
  const accountData: IAccountForm = {
    name: form.name,
    type: form.type,
    lastFourDigits: form.lastFourDigits || undefined,
    isActive: form.isActive,
  };

  // Only include cardType for credit/debit accounts
  if ((form.type === "credit" || form.type === "debit") && form.cardType) {
    accountData.cardType = form.cardType;
  }

  const result = editingAccount.value
    ? await updateAccount(editingAccount.value.id, accountData)
    : await createAccount(accountData);

  if (result.error) {
    error.value = result.error;
    const toast = useToast();
    toast.add({
      title: "Error",
      description: result.error,
      color: "error",
      icon: "i-lucide-alert-triangle",
    });
  } else {
    const toast = useToast();
    toast.add({
      title: editingAccount.value
        ? "Account updated successfully!"
        : "Account added successfully!",
      color: "primary",
      icon: "i-lucide-check-circle",
    });
    closeModal();
  }

  loading.value = false;
};

const confirmDelete = (account: IAccount) => {
  accountToDelete.value = account;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!accountToDelete.value) return;

  loading.value = true;
  const result = await deleteAccount(accountToDelete.value.id);

  if (result.error) {
    error.value = result.error;
    const toast = useToast();
    toast.add({
      title: "Error deleting account",
      description: result.error,
      color: "error",
      icon: "i-lucide-alert-triangle",
    });
  } else {
    const toast = useToast();
    toast.add({
      title: "Account deleted successfully!",
      color: "primary",
      icon: "i-lucide-check-circle",
    });
    showDeleteModal.value = false;
    accountToDelete.value = null;
  }

  loading.value = false;
};

const toggleStatus = async (account: IAccount) => {
  loading.value = true;
  try {
    await toggleAccountStatus(account.id, !account.isActive);
    const toast = useToast();
    toast.add({
      title: account.isActive
        ? "Account deactivated successfully!"
        : "Account activated successfully!",
      color: "primary",
      icon: "i-lucide-check-circle",
    });
  } catch (err: unknown) {
    const toast = useToast();
    toast.add({
      title: "Error updating account",
      description: err instanceof Error ? err.message : "An error occurred",
      color: "error",
      icon: "i-lucide-alert-triangle",
    });
  } finally {
    loading.value = false;
  }
};
</script>
