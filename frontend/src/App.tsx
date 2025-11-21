import { useState, useEffect } from 'react';
import { ChatWindow } from './components/Chat/ChatWindow';
import { ExpenseForm } from './components/Expenses/ExpenseForm';
import { ExpenseList } from './components/Expenses/ExpenseList';
import { InsightsDashboard } from './components/Insights/InsightsDashboard';

interface Expense {
  id: string;
  amount: number;
  merchant: string;
  category: string;
  date: string;
  notes?: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'expenses' | 'insights'>('chat');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>(() => {
    // Try to get existing session from localStorage, or create new one
    const stored = localStorage.getItem('finbot-userId');
    if (stored) return stored;
    const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('finbot-userId', newId);
    return newId;
  });

  const API_URL = 'http://localhost:8787';

  // Fetch expenses on mount and when tab changes or userId changes
  useEffect(() => {
    fetchExpenses();
  }, [activeTab, userId]);

  const fetchExpenses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/user/expenses?userId=${userId}`);
      const data = await response.json();
      setExpenses(data.expenses || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = () => {
    if (confirm('Start a new session? This will clear all your expenses and chat history.')) {
      const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('finbot-userId', newId);
      setUserId(newId);
      setExpenses([]);
      setActiveTab('chat');
      fetchExpenses();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">💰 FinBot</h1>
              <p className="text-sm text-gray-600">AI-Powered Financial Wellness</p>
              <p className="text-xs text-gray-400 mt-1">
                Session: {userId.split('_')[1]?.slice(0, 8)}...
              </p>
            </div>
            <button
              onClick={startNewSession}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 text-sm font-medium shadow-md transition-all"
              title="Start a new session with fresh data"
            >
              🔄 New Session
            </button>
          </div>

          <nav className="mt-4 flex gap-4">
            <button
              onClick={() => setActiveTab('chat')}
              className={`pb-2 border-b-2 ${
                activeTab === 'chat'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`pb-2 border-b-2 ${
                activeTab === 'expenses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`pb-2 border-b-2 ${
                activeTab === 'insights'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600'
              }`}
            >
              Insights
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 px-4">
        {activeTab === 'chat' && <ChatWindow userId={userId} />}

        {activeTab === 'expenses' && (
          <>
            <ExpenseForm
              userId={userId}
              onExpenseAdded={fetchExpenses}
              existingExpenses={expenses}
            />
            <ExpenseList expenses={expenses} loading={loading} />
          </>
        )}

        {activeTab === 'insights' && <InsightsDashboard userId={userId} expenses={expenses} loading={loading} />}
      </main>
    </div>
  );
}

export default App;
