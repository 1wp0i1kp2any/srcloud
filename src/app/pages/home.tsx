import { requestInfo } from "rwsdk/worker";

import type { Result } from "@/lib/form";

import { AuthCard, AuthModal } from "@/features/auth";
import { SignupCard } from "@/features/signup";

export const Home = () => {
  // Результат серверного экшена кладёт SDK до рендера; для нативной
  // (без-JS) отправки это единственный способ показать ошибки на той же
  // странице. Компонент один и тот же — страница просто передаёт проп.
  const continuation =
    (requestInfo.rw.actionResult as Result | undefined) ?? null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-10 p-8">
      <AuthCard
        continuation={continuation}
        onSuccess={{ redirect: "/welcome" }}
      />
      <SignupCard />
      <AuthModal />
    </main>
  );
};
