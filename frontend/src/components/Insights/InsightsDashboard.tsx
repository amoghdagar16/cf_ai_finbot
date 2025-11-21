import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface Expense {
  id: string;
  amount: number;
  merchant: string;
  category: string;
  date: string;
  notes?: string;
}

interface SpendingPersonality {
  personality: string;
  description: string;
  patterns: Array<{
    type: string;
    insight: string;
    recommendation: string;
  }>;
  trends: {
    weekendVsWeekday: { weekend: number; weekday: number };
    categoryDistribution: Record<string, number>;
  };
}

interface InsightsDashboardProps {
  userId: string;
  expenses: Expense[];
  loading: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#10B981',       // green
  Transport: '#3B82F6',  // blue
  Shopping: '#8B5CF6',   // purple
  Bills: '#EF4444',      // red
  Other: '#6B7280'       // gray
};

export function InsightsDashboard({ userId, expenses, loading }: InsightsDashboardProps) {
  const [insights, setInsights] = useState<SpendingPersonality | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);

  const API_URL = 'http://localhost:8787';

  useEffect(() => {
    if (expenses.length > 0) {
      fetchInsights();
    } else {
      setInsightsLoading(false);
    }
  }, [expenses, userId]);

  const fetchInsights = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/insights?userId=${userId}`);
      const data = await response.json();
      setInsights(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setInsightsLoading(false);
    }
  };

  // Calculate category breakdown from expenses
  const categoryData = Object.entries(
    expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([category, amount]) => ({
    name: category,
    value: amount,
    color: CATEGORY_COLORS[category] || CATEGORY_COLORS.Other
  }));

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  if (loading || insightsLoading) {
    return <div className="text-center py-8">Analyzing your spending...</div>;
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Expenses Yet</h2>
        <p className="text-gray-600">
          Add some expenses to see your spending insights and patterns!
        </p>
      </div>
    );
  }

  const weekData = insights ? [
    { name: 'Weekday', amount: insights.trends.weekendVsWeekday.weekday },
    { name: 'Weekend', amount: insights.trends.weekendVsWeekday.weekend }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Total Spending Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium mb-1">Total Spending</h2>
            <p className="text-4xl font-bold">${totalSpent.toFixed(2)}</p>
            <p className="text-blue-100 mt-2">{expenses.length} transactions</p>
          </div>
          <div className="text-6xl">💰</div>
        </div>
      </div>

      {/* Personality Insights */}
      {insights && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium mb-1">Your Spending Personality</h2>
              <p className="text-2xl font-bold mb-2">{insights.personality}</p>
              <p className="text-purple-100">{insights.description}</p>
            </div>
            <div className="text-6xl">
              {insights.personality.includes('Weekend') && '🎉'}
              {insights.personality.includes('Stress') && '😰'}
              {insights.personality.includes('Night') && '🌙'}
              {insights.personality.includes('Consistent') && '📊'}
              {insights.personality.includes('Impulse') && '⚡'}
              {!insights.personality.match(/Weekend|Stress|Night|Consistent|Impulse/) && '🤔'}
            </div>
          </div>
        </div>
      )}

      {/* Spending Patterns */}
      {insights && insights.patterns.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">💡 Spending Patterns</h3>
          <div className="space-y-4">
            {insights.patterns.map((pattern, idx) => (
              <div key={idx} className="border-l-4 border-blue-500 pl-4">
                <p className="font-medium text-gray-900">{pattern.insight}</p>
                <p className="text-sm text-gray-600 mt-1">💡 {pattern.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Category Breakdown */}
        {categoryData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>

            {/* Category Legend with Totals */}
            <div className="mt-4 space-y-2">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-gray-700">{cat.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    ${cat.value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bar Chart - Category Amounts */}
        {categoryData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Bar dataKey="value" fill="#3B82F6">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Weekend vs Weekday */}
        {weekData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Weekend vs Weekday Spending</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weekData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Bar dataKey="amount" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Merchants */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Top Merchants</h3>
        <div className="space-y-3">
          {Object.entries(
            expenses.reduce((acc, expense) => {
              acc[expense.merchant] = (acc[expense.merchant] || 0) + expense.amount;
              return acc;
            }, {} as Record<string, number>)
          )
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([merchant, amount], idx) => (
              <div key={merchant} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '📍'}
                  </span>
                  <span className="text-gray-900 font-medium">{merchant}</span>
                </div>
                <span className="text-gray-900 font-semibold">${amount.toFixed(2)}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
