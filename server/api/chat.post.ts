import OpenAI from "openai";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{
      messages: Array<{ role: string; content: string }>;
      context: any;
    }>(event);

    const lastUserMessage = [...(body?.messages || [])]
      .reverse()
      .find((m) => m.role === "user");

    if (!lastUserMessage?.content) {
      return { reply: "Please send a message to get help." };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY environment variable is not set");
      return {
        reply:
          "AI assistant is not configured. Please set the OPENAI_API_KEY environment variable.",
      };
    }

    const openai = new OpenAI({
      apiKey: apiKey.trim(),
    });

    // Build context summary for AI
    const contextData = body.context || {};
    const expenses = contextData.expenses || [];
    const incomes = contextData.incomes || [];
    const projects = contextData.projects || [];
    const accounts = contextData.accounts || [];
    const receipts = contextData.receipts || [];

    // Helper to find account/project names by ID
    const getAccountName = (id: string) =>
      accounts.find((a: any) => a.id === id)?.name || id;
    const getProjectName = (id: string) =>
      projects.find((p: any) => p.id === id)?.name || id;

    // Helper function to search expenses
    const searchExpenses = (query: string) => {
      const lowerQuery = query.toLowerCase();
      return expenses.filter(
        (e: any) =>
          e.description?.toLowerCase().includes(lowerQuery) ||
          e.category?.toLowerCase().includes(lowerQuery)
      );
    };

    // Helper function to calculate totals
    const calculateTotal = (items: any[]) => {
      return items.reduce((sum, item) => sum + (item.amount || 0), 0);
    };

    // Process the query to extract intent
    const userQuery = lastUserMessage.content.toLowerCase();

    // Check for merchant-specific queries (e.g., "Home Depot", "Lowe's")
    let merchantMatches: any[] = [];
    const merchantKeywords = [
      "home depot",
      "lowes",
      "lowe's",
      "menards",
      "ace hardware",
      "walmart",
      "amazon",
    ];

    // First, try exact keyword matches
    for (const keyword of merchantKeywords) {
      if (userQuery.includes(keyword)) {
        merchantMatches = searchExpenses(keyword);
        break;
      }
    }

    // If no merchant keyword found, extract merchant names from expense descriptions
    // and try to match with user query
    if (merchantMatches.length === 0 && expenses.length > 0) {
      // Extract potential merchant names from descriptions (first part before " - ")
      const commonMerchants = new Map<string, any[]>();
      expenses.forEach((e: any) => {
        const desc = e.description || "";
        // Look for patterns like "Home Depot - Receipt" or "HOME DEPOT"
        const merchantPart = desc.split(" - ")[0].trim().toLowerCase();
        if (merchantPart && merchantPart.length > 2) {
          if (!commonMerchants.has(merchantPart)) {
            commonMerchants.set(merchantPart, []);
          }
          commonMerchants.get(merchantPart)!.push(e);
        }
      });

      // Try to match user query with merchant names (fuzzy matching)
      for (const [merchant, matchedExpenses] of commonMerchants.entries()) {
        // Check if user query contains the merchant name or vice versa
        if (
          userQuery.includes(merchant) ||
          merchant.includes(userQuery) ||
          // Also check for partial matches (e.g., "home depot" matches "home")
          merchant.split(/\s+/).some((word) => userQuery.includes(word)) ||
          userQuery.split(/\s+/).some((word) => merchant.includes(word))
        ) {
          merchantMatches = matchedExpenses;
          break;
        }
      }
    }

    // Build compact, token-efficient context string for AI
    let contextString = `Financial Data:\n`;

    // Expenses - compact format
    if (expenses.length > 0) {
      contextString += `Expenses(${expenses.length}): `;
      expenses.slice(0, 100).forEach((e: any, idx: number) => {
        const project = e.projectId ? getProjectName(e.projectId) : "";
        const account = e.accountId ? getAccountName(e.accountId) : "";
        const merchant = e.ocrData?.merchant ? ` [${e.ocrData.merchant}]` : "";
        contextString += `${idx > 0 ? "; " : ""}$${e.amount.toFixed(2)}|${
          e.date
        }|${e.category}|${e.description}${merchant}${
          project ? `|${project}` : ""
        }${account ? `|${account}` : ""}`;
      });
      if (expenses.length > 100) {
        contextString += `... (+${expenses.length - 100} more)`;
      }
      contextString += "\n";
    }

    // Incomes - compact format
    if (incomes.length > 0) {
      contextString += `Incomes(${incomes.length}): `;
      incomes.slice(0, 100).forEach((i: any, idx: number) => {
        const project = i.projectId ? getProjectName(i.projectId) : "";
        contextString += `${idx > 0 ? "; " : ""}$${i.amount.toFixed(2)}|${
          i.date
        }|${i.description}${project ? `|${project}` : ""}`;
      });
      if (incomes.length > 100) {
        contextString += `... (+${incomes.length - 100} more)`;
      }
      contextString += "\n";
    }

    // Projects - full details
    if (projects.length > 0) {
      contextString += `Projects(${projects.length}): `;
      projects.forEach((p: any, idx: number) => {
        contextString += `${idx > 0 ? "; " : ""}${p.name}|${
          p.status
        }|Budget:$${p.budget.toFixed(2)}|Spent:$${p.spent.toFixed(
          2
        )}|Left:$${p.amountLeft.toFixed(2)}|${p.budgetPercentage.toFixed(1)}%`;
        if (p.description) contextString += `|${p.description}`;
        if (p.endDate) contextString += `|End:${p.endDate}`;
      });
      contextString += "\n";
    }

    // Accounts - full details
    if (accounts.length > 0) {
      contextString += `Accounts(${accounts.length}): `;
      accounts.forEach((a: any, idx: number) => {
        contextString += `${idx > 0 ? "; " : ""}${a.name}|${a.type}${
          a.cardType ? `|${a.cardType}` : ""
        }${a.lastFourDigits ? `|****${a.lastFourDigits}` : ""}|${
          a.isActive ? "active" : "inactive"
        }`;
      });
      contextString += "\n";
    }

    // Receipts - full details
    if (receipts.length > 0) {
      const pendingCount = receipts.filter(
        (r: any) => r.status === "uploaded" || r.status === "processing"
      ).length;
      const processedCount = receipts.filter(
        (r: any) => r.status === "processed" || r.status === "approved"
      ).length;
      const errorCount = receipts.filter(
        (r: any) => r.status === "error"
      ).length;
      contextString += `Receipts: Total ${receipts.length} (Pending:${pendingCount}|Processed:${processedCount}|Errors:${errorCount})\n`;
      if (pendingCount > 0) {
        contextString += `Pending: `;
        receipts
          .filter(
            (r: any) => r.status === "uploaded" || r.status === "processing"
          )
          .slice(0, 10)
          .forEach((r: any, idx: number) => {
            contextString += `${idx > 0 ? "; " : ""}#${
              r.receiptNumber || r.id
            }|${r.status}|${r.uploadDate}`;
          });
        contextString += "\n";
      }
    }

    // Add merchant-specific results if found
    if (merchantMatches.length > 0) {
      const merchantTotal = calculateTotal(merchantMatches);
      const lastMatch = merchantMatches.sort(
        (a: any, b: any) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      contextString += `\nMerchant Query Results: ${
        merchantMatches.length
      } match(es), Total: $${merchantTotal.toFixed(
        2
      )}, Last: $${lastMatch.amount.toFixed(2)} on ${lastMatch.date}\n`;
    }

    // Summary stats
    const totalExpenses = calculateTotal(expenses);
    const totalIncomes = calculateTotal(incomes);
    const netIncome = totalIncomes - totalExpenses;
    contextString += `\nTotals: Expenses $${totalExpenses.toFixed(
      2
    )} | Incomes $${totalIncomes.toFixed(2)} | Net $${netIncome.toFixed(2)}\n`;

    // Build the AI prompt - concise and token-efficient
    const systemPrompt = `You are a financial assistant for a construction business. Answer questions accurately and concisely using the provided data. Rules:
- Use exact amounts/dates from data
- Be direct and factual
- Do NOT ask follow-up questions
- Do NOT add closing phrases like "How can I help?" or "Let me know if..."
- Keep responses brief (2-4 sentences max unless detailed analysis needed)
- If data unavailable, say so briefly`;

    const userPrompt = `${contextString}\n\nQ: ${lastUserMessage.content}\n\nA:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 300,
    });

    const reply =
      completion.choices[0]?.message?.content ||
      "Sorry, I couldn't generate a response. Please try again.";

    return { reply };
  } catch (error) {
    console.error("Chat API error:", error);
    return {
      reply:
        error instanceof Error
          ? `Sorry, an error occurred: ${error.message}`
          : "Sorry, something went wrong. Please try again.",
    };
  }
});
