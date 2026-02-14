import { useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { appEnv } from "@/config/env";
import { getTelegramInitData, isTelegramWebApp } from "@/lib/telegram";
import {
  useLazyGetProfileQuery,
  useLoginWithCredentialsMutation,
  useLoginWithTelegramMutation,
} from "@/store/api/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSession, setAuthLoading, setAuthError } from "@/store/slices/authSlice";
import { setProfile } from "@/store/slices/userSlice";
import type { Role } from "@/types/domain";
import { LoadingState } from "@/components/common/LoadingState";

const getDefaultPath = (role: Role): string => (role === "teacher" ? "/teacher" : "/student");

export const HomePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const auth = useAppSelector((state) => state.auth);
  const profile = useAppSelector((state) => state.user.profile);

  const [loginWithTelegram, telegramState] = useLoginWithTelegramMutation();
  const [loginWithCredentials, credentialsState] = useLoginWithCredentialsMutation();
  const [fetchProfile] = useLazyGetProfileQuery();

  const telegramAttemptedRef = useRef(false);

  useEffect(() => {
    const hydrateUser = async (): Promise<void> => {
      if (!auth.token || profile) {
        return;
      }

      try {
        const user = await fetchProfile().unwrap();
        dispatch(setProfile(user));
      } catch {
        // If token is invalid, 401 flow clears state in middleware.
      }
    };

    hydrateUser();
  }, [auth.token, profile, fetchProfile, dispatch]);

  useEffect(() => {
    const initTelegramLogin = async (): Promise<void> => {
      if (appEnv.useMockData) {
        return;
      }

      if (telegramAttemptedRef.current) {
        return;
      }

      const initData = getTelegramInitData();
      if (!initData) {
        return;
      }

      telegramAttemptedRef.current = true;
      dispatch(setAuthLoading(true));

      try {
        const session = await loginWithTelegram({ initData }).unwrap();
        dispatch(setSession(session));
        dispatch(setProfile(session.user));
        navigate(getDefaultPath(session.user.role));
      } catch {
        dispatch(setAuthError("Telegram auth failed. Use local login or verify backend initData validation."));
      }
    };

    initTelegramLogin();
  }, [dispatch, loginWithTelegram, navigate]);

  const startMockLogin = async (role: Role): Promise<void> => {
    dispatch(setAuthLoading(true));
    dispatch(setAuthError(null));

    try {
      const session = await loginWithCredentials({
        username: `${role}.demo`,
        password: "demo",
        roleHint: role,
      }).unwrap();

      dispatch(setSession(session));
      dispatch(setProfile(session.user));
      navigate(getDefaultPath(role));
    } catch {
      dispatch(setAuthError("Unable to authenticate with mock backend."));
    } finally {
      dispatch(setAuthLoading(false));
    }
  };

  if (auth.token && profile) {
    return <Navigate to={getDefaultPath(profile.role)} replace />;
  }

  const loading = auth.status === "loading" || telegramState.isLoading || credentialsState.isLoading;

  return (
    <section className="home-screen">
      <div className="hero">
        <p className="eyebrow">Telegram Mini App</p>
        <h1>School Assessment Console</h1>
        <p>
          Role-based frontend for students and teachers with secure auth, dynamic tests, and mock-to-real API switching.
        </p>
      </div>

      {loading ? <LoadingState label="Authenticating..." /> : null}

      {!appEnv.useMockData && isTelegramWebApp() ? (
        <div className="panel">
          <h2>Telegram Login</h2>
          <p>Waiting for authenticated Telegram session...</p>
        </div>
      ) : (
        <div className="panel role-grid">
          <button type="button" className="role-card" onClick={() => startMockLogin("student")}>
            <h3>Student</h3>
            <p>Take tests, submit attempts, view score breakdown and explanations.</p>
          </button>

          <button type="button" className="role-card" onClick={() => startMockLogin("teacher")}>
            <h3>Teacher</h3>
            <p>Create tests, configure answers/tolerance, publish, and review aggregate results.</p>
          </button>
        </div>
      )}

      <div className="panel stack-sm">
        <p><strong>Mode:</strong> {appEnv.useMockData ? "Mock Data" : "Real Backend"}</p>
        <p><strong>API Base:</strong> {appEnv.apiBaseUrl}</p>
        {auth.error ? <p className="error-inline">{auth.error}</p> : null}
      </div>
    </section>
  );
};

export default HomePage;
