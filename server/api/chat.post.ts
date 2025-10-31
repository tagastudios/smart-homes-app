import OpenAI from "openai";

interface QueryIntent {
  timeFilter?: {
    type:
      | "thisMonth"
      | "lastMonth"
      | "thisYear"
      | "lastYear"
      | "thisWeek"
      | "lastWeek"
      | "last30Days"
      | "last90Days"
      | "yearToDate"
      | "custom";
    startDate?: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
    year?: number;
    month?: number; // 1-12
    quarter?: number; // 1-4
  };
  amountFilter?: {
    type: "min" | "max" | "range" | "above" | "below";
    min?: number;
    max?: number;
    value?: number;
    sortBy?: "amount";
    sortOrder?: "asc" | "desc";
  };
  categoryFilter?: {
    categories: string[]; // Category names
  };
  projectFilter?: {
    projects: string[]; // Project names or IDs
  };
  accountFilter?: {
    accounts: string[]; // Account names or IDs
  };
  merchantFilter?: {
    merchants: string[]; // Merchant names
  };
  receiptStatusFilter?: {
    statuses: (
      | "uploaded"
      | "processing"
      | "processed"
      | "approved"
      | "error"
    )[];
  };
  sortBy?: {
    field: "date" | "amount" | "category" | "project" | "account";
    order: "asc" | "desc";
  };
  limit?: number;
  aggregation?: {
    type: "top" | "bottom";
    count: number;
    by?: "amount" | "date";
  };
  queryType?:
    | "expenses"
    | "incomes"
    | "projects"
    | "accounts"
    | "receipts"
    | "mixed"
    | "all";
}

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

    // Get all context data
    const contextData = body.context || {};
    const allExpenses = contextData.expenses || [];
    const allIncomes = contextData.incomes || [];
    const allProjects = contextData.projects || [];
    const allAccounts = contextData.accounts || [];
    const allReceipts = contextData.receipts || [];
    const allCategories = contextData.categories || [];

    // Helper functions
    const getAccountName = (id: string) =>
      allAccounts.find((a: any) => a.id === id)?.name || id;
    const getProjectName = (id: string) =>
      allProjects.find((p: any) => p.id === id)?.name || id;

    // Helper function to calculate totals
    const calculateTotal = (items: any[]) => {
      return items.reduce((sum, item) => sum + (item.amount || 0), 0);
    };

    // Step 1: Extract query intent using AI (multilingual)
    const intentPrompt = `Extract filter parameters from the user's financial query. The query may be in any language.

Available categories: ${
      allCategories.map((c: any) => c.name).join(", ") || "None"
    }
Available projects: ${allProjects.map((p: any) => p.name).join(", ") || "None"}
Available accounts: ${allAccounts.map((a: any) => a.name).join(", ") || "None"}

Return JSON with this structure:
{
  "timeFilter": {
    "type": "thisMonth|lastMonth|thisYear|lastYear|thisWeek|lastWeek|last30Days|last90Days|yearToDate|custom",
    "startDate": "YYYY-MM-DD" (only if custom),
    "endDate": "YYYY-MM-DD" (only if custom),
    "year": 2024 (if specific year mentioned),
    "month": 1-12 (if specific month),
    "quarter": 1-4 (if quarter mentioned)
  },
  "amountFilter": {
    "type": "min|max|range|above|below",
    "min": number (for range/above),
    "max": number (for range/below),
    "value": number (for above/below single value),
    "sortBy": "amount" (if sorting by amount),
    "sortOrder": "asc|desc"
  },
  "categoryFilter": {
    "categories": ["Category1", "Category2"] (array of category names from available list)
  },
  "projectFilter": {
    "projects": ["Project1", "Project2"] (array of project names or IDs)
  },
  "accountFilter": {
    "accounts": ["Account1", "Account2"] (array of account names or IDs)
  },
  "merchantFilter": {
    "merchants": ["Merchant1", "Merchant2"] (merchant names extracted from query or OCR data)
  },
  "receiptStatusFilter": {
    "statuses": ["uploaded", "processing", "processed", "approved", "error"]
  },
  "sortBy": {
    "field": "date|amount|category|project|account",
    "order": "asc|desc"
  },
  "limit": 100 (default, or specific number if "top N" or "bottom N" mentioned),
  "aggregation": {
    "type": "top|bottom",
    "count": number (if "top 10", "bottom 5" etc mentioned),
    "by": "amount|date"
  },
  "queryType": "expenses|incomes|projects|accounts|receipts|mixed|all"
}

Rules:
- Only include fields that are relevant to the query
- If query mentions "most expensive", "highest", "largest" → amountFilter.type="max", sortBy.amount="desc"
- If query mentions "cheapest", "lowest", "smallest" → amountFilter.type="min", sortBy.amount="asc"
- If query mentions "oldest", "earliest", "first" → sortBy.field="date", sortBy.order="asc"
- If query mentions "newest", "latest", "most recent", "last" → sortBy.field="date", sortBy.order="desc"
- If time period mentioned, set appropriate timeFilter
- Match category/project/account names to available lists (case-insensitive, partial match OK)
- If "top N" or "bottom N" mentioned, set aggregation with count=N
- Default limit is 100 unless aggregation specifies a different number
- If query is ambiguous, prefer "all" or "mixed" queryType

User query: "${lastUserMessage.content}"

Return only valid JSON, no additional text.`;

    const intentCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a query intent extractor. Analyze financial queries in any language and extract filter parameters. Always return valid JSON.",
        },
        {
          role: "user",
          content: intentPrompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 800,
    });

    let intent: QueryIntent = {
      limit: 100,
      queryType: "all",
    };

    try {
      const intentResponse = intentCompletion.choices[0]?.message?.content;
      if (intentResponse) {
        intent = { ...intent, ...JSON.parse(intentResponse) };
      }
    } catch (e) {
      console.error("Failed to parse intent:", e);
      // Continue with default intent
    }

    // Step 2: Apply filters based on intent
    const applyTimeFilter = (items: any[], field: string = "date"): any[] => {
      if (!intent.timeFilter) return items;
      const filter = intent.timeFilter;
      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      switch (filter.type) {
        case "thisMonth":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59
          );
          break;
        case "lastMonth":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
          break;
        case "thisYear":
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
          break;
        case "lastYear":
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
          break;
        case "thisWeek": {
          const dayOfWeek = now.getDay();
          startDate = new Date(now);
          startDate.setDate(now.getDate() - dayOfWeek);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          break;
        }
        case "lastWeek": {
          const lastWeekDay = now.getDay();
          startDate = new Date(now);
          startDate.setDate(now.getDate() - lastWeekDay - 7);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          break;
        }
        case "last30Days":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "last90Days":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 90);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "yearToDate":
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "custom":
          if (filter.startDate) startDate = new Date(filter.startDate);
          if (filter.endDate) endDate = new Date(filter.endDate);
          break;
      }

      if (filter.year && !filter.month) {
        startDate = new Date(filter.year, 0, 1);
        endDate = new Date(filter.year, 11, 31, 23, 59, 59);
      }

      if (filter.month && filter.year) {
        startDate = new Date(filter.year, filter.month - 1, 1);
        endDate = new Date(filter.year, filter.month, 0, 23, 59, 59);
      }

      if (filter.quarter && filter.year) {
        const quarterStartMonth = (filter.quarter - 1) * 3;
        startDate = new Date(filter.year, quarterStartMonth, 1);
        endDate = new Date(filter.year, quarterStartMonth + 3, 0, 23, 59, 59);
      }

      if (!startDate || !endDate) return items;

      return items.filter((item: any) => {
        const itemDate = new Date(item[field]);
        return itemDate >= startDate! && itemDate <= endDate!;
      });
    };

    const applyCategoryFilter = (items: any[]): any[] => {
      if (!intent.categoryFilter?.categories.length) return items;
      const categoryNames = intent.categoryFilter.categories.map((c) =>
        c.toLowerCase()
      );
      return items.filter((item: any) =>
        categoryNames.some((cat) => item.category?.toLowerCase().includes(cat))
      );
    };

    const applyProjectFilter = (items: any[]): any[] => {
      if (!intent.projectFilter?.projects.length) return items;
      const projectNames = intent.projectFilter.projects.map((p) =>
        p.toLowerCase()
      );
      return items.filter((item: any) => {
        if (!item.projectId) return false;
        const projectName = getProjectName(item.projectId).toLowerCase();
        return projectNames.some((p) => projectName.includes(p));
      });
    };

    const applyAccountFilter = (items: any[]): any[] => {
      if (!intent.accountFilter?.accounts.length) return items;
      const accountNames = intent.accountFilter.accounts.map((a) =>
        a.toLowerCase()
      );
      return items.filter((item: any) => {
        if (!item.accountId) return false;
        const accountName = getAccountName(item.accountId).toLowerCase();
        return accountNames.some((a) => accountName.includes(a));
      });
    };

    const applyMerchantFilter = (items: any[]): any[] => {
      if (!intent.merchantFilter?.merchants.length) return items;
      const merchantNames = intent.merchantFilter.merchants.map((m) =>
        m.toLowerCase()
      );
      return items.filter((item: any) => {
        const description = (item.description || "").toLowerCase();
        const ocrMerchant = (item.ocrData?.merchant || "").toLowerCase();
        return merchantNames.some(
          (m) => description.includes(m) || ocrMerchant.includes(m)
        );
      });
    };

    const applyAmountFilter = (items: any[]): any[] => {
      if (!intent.amountFilter) return items;
      const filter = intent.amountFilter;

      switch (filter.type) {
        case "above":
          return items.filter(
            (item: any) => item.amount >= (filter.value || 0)
          );
        case "below":
          return items.filter(
            (item: any) => item.amount <= (filter.value || 0)
          );
        case "range":
          return items.filter(
            (item: any) =>
              item.amount >= (filter.min || 0) &&
              item.amount <= (filter.max || Infinity)
          );
        default:
          return items;
      }
    };

    const applySort = (items: any[]): any[] => {
      // Handle aggregation sort (top/bottom by amount)
      if (intent.aggregation?.by === "amount") {
        return [...items].sort((a, b) => {
          if (intent.aggregation?.type === "top") {
            return b.amount - a.amount; // Descending for top
          } else {
            return a.amount - b.amount; // Ascending for bottom
          }
        });
      }

      if (intent.aggregation?.by === "date") {
        return [...items].sort((a, b) => {
          if (intent.aggregation?.type === "top") {
            return new Date(b.date).getTime() - new Date(a.date).getTime(); // Most recent first
          } else {
            return new Date(a.date).getTime() - new Date(b.date).getTime(); // Oldest first
          }
        });
      }

      // Handle amount filter sorting
      if (intent.amountFilter?.sortBy === "amount") {
        const order = intent.amountFilter.sortOrder || "desc";
        return [...items].sort((a, b) => {
          return order === "asc" ? a.amount - b.amount : b.amount - a.amount;
        });
      }

      if (!intent.sortBy) {
        // Default: sort by date descending (most recent first)
        return [...items].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      }

      const { field, order } = intent.sortBy;
      const multiplier = order === "asc" ? 1 : -1;

      return [...items].sort((a, b) => {
        switch (field) {
          case "date":
            return (
              (new Date(a.date).getTime() - new Date(b.date).getTime()) *
              multiplier
            );
          case "amount":
            return (a.amount - b.amount) * multiplier;
          case "category":
            return (
              (a.category || "").localeCompare(b.category || "") * multiplier
            );
          case "project": {
            const aProject = getProjectName(a.projectId || "");
            const bProject = getProjectName(b.projectId || "");
            return aProject.localeCompare(bProject) * multiplier;
          }
          case "account": {
            const aAccount = getAccountName(a.accountId || "");
            const bAccount = getAccountName(b.accountId || "");
            return aAccount.localeCompare(bAccount) * multiplier;
          }
          default:
            return 0;
        }
      });
    };

    const applyLimit = (items: any[]): any[] => {
      const limit = intent.aggregation?.count || intent.limit || 100;
      return items.slice(0, limit);
    };

    // Apply all filters to expenses
    let filteredExpenses = [...allExpenses];
    filteredExpenses = applyTimeFilter(filteredExpenses);
    filteredExpenses = applyCategoryFilter(filteredExpenses);
    filteredExpenses = applyProjectFilter(filteredExpenses);
    filteredExpenses = applyAccountFilter(filteredExpenses);
    filteredExpenses = applyMerchantFilter(filteredExpenses);
    filteredExpenses = applyAmountFilter(filteredExpenses);
    filteredExpenses = applySort(filteredExpenses);
    filteredExpenses = applyLimit(filteredExpenses);

    // Apply all filters to incomes
    let filteredIncomes = [...allIncomes];
    filteredIncomes = applyTimeFilter(filteredIncomes);
    filteredIncomes = applyProjectFilter(filteredIncomes);
    filteredIncomes = applyAccountFilter(filteredIncomes);
    filteredIncomes = applyAmountFilter(filteredIncomes);
    filteredIncomes = applySort(filteredIncomes);
    filteredIncomes = applyLimit(filteredIncomes);

    // Apply receipt status filter
    let filteredReceipts = [...allReceipts];
    if (intent.receiptStatusFilter?.statuses.length) {
      filteredReceipts = filteredReceipts.filter((r: any) =>
        intent.receiptStatusFilter!.statuses.includes(r.status)
      );
    }

    // Step 3: Build context string with filtered data
    let contextString = `Financial Data:\n`;

    const limit = intent.aggregation?.count || intent.limit || 100;
    const isExpensesLimited =
      allExpenses.length > filteredExpenses.length &&
      filteredExpenses.length === limit;
    const isIncomesLimited =
      allIncomes.length > filteredIncomes.length &&
      filteredIncomes.length === limit;

    // Expenses
    if (filteredExpenses.length > 0) {
      contextString += `Expenses(${filteredExpenses.length}${
        isExpensesLimited ? ` of ${allExpenses.length} (filtered)` : ""
      }): `;
      filteredExpenses.forEach((e: any, idx: number) => {
        const project = e.projectId ? getProjectName(e.projectId) : "";
        const account = e.accountId ? getAccountName(e.accountId) : "";
        const merchant = e.ocrData?.merchant ? ` [${e.ocrData.merchant}]` : "";
        contextString += `${idx > 0 ? "; " : ""}$${e.amount.toFixed(2)}|${
          e.date
        }|${e.category}|${e.description}${merchant}${
          project ? `|${project}` : ""
        }${account ? `|${account}` : ""}`;
      });
      contextString += "\n";
    }

    // Incomes
    if (filteredIncomes.length > 0) {
      contextString += `Incomes(${filteredIncomes.length}${
        isIncomesLimited ? ` of ${allIncomes.length} (filtered)` : ""
      }): `;
      filteredIncomes.forEach((i: any, idx: number) => {
        const project = i.projectId ? getProjectName(i.projectId) : "";
        contextString += `${idx > 0 ? "; " : ""}$${i.amount.toFixed(2)}|${
          i.date
        }|${i.description}${project ? `|${project}` : ""}`;
      });
      contextString += "\n";
    }

    // Projects - full details
    if (allProjects.length > 0) {
      contextString += `Projects(${allProjects.length}): `;
      allProjects.forEach((p: any, idx: number) => {
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
    if (allAccounts.length > 0) {
      contextString += `Accounts(${allAccounts.length}): `;
      allAccounts.forEach((a: any, idx: number) => {
        contextString += `${idx > 0 ? "; " : ""}${a.name}|${a.type}${
          a.cardType ? `|${a.cardType}` : ""
        }${a.lastFourDigits ? `|****${a.lastFourDigits}` : ""}|${
          a.isActive ? "active" : "inactive"
        }`;
      });
      contextString += "\n";
    }

    // Receipts - full details
    if (filteredReceipts.length > 0 || allReceipts.length > 0) {
      const receiptsToShow =
        filteredReceipts.length > 0 ? filteredReceipts : allReceipts;
      const pendingCount = receiptsToShow.filter(
        (r: any) => r.status === "uploaded" || r.status === "processing"
      ).length;
      const processedCount = receiptsToShow.filter(
        (r: any) => r.status === "processed" || r.status === "approved"
      ).length;
      const errorCount = receiptsToShow.filter(
        (r: any) => r.status === "error"
      ).length;
      contextString += `Receipts: Total ${receiptsToShow.length} (Pending:${pendingCount}|Processed:${processedCount}|Errors:${errorCount})\n`;
      if (pendingCount > 0) {
        contextString += `Pending: `;
        receiptsToShow
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

    // Summary stats from filtered data
    const totalExpenses = calculateTotal(filteredExpenses);
    const totalIncomes = calculateTotal(filteredIncomes);
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
- If data unavailable, say so briefly
- If filtered data is shown, mention the filters applied when relevant`;

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
