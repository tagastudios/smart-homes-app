<template>
  <ClientOnly>
    <div class="min-h-screen bg-default text-default mobile-padding-bottom">
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
          <h1 class="text-2xl font-bold text-white">Assistant</h1>
          <div class="w-10" />
        </div>
      </div>

      <div class="container mx-auto px-6 py-4 pb-28">
        <UCard class="bg-elevated border border-default">
          <div
            ref="scrollRef"
            class="space-y-4 max-h-[60vh] overflow-y-auto pr-1"
          >
            <div v-if="messages.length === 0" class="text-muted text-sm py-6">
              Ask anything about your spending, income, projects, or pending
              receipts.
            </div>

            <div
              v-for="m in messages"
              :key="m.id"
              class="flex"
              :class="m.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[85%] rounded-2xl px-4 py-3 text-sm"
                :class="
                  m.role === 'user'
                    ? 'bg-blue-600/30 text-white'
                    : 'bg-accented text-default'
                "
              >
                <!-- Markdown content -->
                <div
                  v-if="m.role === 'assistant'"
                  class="prose prose-sm max-w-none dark:prose-invert"
                  v-html="renderMarkdown(m.content)"
                ></div>
                <p v-else class="whitespace-pre-wrap">{{ m.content }}</p>

                <!-- Charts -->
                <div
                  v-if="m.charts && m.charts.length > 0"
                  class="mt-4 space-y-4"
                >
                  <div
                    v-for="(chart, idx) in m.charts"
                    :key="idx"
                    class="bg-accented rounded-lg p-4 border border-default"
                  >
                    <h4 class="font-semibold mb-3">
                      {{ chart.title }}
                    </h4>
                    <ClientOnly>
                      <apexchart
                        :type="chart.type === 'pie' ? 'donut' : 'bar'"
                        :height="chart.type === 'pie' ? '300' : '250'"
                        :options="getChartOptions(chart)"
                        :series="getChartSeries(chart)"
                      />
                    </ClientOnly>
                  </div>
                </div>

                <p class="text-xs text-muted mt-2">
                  {{ formatTime(m.createdAt) }}
                </p>
              </div>
            </div>

            <div v-if="isStreaming" class="flex justify-start">
              <div
                class="bg-accented text-default rounded-2xl px-3 py-2 text-sm"
              >
                <span class="inline-flex gap-1 items-center">
                  <span class="animate-pulse">●</span>
                  <span class="animate-pulse" style="animation-delay: 0.15s"
                    >●</span
                  >
                  <span class="animate-pulse" style="animation-delay: 0.3s"
                    >●</span
                  >
                </span>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Composer -->
      <div class="fixed bottom-0 left-0 right-0 z-40 px-6 pb-6">
        <UCard class="bg-elevated border border-default">
          <div class="flex items-end gap-3">
            <UTextarea
              v-model="input"
              :rows="1"
              autoresize
              placeholder="Type a message..."
              class="flex-1"
              :ui="{ base: 'bg-accented text-default border border-default' }"
            />
            <UButton
              icon="i-lucide-send"
              :loading="isStreaming"
              :disabled="!input.trim() || isStreaming"
              class="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
              @click="onSend"
            />
          </div>
          <div class="mt-3 flex gap-2 flex-wrap">
            <UButton
              size="xs"
              variant="ghost"
              @click="quick('How much did I spend this month?')"
              >This month spend</UButton
            >
            <UButton
              size="xs"
              variant="ghost"
              @click="quick('Show pending receipts')"
              >Pending receipts</UButton
            >
            <UButton
              size="xs"
              variant="ghost"
              @click="quick('Top categories this month with a pie chart')"
              >Top categories</UButton
            >
          </div>
        </UCard>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { marked } from "marked";
import DOMPurify from "dompurify";
import type { ChartData } from "~/composables/useChat";

definePageMeta({ middleware: "auth", ssr: false });

import { useChat } from "~/composables/useChat";
import { useChatContext } from "~/composables/useChatContext";
import { ref, nextTick } from "vue";

const { messages, input, isStreaming, append, setInput } = useChat();
const { buildContext } = useChatContext();
const scrollRef = ref<HTMLElement | null>(null);

const formatTime = (d: Date) => new Date(d).toLocaleTimeString();

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Render markdown to sanitized HTML
const renderMarkdown = (content: string): string => {
  try {
    const html = marked.parse(content) as string;
    // Sanitize HTML for security (DOMPurify works in browser context)
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "h1",
        "h2",
        "h3",
        "h4",
        "ul",
        "ol",
        "li",
        "blockquote",
        "code",
        "pre",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "a",
        "hr",
      ],
      ALLOWED_ATTR: ["href", "target", "rel"],
    });
  } catch (error) {
    console.error("Error rendering markdown:", error);
    return content;
  }
};

// Get ApexCharts options for a chart
const getChartOptions = (chart: ChartData) => {
  if (chart.type === "pie") {
    return {
      chart: {
        toolbar: { show: false },
        foreColor: "#94a3b8",
      },
      labels: chart.data.labels,
      legend: {
        labels: { colors: "#94a3b8" },
        position: "bottom" as const,
      },
      colors: chart.colors || undefined,
      theme: { mode: "dark" as const },
      plotOptions: {
        pie: {
          donut: {
            size: "60%",
          },
        },
      },
    };
  } else {
    return {
      chart: {
        toolbar: { show: false },
        foreColor: "#94a3b8",
      },
      xaxis: {
        categories: chart.data.labels,
        labels: {
          style: {
            colors: "#94a3b8",
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: "#94a3b8",
          },
          formatter: (val: number) => `$${val.toFixed(2)}`,
        },
      },
      colors: chart.colors || ["#8b5cf6"],
      theme: { mode: "dark" as const },
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 4,
        },
      },
      dataLabels: {
        enabled: false,
      },
    };
  }
};

// Get ApexCharts series for a chart
const getChartSeries = (chart: ChartData) => {
  if (chart.type === "pie") {
    return chart.data.values;
  } else {
    return [
      {
        name: chart.title,
        data: chart.data.values,
      },
    ];
  }
};

const onSend = async () => {
  const text = input.value.trim();
  if (!text) return;
  append({ role: "user", content: text });
  setInput("");
  const ctx = buildContext();
  isStreaming.value = true;
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages.value, context: ctx }),
    });
    const data = await res.json();
    append({
      role: "assistant",
      content: data.reply || "Sorry, I could not generate a response.",
      charts: data.charts || [],
    });
  } catch (e) {
    append({ role: "assistant", content: "Failed to reach assistant." });
  } finally {
    isStreaming.value = false;
    nextTick(() => {
      if (scrollRef.value)
        scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
    });
  }
};

const quick = (q: string) => {
  setInput(q);
};
</script>

<style scoped>
/* Mobile-first markdown styling - emphasize vertical layout */
.prose {
  /* Ensure text wraps properly */
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Hide or convert tables to vertical layout on mobile */
.prose table {
  display: none; /* Hide tables completely */
}

/* Paragraph spacing - add breathing room */
.prose p {
  word-wrap: break-word;
  overflow-wrap: break-word;
  margin-bottom: 1rem; /* Add space between paragraphs */
  line-height: 1.6;
}

/* Heading spacing */
.prose h1,
.prose h2,
.prose h3,
.prose h4 {
  word-wrap: break-word;
  overflow-wrap: break-word;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.prose h2 {
  margin-top: 1.25rem;
}

/* List spacing */
.prose ul,
.prose ol {
  padding-left: 1.5rem;
  margin-bottom: 1.25rem; /* More space after lists */
  margin-top: 0.5rem;
}

.prose li {
  margin-bottom: 0.75rem; /* More space between list items */
  line-height: 1.7;
  padding-left: 0.25rem;
}

/* Improve list readability */
.prose ul li p,
.prose ol li p {
  margin: 0.5rem 0; /* Add space inside list items */
}

/* Add spacing between list items with nested content */
.prose li + li {
  margin-top: 0.5rem;
}

/* Code styling */
.prose code {
  background-color: rgb(15 23 42);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.prose pre {
  overflow-x: auto;
  max-width: 100%;
  margin: 1rem 0; /* Space around code blocks */
}

.prose pre code {
  background-color: transparent;
  padding: 0;
}

/* Blockquote spacing */
.prose blockquote {
  margin: 1rem 0;
  padding-left: 1rem;
  border-left: 3px solid rgb(71 85 105);
}

/* Horizontal rule spacing */
.prose hr {
  margin: 1.5rem 0;
  border-color: rgb(71 85 105);
}
</style>
