import { Expense, SpendingPattern, SpendingPersonality } from '../types';

export async function analyzeSpendingPatterns(
  ai: any,
  expenses: Expense[]
): Promise<SpendingPersonality> {
  if (expenses.length < 5) {
    return {
      personality: 'Getting Started',
      description: 'Add more expenses to see your spending personality!',
      patterns: [],
      trends: {
        weekendVsWeekday: { weekend: 0, weekday: 0 },
        categoryDistribution: {}
      }
    };
  }

  const trends = calculateTrends(expenses);

  const personalityPrompt = `Based on this spending data, identify the user's spending personality.

Data:
- Weekend spending: $${trends.weekendVsWeekday.weekend}
- Weekday spending: $${trends.weekendVsWeekday.weekday}
- Top categories: ${Object.entries(trends.categoryDistribution)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([cat, amt]) => `${cat} ($${amt})`)
    .join(', ')}

Choose ONE personality type from: Weekend Warrior, Stress Spender, Late Night Buyer, Consistent Budgeter, Impulse Shopper

Respond with ONLY the personality type name.`;

  const response = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [{ role: 'user', content: personalityPrompt }],
    max_tokens: 20,
    temperature: 0.3
  });

  const personality = response.response.trim();

  const descriptionPrompt = `You identified this user as a "${personality}".
Write a 1-sentence friendly description of what that means based on their spending:
- Weekend: $${trends.weekendVsWeekday.weekend}, Weekday: $${trends.weekendVsWeekday.weekday}
- Top category: ${Object.keys(trends.categoryDistribution)[0]}`;

  const descResponse = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [{ role: 'user', content: descriptionPrompt }],
    max_tokens: 100,
    temperature: 0.7
  });

  const description = descResponse.response.trim();
  const patterns = generatePatterns(expenses, trends);

  return {
    personality,
    description,
    patterns,
    trends
  };
}

function calculateTrends(expenses: Expense[]) {
  const weekendTotal = expenses
    .filter(e => {
      const day = new Date(e.date).getDay();
      return day === 0 || day === 6;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const weekdayTotal = expenses
    .filter(e => {
      const day = new Date(e.date).getDay();
      return day >= 1 && day <= 5;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals: Record<string, number> = {};
  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  return {
    weekendVsWeekday: { weekend: weekendTotal, weekday: weekdayTotal },
    categoryDistribution: categoryTotals
  };
}

function generatePatterns(expenses: Expense[], trends: any): SpendingPattern[] {
  const patterns: SpendingPattern[] = [];

  if (trends.weekendVsWeekday.weekend > trends.weekendVsWeekday.weekday * 1.3) {
    patterns.push({
      type: 'day_of_week',
      insight: `You spend ${Math.round((trends.weekendVsWeekday.weekend / (trends.weekendVsWeekday.weekend + trends.weekendVsWeekday.weekday)) * 100)}% of your money on weekends`,
      recommendation: 'Consider setting a weekend spending cap to balance fun with savings'
    });
  }

  const topCategory = Object.entries(trends.categoryDistribution)
    .sort(([, a], [, b]) => (b as number) - (a as number))[0];

  if (topCategory) {
    const [category, amount] = topCategory;
    const percentage = Math.round((amount as number / expenses.reduce((sum, e) => sum + e.amount, 0)) * 100);

    patterns.push({
      type: 'category',
      insight: `${category} is ${percentage}% of your spending`,
      recommendation: percentage > 40 ? `Try diversifying your spending or reducing ${category} expenses` : `Your ${category} spending looks balanced`
    });
  }

  return patterns;
}
