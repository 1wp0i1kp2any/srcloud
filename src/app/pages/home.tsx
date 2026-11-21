import { requestInfo } from "rwsdk/worker";

import type { Result } from "@/lib/form";

import { Surface } from "@/components/surface";
import { AuthCard, AuthModal } from "@/features/auth";
import { SignupCard } from "@/features/signup";

export const Home = () => {
  // Результат нативного POST кладёт SDK до рендера; Surface раздаёт его формам.
  const continuation =
    (requestInfo.rw.actionResult as Result | undefined) ?? null;

  return (
    <Surface
      continuation={continuation}
      render={<main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-10 p-8" />}
    >
      <AuthCard onSuccess={{ redirect: "/welcome" }} />
      <SignupCard />
      <AuthModal />
    </Surface>
  );
};