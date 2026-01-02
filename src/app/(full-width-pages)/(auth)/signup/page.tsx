import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stock-App | Inscription",
  description: "gérez vos stocks facilement grâce à notre application avec ou sans connexion internet",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
