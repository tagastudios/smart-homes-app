export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{
      messages: Array<{ role: string; content: string }>;
      context: any;
    }>(event);
    // Placeholder implementation: echo last user message with a friendly note and mention number of expenses known
    const last = [...(body?.messages || [])]
      .reverse()
      .find((m) => m.role === "user");
    const reply = `You said: "${last?.content || ""}". I have ${
      body?.context?.expenses?.length || 0
    } expenses and ${
      body?.context?.incomes?.length || 0
    } incomes in your context. How can I help further?`;
    return { reply };
  } catch (e) {
    return { reply: "Sorry, something went wrong." };
  }
});
