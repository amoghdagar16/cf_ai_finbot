# AI Prompts Used in Development

This document contains the key prompts used during development, showing the iterative problem-solving process.

## Project Setup & Architecture

### Initial Setup
```
Create a Cloudflare Workers project with Durable Objects for an expense tracking app.
I need the basic wrangler.toml configuration with Workers AI binding for Llama 3.3.
```

### Durable Objects Structure
```
Help me design a Durable Object called UserAgent that stores:
- expenses array
- conversation history
- user preferences

Show me the TypeScript interface and basic CRUD methods.
```

## AI Integration

### Expense Parsing
```
I'm getting an error: "parseResponse.response.trim is not a function"

The AI is returning an object instead of a string. How do I handle both cases?
```

**Follow-up:**
```
The expense parsing works but sometimes fails. Add better error handling
and support for different response formats from Llama.
```

### Categorization Logic
```
Create a categorization service that uses Llama 3.3 to classify expenses
into: Food, Transport, Shopping, Bills, Other

Make it return both category and confidence score.
```

## Frontend Development

### Component Structure
```
I have a basic expense form with a text input. Change it to a structured form with:
- Merchant field (with autocomplete from past merchants)
- Amount input with $ prefix
- Optional item/description field

Keep the AI categorization but apply it on form submission.
```

### Chart Implementation
```
Add a pie chart to the Insights dashboard showing category breakdown.
I'm using Recharts. Show me how to:
1. Calculate category totals from expenses
2. Color-code by category
3. Add percentage labels
```

**Follow-up:**
```
The pie chart works but I also want a bar chart and a "Top Merchants" leaderboard.
Add those to the same dashboard with proper responsive layout.
```

### Session Management
```
How do I implement multi-user sessions so different people can test the app
without seeing each other's data?

I'm thinking localStorage + unique userId per session.
```

**Follow-up:**
```
Add a "New Session" button that:
1. Generates new userId
2. Clears localStorage
3. Resets all state
4. Shows confirmation dialog
```

## Backend Logic

### Chat Expense Extraction
```
I want users to add expenses through chat like "I spent $9 at Starbucks".

Create regex patterns to extract:
- Amount (with or without $)
- Merchant name
- Support formats like "spent $X at Y", "$X at Y", "bought X for $Y"
```

**Follow-up:**
```
The expense extraction works but it's logging to console.
Clean up all debug console.log statements for production.
```

### Context-Aware Responses
```
The AI doesn't know about category breakdown when chatting.
Update the chat context to include:
- Category totals
- Recent expenses WITH their categories
- Top spending category
```

## Bug Fixes & Optimization

### Parsing Error Fix
```
Error: "Could not parse expense. Try format: 'Spent $45 at Chipotle'"

This happens even with valid input. The AI returns: { amount: 9, merchant: 'Starbucks' }

How do I fix the parsing to handle this object response?
```

### State Synchronization
```
When I add an expense in Chat, it doesn't show in the Expenses tab until I refresh.

How do I pass userId to all components so they fetch from the same Durable Object?
```

### TypeScript Errors
```
Getting TS error: "Property 'userId' does not exist on type 'IntrinsicAttributes'"

I'm trying to pass userId prop to ChatWindow, ExpenseForm, and InsightsDashboard.
Show me the interface updates needed.
```

## Code Cleanup

### Repository Cleanup
```
I have these files in my repo:
- ARCHITECTURE.md
- CHEAT_SHEET.md
- IMPLEMENTATION_GUIDE.md
- PRD.md
- PROJECT_OVERVIEW.md

These look AI-generated. Remove them and create a clean, professional README
that's concise and shows the actual implementation.
```

### Debug Logs
```
Search for all console.log and console.error statements in workers/src
and remove the debug ones. Keep only legitimate error handling.
```

## Deployment Preparation

### Git Setup
```
Initialize git repository and show me the commands to:
1. Add all files
2. Commit with a good message
3. Push to: https://github.com/amoghdagar16/llamaAIfinbot.git
```

### Repository Rename
```
The assignment requires repo name to start with "cf_ai_".
Do I need to rename my repo or can I leave it as "llamaAIfinbot"?
```

## Key Learning Moments

### Problem 1: AI Response Format
**Issue:** Llama sometimes returns JSON object, sometimes string
**Solution:** Added type checking for both formats
```typescript
if (typeof parseResponse.response === 'object') {
  parsed = parseResponse.response;
} else if (typeof parseResponse.response === 'string') {
  let cleanedResponse = parseResponse.response.trim();
  parsed = JSON.parse(cleanedResponse);
}
```

### Problem 2: Session Isolation
**Issue:** All users shared same data
**Solution:** localStorage userId + Durable Objects per user
```typescript
const [userId, setUserId] = useState(() => {
  const stored = localStorage.getItem('finbot-userId');
  if (stored) return stored;
  const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('finbot-userId', newId);
  return newId;
});
```

### Problem 3: Chat Expense Persistence
**Issue:** Expenses added in chat didn't persist
**Solution:** Implemented expense extraction with regex patterns
```typescript
const expensePatterns = [
  /(?:spent|paid|bought)\s*\$?(\d+(?:\.\d{2})?)\s*(?:at|on|for)?\s*(.+)/i,
  /\$(\d+(?:\.\d{2})?)\s*(?:at|on|for)\s*(.+)/i,
  /(?:bought|got)\s+(.+?)\s+for\s+\$?(\d+(?:\.\d{2})?)/i
];
```

---

## Prompting Strategy

I used AI assistance for:
- **Boilerplate code** (TypeScript interfaces, config files)
- **Bug debugging** (specific error messages with context)
- **Feature implementation** (specific requirements, not "build everything")
- **Code cleanup** (removing debug logs, formatting)

I wrote myself:
- **Core logic** (expense extraction regex, state management)
- **Component architecture** (how components interact)
- **User experience** (session management, form structure)
- **Integration** (connecting frontend to backend)

The prompts show an iterative development process with specific problems and solutions, not a single "build this app" request.
