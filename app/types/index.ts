import type { Timestamp } from "firebase/firestore";

export interface IUser {
  id: string;
  email: string;
  displayName?: string;
  createdAt: Date | Timestamp;
}

export interface ICategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  isDefault: boolean;
  userId?: string;
  createdAt: Date | Timestamp;
}

export interface IAccount {
  id: string;
  name: string;
  type: "credit" | "debit" | "bank" | "loan";
  lastFourDigits?: string;
  isActive: boolean;
  userId: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface IProject {
  id: string;
  name: string;
  description?: string;
  budget: number;
  spent: number;
  startDate: Date | Timestamp;
  endDate?: Date | Timestamp;
  status: "active" | "completed" | "paused";
  userId: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface IReceipt {
  id: string;
  imageUrl: string;
  uploadDate: Date | Timestamp;
  processedDate?: Date | Timestamp;
  status: "uploaded" | "processing" | "processed" | "error";
  userId: string;
  errorMessage?: string;
  receiptNumber?: number;
}

export interface IOcrItem {
  name: string;
  quantity?: number;
  price: number;
  category?: string;
}

export interface IOcrResult {
  totalAmount: number;
  merchant?: string;
  date?: Date | Timestamp;
  creditCardLastFour?: string;
  items: IOcrItem[];
  rawText?: string;
}

export interface IExpense {
  id: string;
  amount: number;
  category: string;
  projectId: string;
  accountId: string;
  description: string;
  date: Date | Timestamp;
  receiptId?: string;
  receiptImageUrl?: string;
  isManualEntry: boolean;
  ocrData?: IOcrResult;
  userId: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface IIncome {
  id: string;
  amount: number;
  description: string;
  date: Date | Timestamp;
  projectId?: string;
  accountId?: string;
  userId: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Report interfaces
export interface IExpenseBreakdown {
  category: string;
  total: number;
  count: number;
}

export interface IProjectPerformance {
  projectId: string;
  projectName: string;
  budget: number;
  spent: number;
  percentageUsed: number;
}

export interface IAccountSummary {
  accountId: string;
  accountName: string;
  total: number;
  count: number;
}

export interface IFinancialReport {
  dateRange: {
    start: Date;
    end: Date;
  };
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  expenseBreakdown: IExpenseBreakdown[];
  projectPerformance: IProjectPerformance[];
  accountSummary: IAccountSummary[];
}

// Form states
export interface IExpenseForm {
  amount: number;
  category: string;
  projectId: string;
  accountId: string;
  description: string;
  date: Date;
}

export interface IIncomeForm {
  amount: number;
  description: string;
  date: Date;
  projectId?: string;
  accountId?: string;
}

export interface IProjectForm {
  name: string;
  description?: string;
  budget: number;
  startDate: Date;
  endDate?: Date;
  status: "active" | "completed" | "paused";
}

export interface IAccountForm {
  name: string;
  type: "credit" | "debit" | "bank" | "loan";
  lastFourDigits?: string;
  isActive: boolean;
}

// Predefined categories
export const DEFAULT_CATEGORIES: Omit<
  ICategory,
  "id" | "userId" | "createdAt"
>[] = [
  {
    name: "Flooring",
    color: "#8B5CF6",
    icon: "i-heroicons-squares-plus",
    isDefault: true,
  },
  {
    name: "Plumbing",
    color: "#06B6D4",
    icon: "i-heroicons-funnel",
    isDefault: true,
  },
  {
    name: "Electrical",
    color: "#F59E0B",
    icon: "i-heroicons-bolt",
    isDefault: true,
  },
  {
    name: "Materials",
    color: "#10B981",
    icon: "i-heroicons-cube",
    isDefault: true,
  },
  {
    name: "Labor",
    color: "#EF4444",
    icon: "i-heroicons-users",
    isDefault: true,
  },
  {
    name: "Equipment",
    color: "#6366F1",
    icon: "i-heroicons-wrench-screwdriver",
    isDefault: true,
  },
  {
    name: "Tools",
    color: "#EC4899",
    icon: "i-heroicons-wrench",
    isDefault: true,
  },
  {
    name: "Transportation",
    color: "#F97316",
    icon: "i-heroicons-truck",
    isDefault: true,
  },
  {
    name: "Permits",
    color: "#14B8A6",
    icon: "i-heroicons-document-check",
    isDefault: true,
  },
  {
    name: "Other",
    color: "#64748B",
    icon: "i-heroicons-ellipsis-horizontal-circle",
    isDefault: true,
  },
];
