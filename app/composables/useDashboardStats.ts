export const useDashboardStats = () => {
  // Mock data matching the prototype exactly
  const thisMonthExpenses = ref(12450);
  const lastMonthExpenses = ref(11000);
  const expensesPercentageChange = computed(() => 12.5);

  const pendingReceipts = ref({
    count: 5,
    totalAmount: 3200,
  });

  interface Transaction {
    id: string;
    type: "expense" | "income";
    amount: number;
    description: string;
    location: string;
    date: string;
    icon: string;
    iconColor: string;
    bgColor: string;
    amountColor: string;
  }

  const recentTransactions = ref<Transaction[]>([
    {
      id: "1",
      type: "expense",
      amount: 234.5,
      description: "Hardware Store",
      location: "1399 Bank Road",
      date: "Today",
      icon: "i-lucide-trending-down",
      iconColor: "text-red-400",
      bgColor: "bg-red-500/20",
      amountColor: "text-red-400",
    },
    {
      id: "2",
      type: "income",
      amount: 5000.0,
      description: "Client Payment",
      location: "123 Main Rd",
      date: "Yesterday",
      icon: "i-lucide-trending-up",
      iconColor: "text-green-400",
      bgColor: "bg-green-500/20",
      amountColor: "text-green-400",
    },
    {
      id: "3",
      type: "expense",
      amount: 2500.0,
      description: "Employee Salary",
      location: "Internal",
      date: "2 days ago",
      icon: "i-lucide-trending-down",
      iconColor: "text-red-400",
      bgColor: "bg-red-500/20",
      amountColor: "text-red-400",
    },
  ]);

  // Utility functions
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const formatPercentage = (value: number) => {
    return `+${value}%`;
  };

  const formatAmount = (amount: number, type: "expense" | "income") => {
    const sign = type === "expense" ? "-" : "+";
    return `${sign}$${amount.toLocaleString()}`;
  };

  return {
    thisMonthExpenses,
    pendingReceipts,
    expensesPercentageChange,
    recentTransactions,
    formatCurrency,
    formatPercentage,
    formatAmount,
  };
};
