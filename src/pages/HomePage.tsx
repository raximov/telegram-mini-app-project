import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { appEnv } from "@/config/env";
import { isTelegramWebApp, getTelegramInitData } from "@/lib/telegram";
import { useLazyGetProfileQuery, useLoginWithCredentialsMutation, useLoginWithTelegramMutation } from "@/store/api/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSession, setAuthLoading, setAuthError } from "@/store/slices/authSlice";
import { setProfile } from "@/store/slices/userSlice";
import type { Role } from "@/types/domain";
import { LoadingState } from "@/components/common/LoadingState";

const getDefaultPath = (role: Role): string => (role === "teacher" ? "/teacher" : "/student");

const extractErrorDetail = (error: unknown): string => {
  const typed = error as {
    data?: { detail?: string; error?: string };
    status?: number | string;
    error?: string;
  };

  return (
    typed?.data?.detail ??
    typed?.data?.error ??
    typed?.error ??
    (typed?.status === "FETCH_ERROR"
      ? "Network error: API endpoint is unreachable."
      : typed?.status === "PARSING_ERROR"
        ? "Response parsing failed from API."
        : "Request failed.")
  );
};

export const HomePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const auth = useAppSelector((state) => state.auth);
  const profile = useAppSelector((state) => state.user.profile);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const telegramAutoTriedRef = useRef(false);
  const insideTelegram = isTelegramWebApp();
  const telegramInitData = getTelegramInitData();

  const [loginWithCredentials, credentialsState] = useLoginWithCredentialsMutation();
  const [loginWithTelegram, telegramState] = useLoginWithTelegramMutation();
  const [fetchProfile] = useLazyGetProfileQuery();

  useEffect(() => {
    const hydrateUser = async (): Promise<void> => {
      if (!auth.token || profile) {
        return;
      }

      try {
        const user = await fetchProfile().unwrap();
        dispatch(setProfile(user));
      } catch {
        // Invalid token will be cleaned by global 401 middleware.
      }
    };

    hydrateUser();
  }, [auth.token, profile, fetchProfile, dispatch]);

  const finalizeLogin = async (token: string, expiresAt?: string): Promise<void> => {
    dispatch(
      setSession({
        token,
        expiresAt: expiresAt ?? new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      })
    );

    const user = await fetchProfile().unwrap();
    dispatch(setProfile(user));
    navigate(getDefaultPath(user.role));
  };

  const loginRealBackend = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    dispatch(setAuthLoading(true));
    dispatch(setAuthError(null));

    try {
      const login = await loginWithCredentials({ username, password }).unwrap();
      await finalizeLogin(login.token, login.expiresAt);
    } catch (error) {
      dispatch(setAuthError(extractErrorDetail(error)));
    } finally {
      dispatch(setAuthLoading(false));
    }
  };

  const loginMockRole = async (role: Role): Promise<void> => {
    dispatch(setAuthLoading(true));
    dispatch(setAuthError(null));

    try {
      const login = await loginWithCredentials({
        username: `${role}.demo`,
        password: "demo",
        roleHint: role,
      }).unwrap();

      await finalizeLogin(login.token, login.expiresAt);
    } catch {
      dispatch(setAuthError("Unable to authenticate with mock backend."));
    } finally {
      dispatch(setAuthLoading(false));
    }
  };

  const loginTelegram = async (): Promise<void> => {
    if (!telegramInitData) {
      dispatch(setAuthError("Telegram initData topilmadi. Bot ichidan oching."));
      return;
    }

    dispatch(setAuthLoading(true));
    dispatch(setAuthError(null));

    try {
      const login = await loginWithTelegram({ initData: telegramInitData }).unwrap();
      await finalizeLogin(login.token, login.expiresAt);
    } catch (error) {
      dispatch(setAuthError(extractErrorDetail(error)));
    } finally {
      dispatch(setAuthLoading(false));
    }
  };

  useEffect(() => {
    if (appEnv.useMockData) {
      return;
    }

    if (telegramAutoTriedRef.current) {
      return;
    }

    if (auth.token || profile) {
      return;
    }

    if (!insideTelegram || !telegramInitData) {
      return;
    }

    telegramAutoTriedRef.current = true;
    void loginTelegram();
  }, [auth.token, profile, insideTelegram, telegramInitData]);

  if (auth.token && profile) {
    return <Navigate to={getDefaultPath(profile.role)} replace />;
  }

  const loading = auth.status === "loading" || credentialsState.isLoading || telegramState.isLoading;

  return (
    <section className="home-screen">
      <div className="hero">
        <p className="eyebrow">Telegram Mini App</p>
        <h1>School Assessment Console</h1>
        <p>Frontend hozir backendga ulangan. Quyida login qilib real datani ko‘rishingiz mumkin.</p>
      </div>

      {loading ? <LoadingState label="Authenticating..." /> : null}

      {appEnv.useMockData ? (
        <div className="panel role-grid">
          <button type="button" className="role-card" onClick={() => loginMockRole("student")}>
            <h3>Student (Mock)</h3>
            <p>Mock student flow.</p>
          </button>

          <button type="button" className="role-card" onClick={() => loginMockRole("teacher")}>
            <h3>Teacher (Mock)</h3>
            <p>Mock teacher flow.</p>
          </button>
        </div>
      ) : (
        <form className="panel stack-sm" onSubmit={loginRealBackend}>
          <h2>Backend Login</h2>
          <p>DRF user credentials kiriting (`/api-token-auth/`) yoki Telegram orqali kiring.</p>

          {insideTelegram ? (
            <div className="actions-row left">
              <button type="button" className="btn btn-secondary" onClick={loginTelegram} disabled={loading}>
                Login via Telegram
              </button>
            </div>
          ) : null}

          <label>
            <span>Username</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} required />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <div className="actions-row left">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              Login
            </button>
          </div>
        </form>
      )}

      <div className="panel stack-sm">
        <p>
          <strong>Mode:</strong> {appEnv.useMockData ? "Mock Data" : "Real Backend"}
        </p>
        <p>
          <strong>API Base:</strong> {appEnv.apiBaseUrl}
        </p>
        {auth.error ? <p className="error-inline">{auth.error}</p> : null}
      </div>
    </section>
  );
};

export default HomePage;
