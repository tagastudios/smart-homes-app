import { useCategories } from "./useCategories";

export const useChatContext = () => {
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { projects } = useProjects();
  const { accounts } = useAccounts();
  const { receipts } = useReceipts();
  const { allCategories } = useCategories();

  const formatDate = (d: any) => {
    const v = d && typeof d.toDate === "function" ? d.toDate() : d;
    return new Date(v).toISOString().slice(0, 10);
  };

  const buildContext = () => {
    // Include ALL expenses (no limit)
    const ex = (expenses.value || []).map((e) => ({
      id: e.id,
      amount: e.amount,
      category: e.category,
      description: e.description,
      date: formatDate(e.date),
      projectId: e.projectId,
      accountId: e.accountId,
      receiptId: e.receiptId,
      ocrData: e.ocrData
        ? {
            merchant: e.ocrData.merchant,
            totalAmount: e.ocrData.totalAmount,
            date: e.ocrData.date ? formatDate(e.ocrData.date) : undefined,
          }
        : undefined,
    }));

    // Include ALL incomes (no limit)
    const inc = (incomes.value || []).map((i) => ({
      id: i.id,
      amount: i.amount,
      description: i.description,
      date: formatDate(i.date),
      projectId: i.projectId,
      accountId: i.accountId,
    }));

    // Include ALL accounts with full details
    const acc = (accounts.value || []).map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      cardType: a.cardType,
      lastFourDigits: a.lastFourDigits,
      isActive: a.isActive,
    }));

    // Include ALL projects with full details
    const proj = (projects.value || []).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      status: p.status,
      budget: p.budget,
      spent: p.spent,
      startDate: formatDate(p.startDate),
      endDate: p.endDate ? formatDate(p.endDate) : undefined,
      amountLeft: Math.max(0, p.budget - p.spent),
      budgetPercentage: p.budget > 0 ? (p.spent / p.budget) * 100 : 0,
    }));

    // Include ALL receipts with full details
    const receiptsData = (receipts.value || []).map((r) => ({
      id: r.id,
      status: r.status,
      uploadDate: formatDate(r.uploadDate),
      processedDate: r.processedDate ? formatDate(r.processedDate) : undefined,
      receiptNumber: r.receiptNumber,
      errorMessage: r.errorMessage,
    }));

    // Include ALL categories
    const cats = (allCategories.value || []).map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
    }));

    return {
      expenses: ex,
      incomes: inc,
      accounts: acc,
      projects: proj,
      receipts: receiptsData,
      categories: cats,
    };
  };

  return { buildContext };
};
