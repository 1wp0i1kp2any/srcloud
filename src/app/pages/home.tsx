import { AuthCard, AuthModal } from "@/features/auth";
import { SignupCard } from "@/features/signup";

export const Home = () => {
  return (
    <>
      <AuthCard onSuccess={{ redirect: "/welcome" }} />
      <SignupCard />
      <AuthModal />
    </>
  );
};