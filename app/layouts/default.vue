<template>
  <div class="min-h-screen bg-default">
    <!-- Main content with bottom padding for navigation -->
    <main class="pb-24">
      <slot />
    </main>

    <!-- Bottom Navigation -->
    <div
      class="fixed bottom-0 left-0 right-0 z-50 overflow-visible bottom-nav-container"
    >
      <UCard
        class="glass-dark rounded-none overflow-visible"
        :ui="{
          root: 'rounded-none overflow-visible',
          body: 'p-0 overflow-visible',
        }"
      >
        <div
          class="relative flex justify-around items-center max-w-md mx-auto px-6 py-3 overflow-visible"
        >
          <!-- Home -->
          <UButton
            to="/"
            variant="ghost"
            class="flex flex-col items-center gap-1 transition-colors py-2 touch-target"
            :class="
              isActive('/')
                ? 'text-purple-400'
                : 'text-muted hover:text-default'
            "
          >
            <UIcon name="i-lucide-house" class="w-6 h-6" />
            <span class="text-xs font-medium">Home</span>
          </UButton>

          <!-- Reports -->
          <UButton
            to="/reports"
            variant="ghost"
            class="flex flex-col items-center gap-1 transition-colors py-2 touch-target"
            :class="
              isActive('/reports')
                ? 'text-purple-400'
                : 'text-muted hover:text-default'
            "
          >
            <UIcon name="i-lucide-chart-column" class="w-6 h-6" />
            <span class="text-xs font-medium">Reports</span>
          </UButton>

          <!-- Floating Action Button -->
          <div class="relative -top-6 overflow-visible fab-overflow">
            <UButton
              size="lg"
              class="w-16 h-16 bg-gradient-fab rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform border-4 border-default touch-target"
              @click="toggleFabMenu"
            >
              <UIcon
                name="i-lucide-plus"
                class="w-8 h-8 text-white transition-transform duration-300"
                :class="{ 'rotate-45': showFabModal }"
              />
            </UButton>
          </div>

          <!-- Projects -->
          <UButton
            to="/projects"
            variant="ghost"
            class="flex flex-col items-center gap-1 transition-colors py-2 touch-target"
            :class="
              isActive('/projects')
                ? 'text-purple-400'
                : 'text-muted hover:text-default'
            "
          >
            <UIcon name="i-lucide-folder-open" class="w-6 h-6" />
            <span class="text-xs font-medium">Projects</span>
          </UButton>

          <!-- Accounts -->
          <UButton
            to="/accounts"
            variant="ghost"
            class="flex flex-col items-center gap-1 transition-colors py-2 touch-target"
            :class="
              isActive('/accounts')
                ? 'text-purple-400'
                : 'text-muted hover:text-default'
            "
          >
            <UIcon name="i-lucide-credit-card" class="w-6 h-6" />
            <span class="text-xs font-medium">Accounts</span>
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- FAB Modal -->
    <FabModal
      v-model:open="showFabModal"
      @close="showFabModal = false"
      @action="handleFabAction"
    />
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const router = useRouter();

const showFabModal = ref(false);

// Check if route is active
const isActive = (path: string) => {
  return route.path === path;
};

// Toggle FAB menu
const toggleFabMenu = () => {
  showFabModal.value = !showFabModal.value;
};

// Handle FAB modal actions
const handleFabAction = (action: string) => {
  showFabModal.value = false; // Ensure modal closes
  switch (action) {
    case "scan-receipt":
      router.push("/receipts");
      break;
    case "add-expense":
      router.push("/expenses/add");
      break;
    case "add-income":
      router.push("/incomes/add");
      break;
  }
};
</script>
