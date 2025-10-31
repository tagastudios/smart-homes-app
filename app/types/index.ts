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
  type: string; // Changed to string for custom types
  cardType?: string; // Changed to string to allow custom brands
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
  status: string; // Changed to string for custom statuses
  userId: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface IReceipt {
  id: string;
  imageUrl: string;
  uploadDate: Date | Timestamp;
  processedDate?: Date | Timestamp;
  status: "uploaded" | "processing" | "processed" | "approved" | "error";
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
  status: string; // Changed to string for custom statuses
}

export interface IAccountForm {
  name: string;
  type: string; // Changed to string for custom types
  cardType?: string; // Changed to string to allow custom brands
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

// Account Type interface and constants
export interface IAccountType {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  userId?: string;
  createdAt: Date | Timestamp;
}

export const DEFAULT_ACCOUNT_TYPES: Omit<
  IAccountType,
  "id" | "userId" | "createdAt"
>[] = [
  {
    name: "Credit Card",
    icon: "i-lucide-credit-card",
    color: "#8B5CF6",
    isDefault: true,
  },
  {
    name: "Debit Card",
    icon: "i-lucide-credit-card",
    color: "#06B6D4",
    isDefault: true,
  },
  {
    name: "Bank Account",
    icon: "i-lucide-landmark",
    color: "#10B981",
    isDefault: true,
  },
  {
    name: "Loan",
    icon: "i-lucide-trending-up",
    color: "#EF4444",
    isDefault: true,
  },
];

// Project Status interface and constants
export interface IProjectStatus {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  userId?: string;
  createdAt: Date | Timestamp;
}

export const DEFAULT_PROJECT_STATUSES: Omit<
  IProjectStatus,
  "id" | "userId" | "createdAt"
>[] = [
  {
    name: "Active",
    icon: "i-lucide-circle-dot",
    color: "#10B981",
    isDefault: true,
  },
  {
    name: "Completed",
    icon: "i-lucide-check-circle",
    color: "#06B6D4",
    isDefault: true,
  },
  {
    name: "On Hold",
    icon: "i-lucide-pause-circle",
    color: "#F59E0B",
    isDefault: true,
  },
];

// Card Brand interface and constants
export interface ICardBrand {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  userId?: string;
  createdAt: Date | Timestamp;
}

// Card brand definitions for visual icons
export const CARD_BRANDS = {
  visa: { icon: "i-lucide-credit-card", color: "#1A1F71", label: "Visa" },
  mastercard: {
    icon: "i-lucide-credit-card",
    color: "#EB001B",
    label: "Mastercard",
  },
  amex: {
    icon: "i-lucide-credit-card",
    color: "#006FCF",
    label: "American Express",
  },
  discover: {
    icon: "i-lucide-credit-card",
    color: "#FF6000",
    label: "Discover",
  },
};

// User Preferences interface
export interface IUserPreferences {
  currency: string;
  dateFormat: string;
  theme: "dark" | "light";
  budgetAlertEnabled: boolean;
  budgetAlertThreshold: number;
  userId: string;
  updatedAt: Date | Timestamp;
}

// User Profile interface
export interface IUserProfile {
  firstName: string;
  lastName: string;
  companyName?: string;
  address?: string;
  phone?: string;
  taxId?: string;
  userId: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}
