import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Role } from "@/types/domain";
import { useAppSelector } from "@/store/hooks";
import { isSessionExpired } from "@/store/slices/authSlice";

interface ProtectedRouteProps {
  allowRoles: Role[];
  children: ReactNode;
}

export const ProtectedRoute = ({ allowRoles, children }: ProtectedRouteProps): ReactNode => {
  const location = useLocation();
  const token = useAppSelector((state) => state.auth.token);
  const expiresAt = useAppSelector((state) => state.auth.expiresAt);
  const profile = useAppSelector((state) => state.user.profile);

  if (!token || isSessionExpired(expiresAt)) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (!profile) {
    return <div className="page-loading">Loading profile...</div>;
  }

  if (!allowRoles.includes(profile.role)) {
    return <Navigate to={profile.role === "teacher" ? "/teacher" : "/student"} replace />;
  }

  return children;
};
