import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useSession } from "./useSession";

interface Props {
  roles?: string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function RequireAuth({ roles, fallback, children }: Props) {
  const { status, roles: userRoles } = useSession();

  if (status === "loading") return <>{fallback ?? null}</>;
  if (status === "guest") return <Navigate to={"/login" as never} />;

  if (roles && !roles.some((r) => userRoles.includes(r))) {
    return <Navigate to={"/403" as never} />;
  }

  return <>{children}</>;
}
