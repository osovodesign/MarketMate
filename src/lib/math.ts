import {
  Sale,
  Expense,
  FinancialPeriodSummary,
  DashboardMetrics,
  UnifiedTransaction,
  ExpenseCategory,
} from '../types';

/**
 * Calculates deterministic line-item financial metrics for a single sale.
 */
export function calculateSaleMetrics(
  quantity: number,
  sellingPrice: number,
  costPrice: number
): { revenue: number; cost: number; profit: number; profitMargin: number } {
  const safeQty = Math.max(0, Number(quantity) || 0);
  const safeSelling = Math.max(0, Number(sellingPrice) || 0);
  const safeCost = Math.max(0, Number(costPrice) || 0);

  const revenue = safeQty * safeSelling;
  const cost = safeQty * safeCost;
  const profit = revenue - cost;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return {
    revenue: roundMoney(revenue),
    cost: roundMoney(cost),
    profit: roundMoney(profit),
    profitMargin: roundMoney(profitMargin),
  };
}

/**
 * Safely rounds monetary amounts to 2 decimal places to avoid floating point anomalies.
 */
export function roundMoney(val: number): number {
  if (isNaN(val) || !isFinite(val)) return 0;
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Computes deterministic aggregated financial summaries over a set of sales and expenses.
 */
export function calculatePeriodSummary(
  sales: Sale[],
  expenses: Expense[]
): FinancialPeriodSummary {
  let revenue = 0;
  let productCosts = 0;
  let operatingExpenses = 0;

  for (const sale of sales) {
    revenue += Number(sale.revenue) || 0;
    productCosts += Number(sale.cost) || 0;
  }

  for (const exp of expenses) {
    operatingExpenses += Number(exp.amount) || 0;
  }

  revenue = roundMoney(revenue);
  productCosts = roundMoney(productCosts);
  operatingExpenses = roundMoney(operatingExpenses);

  const grossProfit = roundMoney(revenue - productCosts);
  const operatingProfit = roundMoney(grossProfit - operatingExpenses);
  const profitMargin = revenue > 0 ? roundMoney((operatingProfit / revenue) * 100) : 0;

  return {
    revenue,
    productCosts,
    operatingExpenses,
    grossProfit,
    operatingProfit,
    profitMargin,
    salesCount: sales.length,
    expensesCount: expenses.length,
  };
}

/**
 * Filters sales based on a date range [startDate, endDate] inclusive (YYYY-MM-DD)
 */
export function filterSalesByDateRange(
  sales: Sale[],
  startDate: string,
  endDate: string
): Sale[] {
  return sales.filter((s) => s.saleDate >= startDate && s.saleDate <= endDate);
}

/**
 * Filters expenses based on a date range [startDate, endDate] inclusive (YYYY-MM-DD)
 */
export function filterExpensesByDateRange(
  expenses: Expense[],
  startDate: string,
  endDate: string
): Expense[] {
  return expenses.filter((e) => e.expenseDate >= startDate && e.expenseDate <= endDate);
}

/**
 * Generates unified transaction stream sorted by date descending.
 */
export function buildUnifiedTransactions(
  sales: Sale[],
  expenses: Expense[]
): UnifiedTransaction[] {
  const unifiedSales: UnifiedTransaction[] = sales.map((s) => ({
    id: s.id,
    type: 'sale',
    title: s.productName,
    subtitle: s.customerName ? `Customer: ${s.customerName} (${s.quantity} units)` : `${s.quantity} units sold`,
    amount: s.revenue,
    cost: s.cost,
    profit: s.profit,
    paymentMethod: s.paymentMethod,
    date: s.saleDate,
    createdAt: s.createdAt,
    rawSale: s,
  }));

  const unifiedExpenses: UnifiedTransaction[] = expenses.map((e) => ({
    id: e.id,
    type: 'expense',
    title: e.description,
    subtitle: `${e.category} • ${e.paymentMethod}`,
    amount: e.amount,
    paymentMethod: e.paymentMethod,
    category: e.category,
    date: e.expenseDate,
    createdAt: e.createdAt,
    rawExpense: e,
  }));

  return [...unifiedSales, ...unifiedExpenses].sort((a, b) => {
    // Primary sort by date desc, secondary by createdAt desc
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });
}

/**
 * Builds complete comprehensive dashboard metrics (Today, This Week, This Month, Trends, Categories)
 */
export function computeDashboardMetrics(
  sales: Sale[],
  expenses: Expense[],
  referenceDate = new Date()
): DashboardMetrics {
  const now = referenceDate;
  const todayStr = getIsoDate(now);

  // Calculate start of current week (Monday)
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
  const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMonday);
  const weekStartStr = getIsoDate(monday);

  // Calculate start of current month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartStr = getIsoDate(monthStart);

  // Filter partitions
  const todaySales = sales.filter((s) => s.saleDate === todayStr);
  const todayExpenses = expenses.filter((e) => e.expenseDate === todayStr);

  const weekSales = sales.filter((s) => s.saleDate >= weekStartStr && s.saleDate <= todayStr);
  const weekExpenses = expenses.filter((e) => e.expenseDate >= weekStartStr && e.expenseDate <= todayStr);

  const monthSales = sales.filter((s) => s.saleDate >= monthStartStr && s.saleDate <= todayStr);
  const monthExpenses = expenses.filter((e) => e.expenseDate >= monthStartStr && e.expenseDate <= todayStr);

  // Summaries
  const todaySummary = calculatePeriodSummary(todaySales, todayExpenses);
  const thisWeekSummary = calculatePeriodSummary(weekSales, weekExpenses);
  const thisMonthSummary = calculatePeriodSummary(monthSales, monthExpenses);

  // 7-day Sales & Profit Trend
  const salesTrend: DashboardMetrics['salesTrend'] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dStr = getIsoDate(d);
    const dLabel = i === 0 ? 'Today' : i === 1 ? 'Yest' : new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(d);

    const dayS = sales.filter((s) => s.saleDate === dStr);
    const dayE = expenses.filter((e) => e.expenseDate === dStr);
    const sum = calculatePeriodSummary(dayS, dayE);

    salesTrend.push({
      date: dStr,
      label: dLabel,
      revenue: sum.revenue,
      profit: sum.operatingProfit,
      expenses: sum.operatingExpenses,
    });
  }

  // Expense Category Breakdown (for the current month)
  const categoryTotals: Partial<Record<ExpenseCategory, number>> = {};
  let totalMonthExpenseAmount = 0;

  for (const exp of monthExpenses) {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    totalMonthExpenseAmount += exp.amount;
  }

  const expenseCategoryBreakdown = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category: category as ExpenseCategory,
      amount: roundMoney(amount as number),
      percentage: totalMonthExpenseAmount > 0 ? roundMoney(((amount as number) / totalMonthExpenseAmount) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Top Selling Products (This Month)
  const productPerformanceMap: Record<string, { quantity: number; revenue: number; profit: number }> = {};
  for (const sale of monthSales) {
    const pName = sale.productName || 'Unnamed Item';
    if (!productPerformanceMap[pName]) {
      productPerformanceMap[pName] = { quantity: 0, revenue: 0, profit: 0 };
    }
    productPerformanceMap[pName].quantity += sale.quantity;
    productPerformanceMap[pName].revenue += sale.revenue;
    productPerformanceMap[pName].profit += sale.profit;
  }

  const topSellingProducts = Object.entries(productPerformanceMap)
    .map(([name, data]) => ({
      name,
      quantity: data.quantity,
      revenue: roundMoney(data.revenue),
      profit: roundMoney(data.profit),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const unified = buildUnifiedTransactions(sales, expenses);

  return {
    today: todaySummary,
    thisWeek: thisWeekSummary,
    thisMonth: thisMonthSummary,
    recentTransactions: unified.slice(0, 8),
    salesTrend,
    expenseCategoryBreakdown,
    topSellingProducts,
  };
}

function getIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
