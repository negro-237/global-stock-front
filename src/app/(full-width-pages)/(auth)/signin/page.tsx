import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stock-App | Connexion",
  description: "gérez vos stocks facilement grâce à notre application avec ou sans connexion internet",
};

export default function SignIn() {
  return <SignInForm />;
}
