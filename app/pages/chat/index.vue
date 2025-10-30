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
          <h1 class="text-2xl font-bold text-white">Assistant</h1>
          <div class="w-10" />
        </div>
      </div>

      <div class="container mx-auto px-6 py-4 pb-28">
        <UCard class="bg-slate-900 border-slate-800">
          <div
            ref="scrollRef"
            class="space-y-4 max-h-[60vh] overflow-y-auto pr-1"
          >
            <div
              v-if="messages.length === 0"
              class="text-slate-400 text-sm py-6"
            >
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
                class="max-w-[85%] rounded-2xl px-3 py-2 text-sm"
                :class="
                  m.role === 'user'
                    ? 'bg-blue-600/30 text-white'
                    : 'bg-slate-800 text-slate-100'
                "
              >
                <p class="whitespace-pre-wrap">{{ m.content }}</p>
                <p class="text-xs text-slate-400 mt-1">
                  {{ formatTime(m.createdAt) }}
                </p>
              </div>
            </div>

            <div v-if="isStreaming" class="flex justify-start">
              <div
                class="bg-slate-800 text-slate-100 rounded-2xl px-3 py-2 text-sm"
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
        <UCard class="bg-slate-900 border-slate-800">
          <div class="flex items-end gap-3">
            <UTextarea
              v-model="input"
              :rows="1"
              autoresize
              placeholder="Type a message..."
              class="flex-1"
              :ui="{ base: 'bg-slate-800 text-white border-slate-700' }"
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
              @click="quick('Top categories this month')"
              >Top categories</UButton
            >
          </div>
        </UCard>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth", ssr: false });

import { useChat } from "~/composables/useChat";
import { useChatContext } from "~/composables/useChatContext";
import { ref, nextTick } from "vue";

const { messages, input, isStreaming, append, setInput } = useChat();
const { buildContext } = useChatContext();
const scrollRef = ref<HTMLElement | null>(null);

const formatTime = (d: Date) => new Date(d).toLocaleTimeString();

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
