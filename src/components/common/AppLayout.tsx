import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api, useLogoutMutation } from "@/store/api/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearSession } from "@/store/slices/authSlice";
import { clearProfile } from "@/store/slices/userSlice";
import { clearAttempt } from "@/store/slices/attemptSlice";
import { setTheme } from "@/store/slices/uiSlice";

interface AppLayoutProps {
  children: ReactNode;
}

const getHeaderTitle = (pathname: string): string => {
  if (pathname.startsWith("/student/result")) {
    return "Result";
  }
  if (pathname.startsWith("/student/test")) {
    return "Take Test";
  }
  if (pathname.startsWith("/student")) {
    return "Student";
  }
  if (pathname.startsWith("/teacher/tests/create")) {
    return "Create Test";
  }
  if (pathname.startsWith("/teacher/assignments")) {
    return "Assignments";
  }
  if (pathname.startsWith("/teacher/tests/") && pathname !== "/teacher/tests") {
    return "Edit Test";
  }
  if (pathname.startsWith("/teacher/results")) {
    return "Results";
  }
  if (pathname.startsWith("/teacher")) {
    return "Teacher";
  }

  return "Telegram Mini App";
};

export const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [logout] = useLogoutMutation();

  const online = useAppSelector((state) => state.ui.online);
  const theme = useAppSelector((state) => state.ui.theme);
  const profile = useAppSelector((state) => state.user.profile);
  const isAuthenticated = useAppSelector((state) => Boolean(state.auth.token));

  const onLogout = async (): Promise<void> => {
    try {
      await logout().unwrap();
    } catch {
      // Ignore logout network failure.
    }

    dispatch(clearSession());
    dispatch(clearProfile());
    dispatch(clearAttempt());
    dispatch(api.util.resetApiState());
    navigate("/");
  };

  const toggleTheme = (): void => {
    dispatch(setTheme(theme === "light" ? "dark" : "light"));
  };

  const showHeader = location.pathname !== "/";

  return (
    <div className="app-root">
      {!online && <div className="offline-banner">Offline mode detected.</div>}

      {showHeader && (
        <header className="app-header">
          <div>
            <p className="app-subtitle">Telegram Mini App</p>
            <h1>{getHeaderTitle(location.pathname)}</h1>
          </div>

          <div className="header-actions">
            <button type="button" className="btn btn-ghost" onClick={toggleTheme}>
              {theme === "light" ? "Dark" : "Light"}
            </button>

            {isAuthenticated ? (
              <button type="button" className="btn btn-ghost" onClick={onLogout}>
                Logout
              </button>
            ) : null}
          </div>
        </header>
      )}

      {profile ? (
        <nav className="quick-nav">
          {profile.role === "student" ? (
            <>
              <Link to="/student/tests" className={location.pathname.startsWith("/student") ? "active" : ""}>
                Tests
              </Link>
              <Link to="/student" className={location.pathname === "/student" ? "active" : ""}>
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link to="/teacher/tests" className={location.pathname.startsWith("/teacher/tests") ? "active" : ""}>
                Tests
              </Link>
              <Link
                to="/teacher/assignments"
                className={location.pathname.startsWith("/teacher/assignments") ? "active" : ""}
              >
                Assignments
              </Link>
              <Link to="/teacher" className={location.pathname === "/teacher" ? "active" : ""}>
                Dashboard
              </Link>
            </>
          )}
        </nav>
      ) : null}

      <main className="app-main">{children}</main>
    </div>
  );
};
