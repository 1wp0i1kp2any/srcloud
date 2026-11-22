import { Surface } from "@/components/surface";

import { actionResult } from "@/server/action-result";

import { AuthCard, AuthModal } from "@/features/auth";
import { SignupCard } from "@/features/signup";

export const Home = () => {
  return (
    <Surface
      className="mx-auto flex w-full max-w-4xl flex-col gap-10 p-8"
      continuation={actionResult()}
    >
      <AuthCard onSuccess={{ redirect: "/welcome" }} />
      <SignupCard />
      <AuthModal />
    </Surface>
  );
};
