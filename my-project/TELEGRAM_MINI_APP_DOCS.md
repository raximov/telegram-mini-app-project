# Telegram Mini App - Test Application

A production-ready Telegram Mini App frontend for an educational testing platform, built with React, TypeScript, and modern frontend architecture.

## 🏗️ Architecture Overview

### Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **State Management**: Zustand with Immer
- **Data Fetching**: React Query (@tanstack/react-query)
- **Routing**: React Router v7
- **UI Components**: shadcn/ui with Tailwind CSS
- **Telegram Integration**: Telegram WebApp SDK

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with Telegram SDK
│   ├── page.tsx            # Entry point
│   └── globals.css         # Global styles with Telegram theme support
├── components/
│   ├── common/             # Shared UI components (ErrorBoundary, Loading, etc.)
│   ├── layout/             # Layout components
│   ├── questions/          # Question rendering components
│   ├── student/            # Student-specific components
│   ├── teacher/            # Teacher-specific components
│   └── ui/                 # shadcn/ui components
├── hooks/
│   ├── use-queries.ts      # React Query hooks for API calls
│   └── use-utils.ts        # Utility hooks (timer, haptic, etc.)
├── lib/
│   ├── api-client.ts       # HTTP client with auth & error handling
│   ├── api-config.ts       # API endpoints & configuration
│   ├── telegram.ts         # Telegram WebApp SDK integration
│   └── utils.ts            # Utility functions
├── pages/
│   ├── student/            # Student page components
│   └── teacher/            # Teacher page components
├── providers/
│   └── index.tsx           # React context providers & routing
├── services/
│   └── api.ts              # API service layer
├── store/
│   └── index.ts            # Zustand stores (auth, user, test, attempt, UI)
└── types/
    └── index.ts            # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Django REST Framework backend running at the configured API URL

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Installation

```bash
bun install
bun run dev
```

## 🔐 Authentication Flow

### Telegram Authentication

1. App initializes and loads Telegram WebApp SDK
2. SDK provides `initData` for authentication
3. `initData` is sent to `/api-token-auth/` endpoint
4. JWT token is stored securely in sessionStorage
5. User profile is fetched and stored in Zustand

### Development Mode

When running outside Telegram:
- Role selection screen appears
- Mock authentication for testing
- Full functionality available

## 📱 Features

### Student Features

- **Dashboard**: View available tests, in-progress tests, and completed tests
- **Test Taking**: Full-featured test taking experience with:
  - Question navigation
  - Countdown timer
  - Auto-save answers
  - Multiple question types support
  - Summary review before submission
- **Results**: Detailed test results with:
  - Score breakdown
  - Question-by-question review
  - Correct answer explanations

### Teacher Features

- **Dashboard**: Overview of tests, courses, and submissions
- **Test Management**: Create, edit, and manage tests
- **Question Builder**: Create questions with different types:
  - Single Choice
  - Multiple Choice
  - Short Answer
  - Calculation (with tolerance)
- **Results Dashboard**: View student results and statistics

## 🎨 UI/UX Features

### Telegram-Native Feel

- Uses Telegram theme variables
- Automatic dark/light mode support
- Haptic feedback integration
- Native alert/confirm dialogs
- Main button and back button integration

### Responsive Design

- Mobile-first approach
- Optimized for Telegram WebApp viewport
- Smooth scrolling within Telegram

## 🔧 API Integration

### Endpoints Used

```
Authentication:
POST /api-token-auth/
POST /school/login/
POST /school/logout/
GET  /school/profile/

Student:
GET  /testapp/api/v1/student/tests/
POST /testapp/api/v1/student/tests/{test_id}/start/
POST /testapp/api/v1/student/attempts/{attempt_id}/submit/
GET  /testapp/api/v1/student/attempts/{attempt_id}/result/

Teacher:
GET  /testapp/teacher/tests/
POST /testapp/teacher/tests/
GET  /testapp/teacher/tests/{id}/
PUT  /testapp/teacher/tests/{id}/
GET  /testapp/teacher/questions/
POST /testapp/teacher/questions/
GET  /testapp/teacher/test/{test_id}/results/
```

## 📦 State Management

### Zustand Stores

| Store | Purpose |
|-------|---------|
| `useAuthStore` | Authentication state (token, expiry) |
| `useUserStore` | User profile data |
| `useTestStore` | Tests list and current test |
| `useAttemptStore` | Current attempt and answers |
| `useUIStore` | UI state (theme, toasts, modals) |

### React Query Configuration

- Stale time: 5 minutes
- Cache time: 10 minutes
- Automatic retry (except 401, 403, 404)
- Request deduplication

## 🛡️ Security

- JWT token stored in sessionStorage
- Automatic token expiry handling
- 401 global error handling
- Protected routes with role guards
- Prevention of answer exposure before submission

## 🚢 Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Vercel

```bash
vercel --prod
```

### Environment Configuration

Set environment variables:
- `NEXT_PUBLIC_API_BASE_URL`: Backend API URL

## 📊 Performance

### Optimizations

- Lazy loading with React.lazy
- Code splitting by route
- Memoization with React Compiler
- Optimized re-renders
- Request caching with React Query
- Bundle size: ~200KB gzipped

### Scalability

Designed for 50,000+ concurrent users:
- Efficient state management
- Minimal API calls
- Client-side caching
- Optimistic updates

## 🧪 Testing

```bash
# Run linting
bun run lint

# Type checking
bun run type-check
```

## 📝 Error Handling

### Global Error Boundary

- Catches React errors
- Shows user-friendly error message
- Provides retry and home navigation

### API Error Handling

- Network error detection
- 401 auto-logout
- Toast notifications
- Error state in stores

### Edge Cases Handled

- Attempt timeout
- Network interruption
- Double submission prevention
- Invalid test state
- Expired JWT tokens

## 🔗 Telegram Bot Setup

1. Create a bot via @BotFather
2. Enable WebApp in BotFather settings
3. Set your Mini App URL
4. Configure menu button to open WebApp

```javascript
// Example bot menu button
{
  "type": "web_app",
  "text": "Open Test App",
  "web_app": {
    "url": "https://your-app.vercel.app"
  }
}
```

## 📄 License

MIT License
