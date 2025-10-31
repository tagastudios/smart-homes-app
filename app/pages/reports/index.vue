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
            <h1 class="text-2xl font-bold text-white mb-1">Reports</h1>
            <p class="text-purple-200 text-sm">
              Financial analytics and insights
            </p>
          </div>
          <div class="w-10" />
        </div>
      </div>

      <div class="container mx-auto px-6 py-6 space-y-6">
        <!-- Filters -->
        <UCard class="bg-slate-900 border-slate-800">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-white">Filters</h2>
              <div class="flex gap-2">
                <UButton size="sm" variant="ghost" @click="setPreset('today')"
                  >Today</UButton
                >
                <UButton size="sm" variant="ghost" @click="setPreset('week')"
                  >Week</UButton
                >
                <UButton size="sm" variant="ghost" @click="setPreset('month')"
                  >Month</UButton
                >
                <UButton size="sm" variant="ghost" @click="setPreset('year')"
                  >Year</UButton
                >
              </div>
            </div>
          </template>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <UFormField
              label="From"
              :ui="{ label: 'text-white mb-2', wrapper: 'w-full' }"
            >
              <UInput v-model="filters.fromStr" type="date" class="w-full" />
            </UFormField>
            <UFormField
              label="To"
              :ui="{ label: 'text-white mb-2', wrapper: 'w-full' }"
            >
              <UInput v-model="filters.toStr" type="date" class="w-full" />
            </UFormField>
            <UFormField
              label="Project"
              :ui="{ label: 'text-white mb-2', wrapper: 'w-full' }"
            >
              <USelectMenu
                v-model="filters.projectId"
                :items="projectOptions"
                value-key="value"
                class="w-full"
              >
                <template #item="{ item }">
                  <div class="flex items-center gap-2">
                    <UIcon :name="'i-lucide-folder'" class="w-4 h-4" />
                    <span>{{ item.label }}</span>
                  </div>
                </template>
                <template #footer>
                  <div class="p-2">
                    <UButton
                      block
                      variant="ghost"
                      icon="i-lucide-plus"
                      @click="goAddProject"
                      >Add Project...</UButton
                    >
                  </div>
                </template>
              </USelectMenu>
            </UFormField>
            <UFormField
              label="Account"
              :ui="{ label: 'text-white mb-2', wrapper: 'w-full' }"
            >
              <USelectMenu
                v-model="filters.accountId"
                :items="accountOptions"
                value-key="value"
                class="w-full"
              >
                <template #item="{ item }">
                  <div class="flex items-center gap-2">
                    <UIcon
                      :name="item.icon"
                      class="w-4 h-4"
                      :style="{ color: item.color }"
                    />
                    <span>{{ item.label }}</span>
                  </div>
                </template>
                <template #footer>
                  <div class="p-2">
                    <UButton
                      block
                      variant="ghost"
                      icon="i-lucide-plus"
                      @click="goAddAccount"
                      >Add Account...</UButton
                    >
                  </div>
                </template>
              </USelectMenu>
            </UFormField>
            <UFormField
              label="Category"
              :ui="{ label: 'text-white mb-2', wrapper: 'w-full' }"
              class="sm:col-span-2 lg:col-span-1"
            >
              <UI-TypeSelectMenu
                v-model="filters.category"
                :options="categoryOptions"
                placeholder="Any category"
              >
                <template #item="{ item }">
                  <div class="flex items-center gap-2">
                    <UIcon
                      :name="item.icon || 'i-lucide-tag'"
                      class="w-4 h-4"
                      :style="{ color: item.color }"
                    />
                    <span>{{ item.label }}</span>
                  </div>
                </template>
              </UI-TypeSelectMenu>
            </UFormField>
            <div class="sm:col-span-2 lg:col-span-1 flex items-end">
              <UButton
                variant="outline"
                class="w-full"
                icon="i-lucide-download"
                @click="exportCsv"
                >Export CSV</UButton
              >
            </div>
          </div>
        </UCard>

        <!-- KPIs -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <UCard class="bg-slate-900 border-slate-800">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-slate-400 text-sm">Total Income</p>
                <p class="text-2xl font-bold text-white">
                  ${{ formatCurrency(kpis.totalIncome) }}
                </p>
              </div>
              <UBadge class="bg-emerald-500/15 text-emerald-400">Income</UBadge>
            </div>
          </UCard>
          <UCard class="bg-slate-900 border-slate-800">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-slate-400 text-sm">Total Expenses</p>
                <p class="text-2xl font-bold text-white">
                  ${{ formatCurrency(kpis.totalExpenses) }}
                </p>
              </div>
              <UBadge class="bg-rose-500/15 text-rose-400">Expenses</UBadge>
            </div>
          </UCard>
          <UCard class="bg-slate-900 border-slate-800">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-slate-400 text-sm">Net Income</p>
                <p class="text-2xl font-bold text-white">
                  ${{ formatCurrency(kpis.netIncome) }}
                </p>
              </div>
              <UBadge class="bg-blue-500/15 text-blue-400">Net</UBadge>
            </div>
          </UCard>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <UCard class="bg-slate-900 border-slate-800">
            <template #header>
              <h3 class="text-white font-semibold">Income vs Expenses</h3>
            </template>
            <div
              v-if="
                lineSeries[0].data.length === 0 &&
                lineSeries[1].data.length === 0
              "
              class="flex items-center justify-center h-64 text-slate-400"
            >
              <p>No data available for the selected date range</p>
            </div>
            <apexchart
              v-else
              type="line"
              height="260"
              :options="lineOptions"
              :series="lineSeries"
            />
          </UCard>

          <UCard class="bg-slate-900 border-slate-800">
            <template #header>
              <h3 class="text-white font-semibold">Category Breakdown</h3>
            </template>
            <div
              v-if="
                donutSeries.length === 0 || donutSeries.every((v) => v === 0)
              "
              class="flex items-center justify-center h-64 text-slate-400"
            >
              <p>No expenses in the selected date range</p>
            </div>
            <apexchart
              v-else
              type="donut"
              height="260"
              :options="donutOptions"
              :series="donutSeries"
            />
          </UCard>

          <UCard class="bg-slate-900 border-slate-800 lg:col-span-2">
            <template #header>
              <h3 class="text-white font-semibold">Top Expenses by Category</h3>
            </template>
            <div
              v-if="
                barSeries[0].data.length === 0 ||
                barSeries[0].data.every((v) => v === 0)
              "
              class="flex items-center justify-center h-64 text-slate-400"
            >
              <p>No expenses in the selected date range</p>
            </div>
            <apexchart
              v-else
              type="bar"
              height="300"
              :options="barOptions"
              :series="barSeries"
            />
          </UCard>
        </div>

        <!-- Export at bottom -->
        <div class="pt-2">
          <UCard class="bg-slate-900 border-slate-800">
            <div class="sm:col-span-2 lg:col-span-1 flex items-end">
              <UButton
                variant="outline"
                class="w-full"
                icon="i-lucide-download"
                @click="exportCsv"
                >Export CSV</UButton
              >
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
definePageMeta({ middleware: "auth", ssr: false });

import { useExpenses } from "~/composables/useExpenses";
import { useIncomes } from "~/composables/useIncomes";
import { useCategories } from "~/composables/useCategories";
import { useProjects } from "~/composables/useProjects";
import { useAccounts } from "~/composables/useAccounts";
import { useAccountTypes } from "~/composables/useAccountTypes";

const router = useRouter();
const goAddProject = () => router.push("/projects");
const goAddAccount = () => router.push("/accounts");

const { expenses, pending: expensesPending } = useExpenses();
const { incomes, pending: incomesPending } = useIncomes();
const { allCategories } = useCategories();
const { projects } = useProjects();
const { accounts } = useAccounts();
const { allAccountTypes } = useAccountTypes();

// Default filter: show all data (from earliest expense to today)
const filters = reactive({
  fromStr: "2010-01-01", // Start from 2010 to capture all historical data
  toStr: new Date().toISOString().slice(0, 10),
  projectId: undefined,
  accountId: undefined,
  category: undefined,
});

const projectOptions = computed(() =>
  (projects?.value || []).map((p) => ({ label: p.name, value: p.id }))
);
const categoryOptions = computed(() =>
  allCategories.value.map((c) => ({
    label: c.name,
    value: c.name,
    icon: c.icon,
    color: c.color,
  }))
);
const accountOptions = computed(() =>
  (accounts?.value || []).map((a) => {
    const type = allAccountTypes.value.find(
      (t) => t.name.toLowerCase() === String(a.type).toLowerCase()
    );
    return {
      label: `${a.name} (${a.type})`,
      value: a.id,
      icon: type?.icon || "i-lucide-credit-card",
      color: type?.color || "#8B5CF6",
    };
  })
);

const fromDate = computed(() => new Date(filters.fromStr));
const toDate = computed(() => new Date(filters.toStr));

const normalizeDate = (v) => {
  try {
    if (!v) return new Date();
    if (typeof v.toDate === "function") {
      return v.toDate();
    }
    if (v instanceof Date) {
      return v;
    }
    if (typeof v === "string" || typeof v === "number") {
      return new Date(v);
    }
    // Handle Firestore Timestamp from Firebase MCP (has __type__ and value)
    if (v && v.__type__ === "Timestamp" && v.value) {
      return new Date(v.value);
    }
    return new Date(v);
  } catch (error) {
    console.error("Error normalizing date:", error, v);
    return new Date();
  }
};

const filteredExpenses = computed(() => {
  try {
    return (expenses.value || []).filter((e) => {
      if (!e || !e.date) return false;
      try {
        const d = normalizeDate(e.date);
        if (isNaN(d.getTime())) return false;
        // Compare dates only (ignore time)
        const dDateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const fromDateOnly = new Date(
          fromDate.value.getFullYear(),
          fromDate.value.getMonth(),
          fromDate.value.getDate()
        );
        const toDateOnly = new Date(
          toDate.value.getFullYear(),
          toDate.value.getMonth(),
          toDate.value.getDate()
        );
        if (dDateOnly < fromDateOnly || dDateOnly > toDateOnly) return false;
        if (filters.projectId && e.projectId !== filters.projectId)
          return false;
        if (filters.accountId && e.accountId !== filters.accountId)
          return false;
        if (filters.category && e.category !== filters.category) return false;
        return true;
      } catch (error) {
        console.error("Error filtering expense:", error, e);
        return false;
      }
    });
  } catch (error) {
    console.error("Error in filteredExpenses:", error);
    return [];
  }
});

const filteredIncomes = computed(() => {
  try {
    return (incomes.value || []).filter((i) => {
      if (!i || !i.date) return false;
      try {
        const d = normalizeDate(i.date);
        if (isNaN(d.getTime())) return false;
        // Compare dates only (ignore time)
        const dDateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const fromDateOnly = new Date(
          fromDate.value.getFullYear(),
          fromDate.value.getMonth(),
          fromDate.value.getDate()
        );
        const toDateOnly = new Date(
          toDate.value.getFullYear(),
          toDate.value.getMonth(),
          toDate.value.getDate()
        );
        if (dDateOnly < fromDateOnly || dDateOnly > toDateOnly) return false;
        if (filters.projectId && i.projectId !== filters.projectId)
          return false;
        if (filters.accountId && i.accountId !== filters.accountId)
          return false;
        return true;
      } catch (error) {
        console.error("Error filtering income:", error, i);
        return false;
      }
    });
  } catch (error) {
    console.error("Error in filteredIncomes:", error);
    return [];
  }
});

const kpis = computed(() => {
  const totalExpenses = filteredExpenses.value.reduce(
    (s, e) => s + (e.amount || 0),
    0
  );
  const totalIncome = filteredIncomes.value.reduce(
    (s, i) => s + (i.amount || 0),
    0
  );
  return { totalExpenses, totalIncome, netIncome: totalIncome - totalExpenses };
});

const groupByDate = (items, accessor) => {
  try {
    const map = new Map();
    items.forEach((x) => {
      if (!x || !x.date) return;
      try {
        const d = normalizeDate(x.date);
        if (isNaN(d.getTime())) return;
        const key = d.toISOString().slice(0, 10);
        const value = accessor(x) || 0;
        map.set(key, (map.get(key) || 0) + Number(value));
      } catch (error) {
        console.error("Error in groupByDate:", error, x);
      }
    });
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? -1 : 1));
  } catch (error) {
    console.error("Error in groupByDate:", error);
    return [];
  }
};

// Line chart data - Income vs Expenses over time
const lineSeries = computed(() => {
  try {
    const exp = groupByDate(filteredExpenses.value, (e) => e.amount || 0);
    const inc = groupByDate(filteredIncomes.value, (i) => i.amount || 0);
    const allLabels = Array.from(
      new Set([...exp.map(([d]) => d), ...inc.map(([d]) => d)])
    ).sort();
    const expMap = new Map(exp);
    const incMap = new Map(inc);
    return [
      { name: "Expenses", data: allLabels.map((d) => expMap.get(d) || 0) },
      { name: "Income", data: allLabels.map((d) => incMap.get(d) || 0) },
    ];
  } catch (error) {
    console.error("Error computing line series:", error);
    return [
      { name: "Expenses", data: [] },
      { name: "Income", data: [] },
    ];
  }
});

const lineOptions = computed(() => {
  try {
    const exp = groupByDate(filteredExpenses.value, (e) => e.amount || 0);
    const inc = groupByDate(filteredIncomes.value, (i) => i.amount || 0);
    const allLabels = Array.from(
      new Set([...exp.map(([d]) => d), ...inc.map(([d]) => d)])
    ).sort();

    return {
      chart: {
        toolbar: { show: false },
        foreColor: "#94a3b8",
        type: "line",
      },
      stroke: { curve: "smooth", width: 2 },
      colors: ["#f87171", "#60a5fa"],
      xaxis: {
        categories: allLabels,
        labels: {
          style: { colors: "#94a3b8" },
          rotate: -45,
          rotateAlways: false,
        },
      },
      yaxis: {
        labels: {
          style: { colors: "#94a3b8" },
          formatter: function (val) {
            return `$${val.toFixed(0)}`;
          },
        },
      },
      legend: {
        labels: { colors: "#94a3b8" },
        position: "top",
      },
      tooltip: {
        theme: "dark",
        y: {
          formatter: function (val) {
            return `$${val.toFixed(2)}`;
          },
        },
      },
      theme: { mode: "dark" },
    };
  } catch (error) {
    console.error("Error computing line options:", error);
    return {
      chart: { toolbar: { show: false }, foreColor: "#94a3b8" },
      theme: { mode: "dark" },
    };
  }
});

// Donut (categories) - Category breakdown
const donutAgg = computed(() => {
  try {
    const map = new Map();
    filteredExpenses.value.forEach((e) => {
      const category = e.category || "Uncategorized";
      map.set(category, (map.get(category) || 0) + (e.amount || 0));
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]); // Sort by amount descending
  } catch (error) {
    console.error("Error computing donut aggregation:", error);
    return [];
  }
});
const donutSeries = computed(() => {
  try {
    return donutAgg.value.map(([, v]) => Number(v.toFixed(2)));
  } catch {
    return [];
  }
});
const donutOptions = computed(() => {
  try {
    return {
      labels: donutAgg.value.map(([k]) => k || "Uncategorized"),
      legend: {
        labels: { colors: "#94a3b8" },
        position: "bottom",
      },
      plotOptions: {
        pie: {
          donut: {
            size: "60%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Total",
                formatter: () =>
                  `$${filteredExpenses.value
                    .reduce((sum, e) => sum + (e.amount || 0), 0)
                    .toFixed(2)}`,
                color: "#94a3b8",
              },
            },
          },
        },
      },
      tooltip: {
        theme: "dark",
        y: {
          formatter: function (val) {
            return `$${val.toFixed(2)}`;
          },
        },
      },
      theme: { mode: "dark" },
    };
  } catch (error) {
    console.error("Error computing donut options:", error);
    return {
      legend: { labels: { colors: "#94a3b8" } },
      theme: { mode: "dark" },
    };
  }
});

// Bar (top expenses by category or account/project)
const barAgg = computed(() => {
  try {
    // Group by category for better insights
    const byCategory = new Map();
    filteredExpenses.value.forEach((e) => {
      const category = e.category || "Uncategorized";
      byCategory.set(
        category,
        (byCategory.get(category) || 0) + (e.amount || 0)
      );
    });

    // Also group by account
    const byAccount = new Map();
    filteredExpenses.value.forEach((e) => {
      if (e.accountId) {
        const accountName =
          accounts.value?.find((a) => a.id === e.accountId)?.name ||
          "Unknown Account";
        byAccount.set(
          accountName,
          (byAccount.get(accountName) || 0) + (e.amount || 0)
        );
      }
    });

    // Sort and limit to top 10
    const topCategories = Array.from(byCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const topAccounts = Array.from(byAccount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      byCategory: topCategories,
      byAccount: topAccounts,
    };
  } catch (error) {
    console.error("Error computing bar aggregation:", error);
    return { byCategory: [], byAccount: [] };
  }
});

const barSeries = computed(() => {
  try {
    return [
      {
        name: "Expenses by Category",
        data: barAgg.value.byCategory.map(([, v]) => Number(v.toFixed(2))),
      },
    ];
  } catch {
    return [{ name: "Expenses", data: [] }];
  }
});

const barOptions = computed(() => {
  try {
    return {
      chart: {
        toolbar: { show: false },
        foreColor: "#94a3b8",
      },
      xaxis: {
        categories: barAgg.value.byCategory.map(([k]) => k || "Uncategorized"),
        labels: {
          style: { colors: "#94a3b8" },
          rotate: -45,
          rotateAlways: false,
        },
      },
      yaxis: {
        labels: {
          style: { colors: "#94a3b8" },
          formatter: function (val) {
            return `$${val.toFixed(0)}`;
          },
        },
      },
      colors: ["#8b5cf6"],
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 4,
          columnWidth: "70%",
        },
      },
      dataLabels: {
        enabled: false,
      },
      tooltip: {
        theme: "dark",
        y: {
          formatter: function (val) {
            return `$${val.toFixed(2)}`;
          },
        },
      },
      theme: { mode: "dark" },
    };
  } catch (error) {
    console.error("Error computing bar options:", error);
    return {
      chart: { toolbar: { show: false }, foreColor: "#94a3b8" },
      theme: { mode: "dark" },
    };
  }
});

const setPreset = (preset) => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const presets = {
    today: [now, now],
    week: [startOfWeek, now],
    month: [new Date(now.getFullYear(), now.getMonth(), 1), now],
    year: [new Date(now.getFullYear(), 0, 1), now],
  };
  const [from, to] = presets[preset] || [now, now];
  filters.fromStr = from.toISOString().slice(0, 10);
  filters.toStr = to.toISOString().slice(0, 10);
};

const formatCurrency = (amount) => (amount || 0).toFixed(2);

const exportCsv = () => {
  const rows = [
    ["Type", "Date", "Amount", "Category", "Project", "Account", "Description"],
    ...filteredIncomes.value.map((i) => [
      "Income",
      normalizeDate(i.date).toISOString().slice(0, 10),
      i.amount,
      "",
      projects.value?.find((p) => p.id === i.projectId)?.name || "",
      accounts.value?.find((a) => a.id === i.accountId)?.name || "",
      i.description || "",
    ]),
    ...filteredExpenses.value.map((e) => [
      "Expense",
      normalizeDate(e.date).toISOString().slice(0, 10),
      e.amount,
      e.category || "",
      projects.value?.find((p) => p.id === e.projectId)?.name || "",
      accounts.value?.find((a) => a.id === e.accountId)?.name || "",
      e.description || "",
    ]),
  ];
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reports-${filters.fromStr}_to_${filters.toStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
</script>
