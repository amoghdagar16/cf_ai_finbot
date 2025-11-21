# FinBot - AI-Powered Financial Wellness Assistant

A conversational expense tracking app built with Cloudflare Workers AI (Llama 3.3), Durable Objects, and React.

## Features

- **Conversational Expense Tracking**: Add expenses naturally through chat ("I spent $9 at Starbucks")
- **Structured Input**: Quick expense form with merchant autocomplete and AI categorization
- **Smart Insights**: AI-powered spending pattern analysis and personality identification
- **Visual Analytics**: Pie charts and bar graphs for category breakdown
- **Multi-Session Support**: Isolated user sessions for demos and testing

## Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Vite + Recharts
- **Backend**: Cloudflare Workers + Durable Objects
- **AI**: Cloudflare Workers AI (Llama 3.3 70B)
- **Deployment**: Cloudflare Pages + Workers

### Key Components

1. **Durable Objects** - Per-user state management
   - Persistent expense storage
   - Conversation history
   - Session isolation

2. **AI Integration** (4 use cases)
   - Expense parsing from natural language
   - Automatic expense categorization
   - Conversational chat responses
   - Spending pattern analysis

3. **Frontend**
   - Chat interface with expense extraction
   - Structured expense form with autocomplete
   - Real-time visualizations and insights

## Getting Started

### Prerequisites
- Node.js 18+
- Cloudflare account with Workers AI access

### Installation

1. **Clone the repository**
```bash
cd FinBot-claude-assignment-rubric-implementation-0164H43zjLUjiNRFWTGmyGV9
```

2. **Install dependencies**

Backend:
```bash
cd workers
npm install
```

Frontend:
```bash
cd frontend
npm install
```

3. **Configure Cloudflare**

Login to Cloudflare:
```bash
cd workers
npx wrangler login
```

Update `wrangler.toml` with your account ID (if needed).

### Development

1. **Start the backend** (Terminal 1):
```bash
cd workers
npm run dev
```
Backend runs at `http://localhost:8787`

2. **Start the frontend** (Terminal 2):
```bash
cd frontend
npm run dev
```
Frontend runs at `http://localhost:5173`

3. **Open the app**: Visit `http://localhost:5173`

## Usage

### Adding Expenses

**Via Chat**:
- "I spent $9 at Starbucks"
- "Paid $15 for Uber ride"
- "Bought lunch for $12"

**Via Form**:
1. Go to **Expenses** tab
2. Enter merchant, amount, and optional item description
3. AI automatically categorizes the expense

### Viewing Insights

Go to **Insights** tab to see:
- Total spending and transaction count
- Spending personality type
- Category breakdown (pie chart)
- Top merchants leaderboard
- Weekend vs. weekday patterns

### Using Sessions

Click **🔄 New Session** to start fresh:
- Generates new user ID
- Clears all expenses and chat history
- Perfect for demos and testing

## Project Structure

```
.
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/      # Chat interface
│   │   │   ├── Expenses/  # Expense form & list
│   │   │   └── Insights/  # Analytics dashboard
│   │   └── App.tsx        # Main app with routing
│   └── package.json
│
├── workers/               # Cloudflare Workers backend
│   ├── src/
│   │   ├── durable-objects/
│   │   │   └── UserAgent.ts    # Per-user state
│   │   ├── services/
│   │   │   ├── analyzer.ts     # Spending analysis
│   │   │   └── categorizer.ts  # Expense categorization
│   │   └── index.ts            # API entry point
│   └── wrangler.toml
│
└── README.md
```

## API Endpoints

### Chat
- `POST /api/user/chat?userId={id}` - Send message, auto-extract expenses

### Expenses
- `GET /api/user/expenses?userId={id}` - Get all expenses
- `POST /api/user/expenses?userId={id}` - Add expense (auto-categorize)
- `POST /api/user/expenses/parse?userId={id}` - Parse natural language expense

### Insights
- `GET /api/user/insights?userId={id}` - Get spending analysis

## Deployment

### Deploy Backend
```bash
cd workers
npm run deploy
```

### Deploy Frontend
```bash
cd frontend
npm run build
npx wrangler pages deploy dist
```

Update `API_URL` in `frontend/src/App.tsx` to your Workers URL.

## Implementation Details

### Expense Categories
- **Food**: Restaurants, cafes, groceries
- **Transport**: Uber, Lyft, gas, parking
- **Shopping**: Retail, online stores
- **Bills**: Utilities, subscriptions
- **Other**: Miscellaneous expenses

### AI Models Used
All using `@cf/meta/llama-3.3-70b-instruct-fp8-fast`:
- Natural language parsing
- Category classification
- Conversational responses
- Pattern identification

### State Management
Each user gets a dedicated Durable Object instance that stores:
- Expense array with categorization
- Chat conversation history
- User preferences and metadata

Sessions are isolated by `userId` stored in localStorage.

## Assignment Requirements Coverage

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| **LLM (Llama 3.3)** | 4 AI use cases (parsing, categorization, chat, analysis) | ✅ |
| **Workflow/Coordination** | Durable Objects + Workers | ✅ |
| **User Input (Chat)** | Chat interface with text input | ✅ |
| **Memory/State** | Durable Objects persistence + conversation history | ✅ |

## License

MIT
