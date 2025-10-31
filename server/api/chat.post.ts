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
    const calculateTotal = (items: any[]): number => {
      try {
        if (!Array.isArray(items)) return 0;
        return items.reduce((sum: number, item: any) => {
          const amount = Number(item?.amount || 0);
          return isNaN(amount) ? sum : sum + amount;
        }, 0);
      } catch (error) {
        console.error("Error calculating total:", error);
        return 0;
      }
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
        const parsed = JSON.parse(intentResponse);
        // Validate and merge intent safely
        if (parsed && typeof parsed === "object") {
          intent = { ...intent, ...parsed };
          // Ensure limit is a valid number
          if (
            intent.limit &&
            (isNaN(Number(intent.limit)) || Number(intent.limit) <= 0)
          ) {
            intent.limit = 100;
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse intent:", e);
      // Continue with default intent
      intent = {
        limit: 100,
        queryType: "all",
      };
    }

    // Step 2: Apply filters based on intent
    const applyTimeFilter = (items: any[], field: string = "date"): any[] => {
      try {
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
            endDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              0,
              23,
              59,
              59
            );
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
          try {
            if (!item || !item[field]) return false;
            const itemDate = new Date(item[field]);
            if (isNaN(itemDate.getTime())) return false;
            return itemDate >= startDate! && itemDate <= endDate!;
          } catch {
            return false;
          }
        });
      } catch (error) {
        console.error("Error in applyTimeFilter:", error);
        return items;
      }
    };

    const applyCategoryFilter = (items: any[]): any[] => {
      try {
        if (
          !intent.categoryFilter?.categories ||
          !Array.isArray(intent.categoryFilter.categories) ||
          intent.categoryFilter.categories.length === 0
        )
          return items;
        const categoryNames = intent.categoryFilter.categories.map((c: any) =>
          String(c || "").toLowerCase()
        );
        return items.filter((item: any) => {
          const itemCategory = String(item?.category || "").toLowerCase();
          return categoryNames.some((cat: string) =>
            itemCategory.includes(cat)
          );
        });
      } catch (error) {
        console.error("Error in applyCategoryFilter:", error);
        return items;
      }
    };

    const applyProjectFilter = (items: any[]): any[] => {
      try {
        if (
          !intent.projectFilter?.projects ||
          !Array.isArray(intent.projectFilter.projects) ||
          intent.projectFilter.projects.length === 0
        )
          return items;
        const projectNames = intent.projectFilter.projects.map((p: any) =>
          String(p || "").toLowerCase()
        );
        return items.filter((item: any) => {
          if (!item?.projectId) return false;
          try {
            const projectName = String(
              getProjectName(item.projectId)
            ).toLowerCase();
            return projectNames.some((p: string) => projectName.includes(p));
          } catch {
            return false;
          }
        });
      } catch (error) {
        console.error("Error in applyProjectFilter:", error);
        return items;
      }
    };

    const applyAccountFilter = (items: any[]): any[] => {
      try {
        if (
          !intent.accountFilter?.accounts ||
          !Array.isArray(intent.accountFilter.accounts) ||
          intent.accountFilter.accounts.length === 0
        )
          return items;
        const accountNames = intent.accountFilter.accounts.map((a: any) =>
          String(a || "").toLowerCase()
        );
        return items.filter((item: any) => {
          if (!item?.accountId) return false;
          try {
            const accountName = String(
              getAccountName(item.accountId)
            ).toLowerCase();
            return accountNames.some((a: string) => accountName.includes(a));
          } catch {
            return false;
          }
        });
      } catch (error) {
        console.error("Error in applyAccountFilter:", error);
        return items;
      }
    };

    const applyMerchantFilter = (items: any[]): any[] => {
      try {
        if (
          !intent.merchantFilter?.merchants ||
          !Array.isArray(intent.merchantFilter.merchants) ||
          intent.merchantFilter.merchants.length === 0
        )
          return items;
        const merchantNames = intent.merchantFilter.merchants.map((m: any) =>
          String(m || "").toLowerCase()
        );
        return items.filter((item: any) => {
          try {
            const description = String(item?.description || "").toLowerCase();
            const ocrMerchant = String(
              item?.ocrData?.merchant || ""
            ).toLowerCase();
            return merchantNames.some(
              (m: string) => description.includes(m) || ocrMerchant.includes(m)
            );
          } catch {
            return false;
          }
        });
      } catch (error) {
        console.error("Error in applyMerchantFilter:", error);
        return items;
      }
    };

    const applyAmountFilter = (items: any[]): any[] => {
      try {
        if (!intent.amountFilter) return items;
        const filter = intent.amountFilter;

        switch (filter.type) {
          case "above": {
            const minValue = Number(filter.value) || 0;
            return items.filter(
              (item: any) => Number(item?.amount || 0) >= minValue
            );
          }
          case "below": {
            const maxValue = Number(filter.value) || Infinity;
            return items.filter(
              (item: any) => Number(item?.amount || 0) <= maxValue
            );
          }
          case "range": {
            const minValue = Number(filter.min) || 0;
            const maxValue = Number(filter.max) || Infinity;
            return items.filter((item: any) => {
              const amount = Number(item?.amount || 0);
              return amount >= minValue && amount <= maxValue;
            });
          }
          default:
            return items;
        }
      } catch (error) {
        console.error("Error in applyAmountFilter:", error);
        return items;
      }
    };

    const applySort = (items: any[]): any[] => {
      try {
        // Handle aggregation sort (top/bottom by amount)
        if (intent.aggregation?.by === "amount") {
          return [...items].sort((a, b) => {
            try {
              const aAmount = Number(a?.amount || 0);
              const bAmount = Number(b?.amount || 0);
              if (intent.aggregation?.type === "top") {
                return bAmount - aAmount; // Descending for top
              } else {
                return aAmount - bAmount; // Ascending for bottom
              }
            } catch {
              return 0;
            }
          });
        }

        if (intent.aggregation?.by === "date") {
          return [...items].sort((a, b) => {
            try {
              const aDate = new Date(a?.date || 0).getTime();
              const bDate = new Date(b?.date || 0).getTime();
              if (isNaN(aDate) || isNaN(bDate)) return 0;
              if (intent.aggregation?.type === "top") {
                return bDate - aDate; // Most recent first
              } else {
                return aDate - bDate; // Oldest first
              }
            } catch {
              return 0;
            }
          });
        }

        // Handle amount filter sorting
        if (intent.amountFilter?.sortBy === "amount") {
          const order = intent.amountFilter.sortOrder || "desc";
          return [...items].sort((a, b) => {
            try {
              const aAmount = Number(a?.amount || 0);
              const bAmount = Number(b?.amount || 0);
              return order === "asc" ? aAmount - bAmount : bAmount - aAmount;
            } catch {
              return 0;
            }
          });
        }

        if (!intent.sortBy) {
          // Default: sort by date descending (most recent first)
          return [...items].sort((a, b) => {
            try {
              const aDate = new Date(a?.date || 0).getTime();
              const bDate = new Date(b?.date || 0).getTime();
              if (isNaN(aDate) || isNaN(bDate)) return 0;
              return bDate - aDate;
            } catch {
              return 0;
            }
          });
        }

        const { field, order } = intent.sortBy;
        const multiplier = order === "asc" ? 1 : -1;

        return [...items].sort((a, b) => {
          try {
            switch (field) {
              case "date": {
                const aDate = new Date(a?.date || 0).getTime();
                const bDate = new Date(b?.date || 0).getTime();
                if (isNaN(aDate) || isNaN(bDate)) return 0;
                return (aDate - bDate) * multiplier;
              }
              case "amount": {
                const aAmount = Number(a?.amount || 0);
                const bAmount = Number(b?.amount || 0);
                return (aAmount - bAmount) * multiplier;
              }
              case "category": {
                const aCat = String(a?.category || "");
                const bCat = String(b?.category || "");
                return aCat.localeCompare(bCat) * multiplier;
              }
              case "project": {
                const aProject = String(getProjectName(a?.projectId || ""));
                const bProject = String(getProjectName(b?.projectId || ""));
                return aProject.localeCompare(bProject) * multiplier;
              }
              case "account": {
                const aAccount = String(getAccountName(a?.accountId || ""));
                const bAccount = String(getAccountName(b?.accountId || ""));
                return aAccount.localeCompare(bAccount) * multiplier;
              }
              default:
                return 0;
            }
          } catch {
            return 0;
          }
        });
      } catch (error) {
        console.error("Error in applySort:", error);
        // Return items sorted by date as fallback
        return [...items].sort((a, b) => {
          try {
            const aDate = new Date(a?.date || 0).getTime();
            const bDate = new Date(b?.date || 0).getTime();
            if (isNaN(aDate) || isNaN(bDate)) return 0;
            return bDate - aDate;
          } catch {
            return 0;
          }
        });
      }
    };

    const applyLimit = (items: any[]): any[] => {
      try {
        const limit = Number(intent.aggregation?.count || intent.limit || 100);
        if (isNaN(limit) || limit <= 0) return items.slice(0, 100);
        return items.slice(0, limit);
      } catch (error) {
        console.error("Error in applyLimit:", error);
        return items.slice(0, 100);
      }
    };

    // Apply all filters to expenses with error handling
    let filteredExpenses: any[] = [];
    try {
      filteredExpenses = Array.isArray(allExpenses) ? [...allExpenses] : [];
      filteredExpenses = applyTimeFilter(filteredExpenses);
      filteredExpenses = applyCategoryFilter(filteredExpenses);
      filteredExpenses = applyProjectFilter(filteredExpenses);
      filteredExpenses = applyAccountFilter(filteredExpenses);
      filteredExpenses = applyMerchantFilter(filteredExpenses);
      filteredExpenses = applyAmountFilter(filteredExpenses);
      filteredExpenses = applySort(filteredExpenses);
      filteredExpenses = applyLimit(filteredExpenses);
    } catch (error) {
      console.error("Error filtering expenses:", error);
      filteredExpenses = Array.isArray(allExpenses)
        ? allExpenses.slice(0, 100)
        : [];
    }

    // Apply all filters to incomes with error handling
    let filteredIncomes: any[] = [];
    try {
      filteredIncomes = Array.isArray(allIncomes) ? [...allIncomes] : [];
      filteredIncomes = applyTimeFilter(filteredIncomes);
      filteredIncomes = applyProjectFilter(filteredIncomes);
      filteredIncomes = applyAccountFilter(filteredIncomes);
      filteredIncomes = applyAmountFilter(filteredIncomes);
      filteredIncomes = applySort(filteredIncomes);
      filteredIncomes = applyLimit(filteredIncomes);
    } catch (error) {
      console.error("Error filtering incomes:", error);
      filteredIncomes = Array.isArray(allIncomes)
        ? allIncomes.slice(0, 100)
        : [];
    }

    // Apply receipt status filter with error handling
    let filteredReceipts: any[] = [];
    try {
      filteredReceipts = Array.isArray(allReceipts) ? [...allReceipts] : [];
      if (
        intent.receiptStatusFilter?.statuses &&
        Array.isArray(intent.receiptStatusFilter.statuses) &&
        intent.receiptStatusFilter.statuses.length > 0
      ) {
        filteredReceipts = filteredReceipts.filter((r: any) =>
          intent.receiptStatusFilter!.statuses.includes(r?.status)
        );
      }
    } catch (error) {
      console.error("Error filtering receipts:", error);
      filteredReceipts = Array.isArray(allReceipts) ? allReceipts : [];
    }

    // Step 3: Build context string with filtered data
    let contextString = `Financial Data:\n`;

    try {
      const limit = intent.aggregation?.count || intent.limit || 100;
      const isExpensesLimited =
        Array.isArray(allExpenses) &&
        allExpenses.length > filteredExpenses.length &&
        filteredExpenses.length === limit;
      const isIncomesLimited =
        Array.isArray(allIncomes) &&
        allIncomes.length > filteredIncomes.length &&
        filteredIncomes.length === limit;

      // Expenses
      if (filteredExpenses.length > 0) {
        contextString += `Expenses(${filteredExpenses.length}${
          isExpensesLimited ? ` of ${allExpenses.length} (filtered)` : ""
        }): `;
        filteredExpenses.forEach((e: any, idx: number) => {
          try {
            const amount = Number(e?.amount || 0);
            const amountStr = isNaN(amount) ? "0.00" : amount.toFixed(2);
            const project = e?.projectId ? getProjectName(e.projectId) : "";
            const account = e?.accountId ? getAccountName(e.accountId) : "";
            const merchant = e?.ocrData?.merchant
              ? ` [${e.ocrData.merchant}]`
              : "";
            contextString += `${idx > 0 ? "; " : ""}$${amountStr}|${
              e?.date || ""
            }|${e?.category || ""}|${e?.description || ""}${merchant}${
              project ? `|${project}` : ""
            }${account ? `|${account}` : ""}`;
          } catch {
            // Skip invalid entries
          }
        });
        contextString += "\n";
      }

      // Incomes
      if (filteredIncomes.length > 0) {
        contextString += `Incomes(${filteredIncomes.length}${
          isIncomesLimited ? ` of ${allIncomes.length} (filtered)` : ""
        }): `;
        filteredIncomes.forEach((i: any, idx: number) => {
          try {
            const amount = Number(i?.amount || 0);
            const amountStr = isNaN(amount) ? "0.00" : amount.toFixed(2);
            const project = i?.projectId ? getProjectName(i.projectId) : "";
            contextString += `${idx > 0 ? "; " : ""}$${amountStr}|${
              i?.date || ""
            }|${i?.description || ""}${project ? `|${project}` : ""}`;
          } catch {
            // Skip invalid entries
          }
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
          )}|Left:$${p.amountLeft.toFixed(2)}|${p.budgetPercentage.toFixed(
            1
          )}%`;
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
      )} | Incomes $${totalIncomes.toFixed(2)} | Net $${netIncome.toFixed(
        2
      )}\n`;
    } catch (error) {
      console.error("Error building context string:", error);
      // Continue with minimal context
      contextString += "Error building context. Data may be incomplete.\n";
    }

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
    // Don't expose error details to user - return friendly message
    return {
      reply:
        "Lo siento, ocurrió un error al procesar tu consulta. Por favor intenta de nuevo o reformula tu pregunta.",
    };
  }
});
