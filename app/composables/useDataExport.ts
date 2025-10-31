import { useExpenses } from "./useExpenses";
import { useIncomes } from "./useIncomes";
import type { IExpense, IIncome } from "~/types";

export const useDataExport = () => {
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();

  const formatDate = (date: Date | any, format: string = "MM/DD/YYYY") => {
    if (!date) return "";
    const d = date instanceof Date ? date : date.toDate?.() || new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();

    if (format === "DD/MM/YYYY") {
      return `${day}/${month}/${year}`;
    } else if (format === "YYYY-MM-DD") {
      return `${year}-${month}-${day}`;
    }
    return `${month}/${day}/${year}`;
  };

  const escapeCsvValue = (value: any): string => {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);
    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const exportExpensesToCsv = (
    dateStart?: Date,
    dateEnd?: Date,
    dateFormat: string = "MM/DD/YYYY"
  ) => {
    if (!expenses.value || expenses.value.length === 0) {
      return { error: "No expenses to export" };
    }

    let filteredExpenses = [...expenses.value];

    if (dateStart || dateEnd) {
      filteredExpenses = filteredExpenses.filter((exp) => {
        const expDate =
          exp.date instanceof Date
            ? exp.date
            : exp.date.toDate?.() || new Date(exp.date);
        if (dateStart && expDate < dateStart) return false;
        if (dateEnd && expDate > dateEnd) return false;
        return true;
      });
    }

    const headers = [
      "Date",
      "Amount",
      "Category",
      "Description",
      "Project",
      "Account",
      "Is Manual Entry",
    ];
    const rows = filteredExpenses.map((exp) => [
      formatDate(exp.date, dateFormat),
      exp.amount,
      exp.category,
      exp.description,
      exp.projectId || "",
      exp.accountId || "",
      exp.isManualEntry ? "Yes" : "No",
    ]);

    const csvContent =
      headers.map(escapeCsvValue).join(",") +
      "\n" +
      rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `expenses_${formatDate(new Date(), "YYYY-MM-DD")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { error: null };
  };

  const exportIncomesToCsv = (
    dateStart?: Date,
    dateEnd?: Date,
    dateFormat: string = "MM/DD/YYYY"
  ) => {
    if (!incomes.value || incomes.value.length === 0) {
      return { error: "No incomes to export" };
    }

    let filteredIncomes = [...incomes.value];

    if (dateStart || dateEnd) {
      filteredIncomes = filteredIncomes.filter((inc) => {
        const incDate =
          inc.date instanceof Date
            ? inc.date
            : inc.date.toDate?.() || new Date(inc.date);
        if (dateStart && incDate < dateStart) return false;
        if (dateEnd && incDate > dateEnd) return false;
        return true;
      });
    }

    const headers = ["Date", "Amount", "Description", "Project", "Account"];
    const rows = filteredIncomes.map((inc) => [
      formatDate(inc.date, dateFormat),
      inc.amount,
      inc.description,
      inc.projectId || "",
      inc.accountId || "",
    ]);

    const csvContent =
      headers.map(escapeCsvValue).join(",") +
      "\n" +
      rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `incomes_${formatDate(new Date(), "YYYY-MM-DD")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { error: null };
  };

  const exportAllToCsv = (
    dateStart?: Date,
    dateEnd?: Date,
    dateFormat: string = "MM/DD/YYYY"
  ) => {
    const expensesResult = exportExpensesToCsv(dateStart, dateEnd, dateFormat);
    if (
      expensesResult.error &&
      expensesResult.error !== "No expenses to export"
    )
      return expensesResult;

    const incomesResult = exportIncomesToCsv(dateStart, dateEnd, dateFormat);
    if (incomesResult.error && incomesResult.error !== "No incomes to export")
      return incomesResult;

    return { error: null };
  };

  return {
    exportExpensesToCsv,
    exportIncomesToCsv,
    exportAllToCsv,
  };
};
