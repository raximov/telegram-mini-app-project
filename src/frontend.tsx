import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { App } from "@/App";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { store } from "@/store";
import "./index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element was not found.");
}

const app = (
  <StrictMode>
    <Provider store={store}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </Provider>
  </StrictMode>
);

if (import.meta.hot) {
  const root = (import.meta.hot.data.root ??= createRoot(container));
  root.render(app);
} else {
  createRoot(container).render(app);
}
