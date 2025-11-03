"use client";

import { useAuth } from "@/contexts/auth-context";

interface AuthenticatedContentProps {
  children: React.ReactNode;
}

export function AuthenticatedContent({ children }: AuthenticatedContentProps) {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return null;
  }

  return <>{children}</>;
}