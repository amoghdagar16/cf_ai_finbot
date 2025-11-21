import { DurableObject } from "cloudflare:workers";
import { Expense, Message, UserState, SpendingContext, Env } from '../types';
import { categorizeExpense } from '../services/categorizer';
import { analyzeSpendingPatterns } from '../services/insights';

export class UserAgent extends DurableObject<Env> {
  private state: UserState;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.state = {
      userId: '',
      expenses: [],
      conversations: [],
      preferences: {
        currency: 'USD',
        categories: ['Food', 'Transport', 'Shopping', 'Bills', 'Other']
      }
    };
  }

  async initialize(userId: string) {
    const stored = await this.ctx.storage.get<UserState>('state');
    if (stored) {
      this.state = stored;
    } else {
      this.state.userId = userId;
      await this.saveState();
    }
  }

  async saveState() {
    await this.ctx.storage.put('state', this.state);
  }

  async addExpense(expense: Omit<Expense, 'id'>) {
    const newExpense: Expense = {
      ...expense,
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.state.expenses.push(newExpense);
    await this.saveState();

    return newExpense;
  }

  async getExpenses(filters?: { startDate?: string; endDate?: string; category?: string }) {
    let filtered = [...this.state.expenses];

    if (filters?.startDate) {
      filtered = filtered.filter(e => e.date >= filters.startDate!);
    }
    if (filters?.endDate) {
      filtered = filtered.filter(e => e.date <= filters.endDate!);
    }
    if (filters?.category) {
      filtered = filtered.filter(e => e.category === filters.category);
    }

    return filtered;
  }

  async addMessage(role: 'user' | 'assistant', content: string) {
    const message: Message = {
      role,
      content,
      timestamp: new Date().toISOString()
    };

    this.state.conversations.push(message);

    if (this.state.conversations.length > 20) {
      this.state.conversations = this.state.conversations.slice(-20);
    }

    await this.saveState();
    return message;
  }

  async getConversations() {
    return this.state.conversations;
  }

  async getSpendingContext(): Promise<SpendingContext> {
    const expenses = this.state.expenses;
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    const categoryTotals: Record<string, number> = {};
    expenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const topCategory = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)[0];

    const recent = expenses.slice(-5);

    return {
      totalSpent: total,
      topCategory: topCategory ? topCategory[0] : 'Unknown',
      topAmount: topCategory ? topCategory[1] : 0,
      recentExpenses: recent,
      expenseCount: expenses.length
    };
  }

  async chatWithAI(userMessage: string, context: SpendingContext): Promise<string> {
    // Calculate category breakdown
    const expenses = this.state.expenses;
    const categoryBreakdown: Record<string, number> = {};
    expenses.forEach(e => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
    });
    const categoryList = Object.entries(categoryBreakdown)
      .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`)
      .join(', ');

    const systemPrompt = `You are FinBot, a friendly financial wellness assistant.
You help users understand their spending without judgment.
Use a conversational tone, avoid jargon unless asked.

User Context:
- Total expenses: $${context.totalSpent.toFixed(2)}
- Number of expenses: ${context.expenseCount}
- Top category: ${context.topCategory} ($${context.topAmount.toFixed(2)})
- Category breakdown: ${categoryList || 'No expenses yet'}
- Recent expenses: ${context.recentExpenses.map(e => `${e.merchant} $${e.amount} (${e.category})`).join(', ')}

Guidelines:
- Be concise (2-3 sentences)
- Use specific data from their expenses including categories
- Offer actionable suggestions
- Never shame or judge`;

    try {
      const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 256,
        temperature: 0.7
      });

      return response.response || "I'm having trouble responding right now. Please try again.";
    } catch (error) {
      console.error('Llama error:', error);
      return "Sorry, I encountered an error. Please try again.";
    }
  }

  async parseAndAddExpense(text: string): Promise<Expense> {
    const parsePrompt = `Extract expense details from this text: "${text}"

Respond with JSON in this exact format:
{
  "amount": number,
  "merchant": "string"
}

If you can't parse it, respond with null.`;

    const parseResponse = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [{ role: 'user', content: parsePrompt }],
      max_tokens: 100,
      temperature: 0.1
    });

    let parsed;
    try {
      // Handle both object and string responses from AI
      if (typeof parseResponse.response === 'object' && parseResponse.response !== null) {
        // AI already returned a parsed object
        parsed = parseResponse.response;
      } else if (typeof parseResponse.response === 'string') {
        // AI returned a string, need to parse it
        let cleanedResponse = parseResponse.response.trim();
        cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        parsed = JSON.parse(cleanedResponse);
      } else {
        throw new Error('Unexpected response type from AI');
      }
    } catch (e) {
      throw new Error('Could not parse expense. Try format: "Spent $45 at Chipotle"');
    }

    if (!parsed || !parsed.amount || !parsed.merchant) {
      throw new Error('Could not understand that expense format.');
    }

    const { category, confidence } = await categorizeExpense(
      this.env.AI,
      parsed.merchant,
      parsed.amount
    );

    const expense = await this.addExpense({
      amount: parsed.amount,
      merchant: parsed.merchant,
      category,
      date: new Date().toISOString().split('T')[0],
      notes: `Auto-categorized as ${category} (${Math.round(confidence * 100)}% confidence)`
    });

    return expense;
  }

  async getInsights() {
    const expenses = this.state.expenses;
    const personality = await analyzeSpendingPatterns(this.env.AI, expenses);
    return personality;
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    const path = url.pathname;

    const userId = url.searchParams.get('userId') || 'default';
    await this.initialize(userId);

    if (path.endsWith('/expenses') && request.method === 'POST') {
      const body = await request.json() as any;

      // Auto-categorize if no category provided
      if (!body.category) {
        const { category, confidence } = await categorizeExpense(
          this.env.AI,
          body.merchant,
          body.amount
        );
        body.category = category;
        if (!body.notes) {
          body.notes = `Auto-categorized as ${category} (${Math.round(confidence * 100)}% confidence)`;
        }
      }

      const expense = await this.addExpense(body);
      return Response.json({ success: true, expense });
    }

    if (path.endsWith('/expenses') && request.method === 'GET') {
      const expenses = await this.getExpenses();
      return Response.json({ expenses });
    }

    if (path.endsWith('/expenses/parse') && request.method === 'POST') {
      const { text } = await request.json() as any;
      try {
        const expense = await this.parseAndAddExpense(text);
        return Response.json({ success: true, expense });
      } catch (error: any) {
        return Response.json({ success: false, error: error.message }, { status: 400 });
      }
    }

    if (path.endsWith('/chat') && request.method === 'POST') {
      const { message } = await request.json() as any;

      await this.addMessage('user', message);

      // Try to detect and extract expenses from the message
      let expenseAdded = false;
      const expensePatterns = [
        /(?:spent|paid|bought|cost|costs)\s*\$?(\d+(?:\.\d{2})?)\s*(?:at|on|for)?\s*(.+)/i,
        /\$(\d+(?:\.\d{2})?)\s*(?:at|on|for)\s*(.+)/i,
        /(?:bought|got)\s+(.+?)\s+for\s+\$?(\d+(?:\.\d{2})?)/i
      ];

      for (const pattern of expensePatterns) {
        const match = message.match(pattern);
        if (match) {
          try {
            // Extract amount and merchant (order depends on pattern)
            let amount: number, merchant: string;
            if (pattern.toString().includes('bought|got')) {
              // Pattern 3: "bought coffee for $5"
              merchant = match[1].trim();
              amount = parseFloat(match[2]);
            } else {
              // Patterns 1 & 2: "spent $5 at Starbucks" or "$5 at Starbucks"
              amount = parseFloat(match[1]);
              merchant = match[2].trim();
            }

            // Clean up merchant name (remove trailing punctuation, extra words)
            merchant = merchant.replace(/[.,!?;]+$/, '').split(/\s+(today|yesterday|just now)/i)[0].trim();

            if (amount > 0 && merchant.length > 0) {
              // Categorize and add the expense
              const { category } = await categorizeExpense(this.env.AI, merchant, amount);
              await this.addExpense({
                merchant,
                amount,
                category,
                date: new Date().toISOString().split('T')[0],
                notes: `Added via chat`
              });
              expenseAdded = true;
              break;
            }
          } catch (e) {
            // Silently continue to next pattern if parsing fails
          }
        }
      }

      const context = await this.getSpendingContext();

      // Modify the response to acknowledge expense addition
      let aiResponse: string;
      if (expenseAdded) {
        const enhancedMessage = `${message}\n\n[Note: I detected and saved an expense from this message. Acknowledge this briefly and provide relevant spending advice.]`;
        aiResponse = await this.chatWithAI(enhancedMessage, context);
      } else {
        aiResponse = await this.chatWithAI(message, context);
      }

      await this.addMessage('assistant', aiResponse);

      return Response.json({ response: aiResponse, expenseAdded });
    }

    if (path.endsWith('/insights') && request.method === 'GET') {
      const insights = await this.getInsights();
      return Response.json(insights);
    }

    return new Response('Not Found', { status: 404 });
  }
}
