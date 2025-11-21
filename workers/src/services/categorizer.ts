export async function categorizeExpense(
  ai: any,
  merchant: string,
  amount: number,
  notes?: string
): Promise<{ category: string; confidence: number }> {
  const prompt = `Categorize this expense into ONE of these categories: Food, Transport, Shopping, Bills, Other.

Expense: ${merchant}${notes ? ` - ${notes}` : ''}
Amount: $${amount}

Respond with ONLY the category name, nothing else.`;

  try {
    const response = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 10,
      temperature: 0.3
    });

    const category = response.response.trim();
    const validCategories = ['Food', 'Transport', 'Shopping', 'Bills', 'Other'];

    if (validCategories.includes(category)) {
      return { category, confidence: 0.95 };
    }

    return { category: 'Other', confidence: 0.5 };
  } catch (error) {
    console.error('Categorization error:', error);
    return { category: 'Other', confidence: 0.3 };
  }
}
