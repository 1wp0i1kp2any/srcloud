"use client";

import { navigate } from "rwsdk/client";

import type { Result } from "@/lib/form";

import { AuthCard } from "@/app/components/auth-card";

/**
 * Подключение на маршруте: после подтверждённого входа уходим на /welcome.
 * Сама форма навигацию не решает — это дело места подключения.
 */
export function AuthPageCard({
  continuation,
}: {
  continuation?: Result | null;
}) {
  return (
    <AuthCard
      continuation={continuation}
      instance="auth:page"
      onSuccess={() => {
        void navigate("/welcome");
      }}
    />
  );
}
