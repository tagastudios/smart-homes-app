export const useChatContext = () => {
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { projects } = useProjects();
  const { accounts } = useAccounts();
  const { receipts } = useReceipts();

  const formatDate = (d: any) => {
    const v = d && typeof d.toDate === "function" ? d.toDate() : d;
    return new Date(v).toISOString().slice(0, 10);
  };

  const buildContext = () => {
    const ex = (expenses.value || [])
      .slice(0, 50)
      .map((e) => ({
        id: e.id,
        amount: e.amount,
        category: e.category,
        description: e.description,
        date: formatDate(e.date),
      }));
    const inc = (incomes.value || [])
      .slice(0, 50)
      .map((i) => ({
        id: i.id,
        amount: i.amount,
        description: i.description,
        date: formatDate(i.date),
      }));
    const acc = (accounts.value || []).map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
    }));
    const proj = (projects.value || []).map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      budget: p.budget,
      spent: p.spent,
    }));
    const pend = (receipts.value || [])
      .filter((r) => r.status === "uploaded" || r.status === "processing")
      .map((r) => ({ id: r.id, uploadDate: formatDate(r.uploadDate) }));
    return {
      expenses: ex,
      incomes: inc,
      accounts: acc,
      projects: proj,
      pendingReceipts: pend,
    };
  };

  return { buildContext };
};
