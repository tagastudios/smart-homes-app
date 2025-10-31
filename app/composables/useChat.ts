export type ChartData = {
  type: "bar" | "pie";
  title: string;
  data: {
    labels: string[];
    values: number[];
  };
  colors?: string[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  charts?: ChartData[];
  createdAt: Date;
};

export const useChat = () => {
  const messages = useState<ChatMessage[]>("chat:messages", () => []);
  const input = useState<string>("chat:input", () => "");
  const isStreaming = useState<boolean>("chat:loading", () => false);

  const append = (m: {
    role: "user" | "assistant";
    content: string;
    charts?: ChartData[];
  }) => {
    messages.value.push({
      id: crypto.randomUUID(),
      role: m.role,
      content: m.content,
      charts: m.charts || [],
      createdAt: new Date(),
    });
  };

  const setInput = (v: string) => {
    input.value = v;
  };

  return { messages, input, isStreaming, append, setInput };
};
