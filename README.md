# Telegram Mini App Frontend (React + TypeScript)

Production-grade Telegram Mini App frontend scaffold for your DRF backend, with a **mock-data mode enabled by default** for local development.

## Quick Start (Local Mock Data)

1. Install deps:

```bash
npm install
```

2. Run frontend locally with mock data:

```bash
BUN_PUBLIC_USE_MOCK_DATA=true PORT=3001 bun run dev
```

3. Open:

```text
http://localhost:3001
```

## Switch To Real Backend

```bash
BUN_PUBLIC_USE_MOCK_DATA=false \
BUN_PUBLIC_API_BASE_URL=http://127.0.0.1:8000 \
PORT=3001 \
bun run dev
```

## Environment Variables

- `BUN_PUBLIC_USE_MOCK_DATA` (`true`/`false`) default: `true`
- `BUN_PUBLIC_API_BASE_URL` default: `http://127.0.0.1:8000`
- `BUN_PUBLIC_REQUEST_TIMEOUT_MS` default: `15000`
- `BUN_PUBLIC_MOCK_LATENCY_MS` default: `220`
- `PORT` or `BUN_PORT` default: `3000`

## Folder Structure

```text
src/
  config/
    env.ts
  lib/
    telegram.ts
  types/
    domain.ts
  hooks/
    useSessionBootstrap.ts
  store/
    api/
      api.ts
      mockBaseQuery.ts
      mockDb.ts
    slices/
      authSlice.ts
      userSlice.ts
      testSlice.ts
      attemptSlice.ts
      uiSlice.ts
    hooks.ts
    index.ts
    persistence.ts
  components/
    common/
      AppLayout.tsx
      ErrorBoundary.tsx
      ProtectedRoute.tsx
      LoadingState.tsx
      ErrorState.tsx
      ToastViewport.tsx
    student/
      QuestionRenderer.tsx
    teacher/
      TeacherTestBuilder.tsx
  pages/
    HomePage.tsx
    student/
      DashboardPage.tsx
      TestPage.tsx
      ResultPage.tsx
    teacher/
      DashboardPage.tsx
      TestsPage.tsx
      BuilderPage.tsx
      ResultsPage.tsx
  App.tsx
  frontend.tsx
  index.css
  index.html
  index.ts
```

## Architecture Summary

- **Platform integration**: Telegram WebApp SDK bootstrap + theme variable mapping in `src/lib/telegram.ts`.
- **State management**: Redux Toolkit slices (`auth`, `user`, `test`, `attempt`, `ui`).
- **Data fetching**: RTK Query in `src/store/api/api.ts`.
- **Mode switching**:
  - Mock mode: in-memory backend emulation (`mockDb.ts`, `mockBaseQuery.ts`).
  - Real mode: HTTP via `fetchBaseQuery`.
- **Global security handling**: 401 auto-clears auth/profile/attempt state.
- **Error strategy**: RTK query error middleware + UI toasts + top-level `ErrorBoundary`.
- **Routing**: role-protected routes with `ProtectedRoute`.

## Route Map

- Student:
  - `/student`
  - `/student/tests`
  - `/student/test/:id`
  - `/student/result/:attemptId`
- Teacher:
  - `/teacher`
  - `/teacher/tests`
  - `/teacher/tests/create`
  - `/teacher/tests/:id`
  - `/teacher/results/:testId`

## API Integration Map

Implemented endpoint usage:

- Auth:
  - `POST /api-token-auth/`
  - `POST /school/login/`
  - `POST /school/logout/`
  - `GET /school/profile/`
- Student:
  - `GET /testapp/api/v1/student/tests/`
  - `POST /testapp/api/v1/student/tests/{test_id}/start/`
  - `POST /testapp/api/v1/student/attempts/{attempt_id}/submit/`
  - `GET /testapp/api/v1/student/attempts/{attempt_id}/result/`
- Teacher:
  - `GET /testapp/teacher/tests/`
  - `POST /testapp/teacher/tests/`
  - `PATCH /testapp/teacher/tests/{id}/`
  - `DELETE /testapp/teacher/tests/{id}/`
  - `POST /testapp/teacher/questions/`
  - `PATCH /testapp/teacher/questions/{id}/`
  - `DELETE /testapp/teacher/questions/{id}/`
  - `GET /testapp/teacher/test/{test_id}/results/`
- Course/enrollment:
  - `GET /school/courses/`
  - `GET /school/enrollment/`

## State Architecture

- **Global state (Redux slices)**
  - `auth`: token, expiry, auth status/error
  - `user`: resolved profile + role
  - `test`: UI filters + test selection + builder dirty flag
  - `attempt`: current attempt session + per-question answer draft + submit lock
  - `ui`: theme, online/offline, global error, toasts
- **Server cache (RTK Query)**
  - student tests, attempt results, teacher tests/questions/results, profile, courses
  - tag-based invalidation on create/update/delete/submit
- **Local component state**
  - wizard index, form input drafts, small UI toggles

## Security and Edge Cases

- Teacher routes are protected by role checks.
- `401` globally forces logout state.
- Session expiry is checked on interval and auto-clears state.
- Attempt submit is guarded against double click (`submitInFlight`).
- Mock backend rejects repeated submit for same attempt.
- Student question payload excludes correctness data before submission.
- Timeout auto-submit path is implemented in student test page.

## Performance Notes

- Route-level lazy loading (`React.lazy` + `Suspense`).
- RTK Query caching and invalidation minimize refetch churn.
- Small, memoized derived values in test flow and builder flow.
- Mobile-first layout and scroll containment for Telegram WebView stability.

## Deployment

### Vercel (Static Output)

```bash
bun run build
```

Deploy `dist/` as static site, with SPA fallback to `index.html`.

### Docker

```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY . .
RUN bun install
RUN bun run build
EXPOSE 3000
CMD ["bun", "src/index.ts"]
```

Use env vars for backend URL and mock toggle.

### Nginx (Static)

1. Build assets:

```bash
bun run build
```

2. Serve `dist/` with fallback:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

3. Optionally reverse-proxy API to DRF backend.
