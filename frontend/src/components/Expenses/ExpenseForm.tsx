import { useState } from 'react';

interface ExpenseFormProps {
  userId: string;
  onExpenseAdded: () => void;
  existingExpenses: Array<{ merchant: string }>;
}

export function ExpenseForm({ userId, onExpenseAdded, existingExpenses }: ExpenseFormProps) {
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [item, setItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showMerchantDropdown, setShowMerchantDropdown] = useState(false);

  const API_URL = 'http://localhost:8787';

  // Get unique merchants from existing expenses
  const uniqueMerchants = Array.from(
    new Set(existingExpenses.map(e => e.merchant))
  ).sort();

  // Filter merchants based on input
  const filteredMerchants = uniqueMerchants.filter(m =>
    m.toLowerCase().includes(merchant.toLowerCase())
  );

  const addExpense = async () => {
    if (!merchant.trim() || !amount || parseFloat(amount) <= 0) {
      setMessage('Error: Please provide merchant and valid amount');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Use the direct add endpoint with structured data
      const response = await fetch(`${API_URL}/api/user/expenses?userId=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: merchant.trim(),
          amount: parseFloat(amount),
          notes: item.trim() || undefined,
          date: new Date().toISOString().split('T')[0]
        })
      });

      const data = await response.json();

      if (data.success || data.expense) {
        const expense = data.expense || data;
        setMessage(`✓ Added $${expense.amount} at ${expense.merchant} (${expense.category || 'categorizing...'})`);
        setMerchant('');
        setAmount('');
        setItem('');
        onExpenseAdded();
      } else {
        setMessage(`Error: ${data.error || 'Failed to add expense'}`);
      }
    } catch (error) {
      setMessage('Error adding expense');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h2 className="text-lg font-semibold mb-3">Add Expense</h2>

      <div className="space-y-3">
        {/* Merchant Input with Autocomplete */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Merchant *
          </label>
          <input
            type="text"
            value={merchant}
            onChange={(e) => {
              setMerchant(e.target.value);
              setShowMerchantDropdown(true);
            }}
            onFocus={() => setShowMerchantDropdown(true)}
            onBlur={() => setTimeout(() => setShowMerchantDropdown(false), 200)}
            placeholder="e.g., Starbucks, Uber, Amazon"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Dropdown for existing merchants */}
          {showMerchantDropdown && filteredMerchants.length > 0 && merchant.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {filteredMerchants.slice(0, 5).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMerchant(m);
                    setShowMerchantDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addExpense()}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Item/Description Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Item / Description <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <input
            type="text"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addExpense()}
            placeholder="e.g., Latte, Lunch meeting, Groceries"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Helps AI understand your spending patterns better
          </p>
        </div>

        {/* Submit Button */}
        <button
          onClick={addExpense}
          disabled={loading || !merchant.trim() || !amount}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Adding...' : 'Add Expense'}
        </button>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`mt-3 p-2 rounded text-sm ${
          message.startsWith('Error')
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message}
        </div>
      )}

      {/* Helper Text */}
      <div className="mt-3 text-xs text-gray-500 border-t pt-3">
        <strong>Tip:</strong> Category is auto-assigned by AI based on merchant and item
      </div>
    </div>
  );
}
