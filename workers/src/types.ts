export interface Expense {
  id: string;
  amount: number;
  merchant: string;
  category: string;
  date: string;
  notes?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface UserState {
  userId: string;
  expenses: Expense[];
  conversations: Message[];
  preferences: {
    currency: string;
    categories: string[];
  };
}

export interface SpendingContext {
  totalSpent: number;
  topCategory: string;
  topAmount: number;
  recentExpenses: Expense[];
  expenseCount: number;
}

export interface SpendingPattern {
  type: 'time_of_day' | 'day_of_week' | 'category';
  insight: string;
  recommendation: string;
}

export interface SpendingPersonality {
  personality: string;
  description: string;
  patterns: SpendingPattern[];
  trends: {
    weekendVsWeekday: { weekend: number; weekday: number };
    categoryDistribution: Record<string, number>;
  };
}

export interface Env {
  AI: any;
  USER_AGENT: DurableObjectNamespace;
}
