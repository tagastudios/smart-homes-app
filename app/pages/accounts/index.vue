<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Financial Accounts
        </h1>
        <p class="text-gray-600 dark:text-gray-300 mt-1">
          Manage your credit cards, debit cards, and bank accounts
        </p>
      </div>
      <UButton @click="openModal()" icon="i-heroicons-plus">
        Add Account
      </UButton>
    </div>

    <div v-if="pending" class="text-center py-12">
      <UIcon
        name="i-heroicons-arrow-path"
        class="w-8 h-8 animate-spin mx-auto"
      />
      <p class="text-gray-600 dark:text-gray-300 mt-2">Loading accounts...</p>
    </div>

    <div
      v-else-if="accounts && accounts.length === 0"
      class="text-center py-12"
    >
      <p class="text-gray-600 dark:text-gray-300">
        No accounts yet. Add your first account to get started.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard
        v-for="account in accounts"
        :key="account.id"
        class="hover:shadow-lg transition-shadow"
      >
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ account.name }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 capitalize">
              {{ account.type }}
            </p>
            <p
              v-if="account.lastFourDigits"
              class="text-sm text-gray-500 dark:text-gray-400 mt-1"
            >
              •••• {{ account.lastFourDigits }}
            </p>
          </div>
          <UBadge :color="account.isActive ? 'green' : 'gray'">
            {{ account.isActive ? "Active" : "Inactive" }}
          </UBadge>
        </div>

        <div class="flex gap-2">
          <UButton
            size="xs"
            color="primary"
            variant="ghost"
            @click="openModal(account)"
          >
            Edit
          </UButton>
          <UButton
            size="xs"
            color="red"
            variant="ghost"
            @click="confirmDelete(account)"
          >
            Delete
          </UButton>
          <UButton
            size="xs"
            color="gray"
            variant="ghost"
            @click="toggleStatus(account)"
          >
            {{ account.isActive ? "Deactivate" : "Activate" }}
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Add/Edit Modal -->
    <UModal v-model="showModal">
      <UCard>
        <template #header>
          <h3 class="text-xl font-semibold">
            {{ editingAccount ? "Edit Account" : "Add New Account" }}
          </h3>
        </template>

        <UForm :state="form" @submit="submitForm" class="space-y-4">
          <UFormField label="Account Name" name="name" required>
            <UInput
              v-model="form.name"
              placeholder="e.g., Chase Business Card"
            />
          </UFormField>

          <UFormField label="Account Type" name="type" required>
            <USelect
              v-model="form.type"
              :options="accountTypes"
              placeholder="Select type"
            />
          </UFormField>

          <UFormField label="Last 4 Digits" name="lastFourDigits">
            <UInput
              v-model="form.lastFourDigits"
              placeholder="0000"
              maxlength="4"
              pattern="[0-9]*"
            />
            <template #hint>
              Optional: Last 4 digits shown on receipts
            </template>
          </UFormField>

          <UFormField label="Status" name="isActive">
            <div class="flex items-center gap-2">
              <USwitch v-model="form.isActive" />
              <span class="text-sm text-gray-600 dark:text-gray-300">
                Active
              </span>
            </div>
          </UFormField>

          <div v-if="error" class="text-red-600 text-sm">
            {{ error }}
          </div>

          <div class="flex gap-2 justify-end">
            <UButton color="gray" variant="ghost" @click="closeModal">
              Cancel
            </UButton>
            <UButton type="submit" :loading="loading">
              {{ editingAccount ? "Update" : "Create" }}
            </UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model="showDeleteModal">
      <UCard>
        <template #header>
          <h3 class="text-xl font-semibold text-red-600">Delete Account</h3>
        </template>

        <p class="text-gray-600 dark:text-gray-300">
          Are you sure you want to delete the account "{{
            accountToDelete?.name
          }}"? This action cannot be undone.
        </p>

        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton
              color="gray"
              variant="ghost"
              @click="showDeleteModal = false"
            >
              Cancel
            </UButton>
            <UButton color="red" @click="handleDelete" :loading="loading">
              Delete
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { IAccount, IAccountForm } from "~/types";

definePageMeta({
  middleware: "auth",
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

const form = reactive<IAccountForm>({
  name: "",
  type: "credit",
  lastFourDigits: "",
  isActive: true,
});

const openModal = (account?: IAccount) => {
  if (account) {
    editingAccount.value = account;
    form.name = account.name;
    form.type = account.type;
    form.lastFourDigits = account.lastFourDigits || "";
    form.isActive = account.isActive;
  } else {
    editingAccount.value = null;
    form.name = "";
    form.type = "credit";
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

  const result = editingAccount.value
    ? await updateAccount(editingAccount.value.id, form)
    : await createAccount(form);

  if (result.error) {
    error.value = result.error;
  } else {
    closeModal();
    // Show success toast
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
  } else {
    showDeleteModal.value = false;
    accountToDelete.value = null;
  }

  loading.value = false;
};

const toggleStatus = async (account: IAccount) => {
  loading.value = true;
  await toggleAccountStatus(account.id, !account.isActive);
  loading.value = false;
};
</script>
